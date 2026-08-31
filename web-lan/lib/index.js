// @npm-liqingfeng/dsh-web-lan —— dsh Web 局域网直连支持（精简版，适配官方 v0.1.2-alpha.2）
//
// 官方 alpha.2 已原生覆盖局域网访问的绝大部分能力，本插件不再重复实现：
//   - webserver 可配 host: 0.0.0.0（见 cordis.patch.yml），官方 runtime 自动把局域网
//     IP 推导进 trustedHosts，特权 /api 方法对局域网放行
//   - 页面 / 会话 / 工具经官方 token 认证后局域网可正常使用
//   - crypto.randomUUID：官方前端一律用 crypto.getRandomValues 自实现（util-crypto
//     的 randomUUID / connection 的 randomUuid），明确针对纯 HTTP 局域网非安全来源，
//     无需 polyfill（lint 禁止 crypto.randomUUID 调用）
//
// 本插件只补官方未覆盖的一件事：isLoopback 重写。官方 settings 配置面仅对 loopback
// 主机开放（浏览器端 isLoopback 决定 settings describe 走 host / memory；非本机走
// memory 模式即配置不可用）。局域网设备要获得完整配置能力（插件配置卡等），需让
// 浏览器端 isLoopback 恒 true。实现为直接修改安装的 dsh-client-connection 包
// client.js ——client-modules 的 serveBundle 从磁盘文件构建 bundle 响应，改文件即改
// 响应内容；apply 幂等执行，dsh 升级覆盖文件后下次启动自动恢复。
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

// ── isLoopback 重写（修改 dsh-client-connection 的 client.js）───────────────
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

// ── apply ──────────────────────────────────────────────────────────────────

export function apply() {
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
