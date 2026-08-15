// notify-sound 浏览器半区逻辑测试（node 内置，无需浏览器）
// 模拟模块加载器 + 假 React/AudioContext/文档 + 内存版 settings 服务
// 运行：node tests/test-client.mjs
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')

let failures = 0
const ok = (cond, label) => {
  if (cond) console.log('PASS', label)
  else { failures++; console.log('FAIL', label) }
}

const tick = () => new Promise((resolve) => setImmediate(resolve))

// 内置音首基频（ding/chime/bell/complete/success/alert/fallback）
const FREQ = { ding: 698.46, chime: 880, bell: 493.88, complete: 523.25, success: 783.99, alert: 220 }

const DEFAULTS = {
  enabled: true,
  quietCurrent: false,
  defaultSound: 'chime',
  attentionSound: 'ding',
  approvalSound: '',
  questionSound: '',
  planReviewSound: '',
  goalBlockedSound: 'bell',
  failureSound: 'alert',
}

/** 内存版服务端：user 层 + revision；记录 writes 与 GET 次数。 */
function makeServer(user) {
  const state = { user: { ...(user || {}) }, revision: 1, writes: [], gets: 0, reject: false }
  const view = () => ({
    ns: 'notify-sound',
    value: { ...DEFAULTS, ...state.user },
    base: { ...DEFAULTS },
    user: { ...state.user },
    revision: state.revision,
    writable: true,
    secrets: [],
  })
  return {
    state,
    fetch: async (url, opts) => {
      if (state.reject) throw new Error('network down')
      if (opts && opts.method === 'POST') {
        const body = JSON.parse(opts.body)
        const writes = body.writes
        for (const w of writes) {
          if (w.op === 'set') state.user[w.field] = w.value
          else delete state.user[w.field]
        }
        state.revision++
        state.writes.push(writes)
        return { ok: true, json: async () => ({ ok: true, value: view() }) }
      }
      state.gets++
      return { ok: true, json: async () => ({ ok: true, value: view() }) }
    },
  }
}

/** 每场景全新环境。seededOpen 控制卡片首次渲染的展开态（用于断言卡片内容）。 */
function makeEnv(serverUser, seededOpen) {
  const server = makeServer(serverUser)
  const registered = {}
  let oscCount = 0
  const freqs = []
  const intervals = []
  const windowListeners = {}
  const docListeners = {}
  const created = []
  const effectDisposers = []

  const fakeWindow = {
    __ModuleLoader__: { load: (entry) => { registered[entry.id] = entry } },
    fetch: server.fetch,
    setInterval: (fn) => { intervals.push(fn); return intervals.length },
    clearInterval: () => {},
    addEventListener: (name, fn) => { windowListeners[name] = fn },
    removeEventListener: () => {},
    AudioContext: class {
      constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {} }
      resume() { return Promise.resolve() }
      createOscillator() {
        oscCount++
        return {
          type: 'sine',
          frequency: {
            setValueAtTime: (f) => { freqs.push(f) },
            exponentialRampToValueAtTime() {},
          },
          connect() {}, start() {}, stop() {},
        }
      }
      createGain() {
        return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }
      }
    },
  }
  const fakeDocument = {
    body: { setAttribute() {}, removeAttribute() {} },
    head: { appendChild() {} },
    createElement: () => ({ dataset: {}, textContent: '', remove() {} }),
    addEventListener: (name, fn) => { docListeners[name] = fn },
    removeEventListener: () => {},
    visibilityState: 'visible',
  }

  let hookCall = 0
  const react = {
    createElement: (type, props, ...kids) => {
      const node = { type, props: props || {}, children: kids }
      created.push(node)
      return node
    },
    useState: (v) => {
      hookCall++
      const isOpen = hookCall === 1
      return [isOpen ? seededOpen : (typeof v === 'function' ? v() : v), () => {}]
    },
    useEffect: () => {},
    useRef: () => ({ current: null }),
  }

  const factoryFn = new Function('window', 'document', source + '\n')
  factoryFn(fakeWindow, fakeDocument)
  const entry = registered['dsh-notify-sound']
  const exportsObj = entry.factory((spec) => (spec === 'react' ? react : undefined))

  let sessionsSnap = { ids: ['s1'], byId: { s1: { id: 's1', running: false } }, current: 's1', jobsBySession: {} }
  let sessionsSub = null
  let slotReg = null
  const ctx = {
    sessions: {
      list: {
        getSnapshot: () => sessionsSnap,
        subscribe: (fn) => { sessionsSub = fn; return () => {} },
      },
    },
    get: (name) => (name === 'slots'
      ? {
          inject: (n, cb) => { slotReg = { name: n, registration: cb() } },
          register: (opts, comp) => ({ opts, comp }),
        }
      : undefined),
    effect: (fn) => { effectDisposers.push(fn()) },
  }

  const drive = (next) => {
    sessionsSnap = next
    sessionsSub()
  }
  const row = (extra) => Object.assign({ id: 's1', running: false }, extra)

  return {
    exportsObj,
    ctx,
    drive,
    row,
    server,
    created,
    intervals,
    windowListeners,
    docListeners,
    effectDisposers,
    getSlotReg: () => slotReg,
    getOscCount: () => oscCount,
    freqs,
    lastFreq: () => freqs[freqs.length - 1],
  }
}

