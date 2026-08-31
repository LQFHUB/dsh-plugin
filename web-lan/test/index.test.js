// @npm-liqingfeng/dsh-web-lan 单元测试（node:test，零依赖）：isLoopback 重写
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  rewriteClientJs,
  CLIENT_JS_RE,
} from '../lib/index.js'

// ── isLoopback 重写（rewriteClientJs）──────────────────────────────────────

describe('rewriteClientJs', () => {
  it('把 isLoopback 表达式重写为 true（真实 alpha.2 client.js 格式）', () => {
    const src = 'isLoopback: transport?.ownsHost === true || pageLocation === void 0 || isLoopbackHostname(pageLocation.hostname),'
    const out = rewriteClientJs(src)
    assert.ok(out.includes('isLoopback: true'))
    assert.ok(!out.includes('isLoopbackHostname'))
    assert.ok(!out.includes('transport?.ownsHost'))
    // 末尾对象属性分隔逗号必须保留（对象语法）
    assert.ok(out.includes('isLoopback: true,'))
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
  })

  it('不误伤 isLoopbackHostname 函数名（无冒号）', () => {
    const src = 'function isLoopbackHostname(hostname) { return false } isLoopback: foo,'
    const out = rewriteClientJs(src)
    assert.ok(out.includes('function isLoopbackHostname'))
    assert.ok(out.includes('isLoopback: true,'))
  })

  it('多值场景：CLIENT_JS_RE 每次 replace 后不残留 lastIndex（可复用）', () => {
    CLIENT_JS_RE.lastIndex = 0
    const src = 'a: 1, isLoopback: x, b: 2, isLoopback: y'
    const out = src.replace(CLIENT_JS_RE, 'isLoopback: true')
    assert.equal((out.match(/isLoopback: true/g) || []).length, 2)
    CLIENT_JS_RE.lastIndex = 0
  })
})
