/** 已配置视觉模型支持测试：枚举（llm 目录 + settings section）与解析（baseURL/apiKey/model）。 */

import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context, Service } from '@deepseek-ai/cordis'
import { CallId } from '@deepseek-ai/dsh-llm'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import { CredentialProvider } from '@deepseek-ai/dsh-credentials'
import type { CredentialInfo, CredentialRef, ResolvedCredential } from '@deepseek-ai/dsh-credentials'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { SettingsProvider } from '@deepseek-ai/dsh-settings'
import type { SettingsNamespace } from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'

import * as tool from '../src/index.ts'
import { listConfiguredVisionModels, profileAt, resolveConfiguredVision } from '../src/index.ts'
import type { ResolvedConfig } from '../src/index.ts'
import { FakeWebServer, PNG_BYTES, chatReply, jsonReply, startMockServer } from './mock-server.ts'

const PI_NS = settingsNamespace('llm-pi-ai')

/** 内存 settings provider。 */
class MemorySettings extends SettingsProvider {
  doc: Record<string, unknown>
  constructor(ctx: ConstructorParameters<typeof SettingsProvider>[0], options?: { doc?: Record<string, unknown> }) {
    super(ctx)
    this.doc = structuredClone(options?.doc ?? {})
  }
  get writable(): boolean { return true }
  protected load(): Promise<Record<string, unknown>> { return Promise.resolve(structuredClone(this.doc)) }
  protected persist(ns: SettingsNamespace, section: Record<string, unknown>): Promise<void> {
    this.doc[ns] = structuredClone(section)
    return Promise.resolve()
  }
}

/** 内存凭证 provider。 */
class FakeCredentials extends CredentialProvider {
  constructor(ctx: ConstructorParameters<typeof CredentialProvider>[0]) { super(ctx) }
  get writable(): boolean { return true }
  describe(): CredentialInfo[] { return [] }
  protected load(): Promise<Record<string, unknown>> { return Promise.resolve({}) }
  protected persist(): Promise<void> { return Promise.resolve() }
  async resolve(ref: CredentialRef): Promise<ResolvedCredential | undefined> {
    return ref === 'XIAOMI_MIMO_API_KEY' ? { ref, value: 'sk-from-credentials' } : undefined
  }
}

/** 最小 llm 服务：目录条目 + 模型目录。 */
class FakeLlm extends Service {
  constructor(ctx: ConstructorParameters<typeof Service>[0]) { super(ctx, 'llm') }
  listConfigurableProviders() {
    return [
      { provider: 'deepseek-official', displayName: 'DeepSeek', settingsNs: settingsNamespace('llm-deepseek'), settingsPath: [] },
      { provider: 'xiaomi', displayName: 'Xiaomi MiMo', settingsNs: PI_NS, settingsPath: ['providers', 'xiaomi'] },
    ]
  }
  async listModels(provider: string) {
    if (provider === 'deepseek-official') {
      return [{ provider, id: 'deepseek-v4-flash', name: 'V4 Flash', inputModalities: ['text'] }]
    }
    return [
      { provider, id: 'mimo-v2.5', name: 'MiMo V2.5', inputModalities: ['text', 'image'] },
      { provider, id: 'mimo-v2.5-pro', name: 'MiMo V2.5 Pro' },
    ]
  }
}

const cleanup: Array<() => Promise<void>> = []

afterEach(async () => {
  await Promise.all(cleanup.splice(0).map(close => close()))
})

/** 带 llm/settings 服务的上下文（不加载插件本身——只测支持模块）。 */
/** 宽松的 provider 配置 schema（测试用；真实 llm-pi-ai 有自己的 schema）。 */
const ProviderConfigSchema = z.object({ providers: z.dict(z.any()).default({}) })

async function bootContext(doc: Record<string, unknown>): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(MemorySettings, { doc })
  await ctx.plugin(FakeWebServer)
  await ctx.plugin(FakeLlm)
  // 注册命名空间（settings.get 只返回已注册命名空间的解析值）
  for (const [ns, section] of Object.entries(doc)) {
    const scope = ctx.settings.register(settingsNamespace(ns), ProviderConfigSchema, { base: {} })
    await scope.replace(structuredClone(section as Record<string, unknown>))
  }
  return ctx
}

