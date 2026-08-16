/**
 * theme-center — Host 半区。
 *
 * 主题插件的宿主部分只做一件事：把本插件自带的 10 款皮肤 bundle
 * （lib/skins/<id>.js，原样复用 zhu1090093659/dsh-web-ui 皮肤中心的分发产物）
 * 以同源脚本的形式提供给浏览器端。浏览器半区（lib/client.js）通过
 * 「主题」设置卡片加载 /api/theme-center/bundle/<id>，经内核自身的
 * __ModuleLoader__ / __DSH_MODULES__ 执行皮肤 bundle，实现试穿与应用——
 * 与皮肤中心的 try-on 机制一致，但本插件把 bundle 直接内置，不依赖
 * dsh-web-ui 的仓库布局、profile 软链或启动配置改写。
 *
 * 只读资源服务：本半区不写任何配置文件、不触碰模型请求。
 */
import { readFileSync, statSync } from 'node:fs'
import { join as joinPath } from 'node:path'
import { fileURLToPath } from 'node:url'

/** lib/skins/ 目录（bundle 存放处），以本文件位置解析，link 安装同样有效。 */
const SKINS_DIR = fileURLToPath(new URL('./skins/', import.meta.url))

/** 浏览器端 bundle 路由前缀。 */
export const THEME_CENTER_API_PREFIX = '/api/theme-center/bundle'

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
 * 挂载路由。失败只记录日志、绝不抛出——web shell 在插件 apply 抛错时
 * 会整体启动失败，主题分发服务不能把 GUI 拖垮（浏览器半区有降级提示）。
 */
export function apply(ctx) {
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
