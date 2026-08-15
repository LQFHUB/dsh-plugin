/** /describe-image/settings 路由测试：视图读取、批量写、secret 语义、settings 服务缺失。 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { SettingsProvider } from '@deepseek-ai/dsh-settings'
import type { SettingsNamespace } from '@deepseek-ai/dsh-settings'

import * as tool from '../src/index.ts'
import { buildSettingsView, applySettingsWrites, SETTINGS_NAMESPACE } from '../src/index.ts'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import { FakeWebServer } from './mock-server.ts'

/** 内存 settings provider（与 settings.spec 同款）。 */
class MemorySettings extends SettingsProvider {
  doc: Record<string, unknown>

  constructor(ctx: ConstructorParameters<typeof SettingsProvider>[0], options?: { doc?: Record<string, unknown> }) {
    super(ctx)
    this.doc = structuredClone(options?.doc ?? {})
  }

  get writable(): boolean {
    return true
  }

  protected load(): Promise<Record<string, unknown>> {
    return Promise.resolve(structuredClone(this.doc))
  }

  protected persist(ns: SettingsNamespace, section: Record<string, unknown>): Promise<void> {
    this.doc[ns] = structuredClone(section)
    return Promise.resolve()
  }
}

const cleanup: Array<() => Promise<void>> = []

afterEach(async () => {
  await Promise.all(cleanup.splice(0).map(close => close()))
})

async function boot(doc: Record<string, unknown> = {}): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(MemorySettings, { doc })
  await ctx.plugin(FakeWebServer)
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(tool, { baseURL: 'https://api.example.com/v1', model: 'entry-model', apiKey: 'sk-entry' })
  // installSettingsSection 经 ctx.inject(['settings']) 异步注册命名空间：
  // 轮询等待注册完成（settings.spec 经工具调用天然等待，这里显式等待）。
  for (let i = 0; i < 50 && buildSettingsView(ctx) === null; i += 1) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  return ctx
}

describe('buildSettingsView', () => {
  it('returns the redacted namespace view with base/user/revision', async () => {
    const ctx = await boot()
    cleanup.push(() => ctx.fiber.dispose())
    const view = buildSettingsView(ctx)
    expect(view).not.toBeNull()
    expect(view?.ns).toBe(SETTINGS_NAMESPACE)
    // base 来自组合条目：mount config 的 baseURL/model/apiKey
    expect(view?.base).toMatchObject({ baseURL: 'https://api.example.com/v1', model: 'entry-model' })
    // value 为 schema 默认解析后的完整值（base 之上）
    expect(view?.value?.baseURL).toBe('https://api.example.com/v1')
    expect(view?.value?.model).toBe('entry-model')
    expect(view?.value?.apiStyle).toBe('chat-completions')
    // apiKey 是 secret：value 中 redact（无明文），secrets 标记已设置
    expect(view?.value?.apiKey).toBeUndefined()
    expect(view?.secrets).toEqual([{ path: ['apiKey'], set: true }])
    expect(view?.writable).toBe(true)
    expect(view?.revision).toBeTypeOf('number')
  })

  it('returns null when the settings service is absent', async () => {
    const ctx = new Context()
    await ctx.plugin(FakeWebServer)
    await ctx.plugin(tool, {})
    expect(buildSettingsView(ctx)).toBeNull()
    await ctx.fiber.dispose()
  })
})

