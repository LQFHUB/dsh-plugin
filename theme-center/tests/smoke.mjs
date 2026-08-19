/**
 * dsh-theme-center 冒烟测试（node 内置，无新依赖）：
 *   node tests/smoke.mjs
 *
 * 覆盖：
 *  1. 包清单形状（exports / dsh.client / bundle patch）
 *  2. cordis.patch.yml 形状
 *  3. 宿主半区导出契约（name / inject / apply）
 *  4. 浏览器 bundle 模块 id、主题注册表与 lib/skins/ 一一对应
 *  5. 一体化模块存在性：宽度预设、压制 CSS 插值与门控、双 Tab 样式
 *  6. apply 契约（假 window/document/react）：body 作用域属性设置/收回、
 *     三个样式元素（card/width/focus）注入/收回、压制默认 70% 落地、零残留
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, readdirSync } from 'node:fs'

const require = createRequire(import.meta.url)
const pkg = require('../package.json')
const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8')

// 1. 包清单
assert.equal(pkg.name, '@npm-liqingfeng/dsh-theme-center', '包名应为 @npm-liqingfeng/dsh-theme-center')
assert.equal(pkg.version, '0.4.2', '版本应为 0.3.5（14 款磨砂改造）')
assert.equal(pkg.exports['.'], './lib/index.js', 'exports["."] 应指向 lib/index.js')
assert.equal(pkg.exports['./client'], './lib/client.js', 'exports["./client"] 应指向 lib/client.js')
assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml', 'bundle patch 应指向 cordis.patch.yml')
assert.deepEqual(pkg.dsh.client.inject, [], 'dsh.client.inject 应为空')
assert.equal(pkg.dsh.client.platform, 'web', 'platform 应为 web')
assert.equal(pkg.license, 'BSD-3-Clause', '许可证应为 BSD-3-Clause')

// 2. patch 形状
const patch = read('cordis.patch.yml')
assert.match(patch, /id: theme-center/, 'patch 应含 insert id theme-center')
assert.match(patch, /name: '@npm-liqingfeng\/dsh-theme-center'/, 'patch 应引用 @npm-liqingfeng/dsh-theme-center')

// 3. 宿主半区
const host = await import('../lib/index.js')
assert.equal(host.name, 'theme-center', '宿主 name 应为 theme-center')
assert.deepEqual(host.inject, ['webServer'], '宿主 inject 应只含 webServer')
assert.equal(typeof host.apply, 'function', '宿主 apply 应为函数')
// 服务端配置同步：命名空间 + 读写路由 + schema 字段
assert.equal(host.SETTINGS_NAMESPACE, 'theme-center', '设置命名空间应为 theme-center')
assert.equal(host.SETTINGS_API_PATH, '/theme-center/settings', '设置路由应为 /theme-center/settings')
assert.equal(typeof host.buildSettingsView, 'function', '应导出 buildSettingsView')
assert.equal(typeof host.applySettingsWrites, 'function', '应导出 applySettingsWrites')
const configDesc = String(host.Config)
for (const field of ['theme', 'scrim', 'width', 'focus', 'textScale', 'font', 'hideThink', 'hideTool', 'hideContext']) {
  assert.match(configDesc, new RegExp(field), `Config 应有 ${field} 字段（9 项全覆盖）`)
}

// 4. 浏览器 bundle：模块 id + 主题注册表与 lib/skins 一一对应
const clientSrc = read('lib/client.js')
assert.match(clientSrc, /__ModuleLoader__\.load\(/, 'client.js 应为 __ModuleLoader__ 模块')
assert.match(clientSrc, /id: "@npm-liqingfeng\/dsh-theme-center"/, 'client.js 模块 id 应为 @npm-liqingfeng/dsh-theme-center')
assert.match(clientSrc, /key: "theme-center"/, '卡片注册 key 应为设置命名空间 theme-center（rc.7 keyed slot 契约）')

const skinFiles = readdirSync(new URL('../lib/skins/', import.meta.url)).filter((f) => f.endsWith('.js'))
const themeIds = [...clientSrc.matchAll(/\{ id: "([a-z0-9-]+)", name: "[^"]+", accent:/g)].map((m) => m[1])
assert.ok(themeIds.includes('official'), '注册表应含 official')
const skinIds = themeIds.filter((id) => id !== 'official')
for (const id of skinIds) {
  assert.ok(skinFiles.includes(`${id}.js`), `注册表主题 ${id} 应有 lib/skins/${id}.js`)
}
for (const f of skinFiles) {
  assert.ok(skinIds.includes(f.replace(/\.js$/, '')), `lib/skins/${f} 应在注册表中登记`)
}
assert.equal(skinIds.length, skinFiles.length, '注册表皮肤数应与 lib/skins 文件数一致')
// Codex 深蓝专项：参照 image/1.png 配色，黑底+蓝黑过渡+磨砂（2026-08-17 新增）
assert.ok(themeIds.includes('codex'), '注册表应含 codex（Codex 深蓝）')
assert.match(clientSrc, /"codex", name: "Codex 深蓝", accent: "#339cff"/, 'codex 注册条目应为中文名 Codex 深蓝 + 蓝 accent')
assert.match(clientSrc, /attr: "data-dsh-codex"/, 'codex 应注册 data-dsh-codex 属性')
assert.ok(skinFiles.includes('codex.js'), '注册表 codex 应有 lib/skins/codex.js 文件')
const codexBundle = read('lib/skins/codex.js')
assert.match(codexBundle, /data-dsh-codex/, 'codex bundle 应作用于 data-dsh-codex')
assert.match(codexBundle, /backdrop-filter: blur\(20px\)/, 'codex 主界面应有毛玻璃磨砂（root backdrop-filter blur）')
assert.match(codexBundle, /\.VOzbGW_panel \{ background: var\(--dsw-alias-bg-base\) !important; \}/, 'codex 设置面板应不透明（磨砂仅主界面）')
assert.match(codexBundle, /specific-sidebar-fill: radial-gradient\(circle at 88% 94%, rgba\(26,32,48,0.60\)/, 'codex 侧边栏应有精刻多层蓝黑过渡（右下蓝黑径向光晕 + 对角 135deg 多色标，复刻参考图）')
assert.match(codexBundle, /bg-mask-1: rgba\(0, 0, 0, 0.42\)/, 'codex 设置面板遮罩应为中性黑（背景变暗模糊，非蓝蒙层）')
assert.match(codexBundle, /linear-gradient\(135deg, #1e2024 0%, #181818 32%/, 'codex 暗色背景应有对角黑底多层渐变')
assert.match(read('lib/meta/codex.json'), /"name": "Codex 深蓝"/, 'codex 应有 meta 元数据')

// 其余 13 款目标皮肤（2026-08-17 统一改造）：磨砂 root blur / 发送按钮 info 品牌色 / mask 中性黑 / 设置面板不透明
const FROST_TARGETS = ['harbor','catppuccin','mint-fresh','cyber-neon','apple-minimal','tokyo-night','nord','skin-ocean','skin-graphite','skin-forest','skin-sunset','skin-midnight','skin-paper','skin-sakura']
for (const t of FROST_TARGETS) {
  const b = read('lib/skins/' + t + '.js')
  assert.match(b, /backdrop-filter: ?blur\(20px\)/, t + ' 应有磨砂 root blur')
  assert.match(b, /button-info-fill/, t + ' 发送按钮应使用品牌主色（info-fill）')
  assert.match(b, /bg-mask-1: ?rgba\(0, ?0, ?0,/, t + ' 设置遮罩应为中性黑（非品牌深色蒙层）')
  assert.match(b, /VOzbGW_panel/, t + ' 设置面板应不透明')
}
// 亮暗双形态 6 款：亮色态侧边栏应浅色化（不与白主题割裂）
const LIGHT_SIDE = ['catppuccin','mint-fresh','cyber-neon','apple-minimal','tokyo-night','nord']
for (const t of LIGHT_SIDE) {
  assert.match(read('lib/skins/' + t + '.js'), /:not\(\[data-ds-dark-theme\]\) \{ --dsw-specific-sidebar-fill/, t + ' 亮色态侧边栏应浅色化')
}

// 5. 一体化模块存在性（宽度 / 精简 / 双 Tab）
assert.match(clientSrc, /const WIDTH_PRESETS = \[896, 1024, 1152, 1280, 1440, 1600\]/, '应有 6 档宽度预设')
assert.match(clientSrc, /dsh-theme-center:width:v1/, '应有宽度持久化键')
assert.match(clientSrc, /--dsh-chat-content-width/, '宽度规则应覆盖内容区宽度变量')
assert.match(clientSrc, /FOCUS_DEFAULT = 80/, '压制默认应为 80%')
assert.match(clientSrc, /dsh-theme-center:focus:v1/, '应有压制持久化键')
assert.match(clientSrc, /--tc-focus/, '压制 CSS 应使用 --tc-focus 插值变量')
assert.match(clientSrc, /calc\(14px - 2px \* var\(--tc-focus\)\)/, 'Think/工具卡标题字号应线性插值')
assert.match(clientSrc, /data-tc-focus/, '压制规则应由 body[data-tc-focus] 门控')
assert.match(clientSrc, /\[data-variant="think"\] \[class\*="summary"\]/, '应有 Think 摘要变淡规则')
assert.match(clientSrc, /\[data-chat-flow-kind="tool-call"\] \[class\*="summary"\]/, '应有工具卡摘要变淡规则')
assert.match(clientSrc, /\[data-chat-flow-kind="context"\] \[class\*="source"\]/, '应有上下文注入卡来源变淡规则')
assert.match(clientSrc, /\[data-tool="cordis_run"\] \[class\*="row"\]/, '应有 Cordis 插件卡行变矮规则')
assert.match(clientSrc, /data-state="error"\] \[class\*="title"\]/, '应有错误卡标题截断规则')
assert.match(clientSrc, /\.tc-tabs/, '卡片应有 Tab 条样式')
assert.match(clientSrc, /\.tc-secTitle/, '卡片应有区块标题样式')
assert.doesNotMatch(clientSrc, /conversation\.session\.header\.utilities/, '不应再注册标题栏宽度按钮')
assert.match(clientSrc, /dataset\.pluginCss = "dsh-theme-center\/card"/, '应有 card 样式元素')
assert.match(clientSrc, /dataset\.pluginCss = "dsh-theme-center\/width"/, '应有 width 样式元素')
assert.match(clientSrc, /dataset\.pluginCss = "dsh-theme-center\/focus"/, '应有 focus 样式元素')
assert.match(clientSrc, /dataset\.pluginCss = "dsh-theme-center\/table"/, '应有 table 样式元素')
assert.match(clientSrc, /dataset\.pluginCss = "dsh-theme-center\/appearance"/, '应有 appearance 样式元素')
// 表格撑满列宽：覆盖 max-content 为 100% + 解除 td/th 320px 列上限，作用域限助手回答/用户消息
assert.match(clientSrc, /data-chat-flow-kind="assistant-step"\] table/, '应有助手回答表格规则')
assert.match(clientSrc, /userKindsSel\('body\[data-dsh-theme-center\]', ' table'\)/, '应有用户消息表格规则（含 steering 通道）')
assert.match(clientSrc, /width:100% !important;max-width:100% !important/, '表格应撑满列宽')
assert.match(clientSrc, /max-width:none/, '应解除 td/th 列宽上限')
// 外观扩展：会话区字号缩放（16/28 基线 calc，门控 data-tc-scale，不影响 Think/工具/上下文）
assert.match(clientSrc, /TEXT_SCALE_DEFAULT = 80/, '字号默认应为 80%')
assert.match(clientSrc, /TEXT_SCALE_OFFICIAL = 100/, '官方原样锚点应为 100%（与默认值解耦）')
assert.match(clientSrc, /TEXT_SCALE_MIN = 75/, '字号下限应为 75%')
assert.match(clientSrc, /calc\(16px \* var\(--tc-text-scale\)\)/, '应有字号缩放 calc 规则')
assert.match(clientSrc, /calc\(28px \* var\(--tc-text-scale\)\)/, '应有行高缩放 calc 规则')
assert.match(clientSrc, /data-composer-card="true"\] div:has\(> textarea\)\{font-size:calc\(16px \* var\(--tc-text-scale\)\)\}/, '输入框内容应随字号缩放（缩放 textarea 父层，backdrop 可见文字/textarea 光标/mirror 测量三层一并 inherit；行高保持官方 24px 防垂直错位）')
assert.match(clientSrc, /USER_TEXT_KINDS = \['user', 'steering'\]/, '用户消息通道应含 steering（2026-08-17 实测发送内容走 steering 通道不缩放）')
assert.match(clientSrc, /userKindsSel\(F, ' \[data-time-hover-root\] > div:first-child > div'\)/, '用户气泡字号/字体规则应覆盖 user+steering 且每项带完整门控前缀（逗号列表前缀只作用于第一项）')
assert.match(clientSrc, /data-tc-scale/, '字号缩放应由 data-tc-scale 门控')
// 会话区标题（markdown h1-h6）为官方固定 px 令牌，缩放须重定义令牌（calc 乘法 + 随全站字体）
assert.match(clientSrc, /--dsw-font-markdown-h1/, '应有 h1 标题令牌基线')
assert.match(clientSrc, /--dsw-font-markdown-h2/, '应有 h2 标题令牌基线')
assert.match(clientSrc, /--dsw-font-markdown-base-strong/, '应有 h5/h6 标题令牌基线')
assert.match(clientSrc, /\* var\(--tc-text-scale\)\)\/calc\(/, '标题令牌应按 --tc-text-scale 比例缩放')
assert.match(clientSrc, /headingTokensCss\("var\(--dsw-font-family\)"\)/, '缩放分支标题 family 应随全站字体变量')
assert.match(clientSrc, /headingTokensCss\(stack\)/, '字体分支标题应重定义令牌（随所选字体）')
assert.match(clientSrc, /--tc-text-scale:1\}/, '仅换字体时应有 --tc-text-scale 基线 1')
// 外观扩展：全站字体下拉（FONTS 表 ≥6 项 + 双路覆盖，代码字体不动）
assert.match(clientSrc, /id: "msyh"/, 'FONTS 应含微软雅黑')
assert.match(clientSrc, /id: "pingfang"/, 'FONTS 应含苹方')
assert.match(clientSrc, /id: "sourcehan"/, 'FONTS 应含思源黑体')
assert.match(clientSrc, /id: "jetbrains"/, 'FONTS 应含 JetBrains Mono')
assert.match(clientSrc, /--dsw-font-family:/, '字体应覆盖 --dsw-font-family')
assert.match(clientSrc, /data-tc-font/, '字体应由 data-tc-font 门控')
// 外观扩展：隐藏思考行/工具卡/上下文卡（display:none + ~= 门控）
assert.match(clientSrc, /data-tc-hide~="think"\] \[data-variant="think"\]\{display:none !important\}/, '应能隐藏思考行')
assert.match(clientSrc, /data-tc-hide~="tool"\] \[data-chat-flow-kind="tool-call"\]\{display:none !important\}/, '应能隐藏工具调用卡')
assert.match(clientSrc, /data-tc-hide~="context"\] \[data-chat-flow-kind="context"\]\{display:none !important\}/, '应能隐藏上下文注入卡')
// 服务端同步：一处配置、所有终端生效（作用域/轮询/迁移/diff 应用/回环抑制）
assert.match(clientSrc, /SETTINGS_API_PATH = "\/theme-center\/settings"/, '应有设置路由常量')
assert.match(clientSrc, /SYNC_INTERVAL_MS = 15000/, '轮询间隔应为 15s')
assert.match(clientSrc, /WRITE_DEBOUNCE_MS = 400/, '滑杆写应有去抖')
assert.match(clientSrc, /function ThemeCenterSettingsScope/, '应有设置作用域')
assert.match(clientSrc, /set: \(field, value\) => mutate\(\[/, '作用域应实现 set（SettingsScope 契约）')
assert.match(clientSrc, /unset: \(field\) => mutate\(\[/, '作用域应实现 unset')
assert.match(clientSrc, /mutate,\n\s+refresh,/, '作用域应暴露 mutate（迁移/去抖写必需；曾漏掉致 112 实测迁移失效）')
assert.match(clientSrc, /function sanitizeServerValue/, '应有服务器值清洗')
assert.match(clientSrc, /function localStateToWrites/, '应有本地状态迁移上推')
assert.match(clientSrc, /let applyingRemote = false/, '应有回环抑制标志')
assert.match(clientSrc, /function scheduleServerWrite/, '应有服务器写排队')
assert.match(clientSrc, /function applyRemoteState/, '应有服务器状态应用')
assert.match(clientSrc, /"theme-center: server sync"/, '应有同步循环 effect')
assert.match(clientSrc, /配置已同步到服务器，所有终端生效/, '卡片应有同步状态提示')
assert.match(clientSrc, /服务器配置不可用，仅本机生效/, '卡片应有降级提示')
assert.match(clientSrc, /scheduleServerWrite\("theme", theme\.id\)/, '应用主题应写服务器')
assert.match(clientSrc, /scheduleServerWrite\(HIDE_FIELD\[key\], next\[key\]\)/, '隐藏开关应写服务器')
// 主题适配契约：不写死颜色（仅字号/行高/透明度/尺寸插值）
const colorLeak = clientSrc.match(/focusCss[\s\S]*?\/\/#endregion/) // 精简模块区间
assert.ok(colorLeak, '应能定位精简模块区间')
const focusBlock = colorLeak[0]
assert.doesNotMatch(focusBlock, /#[0-9a-fA-F]{3,6}\b|rgb\(|rgba\(/, '压制 CSS 不应硬编码颜色')

// 6. apply 契约：假 window/document/react 全链路 + disposer 零残留
const created = []
const fakeDoc = {
  title: '测试页面',
  head: { appendChild() {} },
  body: {
    dataset: {},
    style: { getPropertyValue: () => '', setProperty() {}, removeProperty() {} },
  },
  createElement(tag) {
    const el = {
      tagName: tag.toUpperCase(),
      dataset: {},
      style: {},
      textContent: '',
      removed: false,
      appendChild() {},
      remove() { this.removed = true },
    }
    created.push(el)
    return el
  },
  querySelectorAll: () => [],
  querySelector: () => null,
  visibilityState: 'visible',
  addEventListener() {},
  removeEventListener() {},
}
const fakeWindow = {
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  __DSH_MODULES__: undefined,
  // 服务端同步 stub：fetch 恒失败 → 作用域进入 unavailable（降级路径，不抛错）
  fetch: () => Promise.reject(new Error('no server in smoke')),
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  addEventListener() {},
  removeEventListener() {},
}
let factory = null
fakeWindow.__ModuleLoader__ = { load(entry) { factory = entry.factory } }

globalThis.window = fakeWindow
globalThis.document = fakeDoc
const clientSource = read('lib/client.js')
// 用 vm 在带假全局的环境中执行 bundle
const vm = await import('node:vm')
const sandbox = vm.createContext({ window: fakeWindow, document: fakeDoc, console, setTimeout, clearTimeout, setInterval, clearInterval, Promise })
vm.runInContext(clientSource, sandbox, { filename: 'lib/client.js' })
assert.ok(factory, '__ModuleLoader__.load 应被调用')

const moduleExports = factory((id) => {
  assert.equal(id, 'react', 'bundle 应只 require react')
  return {}
})
assert.equal(typeof moduleExports.apply, 'function', 'bundle 应导出 apply')
// 注意：bundle 在 vm 沙箱执行，其数组原型与主 realm 不同，先展开再比较
assert.deepEqual([...moduleExports.inject], ['slots'], 'bundle inject 应为 slots')

// 执行 apply：收集 effects
const effects = []
const fakeCtx = {
  effect(cb) { effects.push(cb()) },
  get() { return undefined },
  on() { return () => {} },
}
moduleExports.apply(fakeCtx)

// 设置断言
assert.equal(fakeDoc.body.dataset.dshThemeCenter, '', '应设置 body[data-dsh-theme-center] 作用域')
assert.equal(fakeDoc.body.dataset.tcFocus, '', '压制默认 80% 应挂 body[data-tc-focus] 门控')
assert.equal(created.filter((el) => el.tagName === 'STYLE').length, 5, '应注入 5 个样式元素（card/width/focus/table/appearance）')
const widthStyle = created.find((el) => el.dataset.pluginCss === 'dsh-theme-center/width')
assert.ok(widthStyle, '应有 width 样式元素')
assert.match(widthStyle.textContent, /--dsh-chat-content-width:896px/, '默认宽度应落地 896px')
const focusStyle = created.find((el) => el.dataset.pluginCss === 'dsh-theme-center/focus')
assert.ok(focusStyle, '应有 focus 样式元素')
assert.match(focusStyle.textContent, /--tc-focus:0\.8/, '默认压制 80% 应落地 --tc-focus:0.8')
assert.match(focusStyle.textContent, /calc\(14px - 2px \* var\(--tc-focus\)\)/, 'focus 样式应含插值规则')
assert.equal(created.find((el) => el.dataset.pluginCss === 'dsh-theme-center/card').textContent.length > 100, true, 'card 样式应有内容')
// 外观扩展默认态：字号 100%（无门控）、字体 default（无门控）、隐藏全关（无门控），样式文本为空
const appearanceStyle = created.find((el) => el.dataset.pluginCss === 'dsh-theme-center/appearance')
assert.ok(appearanceStyle, '应有 appearance 样式元素')
assert.equal(fakeDoc.body.dataset.tcScale, '', '默认 80% 应挂 data-tc-scale 门控（缩放生效）')
assert.equal(fakeDoc.body.dataset.tcFont, undefined, '默认字体不应挂 data-tc-font')
assert.equal(fakeDoc.body.dataset.tcHide, undefined, '默认不应挂 data-tc-hide')
assert.match(appearanceStyle.textContent, /--tc-text-scale:0\.8/, '默认 80% 应落地 --tc-text-scale:0.8')

// 收回断言（disposer 逆序执行）
const disposers = effects.filter((d) => typeof d === 'function')
assert.ok(disposers.length >= 7, '应有 ≥7 个 disposer（作用域/四样式/外观扩展/引擎/服务端同步×2）')
for (const dispose of disposers) dispose()
assert.equal(fakeDoc.body.dataset.dshThemeCenter, undefined, 'disposer 应移除 body[data-dsh-theme-center]')
assert.equal(fakeDoc.body.dataset.tcFocus, undefined, 'disposer 应移除 body[data-tc-focus] 门控')
assert.equal(fakeDoc.body.dataset.tcScale, undefined, 'disposer 应移除 body[data-tc-scale]')
assert.equal(fakeDoc.body.dataset.tcFont, undefined, 'disposer 应移除 body[data-tc-font]')
assert.equal(fakeDoc.body.dataset.tcHide, undefined, 'disposer 应移除 body[data-tc-hide]')
assert.ok(created.every((el) => el.removed), '全部样式元素应被 remove')

console.log('PASS 全部断言通过（包形状 / 宿主 / 注册表 / 一体化模块 / apply 契约与收回）')
