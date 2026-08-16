/**
 * theme-center — Host 半区。
 *
 * 主题插件的宿主部分做两件事：
 * 1. 把本插件自带的 23 款皮肤 bundle（lib/skins/<id>.js，原样复用
 *    zhu1090093659/dsh-web-ui 皮肤中心与 KinGao294/dsh-skin 的分发产物）
 *    以同源脚本的形式提供给浏览器端。浏览器半区（lib/client.js）通过
 *    「主题」设置卡片加载 /api/theme-center/bundle/<id>，经内核自身的
 *    __ModuleLoader__ / __DSH_MODULES__ 执行皮肤 bundle，实现试穿与应用——
 *    与皮肤中心的 try-on 机制一致，但本插件把 bundle 直接内置，不依赖
 *    dsh-web-ui 的仓库布局、profile 软链或启动配置改写。
 * 2. 把主题卡片的全部持久化状态存到服务器（profile settings 用户层，
 *    落盘 settings.yaml）：注册 `theme-center` 设置命名空间（schema 见
 *    Config，字段全部带默认值）+ `/theme-center/settings` 读写路由。
 *
 * 为什么需要自建路由：官方 apiproxy 的 settings 暴露白名单
 * （WEB_SETTINGS_NAMESPACES）是硬编码的，第三方插件的命名空间一律答
 * `settings-not-exposed`——因此浏览器端经官方 settingsScope 读不到本
 * 命名空间。本路由绕开该边界：GET 返回命名空间视图（value/base/user/
 * revision/writable），POST 批量写用户层（set/unset，revision 栅栏），
 * 内部经 dsh-settings 的 replace 提交。配置落在 profile settings 用户
 * 层（服务端持久化），所有浏览器/设备读同一份配置即天然同步——
 * 「一处配置，所有终端生效」；localStorage 在浏览器端降级为首屏缓存。
 *
 * 本配置无 secret 字段，redact 逻辑保留（secrets 恒为 []）。
 */
import { readFileSync, statSync } from 'node:fs'
import { join as joinPath } from 'node:path'
import { fileURLToPath } from 'node:url'
import z from '@deepseek-ai/schemastery'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'

/** lib/skins/ 目录（bundle 存放处），以本文件位置解析，link 安装同样有效。 */
const SKINS_DIR = fileURLToPath(new URL('./skins/', import.meta.url))

/** 浏览器端 bundle 路由前缀。 */
export const THEME_CENTER_API_PREFIX = '/api/theme-center/bundle'

/** 设置命名空间名（与浏览器端路由约定一致）。 */
export const SETTINGS_NAMESPACE = 'theme-center'

/** 设置读写 API 路径（浏览器端 GET 视图 / POST 批量写）。 */
export const SETTINGS_API_PATH = '/theme-center/settings'

/** 请求体上限：9 个字段的批量写，64 KiB 富余。 */
export const SETTINGS_BODY_CAP = 64 * 1024

/**
 * 主题卡片配置 schema（"一处配置、所有终端生效"）：
 * 字段与浏览器端 localStorage 缓存键一一对应（浏览器半区维护键的
 * 合法性边界；宿主只负责 schema 化存储）。全部带默认值——未配置时
 * 视图 value = schema 默认，即官方原样。
 */
export const Config = z.object({
  /** 主题 id 或 official（官方默认）。 */
  theme: z.string().default('official'),
  /** 背景遮罩 0-100。 */
  scrim: z.number().min(0).max(100).default(0),
  /** 聊天宽度预设（896-1600）。 */
  width: z.number().default(896),
  /** 聊天区精简百分比 0-100（默认 70）。 */
  focus: z.number().min(0).max(100).default(80),
  /** 会话区字号百分比 75-150（默认 100）。 */
  textScale: z.number().min(75).max(150).default(80),
  /** 全站字体 id（default = 系统默认）。 */
  font: z.string().default('default'),
  hideThink: z.boolean().default(false),
  hideTool: z.boolean().default(false),
  hideContext: z.boolean().default(false),
})

