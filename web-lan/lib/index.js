// @npm-liqingfeng/dsh-web-lan —— dsh Web 局域网直连支持（精简版，适配官方 v0.1.2-alpha.2）
//
// 官方 alpha.2 已原生覆盖局域网访问的绝大部分能力，本插件只补官方未覆盖的：
//   - webserver 可配 host: 0.0.0.0（见 cordis.patch.yml），官方 runtime 自动把局域网
//     IP 推导进 trustedHosts，特权 /api 方法对局域网放行
//   - 页面 / 会话 / 工具经官方 token 认证后局域网可正常使用（官方 token 每次启动随机）
//   - crypto.randomUUID：官方前端一律用 crypto.getRandomValues 自实现，无需 polyfill
//
// 本插件补两件事：
//   1) isLoopback 重写：官方 settings 配置面仅对 loopback 主机开放（浏览器端 isLoopback
//      决定 settings describe 走 host / memory）。局域网设备要获得完整配置能力（插件配置
//      卡等），需让浏览器端 isLoopback 恒 true。实现为直接修改安装的 dsh-client-connection
//      包 client.js（client-modules 的 serveBundle 从磁盘文件构建响应，改文件即改响应）。
//   2) 局域网免 token 认证：官方 index 认证（browser-auth）对无 cookie 请求一律 401 +
//      提示，且 token 每次启动随机。局域网设备首次访问须带 token，体验差。本插件修改
//      dsh-client-connection 的 host 半区（lib/index.js），让来自本机 / 局域网私有 IP
//      （10.x / 192.168.x / 172.16-31.x）的请求在 index 认证层直接放行（免 token）；
//      公网 Host 仍走官方 token 认证，安全边界保留。
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
export const inject = []

// ── 1) isLoopback 重写（修改 dsh-client-connection 的 client.js）───────────────
//
// 注意：isLoopback 表达式（alpha.2：`transport?.ownsHost === true || pageLocation ===
// void 0 || isLoopbackHostname(pageLocation.hostname)`）不含逗号，因此匹配到第一个
// 逗号即完整覆盖整个值并保留对象属性分隔逗号。若 dsh 未来版本该表达式引入逗号
// （如函数调用参数），需同步调整此正则——patchClientJsFile 会校验替换完整性。

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
 * 若重写后仍存在未被替换的 `isLoopback: <非 true 表达式>`，说明正则未完整覆盖
 * 当前表达式（可能含逗号），记录警告而非静默破坏。
 * @returns 是否发生了文件写入。
 */
export function patchClientJsFile() {
  const path = connectionClientPath()
  const original = readFileSync(path, 'utf8')
  const rewritten = rewriteClientJs(original)
  if (rewritten === original) return false
  // 完整性校验：剩余任何 `isLoopback: X`（X 非 true）都是未覆盖的表达式。
  if (/isLoopback:\s*(?!true)(?:[a-zA-Z]|[{[(])/.test(rewritten)) {
    console.warn('[web-lan] client.js contains an unrewritten isLoopback expression; regex may need updating')
  }
  writeFileSync(path, rewritten)
  return true
}

// ── 2) 局域网免 token 认证（修改 dsh-client-connection 的 host 半区）───────────

/** 注入到 host 半区的局域网来源判断函数（JS 函数声明提升，追加到文件末尾即可）。 */
export const LAN_AUTHORITY_FN =
  'function isLanAuthority(authority){' +
  'if(authority===void 0)return false;' +
  'var hostname;' +
  'try{hostname=new URL("http://"+authority).hostname}catch(e){return false}' +
  'if(hostname==="localhost"||hostname==="::1"||hostname==="[::1]")return true;' +
  'if(/^127\\./.test(hostname))return true;' +
  'if(/^10\\./.test(hostname))return true;' +
  'if(/^192\\.168\\./.test(hostname))return true;' +
  'if(/^172\\.(1[6-9]|2\\d|3[01])\\./.test(hostname))return true;' +
  'return false;' +
  '}'

/** authorizeIndex 的放行分支（无 cookie 时的判断），替换为「已认证 OR 局域网来源」。 */
export const AUTHORIZE_INDEX_RE = /if \(this\.isAuthenticated\(req\)\) return true;/
export const AUTHORIZE_INDEX_NEW = 'if (this.isAuthenticated(req) || isLanAuthority(requestAuthority(req.headers))) return true;'

/**
 * 给 host 半区内容注入局域网免认证逻辑（纯函数，幂等）：
 * 追加 isLanAuthority 函数 + 把 authorizeIndex 放行条件改为「已认证 OR 局域网来源」。
 * @param content - dsh-client-connection lib/index.js 内容。
 * @returns 注入后的内容。
 */
export function patchBrowserAuth(content) {
  let out = content
  if (!out.includes('function isLanAuthority')) {
    out = out.replace(/\s*$/, '\n' + LAN_AUTHORITY_FN + '\n')
  }
  out = out.replace(AUTHORIZE_INDEX_RE, AUTHORIZE_INDEX_NEW)
  return out
}

/** 定位 dsh-client-connection 的 host 半区（含 browser-auth 认证逻辑）。 */
export function browserAuthPath() {
  return resolveDshModule('dsh-client-connection/lib/index.js')
}

/**
 * 幂等重写 host 半区文件（局域网免认证）：内容已注入时不写。
 * @returns 是否发生了文件写入。
 */
export function patchBrowserAuthFile() {
  const path = browserAuthPath()
  const original = readFileSync(path, 'utf8')
  const rewritten = patchBrowserAuth(original)
  if (rewritten === original) return false
  writeFileSync(path, rewritten)
  return true
}

// ── apply ──────────────────────────────────────────────────────────────────

export function apply() {
  // 两个补丁都修改 dsh-client-connection 包文件；client-modules / host 在启动时从
  // 磁盘加载，改文件后需重启 dsh web 生效（部署时建议先执行 patch* 再启动，一次到位）。
  try {
    if (patchClientJsFile()) {
      console.log('[web-lan] client.js isLoopback rewritten; restart dsh web to apply')
    }
  } catch (error) {
    console.error('[web-lan] isLoopback rewrite failed:', error)
  }
  try {
    if (patchBrowserAuthFile()) {
      console.log('[web-lan] browser-auth LAN bypass injected; restart dsh web to apply')
    }
  } catch (error) {
    console.error('[web-lan] browser-auth LAN bypass failed:', error)
  }
}
