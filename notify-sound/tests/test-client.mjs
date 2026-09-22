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

/**
 * 最小渲染助手：假 React 的 createElement 只记录元素、不调用组件函数，
 * 故断言渲染结果前须把函数组件元素求值（组件内部的 createElement 已入 created）。
 */
const render = (node) => {
  let cur = node
  let guard = 0
  while (cur && typeof cur === 'object' && typeof cur.type === 'function' && guard++ < 10) {
    cur = cur.type(cur.props || {})
  }
  return cur
}

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

/**
 * 每场景全新环境。seededOpen 控制旧版折叠卡片首次渲染的展开态；
 * api='legacy' 模拟 ≤0.1.5（uiSession.pendingInteractions），默认模拟
 * 0.1.6+（uiSession.sessionStatus）。两版下两个 slot 都会注册。
 */
function makeEnv(serverUser, seededOpen, api) {
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
      // 函数初值（useSnapshot 的 getSnapshot）恒按真实值求值；只有旧版折叠
      // 卡片的布尔 useState 受 seededOpen 控制（它是该组件的首个 hook）。
      if (typeof v === 'function') return [v(), () => {}]
      return [hookCall === 1 ? seededOpen : v, () => {}]
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
  let pendingSnap = new Map()
  let pendingSub = null
  let statusSnap = new Map()
  let statusSub = null
  const slotRegs = []
  const useStatusApi = api !== 'legacy'
  const ctx = {
    sessions: {
      list: {
        getSnapshot: () => sessionsSnap,
        subscribe: (fn) => { sessionsSub = fn; return () => {} },
      },
    },
    // 新版（0.1.6+）uiSession.sessionStatus（Map<id,{pendingInteraction}>）；
    // 旧版（≤0.1.5）uiSession.pendingInteractions（Map<id,{key,kind}>）
    uiSession: useStatusApi
      ? {
          sessionStatus: {
            getSnapshot: () => statusSnap,
            subscribe: (fn) => { statusSub = fn; return () => {} },
          },
        }
      : {
          pendingInteractions: {
            getSnapshot: () => pendingSnap,
            subscribe: (fn) => { pendingSub = fn; return () => {} },
          },
        },
    get: (name) => (name === 'slots'
      ? {
          inject: (n, cb) => { slotRegs.push({ name: n, registration: cb() }) },
          register: (opts, comp) => ({ opts, comp }),
        }
      : undefined),
    effect: (fn) => { effectDisposers.push(fn()) },
  }

  const drive = (next) => {
    sessionsSnap = next
    sessionsSub()
  }
  /** 旧版：驱动 pendingInteractions 快照（{ sessionId: {key, kind, sessionId} }）。 */
  const drivePending = (map) => {
    pendingSnap = new Map(Object.entries(map || {}))
    if (pendingSub) pendingSub()
  }
  /** 新版：驱动 sessionStatus 快照（{ sessionId: {key,kind,sessionId} } → status.pendingInteraction）。 */
  const driveStatus = (map) => {
    statusSnap = new Map(Object.entries(map || {}).map(([id, it]) => [id, { running: false, pendingInteraction: it }]))
    if (statusSub) statusSub()
  }
  const row = (extra) => Object.assign({ id: 's1', running: false }, extra)

  return {
    exportsObj,
    ctx,
    drive,
    drivePending,
    driveStatus,
    useStatusApi,
    row,
    server,
    created,
    intervals,
    windowListeners,
    docListeners,
    effectDisposers,
    getSlotRegs: () => slotRegs,
    /** 新版插件详情页组件（plugins.bundle.config 槽）。 */
    getBundleComp: () => {
      const reg = slotRegs.find((r) => r.name === 'plugins.bundle.config')
      return reg ? reg.registration.comp : undefined
    },
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
    && env.exportsObj.inject.includes('slots') && env.exportsObj.inject.includes('uiSession'),
    'client inject = slots + sessions + uiSession')
  env.exportsObj.apply(env.ctx)
  const regs = env.getSlotRegs()
  const legacyReg = regs.find((r) => r.name === 'settings.plugin.item')
  const bundleReg = regs.find((r) => r.name === 'plugins.bundle.config')
  ok(legacyReg !== undefined && bundleReg !== undefined,
    'registered into both settings.plugin.item (≤0.1.5) and plugins.bundle.config (0.1.6+)')
  ok(legacyReg.registration.opts.id === 'notify-sound', 'card id notify-sound')
  ok(legacyReg.registration.opts.order === 35, 'card order 35')
  ok(legacyReg.registration.opts.label === '提示音', 'card label 提示音')
  ok(bundleReg.registration.opts.key === 'dsh-notify-sound', 'bundle config keyed by package name')
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
  env.driveStatus({ s1: { key: 'a1', kind: 'approval', sessionId: 's1' } })
  ok(env.getOscCount() === 0, 'enabled=false silences attention events too')
}

