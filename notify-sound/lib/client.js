/**
 * dsh-notify-sound — 浏览器半区（经典脚本 + 模块工厂）
 *
 * 以 window.__ModuleLoader__.load 注册的懒加载 CJS 工厂。浏览器侧职责：
 * 1. 监听 sessions.list 快照，检测「回合结束」与「后台任务结束」→ 完成铃声；
 * 2. 检测「需要人介入」的事件 → 注意铃声：
 *    - pendingInteraction 出现（approval 审批 / question 提问 / plan-review 计划评审）
 *    - 目标受阻（goal 投影进入 blocked）
 *    - 后台任务 failed（失败音）
 * 3. 播放内置 Web Audio 合成音（叮咚/风铃/铃铛/完成/成功/警示，无音频文件）；
 * 4. 在「设置 > 插件 > 插件配置」注册「提示音」卡片：总开关、当前会话静音、
 *    完成铃声、通用注意音 + 五类注意事件，每行下拉 + 试听。
 *
 * 配置持久化：宿主 /notify-sound/settings 路由（profile settings 用户层，
 * 服务端落盘）。官方 apiproxy 的 settings 白名单不暴露第三方命名空间，
 * 故自建路由 + 本文件内的 NotifyConfigScope（实现 SettingsScope 契约）。
 * 所有浏览器读同一份服务端配置：卡片写入即 POST 落盘；本页另每 30s 定时
 * 刷新 + 页面聚焦/可见时刷新，跨浏览器/设备近实时同步。
 */
