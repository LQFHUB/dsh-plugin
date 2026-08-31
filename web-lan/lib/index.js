// @npm-liqingfeng/dsh-web-lan —— dsh Web 局域网直连支持（精简版，适配官方 v0.1.2-alpha.2）
//
// 官方 alpha.2 已原生覆盖局域网访问的绝大部分能力，本插件不再重复实现：
//   - webserver 可配 host: 0.0.0.0（见 cordis.patch.yml），官方 runtime 自动把局域网
//     IP 推导进 trustedHosts，特权 /api 方法对局域网放行（无需 apiProxy relay）
//   - 页面 / 会话 / 工具经官方 token 认证后局域网可正常使用
//
// 本插件只补官方未覆盖的两件事：
//   1) crypto.randomUUID polyfill：纯 HTTP 局域网来源（非安全上下文）缺该 Web API
//   2) isLoopback 重写：官方 settings 配置面仅对 loopback 主机开放（浏览器端
//      isLoopback 决定 settings describe 走 host / memory；非本机走 memory 模式即
//      配置不可用）。局域网设备要获得完整配置能力（插件配置卡等），需让浏览器端
//      isLoopback 恒 true。实现为直接修改安装的 dsh-client-connection 包 client.js
//      ——client-modules 的 serveBundle 从磁盘文件构建 bundle 响应，改文件即改响应
//      内容；apply 幂等执行，dsh 升级覆盖文件后下次启动自动恢复。
//
// 前提：profile 的 webserver 需绑定 0.0.0.0（见 cordis.patch.yml）：
//   - id: webserver
//     config: { host: 0.0.0.0, port: 3080 }

import { existsSync } from 'node:fs'
import { readFileSync, writeFileSync } from 'node:fs'

// 本插件以 symlink/真实目录形式挂进 profile 的 node_modules，ESM 会按真实路径解析
// symlink 目标（向上找不到 node_modules 祖先），因此 dsh 内部包不通过 import
// 说明符引入，而是直接从 npm 全局安装位置定位。
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

export const name = 'web-lan'
export const inject = ['webServer']

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

// ── 2) isLoopback 重写（修改 dsh-client-connection 的 client.js）──────────

export const CLIENT_JS_RE = /isLoopback:\s*[^,]+/g

/** 把 client.js 里的 isLoopback 表达式统一重写为 true。 */
export function rewriteClientJs(content) {
  return content.replace(CLIENT_JS_RE, 'isLoopback: true')
}

/** 定位 dsh-client-connection 的 client.js（serveBundle 的磁盘输入）。 */
export function connectionClientPath() {
  return resolveDshModule('dsh-client-connection/lib/client.js')
}

/**
 * 幂等重写 client.js 文件：内容已为 true 时不写（返回 false）。
 * @returns 是否发生了文件写入。
 */
export function patchClientJsFile() {
  const path = connectionClientPath()
  const original = readFileSync(path, 'utf8')
  const rewritten = rewriteClientJs(original)
  if (rewritten === original) return false
  writeFileSync(path, rewritten)
  return true
}

// ── apply ──────────────────────────────────────────────────────────────────

export function apply(ctx) {
  ctx.effect(() => ctx.webServer.tapIndex(injectPolyfill), 'web-lan: randomUUID polyfill')
  // isLoopback 重写：client-modules 在启动时从磁盘文件构建 bundle 响应，改文件后
  // 需重启 dsh web 生效（部署时建议先执行 patchClientJsFile 再启动，一次到位）。
  try {
    if (patchClientJsFile()) {
      console.log('[web-lan] client.js isLoopback rewritten; restart dsh web to apply')
    }
  } catch (error) {
    console.error('[web-lan] isLoopback rewrite failed:', error)
  }
}
