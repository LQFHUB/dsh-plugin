// @user/dsh-web-lan 单元测试（node:test，零依赖）：polyfill 注入 / isLoopback 重写 / 特权 API relay
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  MARKER,
  POLYFILL_SCRIPT,
  PRIVILEGED_METHODS,
  injectPolyfill,
  rewriteClientJs,
  makeRelay,
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

// ── 2) rewriteClientJs ─────────────────────────────────────────────────────

describe('rewriteClientJs', () => {
  it('把 isLoopback 表达式重写为 true（真实 client.js 格式）', () => {
    const src = 'const flags = { isLoopback: pageLocation === void 0 || isLoopbackHostname(pageLocation.hostname), other: 1 }'
    const out = rewriteClientJs(src)
    assert.ok(out.includes('isLoopback: true'))
    assert.ok(!out.includes('isLoopbackHostname'))
    assert.ok(out.includes('other: 1'))
  })

  it('无匹配时原样返回', () => {
    const src = 'const a = 1'
    assert.equal(rewriteClientJs(src), src)
  })

  it('匹配到末尾无逗号时也能替换', () => {
    assert.equal(rewriteClientJs('isLoopback: false'), 'isLoopback: true')
  })
})

// ── 3) makeRelay ───────────────────────────────────────────────────────────

const ENVELOPE = JSON.stringify({
  type: 'client-request',
  rpcId: 'r1',
  method: 'settings.describe',
  payload: {},
})

function makeReq({ method = 'POST', url = '/api/settings.describe', body = ENVELOPE, broken = false } = {}) {
  return {
    method,
    url,
    headers: {
      host: '192.168.31.112:3080',
      'content-type': 'application/json',
      'content-length': String(body.length),
      accept: '*/*',
    },
    [Symbol.asyncIterator]: broken
      ? async function* () {
          throw new Error('body read failed')
        }
      : async function* () {
          yield Buffer.from(body)
        },
  }
}

function makeRes() {
  const calls = []
  return {
    calls,
    writeHead(status, headers) {
      calls.push(['writeHead', status, headers])
    },
    write(chunk) {
      calls.push(['write', chunk])
    },
    end() {
      calls.push(['end'])
    },
  }
}

function makeApiProxy() {
  return {
    events: { mux: () => ({ hello: () => {} }), host: () => ({ hello: () => {} }) },
    downloads: { sessionLog: async () => new Response('x') },
    respond: async () => ({}),
    settings: {
      describe: async (msg) => {
        // handleUnary 传给 handler 的是 { rpcId, payload }（method 由路由确定）
        assert.equal(msg.rpcId, 'r1')
        assert.deepEqual(msg.payload, {})
        return { ok: true }
      },
    },
  }
}

describe('makeRelay', () => {
  it('把 POST 请求 body 原样转发给 apiProxy 并回写响应', async () => {
    const handler = makeRelay(makeApiProxy())
    const res = makeRes()
    await handler(makeReq(), res)

    const head = res.calls.find(([k]) => k === 'writeHead')
    assert.ok(head, 'writeHead 应被调用')
    assert.equal(head[1], 200)
    const written = res.calls.filter(([k]) => k === 'write').map(([, c]) => Buffer.from(c).toString('utf8')).join('')
    assert.ok(written.includes('"type":"server-response"'))
    assert.ok(res.calls.some(([k]) => k === 'end'))
  })

  it('转发不因 content-length 头透传而报错（宿主重新计算长度）', async () => {
    const handler = makeRelay(makeApiProxy())
    const res = makeRes()
    await handler(makeReq(), res)
    assert.equal(res.calls.find(([k]) => k === 'writeHead')[1], 200)
  })

  it('body 读取失败时返回 500 而非抛出', async () => {
    const handler = makeRelay(makeApiProxy())
    const res = makeRes()
    await handler(makeReq({ broken: true }), res)
    const head = res.calls.find(([k]) => k === 'writeHead')
    assert.equal(head[1], 500)
    assert.ok(String(head[2]?.['content-type'] ?? '').includes('text/plain'))
    assert.ok(res.calls.some(([k]) => k === 'end'))
  })
})

// ── 4) 特权方法清单 ────────────────────────────────────────────────────────

describe('PRIVILEGED_METHODS', () => {
  it('覆盖配置/凭证/宿主/代理预设/模型发现 15 个方法且无重复', () => {
    assert.equal(PRIVILEGED_METHODS.length, 15)
    for (const m of [
      'settings.describe',
      'settings.update',
      'credentials.set',
      'credentials.unset',
      'agentPreset.read',
      'llm.discoverModels',
    ]) {
      assert.ok(PRIVILEGED_METHODS.includes(m), `应包含 ${m}`)
    }
    assert.equal(new Set(PRIVILEGED_METHODS).size, PRIVILEGED_METHODS.length)
  })
})