/* ---------------- 5. 注意事件：专属音 → 通用注意音 ---------------- */
{
  const env = makeEnv({}, false)
  env.exportsObj.apply(env.ctx)
  await tick()
  env.driveStatus({ s1: { key: 'a1', kind: 'approval', sessionId: 's1' } })
  ok(env.getOscCount() > 0 && env.freqs[0] === FREQ.ding, 'approval plays generic attention sound (ding)')
  const n1 = env.getOscCount()
  env.driveStatus({ s1: { key: 'a1', kind: 'approval', sessionId: 's1' } })
  ok(env.getOscCount() === n1, 'same pending key does not repeat')
  env.driveStatus({ s1: { key: 'q1', kind: 'question', sessionId: 's1' } })
  ok(env.getOscCount() > n1 && env.freqs[0] === FREQ.ding, 'question plays generic attention sound')
  const n2 = env.getOscCount()
  env.driveStatus({ s1: { key: 'p1', kind: 'plan-review', sessionId: 's1' } })
  ok(env.getOscCount() > n2 && env.freqs[0] === FREQ.ding, 'plan-review plays generic attention sound')
}

/* ---------------- 6. 注意事件专属音覆盖 + 不受 quietCurrent 限制 ---------------- */
{
  const env = makeEnv({ quietCurrent: true, approvalSound: 'bell', failureSound: 'alert' }, false)
  env.exportsObj.apply(env.ctx)
  await tick()
  env.driveStatus({ s1: { key: 'a1', kind: 'approval', sessionId: 's1' } })
  ok(env.getOscCount() > 0 && env.freqs[0] === FREQ.bell, 'approvalSound override plays bell')
  const n3 = env.getOscCount()
  env.driveStatus({ s1: { key: 'a2', kind: 'approval', sessionId: 's1' } })
  ok(env.getOscCount() > n3, 'attention events play even for the open session (quietCurrent ignored); new pending key rings again')
  const afterA2 = env.getOscCount()
  env.driveStatus({})
  ok(env.getOscCount() === afterA2, 'pending cleared plays no extra sound')
}

/* ---------------- 7. 目标受阻：进入 blocked 响一次，停留不重复 ---------------- */
{
  const env = makeEnv({}, false)
  env.exportsObj.apply(env.ctx)
  await tick()
  env.drive({ ids: ['s1'], byId: { s1: env.row({ projectionValues: { goal: { goal: { phase: 'active' } } } }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() === 0, 'goal active produces no sound')
  // 旧错误路径（phase 直挂 goal 下）不应触发——官方结构为 goal.goal.phase
  env.drive({ ids: ['s1'], byId: { s1: env.row({ projectionValues: { goal: { phase: 'blocked' } } }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() === 0, 'goal phase at wrong path (goal.phase) does not fire')
  env.drive({ ids: ['s1'], byId: { s1: env.row({ projectionValues: { goal: { goal: { phase: 'blocked' } } } }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() > 0 && env.freqs[0] === FREQ.bell, 'goal blocked transition plays goalBlockedSound (bell)')
  const after = env.getOscCount()
  env.drive({ ids: ['s1'], byId: { s1: env.row({ projectionValues: { goal: { goal: { phase: 'blocked' } } } }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() === after, 'goal staying blocked does not repeat')
  // goal 为 null（无 goal）不应抛错
  env.drive({ ids: ['s1'], byId: { s1: env.row({ projectionValues: { goal: null } }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() === after, 'goal null tolerated without error or sound')
}

/* ---------------- 8. 后台任务：完成/终止不响（完成提示只由回合结束触发）；失败 → 失败音 ---------------- */
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
  ok(env.getOscCount() === 0, 'job completion stays silent (no per-task completion sound)')
  // 随后整回合结束仍要提示（后台任务静音不影响回合完成音）
  const doneJobs = { s1: [{ id: 'bash-1', kind: 'bash', label: 'x', status: 'completed', startedAt: 1, finishedAt: 2 }] }
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: true }) }, current: 's1', jobsBySession: doneJobs })
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: false }) }, current: 's1', jobsBySession: doneJobs })
  ok(env.getOscCount() > 0 && env.freqs[0] === FREQ.chime,
    'turn end still plays completion sound after a silent job completion')
}
{
  // 终止（killed）与完成同样静音
  const env = makeEnv({}, false)
  env.exportsObj.apply(env.ctx)
  await tick()
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: false }) }, current: 's1',
    jobsBySession: { s1: [{ id: 'bash-3', status: 'running', startedAt: 1 }] } })
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: false }) }, current: 's1',
    jobsBySession: { s1: [{ id: 'bash-3', status: 'killed', startedAt: 1, finishedAt: 2 }] } })
  ok(env.getOscCount() === 0, 'job killed stays silent too')
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
  const Card = env.getBundleComp()
  env.created.length = 0
  render(Card({ view: 'page' }))
  const hints = env.created.filter((n) => n.type === 'div' && n.props.className === 'ns-hint')
  ok(hints.length === 1 && String(hints[0].children.join('')).indexOf('无法读取服务端配置') === 0,
    'unavailable renders hint instead of controls')
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: true }) }, current: 's1', jobsBySession: {} })
  env.drive({ ids: ['s1'], byId: { s1: env.row({ running: false }) }, current: 's1', jobsBySession: {} })
  ok(env.getOscCount() > 0 && env.freqs[0] === FREQ.chime, 'unavailable still plays defaults')
}

