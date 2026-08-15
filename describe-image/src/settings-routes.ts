/**
 * /describe-image/settings 路由：浏览器设置卡的自定义读写接缝。
 *
 * 背景：官方 apiproxy 的 settings 暴露白名单（WEB_SETTINGS_NAMESPACES）是
 * 硬编码的，第三方插件的命名空间一律答 `settings-not-exposed`（官方注释：
 * "adding a section to that page is a decision made here rather than by the
 * registering plugin"）——因此设置卡经官方 settingsScope 只能读到
 * unavailable。本路由绕开该边界：GET 返回命名空间的 redacted 视图
 * （value/base/user/revision/writable + secrets 标记），POST 批量写用户层
 * （set/unset，revision 栅栏），内部经 dsh-settings 的 replace 提交——
 * installSettingsSection 的 onChange 随之触发，工具下次调用即用新配置。
 * 本路由与 attach 路由同款同源护栏。
 * @module dsh-describe-image/settings
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { isSameOriginRequest, json, readJsonBody } from './attach-routes.ts'

/** 设置读写 API 路径（浏览器端 GET 视图 / POST 批量写）。 */
export const SETTINGS_API_PATH = '/describe-image/settings'

/** 本插件设置的命名空间名（与 config-resolve 的 DESCRIBE_IMAGE_SETTINGS_NAMESPACE 一致）。 */
export const SETTINGS_NAMESPACE = 'describe-image'

/** 请求体上限：9 个字段的批量写，64 KiB 富余。 */
export const SETTINGS_BODY_CAP = 64 * 1024

/** 一条批量写：set 写入用户层字段；unset 删除用户层字段（重新继承 base）。 */
export interface SettingsWrite {
  field: string
  op: 'set' | 'unset'
  value?: unknown
}

/** 命名空间视图（secret 值已 redact，仅保留 {path,set} 标记）。 */
export interface SettingsView {
  ns: string
  value: Record<string, unknown> | undefined
  base: unknown
  user: unknown
  revision: number | undefined
  writable: boolean
  secrets: Array<{ path: string[]; set: boolean }>
}

/** 读取 describe-image 命名空间的 redacted 视图；命名空间或 settings 服务缺失时返回 null。 */
export function buildSettingsView(ctx: Context): SettingsView | null {
  const settings = ctx.get('settings')
  if (settings === undefined) return null
  const descriptor = settings.describe({ redactSecrets: true })
    .find((entry) => String(entry.ns) === SETTINGS_NAMESPACE)
  if (descriptor === undefined) return null
  return {
    ns: String(descriptor.ns),
    value: descriptor.value as Record<string, unknown> | undefined,
    base: descriptor.base,
    user: descriptor.user,
    revision: descriptor.revision,
    writable: settings.writable,
    secrets: (descriptor.secrets ?? []).map((secret) => ({ path: [...secret.path], set: secret.set })),
  }
}

/**
 * 应用一次批量写：克隆当前用户层 → 逐条 set/unset（apiKey 为空串的 set
 * 跳过，保持当前密钥）→ settings.replace 整层提交（revision 栅栏）。
 * @param ctx - 注册上下文（settings 服务）。
 * @param writes - 批量写列表。
 * @returns 提交后的 redacted 视图。
 */
export async function applySettingsWrites(ctx: Context, writes: readonly SettingsWrite[]): Promise<SettingsView> {
  const settings = ctx.get('settings')
  if (settings === undefined) throw new Error('settings service is absent')
  const current = buildSettingsView(ctx)
  if (current === null) throw new Error('describe-image settings namespace is not registered')
  const user = structuredClone(current.user ?? {}) as Record<string, unknown>
  for (const write of writes) {
    if (write.field === 'apiKey' && write.op === 'set' && (write.value === '' || write.value === undefined)) {
      continue // 空密钥不覆盖（README：留空表示保持当前密钥）
    }
    if (write.op === 'set') user[write.field] = write.value
    else delete user[write.field]
  }
  await settings.replace(settingsNamespace(SETTINGS_NAMESPACE), user, current.revision)
  const next = buildSettingsView(ctx)
  if (next === null) throw new Error('describe-image settings namespace is not registered')
  return next
}

/** 注册 /describe-image/settings 路由（GET 视图 / POST 批量写，同源护栏）。 */
export function registerSettingsRoute(ctx: Context): void {
  const webserver = ctx.get('webServer')
  if (webserver === undefined) return
  webserver.register({
    kind: 'exact',
    path: SETTINGS_API_PATH,
    handler: async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
      if (!isSameOriginRequest(req)) {
        json(res, { ok: false, error: { code: 'rejected', message: 'cross-site request rejected' } }, 403)
        return
      }
      if (req.method === 'GET') {
        const view = buildSettingsView(ctx)
        if (view === null) {
          json(res, { ok: false, error: { code: 'unavailable', message: 'describe-image settings namespace is not available' } }, 404)
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
      const writes = (body as { writes?: unknown } | null)?.writes
      if (!Array.isArray(writes)) {
        json(res, { ok: false, error: { code: 'rejected', message: 'request body must be a JSON object with a writes array' } }, 400)
        return
      }
      try {
        const view = await applySettingsWrites(ctx, writes as SettingsWrite[])
        json(res, { ok: true, value: view })
      } catch (error) {
        json(res, { ok: false, error: { code: 'rejected', message: (error as Error).message ?? String(error) } }, 422)
      }
    },
  })
}
