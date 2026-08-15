/**
 * dsh-notify-sound — 宿主半区
 *
 * 注册 `notify-sound` 设置命名空间（schema 见 Config，字段全部带默认值，
 * 即"默认配置一套"）+ `/notify-sound/settings` 读写路由。
 *
 * 为什么需要自建路由：官方 apiproxy 的 settings 暴露白名单
 * （WEB_SETTINGS_NAMESPACES）是硬编码的，第三方插件的命名空间一律答
 * `settings-not-exposed`——因此浏览器端经官方 settingsScope 读不到本
 * 命名空间。本路由绕开该边界：GET 返回命名空间视图（value/base/user/
 * revision/writable），POST 批量写用户层（set/unset，revision 栅栏），
 * 内部经 dsh-settings 的 replace 提交。配置落在 profile 的 settings
 * 用户层（服务端持久化），所有浏览器/设备读同一份配置即天然同步。
 *
 * 本配置无 secret 字段，redact 逻辑保留（secrets 恒为 []）。
 * @module dsh-notify-sound
 */

import z from '@deepseek-ai/schemastery'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'

export const name = 'notify-sound'
export const inject = ['webServer']

/** 设置命名空间名（与浏览器端路由约定一致）。 */
export const SETTINGS_NAMESPACE = 'notify-sound'

/** 设置读写 API 路径（浏览器端 GET 视图 / POST 批量写）。 */
export const SETTINGS_API_PATH = '/notify-sound/settings'

/** 请求体上限：9 个字段的批量写，64 KiB 富余。 */
export const SETTINGS_BODY_CAP = 64 * 1024

/**
 * 配置 schema（"默认配置一套"）：
 * - 完成类：回合结束 / 后台任务完成 → defaultSound（chime 风铃）
 * - 注意类（始终响，不受 quietCurrent 限制）：
 *   审批请求 / 用户提问 / 计划评审 → 专属音，留空跟随通用注意音（ding）
 *   目标受阻 → goalBlockedSound（bell 铃铛）
 *   后台任务失败 → failureSound（alert 警示）
 * 空字符串 = "跟随通用注意音"（浏览器端解析）。
 */
export const Config = z.object({
  enabled: z.boolean().default(true),
  quietCurrent: z.boolean().default(false),
  defaultSound: z.string().default('chime'),
  attentionSound: z.string().default('ding'),
  approvalSound: z.string().default(''),
  questionSound: z.string().default(''),
  planReviewSound: z.string().default(''),
  goalBlockedSound: z.string().default('bell'),
  failureSound: z.string().default('alert'),
})

/** 一条批量写：set 写入用户层字段；unset 删除用户层字段（重新继承 base）。 */
export function isSameOriginRequest(req) {
  const headers = req.headers
  // 无头请求（测试 fixture / 非浏览器客户端）放行：护栏只针对浏览器跨站请求。
  if (headers === undefined) return true
  const site = headers['sec-fetch-site']
  if (typeof site === 'string' && site === 'cross-site') return false
  const origin = headers.origin
  if (typeof origin === 'string' && origin !== '' && origin !== 'null') {
    const host = headers.host
    if (typeof host !== 'string' || host === '') return false
    try {
      if (new URL(origin).host !== host) return false
    } catch {
      return false
    }
  }
  return true
}

/** Write one JSON envelope response. */
export function json(res, envelope, status = 200) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(envelope))
}

/** Read a bounded JSON request body; oversize / invalid / empty answers null. */
export async function readJsonBody(req, cap) {
  const chunks = []
  let total = 0
  for await (const chunk of req) {
    const buffer = chunk
    chunks.push(buffer)
    total += buffer.length
    if (total > cap) return null
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (text === '') return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/** 读取 notify-sound 命名空间视图；命名空间或 settings 服务缺失时返回 null。 */
export function buildSettingsView(ctx) {
  const settings = ctx.get('settings')
  if (settings === undefined) return null
  const descriptor = settings.describe({ redactSecrets: true })
    .find((entry) => String(entry.ns) === SETTINGS_NAMESPACE)
  if (descriptor === undefined) return null
  return {
    ns: String(descriptor.ns),
    value: descriptor.value,
    base: descriptor.base,
    user: descriptor.user,
    revision: descriptor.revision,
    writable: settings.writable,
    secrets: (descriptor.secrets ?? []).map((secret) => ({ path: [...secret.path], set: secret.set })),
  }
}

/**
 * 应用一次批量写：克隆当前用户层 → 逐条 set/unset → settings.replace
 * 整层提交（revision 栅栏，防多浏览器并发覆盖）。
 * @param ctx - 注册上下文（settings 服务）。
 * @param writes - 批量写列表。
 * @returns 提交后的视图。
 */
export async function applySettingsWrites(ctx, writes) {
  const settings = ctx.get('settings')
  if (settings === undefined) throw new Error('settings service is absent')
  const current = buildSettingsView(ctx)
  if (current === null) throw new Error('notify-sound settings namespace is not registered')
  const user = structuredClone(current.user ?? {})
  for (const write of writes) {
    if (write && typeof write === 'object' && typeof write.field === 'string') {
      if (write.op === 'set') user[write.field] = write.value
      else if (write.op === 'unset') delete user[write.field]
    }
  }
  await settings.replace(settingsNamespace(SETTINGS_NAMESPACE), user, current.revision)
  const next = buildSettingsView(ctx)
  if (next === null) throw new Error('notify-sound settings namespace is not registered')
  return next
}

/** 注册 /notify-sound/settings 路由（GET 视图 / POST 批量写，同源护栏）。 */
export function registerSettingsRoute(ctx) {
  const webserver = ctx.get('webServer')
  if (webserver === undefined) return
  webserver.register({
    kind: 'exact',
    path: SETTINGS_API_PATH,
    handler: async (req, res) => {
      if (!isSameOriginRequest(req)) {
        json(res, { ok: false, error: { code: 'rejected', message: 'cross-site request rejected' } }, 403)
        return
      }
      if (req.method === 'GET') {
        const view = buildSettingsView(ctx)
        if (view === null) {
          json(res, { ok: false, error: { code: 'unavailable', message: 'notify-sound settings namespace is not available' } }, 404)
          return
        }
        json(res, { ok: true, value: view })
        return
      }
      if (req.method !== 'POST') {
        json(res, { ok: false, error: { code: 'internal', message: 'only GET and POST are allowed' } }, 405)
        return
      }
      const body = await readJsonBody(req, SETTINGS_BODY_CAP)
      const writes = body === null ? undefined : body.writes
      if (!Array.isArray(writes)) {
        json(res, { ok: false, error: { code: 'rejected', message: 'request body must be a JSON object with a writes array' } }, 400)
        return
      }
      try {
        const view = await applySettingsWrites(ctx, writes)
        json(res, { ok: true, value: view })
      } catch (error) {
        json(res, { ok: false, error: { code: 'rejected', message: error?.message ?? String(error) } }, 422)
      }
    },
  })
}

export function apply(ctx, config = {}) {
  // settings 服务在启动时异步加载文档后才可用；installSettingsSection 用
  // ctx.inject 迟绑定：settings 就绪后（或早已就绪时立即）注册，完全没有
  // settings 服务的 profile 中静默不注册。webServer 同理可选。
  installSettingsSection(ctx, SETTINGS_NAMESPACE, Config, config, {
    setSource: () => {},
    onChange: () => {},
    validate: () => {},
  })
  registerSettingsRoute(ctx)
}
