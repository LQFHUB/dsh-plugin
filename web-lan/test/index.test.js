// @npm-liqingfeng/dsh-web-lan 单元测试（node:test，零依赖）：isLoopback 重写 + 局域网免认证注入
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  rewriteClientJs,
  CLIENT_JS_RE,
  patchBrowserAuth,
  AUTHORIZE_INDEX_RE,
  AUTHORIZE_INDEX_NEW,
  LAN_AUTHORITY_FN,
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

// ── 局域网免认证注入（patchBrowserAuth）────────────────────────────────────

describe('patchBrowserAuth', () => {
  const HOST = [
    'import x from "y";',
    'class Auth {',
    '\t\tif (this.isAuthenticated(req)) return true;',
    '\t\tthis.writeUnauthorized(req, res);',
    '\t\treturn false;',
    '}',
    '',
  ].join('\n')

  it('追加 isLanAuthority 函数并替换放行条件为「已认证 OR 局域网来源」', () => {
    const out = patchBrowserAuth(HOST)
    assert.ok(out.includes('function isLanAuthority'), '应注入 isLanAuthority')
    assert.ok(out.includes(AUTHORIZE_INDEX_NEW), '应替换放行条件')
    assert.ok(!out.includes('if (this.isAuthenticated(req)) return true;'), '原放行行应被替换')
    // 注入函数不含会影响原有逻辑的内容
    assert.ok(out.startsWith('import x from "y";'), '文件头不变')
  })

  it('幂等：二次调用不再改变（函数已存在、放行条件已替换）', () => {
    const once = patchBrowserAuth(HOST)
    assert.equal(patchBrowserAuth(once), once)
  })

  it('LAN_AUTHORITY_FN 语法合法（可被 eval 解析）', () => {
    // 用 Function 构造验证注入函数语法（不执行）
    const fn = new Function(`return (${LAN_AUTHORITY_FN});`)()
    assert.equal(typeof fn, 'function')
    assert.equal(fn('192.168.31.112:3080'), true)
    assert.equal(fn('10.0.0.5'), true)
    assert.equal(fn('127.0.0.1:3080'), true)
    assert.equal(fn('172.20.0.1'), true)
    assert.equal(fn('example.com'), false)
    assert.equal(fn('8.8.8.8'), false)
    assert.equal(fn(void 0), false)
  })
})
