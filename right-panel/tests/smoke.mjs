/**
 * dsh-right-panel 冒烟测试（node 内置，无新依赖）：
 *   node tests/smoke.mjs
 *
 * 断言宿主半区 bundle 的导出契约：apply / inject / 公告文本存在且形状正确，
 * 以及护栏适配后的产物仍然语法完整（本文件 import 即触发解析）。
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const pkg = require('../package.json')

// 1. 包清单：exports / dsh.client / bundle patch 指向存在。
assert.equal(pkg.name, 'dsh-right-panel', '包名应为 dsh-right-panel')
assert.equal(pkg.exports['.'], './lib/index.js', 'exports["."] 应指向 lib/index.js')
assert.equal(pkg.exports['./client'], './lib/client.js', 'exports["./client"] 应指向 lib/client.js')
assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml', 'bundle patch 应指向 cordis.patch.yml')
assert.deepEqual(pkg.dsh.client.inject, [
  '@deepseek-ai/dsh-client-runtime',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-ui-conversation',
], 'dsh.client.inject 应保留上游三项')
assert.equal(pkg.dsh.client.platform, 'web', 'platform 应为 web')
assert.equal(pkg.license, 'Apache-2.0', '许可证应为 Apache-2.0')

const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8')
for (const f of ['lib/index.js', 'lib/client.js', 'cordis.patch.yml', 'README.md', 'LICENSE']) {
  assert.ok(read(f).length > 0, `${f} 应存在且非空`)
}

// 2. cordis.patch.yml 形状：insert id 与 name 匹配本包。
const patch = read('cordis.patch.yml')
assert.match(patch, /id: ui-dsh-right-panel/, 'patch 应含 insert id ui-dsh-right-panel')
assert.match(patch, /name: 'dsh-right-panel'/, 'patch 应引用 dsh-right-panel')

// 3. 宿主 bundle 导出契约（import 即验证语法与顶层可加载性）。
const host = await import('../lib/index.js')
assert.equal(typeof host.apply, 'function', 'apply 应为函数')
assert.ok(Array.isArray(host.inject), 'inject 应为数组')
for (const dep of ['webServer', 'subprocess', 'workspaceRegistry', 'systemPrompt']) {
  assert.ok(host.inject.includes(dep), `inject 应含 ${dep}`)
}
assert.equal(typeof host.AIONUI_PANEL_GUIDANCE, 'string', '公告文本应为字符串')
assert.ok(host.AIONUI_PANEL_GUIDANCE.length > 50, '公告文本应有内容')

// 4. 护栏适配落点：同源校验已替换 loopback 检查（不再引用 socket.remoteAddress 判地址）。
const hostSrc = read('lib/index.js')
assert.match(hostSrc, /cross-site-request-rejected/, '护栏拒绝体应为本仓库文案')
assert.doesNotMatch(hostSrc, /forbidden: loopback-only/, '不应残留 loopback-only 拒绝体')
assert.match(hostSrc, /sec-fetch-site/, '护栏应校验 Sec-Fetch-Site')

// 5. 浏览器 bundle 仍是 __ModuleLoader__ 模块（内核加载路径不变），且模块 id 已本地化为包名。
const clientSrc = read('lib/client.js')
assert.match(clientSrc, /__ModuleLoader__\.load\(/, 'client.js 应为 __ModuleLoader__ 模块')
assert.match(clientSrc, /id: "dsh-right-panel"/, 'client.js 模块 id 应等于包名 dsh-right-panel')
assert.doesNotMatch(clientSrc, /linxin666/, 'client.js 不应残留上游包名')

// 6. 皮肤适配层：harbor/trading 的 --aion-* 补丁存在且随 disposer 收回。
assert.match(clientSrc, /dsh-right-panel\/skin-adapt/, 'client.js 应含皮肤适配层标记')
assert.match(clientSrc, /body\[data-dsh-harbor\]/, '适配层应覆盖 harbor（夕港）')
assert.match(clientSrc, /body\[data-dsh-trading\]/, '适配层应覆盖 trading（交易终端）')
assert.match(clientSrc, /body\[data-dsh-trading\]\[data-ds-dark-theme\]/, '适配层应含 trading 暗色变体')
assert.match(clientSrc, /tag\.remove\(\)/, '适配层 style 应随 disposer 收回')

console.log('✓ dsh-right-panel smoke ok（package.json / patch / host 导出 / 护栏适配 / client 形态与模块 id / 皮肤适配层）')