/* ---------------- 12. 新版 page 视图：包含全部控件（无折叠头） ---------------- */
{
  const env = makeEnv({ defaultSound: 'bell', approvalSound: 'ding' }, false)
  env.exportsObj.apply(env.ctx)
  await tick()
  const Card = env.getBundleComp()
  ok(typeof Card === 'function', 'plugins.bundle.config component registered')
  env.created.length = 0
  render(Card({ view: 'page' }))
  const box = env.created.find((n) => n.type === 'div' && String(n.props.className).indexOf('ns-card') === 0)
  ok(box !== undefined, 'page view renders ns-card container')
  ok(env.created.filter((n) => n.type === 'li').length === 0, 'page view has no collapsible li')
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
  ok(buttons.length === 7, 'seven preview buttons (no header in page view)')
  const hint = env.created.find((n) => n.type === 'div' && n.props.className === 'ns-hint')
  ok(hint !== undefined && String(hint.children.join('')).indexOf('配置保存在服务端设置') === 0,
    'sync hint rendered')
}

/* ---------------- 13. 新版 summary 视图：一行状态摘要 ---------------- */
{
  const env = makeEnv({ defaultSound: 'bell' }, false)
  env.exportsObj.apply(env.ctx)
  await tick()
  env.created.length = 0
  render(env.getBundleComp()({ view: 'summary' }))
  const spans = env.created.filter((n) => n.type === 'span' && n.props.className === 'ns-desc')
  ok(spans.length === 1, 'summary renders one ns-desc line')
  const text = String(spans[0].children.join(''))
  ok(text.indexOf('已启用') === 0 && text.indexOf('铃铛') > 0, 'summary shows enabled state and sound label')
  ok(env.created.filter((n) => n.type === 'select').length === 0, 'summary renders no controls')
}
{
  const env = makeEnv({ enabled: false }, false)
  env.exportsObj.apply(env.ctx)
  await tick()
  env.created.length = 0
  render(env.getBundleComp()({ view: 'summary' }))
  const spans = env.created.filter((n) => n.type === 'span' && n.props.className === 'ns-desc')
  ok(String(spans[0].children.join('')) === '已关闭', 'summary reflects disabled state')
}

/* ---------------- 14. 旧版（≤0.1.5）：折叠卡片 + pendingInteractions ---------------- */
{
  const env = makeEnv({ defaultSound: 'bell' }, true, 'legacy')
  ok(env.useStatusApi === false, 'legacy env exposes pendingInteractions only')
  env.exportsObj.apply(env.ctx)
  await tick()
  const legacyReg = env.getSlotRegs().find((r) => r.name === 'settings.plugin.item')
  const Card = legacyReg.registration.comp
  env.created.length = 0
  render(Card({}))
  const li = env.created.find((n) => n.type === 'li')
  ok(li !== undefined && String(li.props.className).indexOf('ns-card') === 0, 'legacy renders li.ns-card')
  ok(env.created.filter((n) => n.type === 'button').length === 8, 'legacy has header + 7 preview buttons')
  ok(env.created.filter((n) => n.type === 'select').length === 7, 'legacy expanded body renders all selects')
  // 旧版注意音路径：pendingInteractions 的值本身就是交互
  env.drivePending({ s1: { key: 'a1', kind: 'approval', sessionId: 's1' } })
  ok(env.getOscCount() > 0 && env.freqs[0] === FREQ.ding, 'legacy pendingInteractions still rings approval (ding)')
  const n = env.getOscCount()
  env.drivePending({ s1: { key: 'a1', kind: 'approval', sessionId: 's1' } })
  ok(env.getOscCount() === n, 'legacy same pending key does not repeat')
}

console.log(failures === 0 ? 'ALL CLIENT TESTS PASSED' : failures + ' FAILURES')
process.exit(failures === 0 ? 0 : 1)
