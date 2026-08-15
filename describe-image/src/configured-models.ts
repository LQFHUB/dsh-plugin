/**
 * DSH 已配置视觉模型的支持模块：枚举模型设置（设置 > 模型）中已配置且
 * 支持图像输入的模型，并把一次 describe_image 调用解析为 provider 配置
 * （baseURL / apiKey / model）。
 *
 * 数据来源：llm 服务的 configurable-provider 目录（`listConfigurableProviders`：
 * provider / displayName / settingsNs / settingsPath）+ settings 服务中该
 * 命名空间的配置 section（host 内部读未 redact 值，apiKey 经 profile 的
 * apiKeyEnv 凭证引用解析）。适配所有官方 adapter（deepseek / pi-ai 等）：
 * pi-ai 支持用户自定义任意 OpenAI 兼容 provider（providers dict，模型级
 * `input: ['text','image']` 声明图像能力）。
 * @module dsh-describe-image/configured-models
 */

import type { Context } from '@deepseek-ai/cordis'
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment'
import type { ResolvedConfig } from './config-resolve.ts'

/** 一个已配置且支持图像输入的模型条目（设置卡模型选择器用）。 */
export interface ConfiguredVisionModel {
  /** llm provider 名（如 pi-ai 的 providers dict key）。 */
  provider: string
  /** provider 显示名（profile.displayName 优先，目录 displayName 兜底）。 */
  providerName: string
  /** 模型 id。 */
  model: string
  /** 模型显示名（无则用 id）。 */
  modelName: string
}

/** 从 profile 对象取字符串字段。 */
function stringField(profile: unknown, key: string): string | undefined {
  if (typeof profile !== 'object' || profile === null) return undefined
  const value = (profile as Record<string, unknown>)[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/** 按 settingsPath 从命名空间 section 取 provider profile 对象。 */
export function profileAt(section: unknown, settingsPath: readonly string[]): unknown {
  let current = section
  for (const key of settingsPath) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

/**
 * 枚举 DSH 中已配置且支持图像输入的模型。只列 settings 服务中确有配置
 * section 的 provider（未配置的目录条目跳过）；listModels 失败的 provider
 * （未注册/不可用）静默跳过。
 * @param ctx - 注册上下文（llm / settings 服务）。
 * @returns 可用视觉模型列表（provider 目录顺序）。
 */
export async function listConfiguredVisionModels(ctx: Context): Promise<ConfiguredVisionModel[]> {
  const llm = ctx.get('llm')
  const settings = ctx.get('settings')
  if (llm === undefined || settings === undefined) return []
  const out: ConfiguredVisionModel[] = []
  for (const entry of llm.listConfigurableProviders()) {
    const section = settings.get(entry.settingsNs)
    if (section === undefined) continue
    const profile = profileAt(section, entry.settingsPath)
    if (typeof profile !== 'object' || profile === null) continue
    let models: readonly { id: string; name?: string; inputModalities?: readonly string[] }[]
    try {
      models = await llm.listModels(entry.provider)
    } catch {
      continue // provider 未注册/端点不可达：静默跳过
    }
    for (const model of models) {
      if (model.inputModalities !== undefined && !model.inputModalities.includes('image')) continue
      out.push({
        provider: entry.provider,
        providerName: stringField(profile, 'displayName') ?? entry.displayName,
        model: model.id,
        modelName: model.name ?? model.id,
      })
    }
  }
  return out
}

/**
 * 把一次 configured 模式的调用解析为视觉端点事实：从选中 provider 的
 * 配置 section 读取 baseURL，模型用配置选中的 id，apiKey 经 profile 的
 * apiKeyEnv 凭证引用解析（profile 内联 apiKey 优先）。
 * @param ctx - 注册上下文（llm / settings / credentials）。
 * @param spec - 已校验的插件配置（useConfiguredModel 必须为 true）。
 * @returns 视觉端点事实。
 */
export async function resolveConfiguredVision(ctx: Context, spec: ResolvedConfig): Promise<{ baseURL: string; model: string; apiKey: string }> {
  const llm = ctx.get('llm')
  const settings = ctx.get('settings')
  if (llm === undefined || settings === undefined) {
    throw new Error('describe-image: no llm/settings service is mounted; use a custom endpoint instead')
  }
  const entry = llm.listConfigurableProviders().find(candidate => candidate.provider === spec.configuredProvider)
  if (entry === undefined) {
    throw new Error(`describe-image: configured provider "${spec.configuredProvider}" is not a known DSH model provider`)
  }
  const section = settings.get(entry.settingsNs)
  const profile = profileAt(section, entry.settingsPath)
  const baseURL = stringField(profile, 'baseURL')
  if (baseURL === undefined || !/^https?:\/\//.test(baseURL)) {
    throw new Error(`describe-image: provider "${spec.configuredProvider}" has no absolute http(s) baseURL in its model settings`)
  }
  // apiKey：profile 内联 apiKey 优先，否则 apiKeyEnv 凭证引用解析。
  let apiKey: string | undefined
  const inline = stringField(profile, 'apiKey')
  const keyEnv = stringField(profile, 'apiKeyEnv')
  if (inline !== undefined) {
    apiKey = inline
  } else if (keyEnv !== undefined) {
    const credentials = ctx.get('credentials')
    if (credentials !== undefined) {
      const hit = await credentials.resolve(keyEnv)
      apiKey = hit?.value
    } else {
      const ambient = launchEnvironmentOf(ctx).get(keyEnv)
      if (ambient !== undefined && ambient.value.length > 0) apiKey = ambient.value
    }
  }
  if (apiKey === undefined) {
    throw new Error(`describe-image: provider "${spec.configuredProvider}" resolves no API key; set apiKeyEnv in its model settings`)
  }
  return { baseURL: baseURL.replace(/\/+$/, ''), model: spec.configuredModelId, apiKey }
}