describe('applySettingsWrites', () => {
  it('writes fields through replace and returns the new view', async () => {
    const ctx = await boot()
    cleanup.push(() => ctx.fiber.dispose())
    const view = await applySettingsWrites(ctx, [
      { field: 'baseURL', op: 'set', value: 'https://new.example.com/v1' },
      { field: 'defaultPrompt', op: 'set', value: 'OCR everything' },
    ])
    expect(view.value?.baseURL).toBe('https://new.example.com/v1')
    expect(view.value?.defaultPrompt).toBe('OCR everything')
    expect(view.base).toMatchObject({ baseURL: 'https://api.example.com/v1' })
    // 用户层记录了覆盖
    expect(view.user).toMatchObject({ baseURL: 'https://new.example.com/v1' })
  })

  it('unset deletes the user-layer field and re-inherits base', async () => {
    const ctx = await boot()
    cleanup.push(() => ctx.fiber.dispose())
    await applySettingsWrites(ctx, [{ field: 'model', op: 'set', value: 'vision-2' }])
    const after = await applySettingsWrites(ctx, [{ field: 'model', op: 'unset' }])
    expect(after.user).not.toHaveProperty('model')
    expect(after.value?.model).toBe('entry-model') // 回到 base
  })

  it('an empty apiKey set keeps the current key (no-op)', async () => {
    const ctx = await boot()
    cleanup.push(() => ctx.fiber.dispose())
    const view = await applySettingsWrites(ctx, [{ field: 'apiKey', op: 'set', value: '' }])
    // secret 不回读；用户层不应新增 apiKey 键（否则空串覆盖 base 密钥）
    expect(view.user).not.toHaveProperty('apiKey')
    expect(view.secrets).toEqual([{ path: ['apiKey'], set: true }]) // base 密钥仍在
  })

  it('a non-empty apiKey set writes the new secret', async () => {
    const ctx = await boot()
    cleanup.push(() => ctx.fiber.dispose())
    const view = await applySettingsWrites(ctx, [{ field: 'apiKey', op: 'set', value: 'sk-new' }])
    expect(view.secrets).toEqual([{ path: ['apiKey'], set: true }])
    // redacted 视图不泄露明文（value/user/base 均不含）
    expect(JSON.stringify(view)).not.toContain('sk-new')
    // 写入经 settings 服务内部值验证（未 redact 的 resolved 值）
    const settings = ctx.get('settings')!
    expect(settings.get(tool.DESCRIBE_IMAGE_SETTINGS_NAMESPACE)).toMatchObject({ apiKey: 'sk-new' })
  })

  it('a stale revision rejects (revision fence)', async () => {
    const ctx = await boot()
    cleanup.push(() => ctx.fiber.dispose())
    const first = buildSettingsView(ctx)
    await applySettingsWrites(ctx, [{ field: 'model', op: 'set', value: 'vision-2' }])
    // 用旧 revision 再写 → SettingsConflictError
    const stale = first!.revision!
    const settings = ctx.get('settings')!
    await expect(
      settings.replace(
        // 直接经 settings 服务带旧 revision 写，模拟并发冲突
        (await import('@deepseek-ai/dsh-settings')).settingsNamespace('describe-image'),
        { model: 'vision-3' },
        stale,
      ),
    ).rejects.toThrow()
  })
})

describe('registerSettingsRoute HTTP surface', () => {
  interface FakeRoute {
    kind: string
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>
  }

  /** 从 FakeWebServer 的注册表取出 settings 路由 handler。 */
  async function routeHandler(): Promise<(req: IncomingMessage, res: ServerResponse) => Promise<void>> {
    const ctx = await boot()
    cleanup.push(() => ctx.fiber.dispose())
    const ws = ctx.get('webServer') as unknown as { routes: FakeRoute[] }
    const route = ws.routes.find(r => r.path === '/describe-image/settings')
    expect(route).toBeDefined()
    return route!.handler
  }

  function makeReq(method: string, body?: string): IncomingMessage {
    const req = new Readable() as IncomingMessage & { push: (chunk: string | null) => boolean }
    req.method = method
    req.url = '/describe-image/settings'
    if (body !== undefined) req.push(body)
    req.push(null)
    return req
  }

  function makeRes(): { res: ServerResponse; status: () => number; body: () => string } {
    let statusCode = 200
    let bodyText = ''
    const res = {
      writeHead(status: number) { statusCode = status },
      end(text: string) { bodyText = String(text) },
    } as unknown as ServerResponse
    return { res, status: () => statusCode, body: () => bodyText }
  }

  it('GET answers the redacted view with 200', async () => {
    const handler = await routeHandler()
    const { res, status, body } = makeRes()
    await handler(makeReq('GET'), res)
    expect(status()).toBe(200)
    const envelope = JSON.parse(body()) as { ok: boolean; value: { ns: string } }
    expect(envelope.ok).toBe(true)
    expect(envelope.value.ns).toBe('describe-image')
  })

  it('POST writes and answers the new view with 200', async () => {
    const handler = await routeHandler()
    const { res, status, body } = makeRes()
    await handler(makeReq('POST', JSON.stringify({ writes: [{ field: 'model', op: 'set', value: 'vision-9' }] })), res)
    expect(status()).toBe(200)
    const envelope = JSON.parse(body()) as { ok: boolean; value: { value: { model: string } } }
    expect(envelope.ok).toBe(true)
    expect(envelope.value.value.model).toBe('vision-9')
  })

  it('answers a malformed body with 400', async () => {
    const handler = await routeHandler()
    const { res, status } = makeRes()
    await handler(makeReq('POST', JSON.stringify({ nope: true })), res)
    expect(status()).toBe(400)
  })
})
