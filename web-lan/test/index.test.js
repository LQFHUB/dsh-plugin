// @npm-liqingfeng/dsh-web-lan 单元测试（node:test，零依赖）：polyfill 注入 / isLoopback 重写
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  MARKER,
  POLYFILL_SCRIPT,
  injectPolyfill,
  rewriteClientJs,
  CLIENT_JS_RE,
} from '../lib/index.js'

// ── 1) injectPolyfill ──────────────────────────────────────────────────────

describe('injectPolyfill', () => {
  it('把 marker 与 polyfill 脚本注入到 <head> 之后', () => {
    const html = '<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n</head>\n<body></body>\n</html>'
    const out = injectPolyfill(html)
    assert.ok(out.startsWith('<!doctype html>'))
    assert.ok(out.includes('<head>' + MARKER + POLYFILL_SCRIPT))
    assert.equal(out.indexOf(MARKER), out.indexOf('<head>') + 6)
    assert.ok(out.includes('c.randomUUID=function'))
    assert.ok(out.endsWith('</html>'))
  })

  it('无 <head> 时原样返回', () => {
    const html = '<html><body>x</body></html>'
    assert.equal(injectPolyfill(html), html)
  })
})

// ── 2) rewriteClientJs（isLoopback 重写）──────────────────────────────────

describe('rewriteClientJs', () => {
  it('把 isLoopback 表达式重写为 true（真实 alpha.2 client.js 格式）', () => {
    const src = 'isLoopback: transport?.ownsHost === true || pageLocation === void 0 || isLoopbackHostname(pageLocation.hostname),'
    const out = rewriteClientJs(src)
    assert.ok(out.includes('isLoopback: true'))
    assert.ok(!out.includes('isLoopbackHostname'))
    assert.ok(!out.includes('transport?.ownsHost'))
  })

  it('无匹配时原样返回', () => {
    const src = 'const a = 1'
    assert.equal(rewriteClientJs(src), src)
  })

  it('匹配到末尾无逗号时也能替换', () => {
    assert.equal(rewriteClientJs('isLoopback: false'), 'isLoopback: true')
  })

  it('幂等：对已重写内容二次调用不再改变', () => {
    const once = rewriteClientJs('isLoopback: foo === bar, x: 1')
    assert.equal(rewriteClientJs(once), once)
    assert.equal(CLIENT_JS_RE.test('isLoopback: true'), true)
  })
})