function configuredSpec(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    baseURL: 'https://unused.example.com',
    model: 'unused',
    apiKey: undefined,
    apiKeyEnv: undefined,
    defaultPrompt: 'default',
    maxBytes: 10485760,
    maxOutputTokens: 1024,
    timeoutMs: 60000,
    apiStyle: 'chat-completions',
    useConfiguredModel: true,
    configuredProvider: 'xiaomi',
    configuredModelId: 'mimo-v2.5',
    ...overrides,
  }
}

const XIAOMI_DOC = {
  'llm-pi-ai': {
    providers: {
      xiaomi: {
        displayName: 'Xiaomi MiMo',
        baseURL: 'https://api.xiaomimimo.com/v1',
        apiKeyEnv: 'XIAOMI_MIMO_API_KEY',
        models: [{ id: 'mimo-v2.5' }],
      },
    },
  },
  'llm-deepseek': { baseURL: 'https://api.deepseek.com', apiKeyEnv: 'DEEPSEEK_API_KEY' },
}

describe('profileAt', () => {
  it('walks settingsPath into the section', () => {
    expect(profileAt(XIAOMI_DOC['llm-pi-ai'], ['providers', 'xiaomi'])).toMatchObject({ displayName: 'Xiaomi MiMo' })
    expect(profileAt(XIAOMI_DOC['llm-pi-ai'], ['providers', 'missing'])).toBeUndefined()
    expect(profileAt(undefined, ['a'])).toBeUndefined()
    expect(profileAt('nope', [])).toBe('nope')
  })
})

describe('listConfiguredVisionModels', () => {
  it('lists image-capable models of configured providers only', async () => {
    const ctx = await bootContext(XIAOMI_DOC)
    cleanup.push(() => ctx.fiber.dispose())
    const models = await listConfiguredVisionModels(ctx)
    // deepseek 已配置但全是 text-only → 排除；xiaomi 列出图像模型
    // （mimo-v2.5 明确 image；mimo-v2.5-pro 未声明模态 → 未知能力放行）
    expect(models).toEqual([
      { provider: 'xiaomi', providerName: 'Xiaomi MiMo', model: 'mimo-v2.5', modelName: 'MiMo V2.5' },
      { provider: 'xiaomi', providerName: 'Xiaomi MiMo', model: 'mimo-v2.5-pro', modelName: 'MiMo V2.5 Pro' },
    ])
  })

  it('returns [] when the llm or settings service is absent', async () => {
    const ctx = new Context()
    await ctx.plugin(FakeWebServer)
    expect(await listConfiguredVisionModels(ctx)).toEqual([])
    await ctx.fiber.dispose()
  })
})

describe('resolveConfiguredVision', () => {
  it('resolves baseURL/model/apiKey from the provider settings section', async () => {
    const ctx = await bootContext(XIAOMI_DOC)
    await ctx.plugin(FakeCredentials)
    cleanup.push(() => ctx.fiber.dispose())
    const resolved = await resolveConfiguredVision(ctx, configuredSpec())
    expect(resolved).toEqual({ baseURL: 'https://api.xiaomimimo.com/v1', model: 'mimo-v2.5', apiKey: 'sk-from-credentials' })
  })

  it('an inline apiKey in the profile wins over apiKeyEnv', async () => {
    const doc = structuredClone(XIAOMI_DOC)
    ;(doc['llm-pi-ai'] as Record<string, unknown>).providers = {
      xiaomi: { displayName: 'Xiaomi MiMo', baseURL: 'https://api.xiaomimimo.com/v1', apiKey: 'sk-inline' },
    }
    const ctx = await bootContext(doc)
    cleanup.push(() => ctx.fiber.dispose())
    const resolved = await resolveConfiguredVision(ctx, configuredSpec())
    expect(resolved.apiKey).toBe('sk-inline')
  })

  it('rejects an unknown provider', async () => {
    const ctx = await bootContext(XIAOMI_DOC)
    cleanup.push(() => ctx.fiber.dispose())
    await expect(resolveConfiguredVision(ctx, configuredSpec({ configuredProvider: 'nope' })))
      .rejects.toThrow(/not a known DSH model provider/)
  })

  it('rejects a provider without an http(s) baseURL', async () => {
    const doc = structuredClone(XIAOMI_DOC)
    ;(doc['llm-pi-ai'] as Record<string, unknown>).providers = { xiaomi: { displayName: 'Xiaomi', baseURL: 'ftp://x' } }
    const ctx = await bootContext(doc)
    cleanup.push(() => ctx.fiber.dispose())
    await expect(resolveConfiguredVision(ctx, configuredSpec())).rejects.toThrow(/no absolute http\(s\) baseURL/)
  })

  it('rejects a provider whose key cannot be resolved', async () => {
    const doc = structuredClone(XIAOMI_DOC)
    ;(doc['llm-pi-ai'] as Record<string, unknown>).providers = { xiaomi: { displayName: 'Xiaomi', baseURL: 'https://api.example.com/v1' } }
    const ctx = await bootContext(doc)
    await ctx.plugin(FakeCredentials)
    cleanup.push(() => ctx.fiber.dispose())
    await expect(resolveConfiguredVision(ctx, configuredSpec())).rejects.toThrow(/resolves no API key/)
  })
})