window.__ModuleLoader__.load({
  id: 'dsh-notify-sound',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    var React = require('react')

    /* ---------------- 常量 ---------------- */
    var SETTINGS_API_PATH = '/notify-sound/settings'
    var SYNC_INTERVAL_MS = 30000
    var CARD_ID = 'notify-sound'

    /** 内置音清单（下拉选项顺序）。none = 静音。 */
    var BUILTIN_SOUNDS = [
      { key: 'ding', label: '叮咚 Ding' },
      { key: 'chime', label: '风铃 Chime' },
      { key: 'bell', label: '铃铛 Bell' },
      { key: 'complete', label: '完成 Complete' },
      { key: 'success', label: '成功 Success' },
      { key: 'alert', label: '警示 Alert' },
      { key: 'none', label: '静音' },
    ]

    /** 注意类事件 → 配置字段映射。 */
    var KIND_FIELDS = {
      'approval': 'approvalSound',
      'question': 'questionSound',
      'plan-review': 'planReviewSound',
      'goal-blocked': 'goalBlockedSound',
      'failure': 'failureSound',
    }

    /** 默认配置一套（与服务端 schema 默认值一致）。 */
    var CONFIG_DEFAULTS = {
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

    var SOUND_FIELDS = ['defaultSound', 'attentionSound', 'approvalSound', 'questionSound',
      'planReviewSound', 'goalBlockedSound', 'failureSound']

    /* ---------------- 样式（body[data-dsh-notify-sound] 作用域，令牌与官方/主题卡一致） ---------------- */
    var CSS = [
      'body[data-dsh-notify-sound] .ns-card{list-style:none;border:1px solid var(--dsw-alias-border-l2);',
      'background:var(--dsw-alias-bg-layer-3);border-radius:12px;transition:border-color .16s,background .16s;}',
      'body[data-dsh-notify-sound] .ns-card:hover{border-color:var(--dsw-alias-label-dimmed);}',
      'body[data-dsh-notify-sound] .ns-card.ns-open{background:var(--dsw-alias-bg-layer-2);',
      'border-color:var(--dsw-alias-label-dimmed);}',
      'body[data-dsh-notify-sound] .ns-header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;',
      'cursor:pointer;background:0 0;border:0;border-radius:12px;display:flex;align-items:center;gap:12px;padding:14px 16px;}',
      'body[data-dsh-notify-sound] .ns-header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;}',
      'body[data-dsh-notify-sound] .ns-headText{display:flex;flex-direction:column;flex:1;gap:4px;min-width:0;}',
      'body[data-dsh-notify-sound] .ns-name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4;}',
      'body[data-dsh-notify-sound] .ns-desc{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5;}',
      'body[data-dsh-notify-sound] .ns-chevron{color:var(--dsw-alias-label-tertiary);flex:none;display:inline-flex;',
      'transition:transform .16s;}',
      'body[data-dsh-notify-sound] .ns-card.ns-open .ns-chevron{transform:rotate(180deg);}',
      'body[data-dsh-notify-sound] .ns-body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;',
      'padding:12px 0 8px;display:flex;flex-direction:column;gap:10px;}',
      'body[data-dsh-notify-sound] .ns-block{display:flex;flex-direction:column;gap:4px;}',
      'body[data-dsh-notify-sound] .ns-title{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5;}',
      'body[data-dsh-notify-sound] .ns-hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5;}',
      'body[data-dsh-notify-sound] .ns-row{display:flex;align-items:center;gap:10px;border:1px solid transparent;',
      'border-radius:10px;padding:8px 10px;min-width:0;}',
      'body[data-dsh-notify-sound] .ns-row:hover{background:var(--dsw-alias-interactive-bg-hover);}',
      'body[data-dsh-notify-sound] .ns-rowName{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;',
      'white-space:nowrap;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.4;}',
      'body[data-dsh-notify-sound] .ns-select{appearance:none;font:inherit;max-width:220px;cursor:pointer;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:4px 12px;font-size:13px;line-height:1.5;',
      'color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-3);}',
      'body[data-dsh-notify-sound] .ns-select:hover{border-color:var(--dsw-alias-label-dimmed);}',
      'body[data-dsh-notify-sound] .ns-btn{appearance:none;font:inherit;cursor:pointer;flex:none;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:4px 12px;font-size:13px;line-height:1.5;',
      'color:var(--dsw-alias-label-secondary);background:0 0;}',
      'body[data-dsh-notify-sound] .ns-btn:hover:not(:disabled){color:var(--dsw-alias-label-primary);',
      'border-color:var(--dsw-alias-label-dimmed);}',
      'body[data-dsh-notify-sound] .ns-check{display:flex;align-items:center;gap:8px;font-size:13px;',
      'color:var(--dsw-alias-label-primary);cursor:pointer;user-select:none;line-height:1.5;}',
    ].join('\n')

    /* ---------------- 配置作用域（服务端持久化，跨浏览器同步） ---------------- */
    function sanitize(value) {
      var out = {}
      out.enabled = CONFIG_DEFAULTS.enabled
      out.quietCurrent = CONFIG_DEFAULTS.quietCurrent
      for (var i = 0; i < SOUND_FIELDS.length; i++) out[SOUND_FIELDS[i]] = CONFIG_DEFAULTS[SOUND_FIELDS[i]]
      if (value && typeof value === 'object') {
        if (typeof value.enabled === 'boolean') out.enabled = value.enabled
        if (typeof value.quietCurrent === 'boolean') out.quietCurrent = value.quietCurrent
        for (var j = 0; j < SOUND_FIELDS.length; j++) {
          var f = SOUND_FIELDS[j]
          if (typeof value[f] === 'string') out[f] = value[f]
        }
      }
      return out
    }

    /** 从作用域快照取配置：未就绪（加载中/不可达）时用默认值，绝不抛错。 */
    function configOf(snapshot) {
      if (!snapshot || snapshot.status !== 'ready' || !snapshot.value) return sanitize(CONFIG_DEFAULTS)
      return sanitize(snapshot.value)
    }

    /**
     * 直连 /notify-sound/settings 的作用域（SettingsScope 契约）：
     * getSnapshot / subscribe / set / unset；refresh() 拉最新视图（定时 +
     * 聚焦刷新由 apply 驱动），set/unset 经 POST 批量写并接受返回视图。
     * 路由不可达/命名空间缺失 → status 'unavailable'（卡片显示说明，事件
     * 按默认值播放）。
     */
    function NotifyConfigScope(endpoint) {
      var snapshot = { status: 'loading', value: undefined, base: undefined, user: undefined, revision: undefined, writable: false, mode: 'host' }
      var listeners = []
      var tail = Promise.resolve()

      function publish(next) {
        snapshot = next
        var list = listeners.slice()
        for (var i = 0; i < list.length; i++) list[i]()
      }

      function accept(envelope) {
        var view = envelope && envelope.value
        if (!view || typeof view !== 'object') { publishUnavailable(); return }
        publish({
          status: 'ready',
          value: view.value,
          base: view.base,
          user: view.user,
          revision: view.revision,
          writable: view.writable === true,
          mode: 'host',
        })
      }

      function publishUnavailable() {
        publish({ status: 'unavailable', value: undefined, base: undefined, user: undefined, revision: undefined, writable: false, mode: 'host' })
      }

      function refresh() {
        return window.fetch(endpoint)
          .then(function (response) {
            if (!response.ok) { publishUnavailable(); return }
            return response.json()
          })
          .then(function (envelope) {
            if (envelope === undefined) return
            if (envelope.ok !== true) { publishUnavailable(); return }
            accept(envelope)
          })
          .catch(function () { publishUnavailable() })
      }

      /** 批量写（串行：并发写按调用顺序落盘）。 */
      function mutate(writes) {
        tail = tail.then(function () {
          return window.fetch(endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ writes: writes }),
          })
            .then(function (response) {
              if (!response.ok) { publishUnavailable(); return null }
              return response.json()
            })
            .then(function (envelope) {
              if (envelope === null) return
              if (envelope.ok !== true) { publishUnavailable(); return }
              accept(envelope)
            })
            .catch(function () { publishUnavailable() })
        })
        return tail
      }

      void refresh()
      return {
        getSnapshot: function () { return snapshot },
        subscribe: function (fn) {
          listeners.push(fn)
          return function () {
            var i = listeners.indexOf(fn)
            if (i >= 0) listeners.splice(i, 1)
          }
        },
        set: function (field, value) { return mutate([{ field: field, op: 'set', value: value }]) },
        unset: function (field) { return mutate([{ field: field, op: 'unset' }]) },
        refresh: refresh,
      }
    }

    /* ---------------- 音频引擎（Web Audio 合成，无音频文件） ---------------- */
    var audioCtx = null
    var lastPlayed = new Map()

    function ensureContext() {
      if (audioCtx === null) {
        var AC = window.AudioContext || window.webkitAudioContext
        audioCtx = AC ? new AC() : undefined
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        var p = audioCtx.resume()
        if (p && p.catch) p.catch(function () {})
      }
      return audioCtx
    }

    function tone(ctx, freq, delay, dur, type, gain, slideTo) {
      var t0 = ctx.currentTime + delay
      var osc = ctx.createOscillator()
      var g = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, t0)
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
      osc.connect(g)
      g.connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + dur + 0.05)
    }

    /** 带泛音分量的音：partials = [[倍频, 时长比, 波形, 增益比], ...] */
    function richTone(ctx, freq, delay, dur, type, gain, partials) {
      tone(ctx, freq, delay, dur, type, gain)
      if (partials) {
        for (var i = 0; i < partials.length; i++) {
          var p = partials[i]
          tone(ctx, freq * p[0], delay, dur * p[1], p[2] || 'sine', gain * p[3])
        }
      }
    }

    function playBuiltin(key) {
      var ctx = ensureContext()
      if (!ctx) return
      if (key === 'ding') {
        // 叮-咚：门铃式双音
        richTone(ctx, 698.46, 0.02, 0.5, 'sine', 0.3, [[2, 0.8, 'sine', 0.35], [3.01, 0.5, 'sine', 0.12]])
        richTone(ctx, 587.33, 0.28, 0.7, 'sine', 0.26, [[2, 0.8, 'sine', 0.3]])
      } else if (key === 'chime') {
        // 风铃：A5 → E6 悠长
        richTone(ctx, 880, 0.02, 0.5, 'sine', 0.22, [[2.76, 0.6, 'sine', 0.18]])
        richTone(ctx, 1318.5, 0.24, 1.1, 'sine', 0.2, [[2, 0.5, 'sine', 0.1]])
      } else if (key === 'bell') {
        // 钟铃：非谐泛音
        richTone(ctx, 493.88, 0.02, 1.6, 'sine', 0.26, [[2, 0.85, 'sine', 0.3], [2.4, 0.6, 'sine', 0.18], [3.02, 0.45, 'sine', 0.1]])
      } else if (key === 'complete') {
        // 完成：C-E-G-C 上行琶音
        richTone(ctx, 523.25, 0.02, 0.28, 'triangle', 0.22, [[2, 0.7, 'sine', 0.25]])
        richTone(ctx, 659.25, 0.18, 0.28, 'triangle', 0.22, [[2, 0.7, 'sine', 0.25]])
        richTone(ctx, 783.99, 0.34, 0.28, 'triangle', 0.22, [[2, 0.7, 'sine', 0.25]])
        richTone(ctx, 1046.5, 0.5, 0.8, 'triangle', 0.22, [[2, 0.6, 'sine', 0.25]])
      } else if (key === 'success') {
        // 成功：明快 G5 → C6 双音
        richTone(ctx, 783.99, 0.02, 0.2, 'sine', 0.2, [[2, 0.7, 'sine', 0.3]])
        richTone(ctx, 1046.5, 0.16, 0.75, 'sine', 0.2, [[2, 0.6, 'sine', 0.25]])
      } else if (key === 'alert') {
        // 警示：低频方波双声报警（失败/受阻用）
        tone(ctx, 220, 0.02, 0.35, 'square', 0.22)
        tone(ctx, 220, 0.45, 0.35, 'square', 0.22)
        richTone(ctx, 330, 0.02, 0.35, 'square', 0.1, [[2, 0.5, 'sine', 0.12]])
      } else {
        tone(ctx, 880, 0.02, 0.4, 'sine', 0.2)
      }
    }

    /** 播放一个铃声值；sourceKey 用于同源（同一次回合/任务/审批）去抖。 */
    function playSound(key, sourceKey) {
      if (!key || key === 'none') return
      if (sourceKey) {
        var now = Date.now()
        var last = lastPlayed.get(sourceKey)
        if (last !== undefined && now - last < 600) return
        lastPlayed.set(sourceKey, now)
      }
      playBuiltin(key)
    }

    /* ---------------- 完成 / 注意事件监听 ---------------- */
    /** 完成铃声：总开关关闭 → 不响；否则取 defaultSound。 */
    function completionSoundFor(cfg) {
      if (!cfg || cfg.enabled === false) return null
      return cfg.defaultSound || 'chime'
    }

    /** 注意铃声解析：kind 专属（显式 'none' = 静音）→ 通用注意音 → 静音。 */
    function attentionSoundFor(cfg, kind) {
      if (!cfg) return null
      var field = KIND_FIELDS[kind]
      if (field && cfg[field]) return cfg[field] === 'none' ? null : cfg[field]
      var generic = cfg.attentionSound
      if (!generic) return null
      return generic === 'none' ? null : generic
    }

    function startWatcher(ctx, scope) {
      var sessionsList = ctx.sessions.list
      var prevRunning = new Map()
      var prevJobStatus = new Map()
      var prevPending = new Map()
      var prevGoalPhase = new Map()

      /** 注意类事件（审批/提问/计划评审/目标受阻/失败）始终响铃，不受 quietCurrent 限制。 */
      function attention(cfg, kind, sourceKey) {
        if (!cfg || cfg.enabled === false) return
        playSound(attentionSoundFor(cfg, kind), sourceKey)
      }

      function check() {
        var snap = sessionsList.getSnapshot()
        if (!snap || !snap.byId) return
        var cfg = configOf(scope.getSnapshot())
        var quietCurrent = !!(cfg && cfg.quietCurrent === true)
        var byId = snap.byId
        var ids = snap.ids || []

        for (var i = 0; i < ids.length; i++) {
          var id = ids[i]
          var row = byId[id]
          if (!row) continue

          // 会话回合结束：running true -> false（完成铃声，尊重 quietCurrent）
          var was = prevRunning.get(id)
          if (was === true && row.running === false) {
            var skipCurrent = quietCurrent && snap.current === id
            if (!skipCurrent) {
              playSound(completionSoundFor(cfg), 'session:' + id)
            }
          }
          prevRunning.set(id, row.running === true)

          // 需要人介入：pendingInteraction 出现（approval / question / plan-review）
          var pi = row.pendingInteraction
          var prevPi = prevPending.get(id)
          if (pi !== undefined && pi !== prevPi) {
            attention(cfg, pi, 'pending:' + id + ':' + pi)
          }
          prevPending.set(id, pi)

          // 目标受阻：goal 投影进入 blocked
          var pv = row.projectionValues
          var goal = pv && typeof pv === 'object' ? pv.goal : undefined
          var phase = goal && typeof goal === 'object' ? goal.phase : undefined
          var prevPhase = prevGoalPhase.get(id)
          if (phase === 'blocked' && prevPhase !== 'blocked') {
            attention(cfg, 'goal-blocked', 'goal:' + id)
          }
          prevGoalPhase.set(id, phase)
        }

        // 后台任务结束：failed → 失败音；其余终态 → 完成铃声（尊重 quietCurrent）
        var jobsBy = snap.jobsBySession || {}
        for (var sid in jobsBy) {
          if (!Object.prototype.hasOwnProperty.call(jobsBy, sid)) continue
          var jobs = jobsBy[sid] || []
          for (var j = 0; j < jobs.length; j++) {
            var job = jobs[j]
            var key = sid + ':' + job.id
            var prev = prevJobStatus.get(key)
            var terminal = job.status === 'completed' || job.status === 'failed' || job.status === 'killed'
            if ((prev === 'running' || prev === 'stopping') && terminal) {
              if (job.status === 'failed') {
                attention(cfg, 'failure', 'job:' + key)
              } else {
                var skipCurrentJob = quietCurrent && snap.current === sid
                if (!skipCurrentJob) {
                  playSound(completionSoundFor(cfg), 'job:' + key)
                }
              }
            }
            prevJobStatus.set(key, job.status)
          }
        }
      }

      var offSessions = sessionsList.subscribe(check)
      return function () { offSessions() }
    }

    /* ---------------- 跨浏览器同步：定时 + 聚焦/可见刷新 ---------------- */
    function startSync(scope) {
      var timer = window.setInterval(function () { scope.refresh() }, SYNC_INTERVAL_MS)
      var onVis = function () {
        if (document.visibilityState === 'visible') scope.refresh()
      }
      var onFocus = function () { scope.refresh() }
      document.addEventListener('visibilitychange', onVis)
      window.addEventListener('focus', onFocus)
      return function () {
        window.clearInterval(timer)
        document.removeEventListener('visibilitychange', onVis)
        window.removeEventListener('focus', onFocus)
      }
    }

    /** 展开箭头（与 theme-center 同款 SVG chevron）。 */
    function Chevron() {
      return React.createElement('svg', {
        width: 14,
        height: 14,
        viewBox: '0 0 16 16',
        'aria-hidden': true,
      }, React.createElement('path', {
        d: 'M4 6l4 4 4-4',
        stroke: 'currentColor',
        fill: 'none',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }))
    }

    /* ---------------- 设置卡片 ---------------- */
    function useSnapshot(source) {
      var pair = React.useState(function () { return source.getSnapshot() })
      var setState = pair[1]
      React.useEffect(function () {
        return source.subscribe(function () {
          setState(source.getSnapshot())
        })
      }, [source])
      return pair[0]
    }

    function soundOptions(includeFollow) {
      var options = []
      if (includeFollow) {
        options.push(React.createElement('option', { key: '', value: '' }, '跟随通用注意音'))
      }
      for (var i = 0; i < BUILTIN_SOUNDS.length; i++) {
        var s = BUILTIN_SOUNDS[i]
        options.push(React.createElement('option', { key: s.key, value: s.key }, s.label))
      }
      return options
    }

    function selectEl(value, onChange, includeFollow) {
      return React.createElement('select', {
        className: 'ns-select',
        value: value || '',
        children: soundOptions(includeFollow),
        onChange: function (ev) { onChange(ev.target.value) },
      })
    }

    /** 声音选择行：标签 + 下拉 + 试听。onChange 收到选中键（''=跟随通用）。 */
    function soundRow(label, value, onChange, includeFollow, previewKey) {
      return React.createElement('div', { className: 'ns-row' },
        React.createElement('span', { className: 'ns-rowName' }, label),
        selectEl(value, onChange, includeFollow),
        React.createElement('button', {
          className: 'ns-btn',
          onClick: function () { playSound(previewKey, undefined) },
        }, '试听')
      )
    }

    function makeCard(scope) {
      function Card(props) {
        var pair = React.useState(false)
        var open = pair[0]
        var setOpen = pair[1]
        var snap = useSnapshot(scope)
        var cfg = configOf(snap)
        var available = snap.status === 'ready'

        function setField(field, value) {
          var p = scope.set(field, value)
          if (p && p.catch) p.catch(function () {})
        }
        function clearField(field) {
          var p = scope.unset(field)
          if (p && p.catch) p.catch(function () {})
        }
        /** 注意类行：''（跟随通用）→ unset；显式键 → set。 */
        function setKind(field, value) {
          if (value === '') clearField(field)
          else setField(field, value)
        }

        var headerChildren = [
          React.createElement('span', { className: 'ns-headText', key: 't' }, [
            React.createElement('span', { className: 'ns-name', key: 'n' }, '提示音'),
            React.createElement('span', { className: 'ns-desc', key: 'd' },
              '会话完成 / 需要人介入（审批、提问、计划评审、目标受阻、任务失败）时播放内置提示音，配置在所有浏览器同步'),
          ]),
          React.createElement('span', { className: 'ns-chevron', key: 'c' }, React.createElement(Chevron, null)),
        ]

        var bodyChildren = []
        if (!available) {
          bodyChildren.push(React.createElement('div', { className: 'ns-hint', key: 'na' },
            snap.status === 'loading'
              ? '正在加载配置…'
              : '无法读取服务端配置（settings 服务不可用）。事件提示音将按默认配置播放，卡片暂不可编辑。'))
        } else {
          bodyChildren.push(
            React.createElement('div', { className: 'ns-block', key: 'b1' }, [
              React.createElement('label', { className: 'ns-check', key: 'e' },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: cfg.enabled !== false,
                  onChange: function (ev) { setField('enabled', ev.target.checked) },
                }),
                '启用提示音'),
              React.createElement('label', { className: 'ns-check', key: 'q' },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: cfg.quietCurrent === true,
                  onChange: function (ev) { setField('quietCurrent', ev.target.checked) },
                }),
                '当前正在查看的会话完成时不响铃'),
            ]),
            React.createElement('div', { className: 'ns-block', key: 'b2' }, [
              React.createElement('div', { className: 'ns-title', key: 't' }, '完成铃声（回合结束 / 后台任务完成）'),
              soundRow('完成铃声', cfg.defaultSound, function (v) { setField('defaultSound', v) }, false, cfg.defaultSound),
            ]),
            React.createElement('div', { className: 'ns-block', key: 'b3' }, [
              React.createElement('div', { className: 'ns-title', key: 't' }, '需要人介入时（注意铃声，不受「当前会话不响铃」限制）'),
              soundRow('通用注意音', cfg.attentionSound, function (v) { setField('attentionSound', v) }, false, cfg.attentionSound),
              soundRow('审批请求', cfg.approvalSound, function (v) { setKind('approvalSound', v) }, true, cfg.approvalSound || cfg.attentionSound),
              soundRow('用户提问', cfg.questionSound, function (v) { setKind('questionSound', v) }, true, cfg.questionSound || cfg.attentionSound),
              soundRow('计划评审', cfg.planReviewSound, function (v) { setKind('planReviewSound', v) }, true, cfg.planReviewSound || cfg.attentionSound),
              soundRow('目标受阻', cfg.goalBlockedSound, function (v) { setKind('goalBlockedSound', v) }, true, cfg.goalBlockedSound || cfg.attentionSound),
              soundRow('后台任务失败', cfg.failureSound, function (v) { setKind('failureSound', v) }, true, cfg.failureSound || cfg.attentionSound),
            ]),
            React.createElement('div', { className: 'ns-hint', key: 'h' },
              '配置保存在服务端设置中，所有浏览器 / 设备同步生效；「跟随通用注意音」表示该事件复用通用注意音。')
          )
        }

        return React.createElement('li', {
          className: 'ns-card' + (open ? ' ns-open' : ''),
        }, [
          React.createElement('button', {
            type: 'button',
            className: 'ns-header',
            'aria-expanded': open,
            'aria-label': (open ? '收起' : '展开') + ': 提示音',
            key: 'h',
            onClick: function () { setOpen(!open) },
          }, headerChildren),
          open ? React.createElement('div', { className: 'ns-body', key: 'b' }, bodyChildren) : null,
        ])
      }
      return Card
    }

    /* ---------------- 插件主体 ---------------- */
    var inject = ['slots', 'sessions']

    function apply(ctx) {
      var scope = new NotifyConfigScope(SETTINGS_API_PATH)
      var disposeWatcher = startWatcher(ctx, scope)
      var disposeSync = startSync(scope)

      // body 作用域属性 + 卡片样式：disposer 全部收回
      ctx.effect(function () {
        document.body.setAttribute('data-dsh-notify-sound', '')
        var styleTag = document.createElement('style')
        styleTag.dataset.plugin = 'dsh-notify-sound'
        styleTag.dataset.pluginCss = 'dsh-notify-sound/card'
        styleTag.textContent = CSS
        document.head.appendChild(styleTag)
        return function () {
          document.body.removeAttribute('data-dsh-notify-sound')
          styleTag.remove()
        }
      }, 'dsh-notify-sound: card styles')

      ctx.effect(function () {
        return function () {
          disposeWatcher()
          disposeSync()
        }
      }, 'dsh-notify-sound: watcher + sync')

      var slots = ctx.get('slots')
      if (slots !== undefined) {
        var Card = makeCard(scope)
        slots.inject('settings.plugin.item', function () {
          return slots.register({
            name: 'settings.plugin.item',
            id: CARD_ID,
            key: CARD_ID,
            order: 35,
            label: '提示音',
          }, Card)
        })
      }
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