/* ---------------- 1. 导出与卡片注册 ---------------- */
{
  const env = makeEnv(undefined, false)
  ok(typeof env.exportsObj.apply === 'function', 'client exports apply')
  ok(Array.isArray(env.exportsObj.inject) && env.exportsObj.inject.includes('sessions')
    && env.exportsObj.inject.includes('slots'), 'client inject = slots + sessions')
  env.exportsObj.apply(env.ctx)
  const slotReg = env.getSlotReg()
  ok(slotReg && slotReg.name === 'settings.plugin.item', 'registered into settings.plugin.item slot')
  ok(slotReg.registration.opts.id === 'notify-sound', 'card id notify-sound')
  ok(slotReg.registration.opts.order === 35, 'card order 35')
  ok(slotReg.registration.opts.label === '提示音', 'card label 提示音')
  ok(env.effectDisposers.length === 2 && env.effectDisposers.every((d) => typeof d === 'function'),
    'two effects with disposers (styles + watcher/sync)')
  ok(env.server.state.gets === 1, 'initial GET issued on apply')
}

/* ---------------- 2. 默认配置：回合结束播放完成音（chime） ---------------- */
{
  const env = makeEnv(undefined, false)
  env.exportsObj.apply(env.ctx)
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: true }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() === 0, 'turn start produces no sound')
  await tick()
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: false }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() > 0 && env.freqs[0] === FREQ.chime, 'turn end plays default chime')
}

/* ---------------- 3. quietCurrent：当前会话完成不响 ---------------- */
{
  const env = makeEnv({ quietCurrent: true }, false)
  env.exportsObj.apply(env.ctx)
  await tick()
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: true }) }, current: 's1', jobsBySession: {} })
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: false }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() === 0, 'quietCurrent mutes completion of the open session')
  // 非当前会话的完成仍响
  env.drive({ ids: ['s2'], byId: { s2: { id: 's2', running: true } }, current: 's1', jobsBySession: {} })
  env.drive({ ids: ['s2'], byId: { s2: { id: 's2', running: false } }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() > 2, 'other session completion still rings under quietCurrent')
}

/* ---------------- 4. enabled=false 全部静音 ---------------- */
{
  const env = makeEnv({ enabled: false }, false)
  env.exportsObj.apply(env.ctx)
  await tick()
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: true }) }, current: 's1', jobsBySession: {} })
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: false }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() === 0, 'enabled=false silences completion')
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: false, pendingInteraction: 'approval' }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() === 0, 'enabled=false silences attention events too')
}