/**
 * 10 款皮肤注册表（id → bundle 文件名）。
 * 名称/属性等展示元数据在浏览器半区维护；宿主只关心「id 合法且存在对应文件」。
 * 条目与 packages/skins/<id>/skin.json 一一对应。
 */
const SKIN_IDS = [
  'blue-fantasy',
  'dragon-heir',
  'harbor',
  'miku',
  'minecraft',
  'qq98',
  'ths',
  'trading',
  'whale-song',
  'xp',
  // 自研皮肤（纯令牌重映射，LQFHUB）
  'catppuccin',
  'mint-fresh',
  'cyber-neon',
  'apple-minimal',
  'tokyo-night',
  'nord',
  // 源自 KinGao294/dsh-skin（MIT）
  'skin-ocean',
  'skin-graphite',
  'skin-forest',
  'skin-sunset',
  'skin-midnight',
  'skin-paper',
  'skin-sakura',
]

/** 合法的 skin id（只允许小写字母/数字/连字符，绝不参与路径拼接之外的其他用途）。 */
const SKIN_ID_RE = /^[a-z0-9-]+$/

/** 稳定 cordis 插件名（与 cordis.patch.yml insert id 一致）。 */
export const name = 'theme-center'

/** 路由依赖宿主 webServer 服务。 */
export const inject = ['webServer']

/** JSON 响应。 */
function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

/** 要求指定方法，否则 405。 */
function requireMethod(req, res, method) {
  if (req.method === method) return true
  json(res, 405, { ok: false, error: 'method-not-allowed' })
  return false
}

/**
 * 同源护栏（照搬皮肤中心 routes.ts 的防线）：浏览器在跨站页面上发起的
 * fetch 一律拒绝——一个恶意网页不能通过 localhost CSRF 让本插件分发
 * 脚本。无 Sec-Fetch-Site/Origin 头的请求（curl 等）放行（本地单用户工具）。
 */
function isSameOriginRequest(req) {
  const site = req.headers['sec-fetch-site']
  if (typeof site === 'string' && site === 'cross-site') return false
  const origin = req.headers.origin
  if (typeof origin === 'string' && origin !== '' && origin !== 'null') {
    const host = req.headers.host
    if (typeof host !== 'string' || host === '') return false
    try {
      if (new URL(origin).host !== host) return false
    } catch {
      return false
    }
  }
  return true
}

/** 拒绝跨站请求（403）。 */
function requireSameOrigin(req, res) {
  if (isSameOriginRequest(req)) return true
  json(res, 403, { ok: false, error: 'cross-site-request-rejected' })
  return false
}

