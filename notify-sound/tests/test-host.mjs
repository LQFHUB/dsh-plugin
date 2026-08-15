// notify-sound 宿主半区契约测试（node 内置，无需浏览器）
// 运行：node tests/test-host.mjs
import { apply, name, inject, Config, SETTINGS_API_PATH, SETTINGS_NAMESPACE } from '../lib/index.js'

let failures = 0
const ok = (cond, label) => {
  if (cond) console.log('PASS', label)
  else { failures++; console.log('FAIL', label) }
}

/* ---------------- 假件 ---------------- */

/** 带命名空间状态的假 settings 服务（register/describe/replace）。 */
function makeFakeSettings(initialUser) {
  const state = {
    user: { ...(initialUser || {}) },
    revision: 1,
    registerCalls: [],
    replaceCalls: [],
  }
  const defaults = Config({})
  const service = {
    writable: true,
    register: (ns, schema, opts) => {
      state.registerCalls.push({ ns: String(ns), opts })
      return {
        get: () => ({ ...defaults, ...state.user }),
        watch: () => {},
      }
    },
    describe: () => [{
      ns: SETTINGS_NAMESPACE,
      value: { ...defaults, ...state.user },
      base: defaults,
      user: state.user,
      revision: state.revision,
      secrets: [],
    }],
    replace: async (ns, section, expectedRevision) => {
      state.replaceCalls.push({ ns: String(ns), section, expectedRevision })
      if (expectedRevision !== undefined && expectedRevision !== state.revision) {
        throw new Error('settings revision conflict')
      }
      if (section && section.fail === true) throw new Error('settings replace failed')
      state.user = { ...section }
      state.revision++
    },
  }
  return { service, state, defaults }
}

/** 带可注入服务与可收集 effect 的假 ctx。 */
function makeCtx(settings, webserver) {
  return {
    inject: (deps, cb) => {
      if (deps.includes('settings') && settings !== undefined) {
        cb({ settings, effect: (fn) => { fn() } })
      }
    },
    get: (name) => {
      if (name === 'settings') return settings
      if (name === 'webServer') return webserver
      return undefined
    },
    effect: (fn) => { fn() },
  }
}

/** 假请求：headers 可指定，body 为 JSON 对象或 undefined。 */
function req(method, body, headers) {
  const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
  let i = 0
  return {
    method,
    headers: headers || {},
    [Symbol.asyncIterator]: () => ({
      next: () => i < chunks.length
        ? Promise.resolve({ value: chunks[i++], done: false })
        : Promise.resolve({ value: undefined, done: true }),
    }),
  }
}

/** 假响应：捕获状态码与 body。 */
function res() {
  const out = { status: 200, body: '', headers: null }
  return {
    writeHead: (status, headers) => { out.status = status; out.headers = headers },
    end: (body) => { out.body = String(body) },
    _out: out,
  }
}

const parse = (r) => JSON.parse(r._out.body)

/* ---------------- 导出与 schema ---------------- */

ok(name === 'notify-sound', 'name export')
ok(Array.isArray(inject) && inject.includes('webServer'), 'inject includes webServer')

{
  const d = Config({})
  ok(d.enabled === true, 'default enabled=true')
  ok(d.quietCurrent === false, 'default quietCurrent=false')
  ok(d.defaultSound === 'chime', 'default defaultSound=chime')
  ok(d.attentionSound === 'ding', 'default attentionSound=ding')
  ok(d.approvalSound === '', 'default approvalSound=""（跟随通用）')
  ok(d.questionSound === '', 'default questionSound=""')
  ok(d.planReviewSound === '', 'default planReviewSound=""')
  ok(d.goalBlockedSound === 'bell', 'default goalBlockedSound=bell')
  ok(d.failureSound === 'alert', 'default failureSound=alert')
}

{
  let rejected = false
  try { Config({ enabled: 'yes' }) } catch (e) { rejected = true }
  ok(rejected, 'schema rejects invalid types')
}

/* ---------------- apply：无服务时不抛错、注册命名空间与路由 ---------------- */

{
  let threw = false
  try {
    apply({ inject: () => {}, get: () => undefined, effect: () => {} })
  } catch (e) { threw = true }
  ok(!threw, 'apply without settings/webServer does not throw')
}

