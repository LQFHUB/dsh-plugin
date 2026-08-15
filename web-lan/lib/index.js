// @user/dsh-web-lan —— dsh Web 局域网直连支持（免反代）
//
// 单一 host 插件，做三件事：
//   1) 向 index.html 注入 crypto.randomUUID polyfill（该 Web API 仅存在于
//      安全上下文，纯 HTTP 的局域网来源没有它）
//   2) 把默认仅限 loopback 的特权 /api 方法（settings / credentials / host /
//      agentPreset / llm.discoverModels）经 apiProxy 转发给局域网客户端，
//      使其可以配置模型与插件
//   3) 重写所服务的 dsh-client-connection client.js，使浏览器端 isLoopback
//      标志为 true（插件配置卡片可在非本机渲染）
//
// 前提：profile 的 webserver 需绑定 0.0.0.0（见 cordis.patch.yml）：
//   - id: webserver
//     config: { host: 0.0.0.0, port: 3080 }
// resolveLanTrust 才会把局域网 IP 放行进非特权 /api 围栏。

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

// 本插件以 symlink 形式挂进 profile 的 node_modules，ESM 会按真实路径解析
// symlink 目标（向上找不到 node_modules 祖先），因此 dsh 内部包不通过
// import 说明符引入，而是直接从 npm 全局安装位置定位。
const DSH_INSTALL_CANDIDATES = [
  '/usr/local/lib/node_modules/@deepseek-ai/dsh',
  '/usr/lib/node_modules/@deepseek-ai/dsh',
]

function findDshInstall() {
  for (const root of DSH_INSTALL_CANDIDATES) {
    if (existsSync(`${root}/package.json`)) return root
  }
  throw new Error('web-lan: cannot locate the @deepseek-ai/dsh installation')
}

function resolveDshModule(rel) {
  const path = `${findDshInstall()}/node_modules/@deepseek-ai/${rel}`
  if (!existsSync(path)) throw new Error(`web-lan: missing dsh module @deepseek-ai/${rel}`)
  return path
}

const { toFetchHandler } = await import(
  pathToFileURL(resolveDshModule('dsh-host-apiproxy/lib/index.js')).href,
)

export const name = 'web-lan'
export const inject = ['webServer', 'apiProxy']

// ── 1) randomUUID polyfill（RFC 4122 v4，基于 crypto.getRandomValues）──────

export const MARKER = '<!--dsh-web-lan-polyfill-->'
export const POLYFILL_SCRIPT =
  '<script>(function(){var c=globalThis.crypto;if(!c){try{c=globalThis.crypto={}}catch(e){return}}' +
  'if(typeof c.randomUUID==="function")return;' +
  'c.randomUUID=function(){var b=new Uint8Array(16);c.getRandomValues(b);' +
  'b[6]=b[6]&15|64;b[8]=b[8]&63|128;var h="";' +
  'for(var i=0;i<16;i++){h+=b[i].toString(16).padStart(2,"0")}' +
  'return h.slice(0,8)+"-"+h.slice(8,12)+"-"+h.slice(12,16)+"-"+h.slice(16,20)+"-"+h.slice(20)}})();</script>'

/** 在 <head> 之后注入 polyfill 标记与脚本；无 <head> 时原样返回。 */
export function injectPolyfill(html) {
  const head = html.indexOf('<head>')
  if (head === -1) return html
  return html.slice(0, head + 6) + MARKER + POLYFILL_SCRIPT + html.slice(head + 6)
}

// ── 2) 特权 API relay ──────────────────────────────────────────────────────

export const PRIVILEGED_METHODS = [
  'agentPreset.read',
  'agentPreset.copy',
  'agentPreset.openDocument',
  'agentPreset.remove',
  'host.pickDirectory',
  'host.openPath',
  'settings.describe',
  'settings.openDocument',
  'settings.update',
  'settings.replace',
  'settings.mutate',
  'credentials.describe',
  'credentials.set',
  'credentials.unset',
  'llm.discoverModels',
]

/** 构造特权 API 的 relay 处理器：把局域网请求原样转发给 apiProxy。 */
export function makeRelay(apiProxy) {
  const fetch = toFetchHandler(apiProxy).fetch
  return async (req, res) => {
    try {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const body = Buffer.concat(chunks)
      const headers = {}
      for (const [key, value] of Object.entries(req.headers)) {
        if (key === 'content-length' || Array.isArray(value)) continue
        headers[key] = value
      }
      const response = await fetch(new Request(`http://dsh.internal${req.url}`, {
        method: req.method,
        headers,
        ...(req.method === 'GET' || req.method === 'HEAD' ? {} : { body }),
      }))
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()))
      if (response.body) {
        for await (const chunk of response.body) res.write(chunk)
      }
      res.end()
    } catch (error) {
      res.writeHead(500, { 'content-type': 'text/plain' })
      res.end(`web-lan relay failed: ${String(error)}`)
    }
  }
}

// ── 3) 浏览器端 isLoopback 重写 ────────────────────────────────────────────

export const CLIENT_JS_RE = /isLoopback:\s*[^,]+/g

/** 把 client.js 里的 isLoopback 表达式统一重写为 true。 */
export function rewriteClientJs(content) {
  return content.replace(CLIENT_JS_RE, 'isLoopback: true')
}

let clientJsCache

async function serveClientJs(req, res) {
  try {
    if (clientJsCache === undefined) {
      clientJsCache = rewriteClientJs(
        await readFile(resolveDshModule('dsh-client-connection/lib/client.js'), 'utf8'),
      )
    }
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-cache' })
    res.end(clientJsCache)
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain' })
    res.end(`web-lan client.js rewrite failed: ${String(error)}`)
  }
}

// ── apply ──────────────────────────────────────────────────────────────────

export function apply(ctx) {
  ctx.effect(() => ctx.webServer.tapIndex(injectPolyfill), 'web-lan: randomUUID polyfill')

  const relay = makeRelay(ctx.apiProxy)
  for (const method of PRIVILEGED_METHODS) {
    ctx.effect(
      () => ctx.webServer.register({ kind: 'exact', path: `/api/${method}`, handler: relay }),
      `web-lan: relay /api/${method}`,
    )
  }

  ctx.effect(
    () => ctx.webServer.register({
      kind: 'exact',
      path: '/plugins/@deepseek-ai/dsh-client-connection/client.js',
      handler: serveClientJs,
    }),
    'web-lan: client.js isLoopback rewrite',
  )
}