/** Read a bounded JSON request body; oversize / invalid / empty answers null. */
async function readJsonBody(req, cap) {
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

/** 读取 theme-center 命名空间视图；命名空间或 settings 服务缺失时返回 null。 */
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
 * 整层提交（revision 栅栏，防多浏览器并发覆盖）。字段名由浏览器端保证
 * 合法（白名单）；宿主侧不做字段级校验（schema 在提交时兜底）。
 * @param ctx - 注册上下文（settings 服务）。
 * @param writes - 批量写列表。
 * @returns 提交后的视图。
 */
export async function applySettingsWrites(ctx, writes) {
  const settings = ctx.get('settings')
  if (settings === undefined) throw new Error('settings service is absent')
  const current = buildSettingsView(ctx)
  if (current === null) throw new Error('theme-center settings namespace is not registered')
  const user = structuredClone(current.user ?? {})
  for (const write of writes) {
    if (write && typeof write === 'object' && typeof write.field === 'string') {
      if (write.op === 'set') user[write.field] = write.value
      else if (write.op === 'unset') delete user[write.field]
    }
  }
  await settings.replace(settingsNamespace(SETTINGS_NAMESPACE), user, current.revision)
  const next = buildSettingsView(ctx)
  if (next === null) throw new Error('theme-center settings namespace is not registered')
  return next
}

/** 注册 /theme-center/settings 路由（GET 视图 / POST 批量写，同源护栏）。 */
export function registerSettingsRoute(ctx) {
  const webserver = ctx.get('webServer')
  if (webserver === undefined) return
  webserver.register({
    kind: 'exact',
    path: SETTINGS_API_PATH,
    handler: async (req, res) => {
      if (!isSameOriginRequest(req)) {
        json(res, 403, { ok: false, error: 'cross-site-request-rejected' })
        return
      }
      if (req.method === 'GET') {
        const view = buildSettingsView(ctx)
        if (view === null) {
          json(res, 404, { ok: false, error: 'theme-center settings namespace is not available' })
          return
        }
        json(res, 200, { ok: true, value: view })
        return
      }
      if (req.method !== 'POST') {
        json(res, 405, { ok: false, error: 'only GET and POST are allowed' })
        return
      }
      const body = await readJsonBody(req, SETTINGS_BODY_CAP)
      const writes = body === null ? undefined : body.writes
      if (!Array.isArray(writes)) {
        json(res, 400, { ok: false, error: 'request body must be a JSON object with a writes array' })
        return
      }
      try {
        const view = await applySettingsWrites(ctx, writes)
        json(res, 200, { ok: true, value: view })
      } catch (error) {
        json(res, 422, { ok: false, error: error?.message ?? String(error) })
      }
    },
  })
}

/**
 * bundle 分发路由：GET /api/theme-center/bundle/<id> 返回
 * lib/skins/<id>.js 原样内容（text/javascript）。id 先过白名单再拼路径，
 * 不存在的 id / 缺失文件返回 404。
 */
function bundleRoute() {
  const prefix = THEME_CENTER_API_PREFIX
  return {
    kind: 'prefix',
    path: prefix,
    handler(req, res) {
      if (!requireMethod(req, res, 'GET')) return
      if (!requireSameOrigin(req, res)) return
      let id
      try {
        id = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname.slice(prefix.length + 1))
      } catch {
        json(res, 400, { ok: false, error: 'invalid-skin-id' })
        return
      }
      if (!SKIN_ID_RE.test(id) || !SKIN_IDS.includes(id)) {
        json(res, 404, { ok: false, error: 'skin-not-found' })
        return
      }
      const bundle = joinPath(SKINS_DIR, `${id}.js`)
      if (!statSync(bundle, { throwIfNoEntry: false })) {
        json(res, 404, { ok: false, error: 'skin-bundle-missing' })
        return
      }
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' })
      res.end(readFileSync(bundle, 'utf8'))
    },
  }
}

/**
 * 挂载设置命名空间与路由。失败只记录日志、绝不抛出——web shell 在插件
 * apply 抛错时会整体启动失败，主题配置同步服务不能把 GUI 拖垮（浏览器
 * 半区在 settings 服务缺失/路由不可达时静默降级为 localStorage 模式）。
 * installSettingsSection 经 ctx.inject 迟绑定：settings 就绪后（或早已
 * 就绪时立即）注册，完全没有 settings 服务的 profile 中静默不注册。
 */
export function apply(ctx, config = {}) {
  try {
    installSettingsSection(ctx, SETTINGS_NAMESPACE, Config, config, {
      setSource: () => {},
      onChange: () => {},
      validate: () => {},
    })
    registerSettingsRoute(ctx)
  } catch (error) {
    console.error('[theme-center] settings section registration failed:', error)
  }
  try {
    ctx.effect(() => {
      const disposers = []
      try {
        disposers.push(ctx.webServer.register(bundleRoute()))
      } catch (error) {
        for (const dispose of disposers) dispose()
        throw error
      }
      return () => {
        for (const dispose of disposers) dispose()
      }
    }, 'theme-center: bundle routes')
  } catch (error) {
    console.error('[theme-center] route registration failed:', error)
  }
}