{
  const { service, state } = makeFakeSettings()
  let registeredRoute = null
  const webserver = { register: (opts) => { registeredRoute = opts } }
  apply(makeCtx(service, webserver))
  ok(state.registerCalls.length === 1 && state.registerCalls[0].ns === SETTINGS_NAMESPACE,
    'settings namespace registered as notify-sound')
  ok(registeredRoute !== null && registeredRoute.kind === 'exact'
    && registeredRoute.path === SETTINGS_API_PATH,
    'route registered at /notify-sound/settings (exact)')
}

/* ---------------- 路由行为 ---------------- */

/** 起一个带状态的服务 + 捕获路由的完整环境。 */
function setup(initialUser) {
  const { service, state, defaults } = makeFakeSettings(initialUser)
  let registeredRoute = null
  const webserver = { register: (opts) => { registeredRoute = opts } }
  apply(makeCtx(service, webserver))
  return { handler: registeredRoute.handler, state, defaults }
}

// GET 视图
{
  const { handler, defaults } = setup()
  const r = res()
  await handler(req('GET', undefined, {}), r)
  ok(r._out.status === 200 && parse(r).ok === true, 'GET answers 200 ok')
  const view = parse(r).value
  ok(view.ns === 'notify-sound', 'view.ns = notify-sound')
  ok(view.value.defaultSound === 'chime' && view.value.enabled === true, 'view carries resolved defaults')
  ok(view.revision === 1 && view.writable === true, 'view carries revision + writable')
  ok(Array.isArray(view.secrets) && view.secrets.length === 0, 'no secrets in view')
  ok(JSON.stringify(view.base) === JSON.stringify(defaults), 'view.base = schema defaults')
}

// POST set / unset
{
  const { handler, state } = setup()
  const r1 = res()
  await handler(req('POST', { writes: [{ field: 'defaultSound', op: 'set', value: 'bell' }] }), r1)
  ok(r1._out.status === 200 && parse(r1).value.value.defaultSound === 'bell', 'POST set updates view')
  ok(state.replaceCalls.length === 1 && state.replaceCalls[0].section.defaultSound === 'bell',
    'replace called with user layer containing the write')
  ok(state.replaceCalls[0].expectedRevision === 1, 'revision fence passed through')

  const r2 = res()
  await handler(req('POST', { writes: [{ field: 'defaultSound', op: 'unset' }] }), r2)
  ok(state.user.defaultSound === undefined, 'unset deletes the user-layer field')
  ok(parse(r2).value.value.defaultSound === 'chime', 'after unset view falls back to base default')
}

// 守卫：跨站 403 / 坏体 400 / 非 GET·POST 405 / 写失败 422
{
  const { handler } = setup()
  const r1 = res()
  await handler(req('POST', { writes: [] }, { 'sec-fetch-site': 'cross-site' }), r1)
  ok(r1._out.status === 403, 'cross-site POST rejected 403')

  const r2 = res()
  await handler(req('GET', undefined, { 'sec-fetch-site': 'cross-site' }), r2)
  ok(r2._out.status === 403, 'cross-site GET rejected 403')

  const r3 = res()
  await handler(req('POST', { nope: 1 }), r3)
  ok(r3._out.status === 400, 'bad body (no writes array) rejected 400')

  const r4 = res()
  await handler(req('PUT', undefined, {}), r4)
  ok(r4._out.status === 405, 'PUT rejected 405')

  const r5 = res()
  // 假件约定：replace 遇到 user 层含 fail:true 时抛错（模拟 revision 冲突/落盘失败）
  await handler(req('POST', { writes: [{ field: 'fail', op: 'set', value: true }] }), r5)
  ok(r5._out.status === 422, 'settings write failure rejected 422')
}

// settings 服务缺失 → GET 404
{
  let registeredRoute = null
  const webserver = { register: (opts) => { registeredRoute = opts } }
  apply(makeCtx(undefined, webserver))
  const r = res()
  await registeredRoute.handler(req('GET', undefined, {}), r)
  ok(r._out.status === 404, 'GET without settings service answers 404')
}

// webServer 缺失 → 不注册路由
{
  const { service, state } = makeFakeSettings()
  apply(makeCtx(service, undefined))
  ok(state.registerCalls.length === 1, 'namespace still registered without webServer')
}

console.log(failures === 0 ? 'ALL HOST TESTS PASSED' : failures + ' FAILURES')
process.exit(failures === 0 ? 0 : 1)