/* ---------------- 5. 注意事件：专属音 → 通用注意音 ---------------- */
{
  const env = makeEnv({}, false)
  env.exportsObj.apply(env.ctx)
  await tick()
  env.drive({ ids: ['s1'], byId: { s1: env.row({ pendingInteraction: 'approval' }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() > 0 && env.freqs[0] === FREQ.ding, 'approval plays generic attention sound (ding)')
  const n1 = env.getOscCount()
  env.drive({ ids: ['s1'], byId: { s1: env.row({ pendingInteraction: 'approval' }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() === n1, 'pendingInteraction unchanged does not repeat')
  env.drive({ ids: ['s1'], byId: { s1: env.row({ pendingInteraction: 'question' }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() > n1 && env.freqs[0] === FREQ.ding, 'question plays generic attention sound')
  const n2 = env.getOscCount()
  env.drive({ ids: ['s1'], byId: { s1: env.row({ pendingInteraction: 'plan-review' }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() > n2 && env.freqs[0] === FREQ.ding, 'plan-review plays generic attention sound')
}

/* ---------------- 6. 注意事件专属音覆盖 + 不受 quietCurrent 限制 ---------------- */
{
  const env = makeEnv({ quietCurrent: true, approvalSound: 'bell', failureSound: 'alert' }, false)
  env.exportsObj.apply(env.ctx)
  await tick()
  env.drive({ ids: ['s1'], byId: { s1: env.row({ pendingInteraction: 'approval' }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() > 0 && env.freqs[0] === FREQ.bell, 'approvalSound override plays bell')
  const n3 = env.getOscCount()
  env.drive({ ids: ['s1'], byId: { s1: env.row({ pendingInteraction: 'plan-review' }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() > n3, 'attention events play even for the open session (quietCurrent ignored)')
}

/* ---------------- 7. 目标受阻：进入 blocked 响一次，停留不重复 ---------------- */
{
  const env = makeEnv({}, false)
  env.exportsObj.apply(env.ctx)
  await tick()
  env.drive({ ids: ['s1'], byId: { s1: env.row({ projectionValues: { goal: { phase: 'active' } } }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() === 0, 'goal active produces no sound')
  env.drive({ ids: ['s1'], byId: { s1: env.row({ projectionValues: { goal: { phase: 'blocked' } } }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() > 0 && env.freqs[0] === FREQ.bell, 'goal blocked transition plays goalBlockedSound (bell)')
  const after = env.getOscCount()
  env.drive({ ids: ['s1'], byId: { s1: env.row({ projectionValues: { goal: { phase: 'blocked' } } }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() === after, 'goal staying blocked does not repeat')
}

/* ---------------- 8. 后台任务：完成 → 完成音；失败 → 失败音 ---------------- */
{
  const env = makeEnv({}, false)
  env.exportsObj.apply(env.ctx)
  await tick()
  const running = { ids: ['s1'], byId: { s1: env.row({ running: false }) }, current: 's1',
    jobsBySession: { s1: [{ id: 'bash-1', kind: 'bash', label: 'x', status: 'running', startedAt: 1 }] } }
  const completed = { ids: ['s1'], byId: { s1: env.row({ running: false }) }, current: 's1',
    jobsBySession: { s1: [{ id: 'bash-1', kind: 'bash', label: 'x', status: 'completed', startedAt: 1, finishedAt: 2 }] } }
  env.drive(running)
  ok(env.getOscCount() === 0, 'job running produces no sound')
  env.drive(completed)
  ok(env.getOscCount() > 0 && env.freqs[0] === FREQ.chime, 'job completion plays completion sound')
}
{
  const env = makeEnv({}, false)
  env.exportsObj.apply(env.ctx)
  await tick()
  const running = { ids: ['s1'], byId: { s1: env.row({ running: false }) }, current: 's1',
    jobsBySession: { s1: [{ id: 'bash-2', status: 'running', startedAt: 1 }] } }
  const failed = { ids: ['s1'], byId: { s1: env.row({ running: false }) }, current: 's1',
    jobsBySession: { s1: [{ id: 'bash-2', status: 'failed', startedAt: 1, finishedAt: 2 }] } }
  env.drive(running)
  env.drive(failed)
  ok(env.getOscCount() > 0 && env.freqs[0] === FREQ.alert, 'job failure plays failureSound (alert), not chime')
}

/* ---------------- 9. 跨浏览器同步：服务端被改后定时/聚焦刷新拉取新配置 ---------------- */
{
  const env = makeEnv({}, false)
  env.exportsObj.apply(env.ctx)
  await tick()
  ok(env.server.state.gets === 1, 'initial GET on apply')
  // 模拟另一浏览器/设备把 defaultSound 改为 bell（服务端 user 层变化）
  env.server.state.user.defaultSound = 'bell'
  env.server.state.revision++
  env.intervals[0]() // 触发 30s 定时 refresh
  await tick()
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: true }) }, current: 's1', jobsBySession: {} })
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: false }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() > 0 && env.freqs[0] === FREQ.bell, 'interval refresh picks up server-side change (cross-browser sync)')
  ok(env.server.state.gets === 2, 'interval refresh issued another GET')
  env.windowListeners.focus()
  await tick()
  ok(env.server.state.gets === 3, 'focus listener issues GET too')
  env.docListeners.visibilitychange()
  await tick()
  ok(env.server.state.gets === 4, 'visibilitychange (visible) issues GET too')
}

/* ---------------- 10. 脏数据 sanitize：坏类型回退默认 ---------------- */
{
  const env = makeEnv({ enabled: 'yes', quietCurrent: 'x', defaultSound: 42, failureSound: 7 }, false)
  env.exportsObj.apply(env.ctx)
  await tick()
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: true }) }, current: 's1', jobsBySession: {} })
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: false }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() > 0 && env.freqs[0] === FREQ.chime, 'garbage config sanitized back to defaults')
}

/* ---------------- 11. 路由不可达：卡片提示 + 事件按默认值播放 ---------------- */
{
  const env = makeEnv(undefined, false)
  env.server.state.reject = true
  env.exportsObj.apply(env.ctx)
  await tick()
  const Card = env.getSlotReg().registration.comp
  env.created.length = 0
  Card({})
  const hints = env.created.filter((n) => n.type === 'div' && n.props.className === 'ns-hint')
  ok(hints.length === 1 && String(hints[0].children.join('')).indexOf('无法读取服务端配置') === 0,
    'unavailable renders hint instead of controls')
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: true }) }, current: 's1', jobsBySession: {} })
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: false }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() > 0 && env.freqs[0] === FREQ.chime, 'unavailable still plays defaults')
}

/* ---------------- 12. 卡片渲染：展开态包含全部控件 ---------------- */
{
  const env = makeEnv({ defaultSound: 'bell', approvalSound: 'ding' }, true)
  env.exportsObj.apply(env.ctx)
  await tick()
  const Card = env.getSlotReg().registration.comp
  env.created.length = 0
  Card({})
  const li = env.created.find((n) => n.type === 'li')
  ok(li !== undefined && String(li.props.className).indexOf('ns-card') === 0, 'card renders as li.ns-card')
  const checks = env.created.filter((n) => n.type === 'input' && n.props.type === 'checkbox')
  ok(checks.length === 2, 'two checkboxes (enabled + quietCurrent)')
  const selects = env.created.filter((n) => n.type === 'select')
  ok(selects.length === 7, 'seven sound selects (default, generic, 5 kinds)')
  const completionOptions = selects[0].props.children.map((o) => o.props.value)
  ok(completionOptions.join(',') === 'ding,chime,bell,complete,success,alert,none',
    'completion select lists all builtins + none')
  const kindOptions = selects[2].props.children.map((o) => o.props.value)
  ok(kindOptions.join(',') === ',ding,chime,bell,complete,success,alert,none',
    'kind select lists 跟随通用 + builtins + none')
  ok(selects[0].props.value === 'bell' && selects[1].props.value === 'ding',
    'selects reflect server values')
  const buttons = env.created.filter((n) => n.type === 'button')
  ok(buttons.length === 8, 'eight buttons (header + 7 试听)')
  const hint = env.created.find((n) => n.type === 'div' && n.props.className === 'ns-hint')
  ok(hint !== undefined && String(hint.children.join('')).indexOf('配置保存在服务端设置') === 0,
    'sync hint rendered')
}

console.log(failures === 0 ? 'ALL CLIENT TESTS PASSED' : failures + ' FAILURES')
process.exit(failures === 0 ? 0 : 1)