describe('configured resolveConfig validation', () => {
  it('requires configuredProvider/configuredModelId when useConfiguredModel is on', () => {
    expect(() => tool.resolveConfig({ useConfiguredModel: true, configuredProvider: '', configuredModelId: 'm' }))
      .toThrow(/configuredProvider must name a DSH model provider/)
    expect(() => tool.resolveConfig({ useConfiguredModel: true, configuredProvider: 'p', configuredModelId: '' }))
      .toThrow(/configuredModelId must name a vision model/)
  })

  it('allows empty baseURL/model in configured mode, requires them otherwise', () => {
    const ok = tool.resolveConfig({ useConfiguredModel: true, configuredProvider: 'p', configuredModelId: 'm' })
    expect(ok.useConfiguredModel).toBe(true)
    expect(ok.baseURL).toBe('')
    expect(() => tool.resolveConfig({ model: 'm' })).toThrow(/baseURL must be an absolute http\(s\) URL/)
    expect(() => tool.resolveConfig({ baseURL: 'https://api.example.com/v1' })).toThrow(/model must be a non-empty model id/)
  })
})

describe('describe_image tool in configured mode (end-to-end)', () => {
  async function tempPng(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'dsh-describe-configured-'))
    cleanup.push(() => rm(dir, { recursive: true, force: true }))
    const path = join(dir, 'pixel.png')
    await writeFile(path, PNG_BYTES)
    return path
  }

  it('routes the call to the configured provider endpoint with its apiKey', async () => {
    const server = await startMockServer((_request, res) => { jsonReply(res, 200, chatReply('configured ok')) })
    cleanup.push(server.close)
    const ctx = new Context()
    await ctx.plugin(MemorySettings, { doc: {} })
    await ctx.plugin(FakeCredentials)
    const piScope = ctx.settings.register(PI_NS, ProviderConfigSchema, { base: {} })
    await piScope.replace({ providers: { xiaomi: { displayName: 'Xiaomi', baseURL: server.url, apiKey: 'sk-x' } } })
    await ctx.plugin(FakeLlm)
    await ctx.plugin(FakeWebServer)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(tool, { useConfiguredModel: true, configuredProvider: 'xiaomi', configuredModelId: 'mimo-v2.5' })
    cleanup.push(() => ctx.fiber.dispose())

    const path = await tempPng()
    const result = await ctx.tools.execute({
      signal: new AbortController().signal,
      callId: CallId('configured-vision-call'),
      name: 'describe_image',
      arguments: { image: path },
    })
    expect(result.isError).toBe(false)
    if (result.isError) throw new Error('expected configured describe_image success')
    expect(result.value).toMatchObject({ text: 'configured ok', model: 'mimo-v2.5' })
    expect(server.request(0).authorization).toBe('Bearer sk-x')
  })

  it('fails with a clear message when the configured provider has no endpoint', async () => {
    const ctx = new Context()
    await ctx.plugin(MemorySettings, { doc: {} })
    const piScope2 = ctx.settings.register(PI_NS, ProviderConfigSchema, { base: {} })
    await piScope2.replace({ providers: {} })
    await ctx.plugin(FakeLlm)
    await ctx.plugin(FakeWebServer)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(tool, { useConfiguredModel: true, configuredProvider: 'xiaomi', configuredModelId: 'mimo-v2.5' })
    cleanup.push(() => ctx.fiber.dispose())

    const path = await tempPng()
    const result = await ctx.tools.execute({
      signal: new AbortController().signal,
      callId: CallId('configured-vision-missing'),
      name: 'describe_image',
      arguments: { image: path },
    })
    expect(result.isError).toBe(true)
    const text = result.content.filter(block => block.type === 'text').map(block => block.text).join('')
    expect(text).toContain('no absolute http(s) baseURL')
  })
})
