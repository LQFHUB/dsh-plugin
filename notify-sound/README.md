# 🔔 dsh-notify-sound

> 个人 DSH 会话提示音插件：会话完成 / 需要人介入（审批、提问、计划评审、目标受阻、后台任务失败）时播放**内置合成提示音**，不同情况可配不同声音，内置一套合理默认；配置**服务端持久化，所有浏览器 / 设备同步**。
>
> 参考 [ldchaowin/dsh-plugin-notify-sound](https://github.com/ldchaowin/dsh-plugin-notify-sound)（MIT）裁剪改造：去掉自定义音频上传、TTS 语音播报与按工作区配置，改为**仅内置合成音 + 插件设置卡片**（dsh 0.1.6+ 在 Plugins 面板插件详情页，≤0.1.5 在「设置 > 插件 > 插件配置」）。

---

## ✨ 特性

- **内置 6 种合成提示音 + 静音**：叮咚 / 风铃 / 铃铛 / 完成 / 成功 / 警示，Web Audio 实时合成，无任何音频文件
- **按情况区分**：完成类（一次对话整回合结束）与注意类（审批请求、用户提问、计划评审、目标受阻、后台任务失败）各自独立配置，可"跟随通用注意音"
- **默认配置一套**：装完即用（完成=风铃、注意=叮咚、受阻=铃铛、失败=警示）
- **配置所有浏览器同步**：配置存服务端 profile 设置（用户层），任何浏览器 / 设备改动全局生效；本页每 30s 定时刷新 + 页面聚焦 / 可见时刷新，近实时同步
- **「提示音」设置卡片**：兼容两代槽位——**0.1.6+** 挂 `plugins.bundle.config`（Plugins 面板 → 插件详情页，按 owner `view` 渲染一行摘要 / 配置表单）；**≤0.1.5** 挂 `settings.plugin.item`（设置 → 插件配置 TAB，折叠卡形态），每行下拉 + 试听
- **注意类事件不受「当前会话不响铃」限制**：需要你介入的事永远响，完成类可设为"当前正在查看的会话不响"

## 🎯 界面位置

**dsh 0.1.6+**：Plugins 面板（左侧）→ 已安装列表点「提示音」→ 详情页配置表单（官方 `plugins.bundle.config` 契约只请求 `page` 视图；组件同时实现了 `summary` 摘要视图，供 owner 请求时使用）。

**dsh ≤0.1.5**：设置（侧边栏底部）→ 插件配置 → 「提示音」折叠卡片。

两版控件相同：

```
☑ 启用提示音
☐ 当前正在查看的会话完成时不响铃
完成铃声（一次对话整回合结束）
  完成铃声 [风铃 Chime]        [试听]
需要人介入时（注意铃声，不受「当前会话不响铃」限制）
  通用注意音 [叮咚 Ding]       [试听]
  审批请求 [跟随通用注意音]     [试听]
  用户提问 [跟随通用注意音]     [试听]
  计划评审 [跟随通用注意音]     [试听]
  目标受阻 [铃铛 Bell]         [试听]
  后台任务失败 [警示 Alert]     [试听]
配置保存在服务端设置中，所有浏览器/设备同步生效…
```

## 🔊 内置音与默认配置

| 键 | 名称 | 听感 | 默认用于 |
| --- | --- | --- | --- |
| `ding` | 叮咚 Ding | 门铃式双音（A5→D5） | 通用注意音 |
| `chime` | 风铃 Chime | A5→E6 悠长双音 | **完成铃声（默认）** |
| `bell` | 铃铛 Bell | 钟铃非谐泛音（B4） | **目标受阻（默认）** |
| `complete` | 完成 Complete | C-E-G-C 上行琶音 | 可选 |
| `success` | 成功 Success | G5→C6 明快双音 | 可选 |
| `alert` | 警示 Alert | 220Hz 方波双声报警 | **后台任务失败（默认）** |
| `none` | 静音 | — | 可选 |

默认配置：完成 = `chime`；通用注意 = `ding`；审批 / 提问 / 计划评审 = 跟随通用（`ding`）；目标受阻 = `bell`；后台任务失败 = `alert`。

## 🎬 触发的事件

| 事件 | 检测 | 声音 |
| --- | --- | --- |
| 回合结束（回答完成） | session `running: true → false` | 完成铃声（受「当前会话不响」约束） |
| 后台任务完成 / 终止 | job `running/stopping → completed/killed` | **不响**（一次对话里的多个后台小任务不逐个提示，避免与回合结束提示重复） |
| 审批请求 | `uiSession` 交互快照出现 `kind: approval`（0.1.6+ 读 `sessionStatus[*].pendingInteraction`；≤0.1.5 读 `pendingInteractions[*]`） | 审批音 → 通用注意音 |
| 用户提问 | 同上，`kind: question` | 提问音 → 通用注意音 |
| 计划评审 | 同上，`kind: plan-review` | 评审音 → 通用注意音 |
| 目标受阻 | goal 投影 `goal.goal.phase → blocked` | `goalBlockedSound`（只响一次） |
| 后台任务失败 | job `→ failed` | `failureSound`（不受约束） |

同源事件 600ms 内去抖，避免重复快照误响。

## 🔧 工作原理 / How it works

- **配置存储**：宿主半区经 `ctx.inject(['settings'], sctx => sctx.settings.installSection(...))`（dsh-settings）注册 `notify-sound` 设置命名空间，配置落在 profile 设置的用户层（服务端落盘）。官方 apiproxy 的 settings 白名单不暴露第三方命名空间，故宿主另注册 **`/notify-sound/settings` 路由**（GET 视图 / POST 批量写，同源护栏 + revision 栅栏）作为读写接缝
- **浏览器作用域**：`NotifyConfigScope` 实现 SettingsScope 契约直连该路由；启动拉取一次，写入即 POST 落盘，另每 30s + 聚焦/可见刷新——所有浏览器读同一份配置即天然同步
- **音效引擎**：Web Audio 合成（Oscillator + Gain），`AudioContext` 惰性创建；首次播放受浏览器自动播放策略约束，页面任意交互（如点「试听」）后即解锁
- **事件监听**：订阅 `sessions.list` 快照（`byId/ids/current/jobsBySession`）+ `uiSession` 权威交互快照（审批/提问/计划评审；`SessionSummary` 无该字段，不能从 list 行读）。交互快照按 dsh 版本自动择一：**0.1.6+** 为 `sessionStatus`（`Map<SessionId, {running, pendingInteraction, completionUnread}>`，交互在 `status.pendingInteraction`）；**≤0.1.5** 为 `pendingInteractions`（值本身即交互）。无轮询、无额外数据通道
- **包结构**：标准 DSH 插件 bundle（`dsh.bundle.patch` + `dsh.client` web 平台），lib/ 随源码提交，link 安装直接可用

## 📦 安装 / Installation

```sh
# 方式一：npm 安装（已发布到 npm registry，推荐——任意 mac/win/linux 机器）
dsh plugin --profile web add dsh-notify-sound

# 方式二：link 安装（源码目录，用于本地开发）
dsh plugin --profile web add link:/root/.dsh/external/notify-sound
# 注意：首次 add 可能只登记依赖、未进 dsh.profile.bundles，重跑一次（幂等）即补齐
dsh plugin --profile web add link:/root/.dsh/external/notify-sound
```

> ⚠️ 安装后需**重启 `dsh web`**，并在浏览器里 **Ctrl+Shift+R** 强制刷新一次（bundle 仅页面加载时获取）。

### 宿主依赖

`@deepseek-ai/schemastery` / `@deepseek-ai/dsh-settings` 未发布到 npm，运行时由 DSH 安装树提供（同 describe-image 既定流程）：

```sh
cd /root/.dsh/external/notify-sound/node_modules/@deepseek-ai
ln -sfn /usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/schemastery schemastery
ln -sfn /usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-settings dsh-settings
```

## 🖱️ 使用 / Usage

1. 打开 **设置 → 插件配置 → 提示音** 卡片
2. 每行下拉选择声音（注意类事件可选「跟随通用注意音」），点「**试听**」确认
3. 改动即时落盘：其他浏览器 / 设备最迟 30s 内（或切回页面时）同步生效
4. 需要安静时：关「启用提示音」，或只勾「当前正在查看的会话完成时不响铃」（注意类仍会响）

## 🧪 开发 / Development

```sh
npm test    # 宿主契约 33 断言 + 浏览器逻辑 60 断言（node 内置，无需浏览器）
npm run check  # 语法检查
```

布局：

- `lib/index.js` — 宿主半区：设置命名空间 + `/notify-sound/settings` 读写路由
- `lib/client.js` — 浏览器半区：提示音卡片、事件监听、音效引擎、同步作用域
- `tests/` — node 内置测试（假 loader / 假 AudioContext 频率捕获 / 内存版 settings 服务）
- `cordis.patch.yml` — bundle patch 层（insert `notify-sound`）

## 📜 部署记录

- 2026-09-22：**去掉后台任务（"小任务"）完成提示音（v0.1.5）**。用户反馈"小任务完成时也响，只想在一次对话整回合做完时响"。改动：`check()` 的后台任务分支只保留 `failed → failureSound`（注意类，需人介入），`completed` / `killed` 一律不响；完成提示仅由会话 `running: true → false`（回合结束）触发；配置卡文案「完成铃声（回合结束 / 后台任务完成）」→「完成铃声（一次对话整回合结束）」。测试 58 → 60 断言。**112（dsh 0.1.7-alpha.1）实测**：普通回合结束捕获 chime 振荡器 880/2428.8/1318.5/2637（4 个，栈落在 `tone()`/`ensureContext()`）；后台任务结束时刻（`sleep 8` 退出码 0、`sleep 5; exit 3`）**无任何振荡器**；同回合内 agent 被任务完成唤醒后的第二个回合结束仍正常响 chime。⚠️ 验证探针注意：`osc.frequency.value` 在 `setValueAtTime` 后仍返回默认 440，必须 patch `frequency.setValueAtTime` 才能读到真实频率。回滚：profile specifier 恢复 `file:/root/dsh-notify-sound-0.1.4.tgz` + `pnpm install` + 重启（备份 `package.json.bak-pre-notify-015-20260922_2218`、`pnpm-lock.yaml.bak-pre-notify-015-20260922_2218`）。**111（正式机）已热更新部署、未重启服务**：111 为 link 安装（`/root/.dsh/external/notify-sound`，原 v0.1.3），复制 v0.1.5 文件后由 `dsh-client-hmr` 热重组 bundle（功能改动全在浏览器端 `client.js`，host 半区 `index.js` 仅注释改动）——实测 `/plugins/??dsh-notify-sound/client.js` 已是新代码、页面 `body[data-dsh-notify-sound]` + ns-card 样式注入、「设置 → 插件 → 提示音」卡片展开渲染 7 下拉 + 2 复选 + 8 按钮（下拉值 `["success","ding","","","","bell","alert"]`，即用户原服务端配置未被改动）、文案已是「完成铃声（一次对话整回合结束）」、console 0 错误、host 路由 `/notify-sound/settings` 200 且回显 `defaultSound: success`。备份 `/root/notify-sound-bak-pre-015-20260922_2245.tgz`（回滚：`tar -xzf` 覆盖回 external 目录）。已打开的页面需刷新（Ctrl+Shift+R）才会加载新 bundle。
- 2026-09-19：**适配 dsh 0.1.6-alpha.2 的槽位与交互 API 变更（v0.1.4）**。该版本移除了 `settings.plugin.item` 槽（「设置 > 插件配置」TAB 一并移除），并把 `uiSession.pendingInteractions` 改为 `uiSession.sessionStatus`，导致 v0.1.3 在新版下**配置卡不显示、需人介入提示音失效**。改法为**双版本兼容**：两个槽同时注册（`settings.plugin.item` 给 ≤0.1.5；`plugins.bundle.config` 给 0.1.6+，key = 包名 `dsh-notify-sound`，组件按 owner `view` 分派 summary/page）；交互源优先取 `sessionStatus`（`status.pendingInteraction`），缺失时回退 `pendingInteractions`。**112（dsh 0.1.6-alpha.2）实测通过**：插件详情页渲染完整表单（v0.1.4、7 下拉 + 2 复选 + 7 试听）、console 0 错误 0 警告；试听捕获 chime 频率 880/2428.8/1318.5/2637；**真实调用 `ask_user_question` 弹出提问卡片时探针捕获 ding 频率 698.46/1396.92/2102.3646/587.33/1174.66**（与「通用注意音 ding」参数完全一致），证明新版 `sessionStatus` 检测链路生效。测试：宿主 33 + 客户端 58 断言全过（新增 page/summary/legacy 三组用例）。回滚：profile specifier 恢复 `file:/root/dsh-notify-sound-0.1.3.tgz` + `pnpm install` + 重启 `dsh-web.service`（备份 `package.json.bak-pre-notify-014-*`）
- 2026-09-06：**112 部署验证 v0.1.3 通过**（本次修复「提问/审批/计划评审/目标受阻」不响）：npm 打包 `dsh-notify-sound-0.1.3.tgz` + `file:` 引用装 112（dsh 0.1.2-rc.1），重启 `dsh-web.service` 后浏览器实测——bundle 加载 200、`/notify-sound/settings` 200、**真实调用 ask_user_question 弹出提问卡片时探针捕获到 ding 合成音**（振荡器 5 个、基频 698.46/1396.92/2102.36/587.33/1174.66，与「通用注意音 ding」参数完全一致）、console 0 错误；提交答案后 agent 正常收尾
- 2026-08-16：112（AI-2，192.168.31.112）**验证全过**——curl：GET 视图（默认值完整）、POST set/unset（用户层落盘 `/root/.dsh/settings.yaml`、unset 回退 base 默认）、跨站 403 / 坏体 400 / PUT 405；浏览器（playwright-core + chromium headless）18/18：bundle 注入、`body[data-dsh-notify-sound]` 作用域与样式注入、设置 → 插件配置「提示音」卡片渲染/展开、7 下拉/2 复选/7 试听、默认值 chime·ding·跟随×3·bell·alert、下拉修改 → POST → 服务端持久化、试听真实发声（AudioContext 振荡器探针）、刷新后服务端回显、双页面跨浏览器同步（focus 刷新即跟随）、无 console 错误
- 2026-08-16：样式统一（官方皮肤令牌体系），112 实测 6/6 全过（与主题卡计算样式逐项一致）
- 111（AI 主机，正式使用）**已部署**：2026-08-16 用户确认后重启 `dsh-web.service`，验证 5/5 全过（bundle 注入、body 作用域、样式注入、插件配置卡片渲染、无错误）

## 📄 License

[MIT](LICENSE)。音效合成参数与事件检测思路参考 [ldchaowin/dsh-plugin-notify-sound](https://github.com/ldchaowin/dsh-plugin-notify-sound)（MIT）。
