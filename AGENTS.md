# AGENTS.md

本文件是本目录（`dsh-plugin`）的**开发约定与变更记录**，供 AI 助手（Agent）在本目录工作时遵循。

## 一、目录用途

- 本目录用于开发**用户个人使用的 DSH 插件**。
- 只存放与插件开发相关的内容（代码、配置、文档、测试等），不得存放与本目录用途无关的文件。

## 二、目录结构约定

- **每个新功能创建一个独立文件夹**，文件夹内包含该功能的全部代码、配置和说明文档。
- 文件夹命名使用语义化、可读的名称（如 `audio-player`、`clipboard-manager`），避免无意义命名。
- 每个功能文件夹内应有自己的说明文档（如 `README.md`），描述该功能的用途和使用方法。
- 通用、跨功能共享的代码或配置，应放在单独的 `shared/`（或明确命名的）目录中，避免在功能目录间复制。

### 现有插件一览

| 文件夹 | 作用 |
|:---|:---|
| `theme-center/` | 主题中心（一体化 v0.3.4）：24 款皮肤 + 「主题/外观」双 Tab 设置卡（试穿/应用/亮暗/遮罩 + 聊天宽度 + 聊天区精简百分比压制 + 会话区字号缩放 + 全站字体 + 隐藏思考/工具/上下文开关）；**配置保存到服务器（settings.yaml），一处配置、所有终端生效**；其他插件 UI 需适配它（见第六节主题适配契约） |
| `web-lan/` | dsh Web 局域网直连（免反代）：crypto polyfill + apiProxy relay + isLoopback |
| `navbar/` | 对话节点导航条（贴左侧边栏，节点跳转/悬停预览/pin 精选，中英文定位） |
| `notify-sound/` | 会话提示音（Web Audio 合成 6 音、事件触发、配置跨浏览器同步、提示音设置卡，皮肤令牌适配） |
| `describe-image/` | 图像理解工具（视觉模型描述图片，configured 模式复用已配置模型 + 「图像理解」设置卡） |
| `modsearch/` | 自维护 fork（上游 v5.10.1）：官方 modsearch dsh 插件（web_search 提供商 + x_search/read_page 工具 + 设置卡）+ **设置卡 LAN 信任修复**（读取官方 `connection.trustedHosts`，局域网 IP 不再 403）；差异见 `modsearch/FORK.md` |
| （外部）`dsh-better-sidebar` | VSCode 风格右侧侧边栏工作台（文件资源管理器/CodeMirror 编辑器/终端/Git/浏览器/子代理，服务化 `ctx.betterSidebar` 三方扩展）——npm 安装，仓库 https://github.com/omdsh-dev/DSH-better-sidebar（MIT） |

### 官方上游源码（只读参考）

- `upstream/DeepSeek-Harness/`：**官方源码的本地镜像**（独立 git 仓库，已 `--filter=blob:none` 完整历史部分克隆 master，当前 HEAD 对应 v0.1.2-alpha.1 发布；**含全量提交历史 14226 条，可直接 `git log` 查看变更记录**）。用途：**开发/排查时直接在本地看官方实现**（源码、`docs/`、agent 决策笔记 `.agents/notes/`），不依赖网络。
- **更新方法**（需要时手动执行）：在 `upstream/DeepSeek-Harness/` 下 `git pull`（部分克隆按需拉取 blob，网络不稳时加 `-c index.threads=1` 重试）。更新后可 `git log --oneline -1` 确认版本。
- **只读性质**：本目录仅作参考，**不得向官方仓库提交/推送**；其 .git 独立，不参与插件仓库版本管理。已在 `.gitignore` 中忽略 `upstream/`，不会误提交。
- 注意：`upstream/` 内是另一个 git 仓库（嵌套仓库），git 命令可能报 `dubious ownership`——用 `git -c safe.directory=<该目录绝对路径>` 或环境变量方式处理，勿写全局配置。

## 三、添加新功能的流程（必须遵守）

1. **先询问，再动手**：在添加任何新功能之前，Agent 必须先询问用户：是否创建一个新文件夹来开发该功能（还是放进现有文件夹）。
2. 若用户同意创建新文件夹：按照"目录结构约定"创建文件夹，并在其中开发。
3. 若用户选择放入现有文件夹：说明原因，并只对现有文件夹做最小必要的修改。
4. 开发完成后，**必须**在本文件"四、变更记录"中追加一条记录。
5. **功能完成标准（Definition of Done）**：以下全部满足才算功能完成——功能代码可用且可正常加载；功能文件夹内 README 已写好（用途、使用方法）；必要的测试通过（如有）；变更记录已追加。
6. **部署验证（适用时）**：功能完成且满足 DoD 后，**先安装到 AI-2（192.168.31.112）检查验证**，验证通过后才视为交付完成。**验证通过后必须询问用户是否部署到 111（AI 主机，正式使用）——用户同意后才可部署 111**；111 部署需重启 `dsh-web.service`，会中断该机上其他进行中的任务，故不得自动执行。AI-2 登录方式见知识库 `autu.md`。

## 四、变更记录

<details>
<summary>📜 变更记录（共 6 条：5 条历史 + 1 条归档动作，点击展开，最新在最上面；更早记录见 `CHANGELOG.md`）</summary>

### 2026-09-23 notify-sound v0.1.6：适配 dsh 0.1.7 的 settings API 重构（配置卡恢复可编辑）

- 变更内容：用户指示「theme-center 不需要了，notify-sound 需要适配」（theme-center 暂不适配）。0.1.7 的 dsh-settings 换成 `SettingsForms` 类：移除 `SettingsProvider.installSection` / `register` 方法与 `installSettingsSection` / `settingsNamespace` 导出，配置改由 configEditor 从**活动插件条目 + Config schema** 自动识别（字段须标 `.volatile()`），命名空间名 = profile 条目 id；settings 存储同时从 `~/.dsh/settings.yaml` 迁到 profile 的 `cordis.patch.yml`。**改法（双版本兼容，不破坏旧版）**：① `lib/index.js` 新增 `live()` 包装——新版 schemastery（3.18.4，随 0.1.7 发布）支持 `.volatile()` 即标记为可热更新字段，旧版（3.18.2，0.1.5-rc.1 搭载）无此方法则原样返回；`Config` 九个字段全部经 `live()`；② `apply` 运行时择一：有 `installSection` 走旧机制（≤0.1.6 原样），否则调 `sctx.effect(() => settings.configure({ auto: false }, ctx.fiber))`（0.1.7+，自带卡片、不要官方自动表单，与官方 ui-theme 同款写法）；③ `describe()` / `replace()` / `writable` 两代同名同义，`buildSettingsView` / `applySettingsWrites` 与 `/notify-sound/settings` 路由契约**零改动**；④ 版本 0.1.5 → 0.1.6。
- 涉及路径：`notify-sound/{lib/index.js,tests/test-host.mjs,README.md,package.json}`；112 `/root/.dsh/profiles/web/{package.json,pnpm-lock.yaml}`（备份 `*.bak-pre-notify-016-20260923_224949`）、`/root/dsh-notify-sound-0.1.6.tgz`
- 备注：**测试**——宿主 33 → 39 断言（新增 modern API 六项：不调 installSection / `configure({auto:false})` / 传入 fiber / 路由仍注册 / GET 视图 / POST replace），本机 schemastery 3.18.2 走降级路径，另建临时环境用 3.18.4 跑 40 断言（含「9 字段全部 volatile」）全过；客户端 60 断言不变。⚠️ **探针经验**：3.18.4 下 volatile 字段解析为**带 `get()` 的引用对象**（官方 `plainConfig()` 负责解包），测试断言需先解包；`toJSON()` 顶层为 `{uid,refs}`，根节点 dict 在 `refs[uid]`。**112（dsh 0.1.7-rc.1）实测全过**：`/notify-sound/settings` GET 200（9 字段视图 + `writable:true`，此前 404）→ POST set 落盘 `cordis.patch.yml` 的 `- id: notify-sound` 条目 → unset 后条目移除回默认；插件详情页卡片恢复（7 下拉 + 2 复选 + 12 按钮，「无法读取服务端配置」消失，显示「配置保存在服务端设置中，所有浏览器/设备同步生效」）；console 不再有 notify-sound 404（仅剩未适配的 theme-center）；UI 改「完成铃声」→ 落盘 `defaultSound: complete`、回合结束探针捕获 complete 琶音（523.25/659.25/783.99/1046.5 + 泛音）、刷新后按服务器真源回落 `chime`。回滚：specifier 恢复 `file:/root/dsh-notify-sound-0.1.5.tgz` + `pnpm install` + 重启。⚠️ **111（0.1.5-rc.1）不受影响**（走旧分支），但本次 host 端改动需重启才生效——111 部署待用户确认。

### 2026-09-23 112 升级 dsh 0.1.7-alpha.1 → 0.1.7-rc.1（settings API 未回退，插件降级状态不变）

- 变更内容：按用户指示把 112 从 `0.1.7-alpha.1` 升级到 `0.1.7-rc.1`（npm 上 `next` tag = 0.1.7-rc.1，`alpha` tag 已到 0.1.7-alpha.2，`latest` 为 0.1.5-rc.3，故必须显式指定版本号）。① **备份**：`profiles/web/{package.json,pnpm-lock.yaml,cordis.patch.yml}`、`settings.yaml.imported`、sessions 打包（均为 `*.bak-pre-017rc1-20260923_224155`）；② **升级** `npm install -g @deepseek-ai/dsh@0.1.7-rc.1`（npmmirror，24s，514 包变更）；③ **依赖比对**（alpha.1 vs rc.1 tarball）：**无新增/移除包**，仅版本号统一升 rc.1，另 cordis `^4.0.3→~4.0.4`、include `^1.0.8→~1.0.9`、loader `^1.0.4→~1.0.5`、timer `^1.1.5→~1.1.6`、schemastery `^3.18.3→~3.18.4`；④ **`dsh-settings` API 与 alpha.1 逐项一致**（仍为 `configure` / `describe` / `invalidate` / `prepareDocument` / `schema`，导出 `SettingsConflictError` / `SettingsForms` / `redactSecrets`）——**官方未回退旧 API**；⑤ web-lan 补丁双重启自愈（首启 REPAIRED 写盘、二启 PATCHED 加载，`isLoopback: true`、`isLanAuthority` count=2）。
- 涉及路径：112 `/usr/local/lib/node_modules/@deepseek-ai/dsh`、`/root/.dsh/profiles/web/{package.json,pnpm-lock.yaml,cordis.patch.yml}`（备份 `*.bak-pre-017rc1-20260923_224155`）、`/root/.dsh/settings.yaml.imported.bak-pre-017rc1-20260923_224155`、`/root/dsh-sessions-bak-pre-017rc1-20260923_224155.tgz`；本目录无文件变更
- 备注：**升级与回归全过**——服务 active、NRestarts=0、`dsh --profile web --dump-config` exit 0、**插件 7/7 `1 total · 1 running`**、LAN 免 token 303+Set-Cookie、`/modsearch/config` 200、**模型端到端调用成功**（UI 发消息 4s 回复「正常」，模型 DeepSeek V4.1 Flash）。⚠️ **插件降级状态与 alpha.1 完全一致**（settings API 未变，属预期）：theme-center v0.5.7 显示「服务器配置不可用，仅本机生效」、notify-sound v0.1.5 显示「无法读取服务端配置…卡片暂不可编辑」、modsearch `scope.settings.register is not a function`（工具与 `/modsearch/config` 正常），`/theme-center/settings` 与 `/notify-sound/settings` 仍 404；dshmarket / find-plugin / global-rules / web-lan 无降级；console 仅上述两个 settings 404 轮询错误。**theme-center 配置段仍完整保留在 `settings.yaml.imported`**（未丢失）。⚠️ 第三方插件 settings 新 API 适配仍待用户确认；111 仍在 0.1.5-rc.1，升级需另行确认。

### 2026-09-22 notify-sound v0.1.5：去掉后台任务（小任务）完成提示音，只在一次对话整回合结束时提示

- 变更内容：用户反馈「notify-sound 在小任务完成时也会响，希望去掉，只在一次对话的整个任务完成时提示」，经询问确认"小任务"= 后台任务（`jobsBySession`），并确认保留后台任务失败音。① **`lib/client.js`**：后台任务分支只保留 `failed → failureSound`（注意类），`completed` / `killed` 一律不响——完成提示仅由会话 `running: true → false`（回合结束）触发；文件头注释与配置卡标题同步（「完成铃声（回合结束 / 后台任务完成）」→「完成铃声（一次对话整回合结束）」）；② **`lib/index.js`**：schema 注释同步；③ **测试**：客户端 58 → 60 断言（job 完成静音、job killed 静音、静音后回合结束仍响、job failed 仍响 alert）；④ 版本 `0.1.4 → 0.1.5`；⑤ README 特性/界面示意/事件表/断言数/部署记录更新。
- 涉及路径：`notify-sound/{lib/client.js,lib/index.js,tests/test-client.mjs,README.md,package.json}`；112 `/root/.dsh/profiles/web/{package.json,pnpm-lock.yaml}`（备份 `*.bak-pre-notify-015-20260922_2218`）、`/root/dsh-notify-sound-0.1.5.tgz`
- 备注：**112（dsh 0.1.7-alpha.1）实测通过**——① 普通回合结束捕获 chime 4 个振荡器（880/2428.8/1318.5/2637，调用栈落在插件 `tone()` / `ensureContext()`，排除第三方音源）；② 后台任务结束时刻（`sleep 8` 退出码 0、`sleep 5; exit 3`）**无任何振荡器**；③ 同回合内 agent 被任务完成唤醒后的第二个回合结束仍正常响 chime。测试：宿主 33 + 客户端 60 断言全过、`npm run check` 通过。⚠️ **探针经验**：`osc.frequency.value` 在 `frequency.setValueAtTime(freq, t0)` 之后仍返回默认 440，验证时必须 patch `frequency.setValueAtTime` 才能读到真实频率（首次验证因此误判"未响"）。⚠️ 112 上 `/notify-sound/settings` 仍 404（0.1.7 settings API 重构的既有问题，浏览器端回退默认配置，提示音正常）。✅ **111（正式机）已热更新部署，未重启服务**：111 为 link 安装（`/root/.dsh/external/notify-sound`，原 v0.1.3）；用户同意后复制 v0.1.5 文件到该目录（备份 `/root/notify-sound-bak-pre-015-20260922_2245.tgz`）——本次功能改动全在浏览器端 `client.js`，111 已加载 `dsh-client-hmr`（对 client bundle 做 500ms stat 轮询），改文件即热重组 bundle，**无需重启 `dsh-web.service`**（host 半区 `index.js` 仅注释改动）。实测：`/plugins/??dsh-notify-sound/client.js&rev=434c0cc8a08b` 已是新代码（`skipCurrentJob` 0 命中、只剩 `job.status === 'failed'`）；页面 `body[data-dsh-notify-sound]` + ns-card 样式注入；「设置 → 插件 → 提示音」卡片展开渲染 7 下拉 + 2 复选 + 8 按钮，下拉值 `["success","ding","","","","bell","alert"]`（= 用户原服务端配置，未被改动），文案已为「完成铃声（一次对话整回合结束）」；console 0 错误；host 路由 `/notify-sound/settings` 200 且回显 `defaultSound: success`（0.1.5-rc.1 旧槽 `settings.plugin.item` 与新槽并存无异常——`slots.inject` 对未声明槽只是等待、不抛错）。回滚：`tar -xzf /root/notify-sound-bak-pre-015-20260922_2245.tgz -C /root/.dsh/external`。📦 **已发布 npm `dsh-notify-sound@0.1.5`**（`npm publish --registry=https://registry.npmjs.org/`，账号 `npm-liqingfeng`，dist-tag `latest`；下载 registry tarball 校验：`skipCurrentJob` 0 命中、只剩 `job.status === 'failed'`、完成音文案已更新）。⚠️ **发布传播延迟经验**：registry 写入后约 5 分钟内 `npm view` 仍显示旧版本、`npm publish` 重试报 `E409 Cannot publish over previously staged version`、`npm stage publish` 报 `Cannot stage previously published version`、`GET /-/stage` 返回空——**均属暂态，勿据此反复发布或误判失败**；npm 另提示「bypass 2FA 的 GAT 正被限制用于直接发布」（见 https://gh.io/npm-gat-bypass2fa-deprecation），后续发布可能需改用 trusted publishing 或带 OTP 的流程。

### 2026-09-22 112 升级 dsh 0.1.6-alpha.2 → 0.1.7-alpha.1 + 实测 settings API 重构（第三方插件服务器同步降级）

- 变更内容：按用户指示把 112 升级到最新 alpha（npm `alpha` tag = `0.1.7-alpha.1`，而 `latest` 仍是 0.1.5-rc.2，故必须显式指定版本号安装）。① **备份**：`profiles/web/{package.json,pnpm-lock.yaml,cordis.patch.yml}`、`/root/.dsh/settings.yaml`、sessions 打包（均为 `*.bak-pre-017alpha1-20260922_180736`）；② **升级** `npm install -g @deepseek-ai/dsh@0.1.7-alpha.1`（npmmirror，20s，486 包变更）；③ **web-lan 补丁双重启自愈**：升级覆盖 `dsh-client-connection` → 首启 `REPAIRED` 写盘、二次重启 `PATCHED` 加载（`isLoopback: true`、`isLanAuthority` count=2）；④ **实测两处破坏性变更**：**(a)** `@deepseek-ai/dsh-settings` API 重构——移除 `SettingsProvider.register(ns,schema,options)` / `installSection(...)` 方法与 `installSettingsSection` / `settingsNamespace` 模块导出，改为 `configure(presentation, owner)` / `describe()` / `schema()`（`SettingsForms` 类）；**(b)** settings 存储从 `~/.dsh/settings.yaml` 迁到 profile 的 `cordis.patch.yml`（各插件 cordis 条目 config 下），官方 `importLegacyDocument()` 先把原文件重命名为 `settings.yaml.imported` 再逐段导入，**运行组合拒绝的段只留在 `.imported` 文件**。
- 涉及路径：112 `/usr/local/lib/node_modules/@deepseek-ai/dsh`、`/root/.dsh/profiles/web/{package.json,pnpm-lock.yaml,cordis.patch.yml}`（备份 `*.bak-pre-017alpha1-20260922_180736`）、`/root/.dsh/settings.yaml.bak-pre-017alpha1-20260922_180736`（8695B）、`/root/dsh-sessions-bak-pre-017alpha1-20260922_180736.tgz`、`/root/.dsh/settings.yaml.imported`（官方迁移产物，含 theme-center 段）；本目录无文件变更
- 备注：**升级与回归全过**——服务 active、`dsh --profile web --dump-config` exit 0、**插件 7/7 `1 total · 1 running`**、LAN 免 token 303+Set-Cookie、`/modsearch/config` 200、**模型端到端调用成功**（UI 发消息 1s 回复「正常」，9.8K tok，模型选择器显示 DeepSeek V4 Flash）、provider 迁移完整（ark + commandcode 均在）。⚠️ **第三方插件服务器同步降级**（0.1.7 起）：**theme-center v0.5.7** 插件与设置卡正常、皮肤试穿/退出零残留实测通过，但同步行显示「服务器配置不可用，仅本机生效」（`/theme-center/settings` 返回 404 JSON `namespace is not available`）→ 配置仅存浏览器 localStorage；**notify-sound v0.1.4** 插件 running、提示音按默认配置播放，但卡片显示「无法读取服务端配置（settings 服务不可用）…卡片暂不可编辑」（0 下拉 0 复选）；**modsearch** settings namespace 注册失败（`scope.settings.register is not a function`，0.1.6 起既有问题），工具与 `/modsearch/config` 正常；dshmarket / find-plugin / global-rules / web-lan 无降级。**根因**：两插件 host 端调用 `sctx.settings.installSection(...)`，0.1.7 已无此方法；因调用位于 `ctx.inject` 回调内，异常被框架吞掉、日志无痕（仅表现为命名空间缺失 + 路由 404）。**用户配置未丢失**：theme-center 段（theme/scrim 35/focus 100/textScale 100 等 12 字段）完整保留在 `settings.yaml.imported`。⚠️ 两个插件的 settings 新 API 适配**待用户确认后进行**；111 仍在旧版（0.1.5-rc.1），升级需另行确认。

### 2026-09-10 111 升级 dsh 0.1.5-rc.1 后 web-lan 补丁丢失修复（局域网「设置不可用 / 插件配置空白」）

- 变更内容：111 升级 dsh 到 0.1.5-rc.1（23:04 全局重装覆盖 `dsh-client-connection` 包）后，局域网访问报「加载提供方目录失败: settings are unavailable in this browser」、插件配置 TAB 空白。**根因**：web-lan 的文件级补丁被升级覆盖丢失（`lib/client.js` 的 isLoopback 恢复官方表达式、`lib/index.js` 无 `isLanAuthority`），浏览器端 `ctx.remote.$host.isLoopback` 为 false → 官方 `dsh-client-ui-settings` 的 `SettingsDescribeMirror` 取 `persistence: "memory"`（`lib/client.js:1345`）→ `mirrored.view === void 0` → 报错（`ui-settings-models/lib/client.js:1006`），非 loopback 页面所有设置面（模型/插件配置）一并失效。**修复**：① 热补丁 `dsh-client-connection/lib/client.js`（`isLoopback: true`）——0.1.5-rc.1 的 `dsh-client-hmr` 默认挂载并对全部 client bundle 做 500ms stat 轮询，改文件即热重组，**无需重启即生效**；② 预补 host 半区 `lib/index.js`（局域网来源自动种 cookie 免 token）；③ 从本仓库复制 `web-lan/`（v2.3.0）到 `/root/.dsh/external/web-lan` 并 `dsh plugin --profile web add link:...` 装回 profile（`dsh.profile.bundles` 自动追加），以恢复 dsh 升级后的补丁自愈能力。
- 涉及路径：111 `/usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-client-connection/lib/{client.js,index.js}`（备份 `*.bak-pre-weblan-20260910_2333*`）、`/root/.dsh/external/web-lan`、`/root/.dsh/profiles/web/{package.json,pnpm-lock.yaml,cordis.patch.yml}`（备份 `*.bak-pre-weblan-reinstall-20260910_233408`）
- 备注：**热补丁已实测通过**——局域网（192.168.31.111:3080，token URL）「设置→模型」渲染 4 个提供方、「插件配置」渲染 8 张卡，浏览器 console 0 错误 0 警告；`dsh --profile web --dump-config` 退出 0（仍单行 `webserver 0.0.0.0:3080` + 新增 web-lan 行，无重复冲突）；web-lan 单测 10/10 PASS；新表达式正则 `/isLoopback:\s*[^,]+/` 与 `authorizeIndex` 目标行均已空跑校验命中。⚠️ **待重启 111 `dsh-web.service` 使 host 免 token 补丁生效**（该补丁为启动时加载，已在磁盘预打，**只需重启一次**，无需历史「双重启」）；重启后验证无 token 访问 `http://192.168.31.111:3080/` 应 303+Set-Cookie。回滚：cp 回两处 `*.bak-pre-weblan-*` + `dsh plugin --profile web remove @npm-liqingfeng/dsh-web-lan` + 重启。

### 2026-09-10 归档 5 条旧记录至 CHANGELOG.md

- 变更内容：变更记录超 5 条，将最旧的 4 条（111 升级 alpha.3、112 升级 alpha.3、theme-center 屏蔽聊天宽度、112 安装 knowledge-base skill）移至 `CHANGELOG.md`（按原格式、时间倒序）；后续追加 web-lan 补丁修复记录后再次超限，再将最旧的 1 条（theme-center v0.5.6 发布 npm）移入 `CHANGELOG.md`；归档动作不计数
- 涉及路径：`AGENTS.md`、`CHANGELOG.md`
- 备注：AGENTS.md 保留最新 5 条历史记录

</details>

---

- 本目录下的**每一次变更**（新建/修改/删除文件夹、文件、配置等）都必须记录到本节。
- 记录格式如下，按时间倒序追加（最新记录在最上面）：

```markdown
### YYYY-MM-DD 变更描述（一句话标题）

- 变更内容：具体做了什么
- 涉及路径：涉及的文件/文件夹
- 备注：其他需要说明的信息（可选）
```

### 归档机制（防止本文件无限膨胀）

- AGENTS.md 会被作为工作区指令**完整注入每个会话的上下文**，体积必须控制。
- 当变更记录条数 **超过 5 条** 时，Agent 应执行归档：将最早的历史记录（保留最新 5 条）移动到同目录的 `CHANGELOG.md`（按原格式、时间倒序存放），并在本节顶部注明"更早记录见 `CHANGELOG.md`"。
- `CHANGELOG.md` 仅作历史存档，不会被注入会话上下文；归档动作本身在 AGENTS.md 中记录一条即可。

## 五、其他规则

- 修改现有代码前，先阅读相关文件夹内的说明文档和现有代码，理解后再动手。
- 不在未询问用户的情况下删除、移动或重命名已有文件夹/文件（`AGENTS.md` 本身除外）。
- **敏感信息安全**：API key、token、密码、凭证等不得硬编码进代码、文档或配置（含本文件）；需要持久保存时放入个人知识库或环境变量。
- **服务重启前处理**：111 上 dsh web 为 systemd 服务 `dsh-web.service`（`Restart=on-failure`，崩溃自动拉起）；112 上同为 systemd 服务 `dsh-web.service`（`Restart=on-failure`，开机自启；`WorkingDirectory=/root`，日志 `/root/dsh-web.log`），可用 `/root/restart-dsh.sh` 重启（现为 `systemctl restart dsh-web`）。重启服务前先收尾：① 收集/终止后台任务与子代理；② 未完成目标如需继续，用 goal 记录。**重启时无需专门提交 git 变更**。
- **前端自动重连机制（已在 112 实测验证 PASS）**：DSH Web 前端内置自动重连——断线后指数退避无限重试（`dsh-client-connection`：500ms 起、10s 封顶，`while (running)` 无次数上限）；重连成功后 `dsh-client-runtime` 的 `onConnected` 触发 sessions/workspaces 重新同步与 `resync()` 重建会话内容（数据来自服务端持久化的 `/root/.dsh/sessions`）。**实测**（2026-08-15，112）：kill 服务后页面 console 出现 `connection lost, retry #1→#3`，端口 3s 恢复后自动重连、API 同步恢复，全程无需刷新浏览器。注意：页面标签页被浏览器冻结时重连暂停，切回标签页即恢复。
- **语言约定**：功能文件夹内的文档（README 等）与代码注释默认使用中文。
- **`AGENTS.md` 的更新由 Agent 自行决定，无需询问用户**：包括新增/修改/删除规则、调整结构、修订内容等；但每次更新仍必须在"四、变更记录"中追加一条记录。
- 本文件本身的内容更新（如约定变更）也属于变更记录，需同步记录。
- 如果本文件与用户口头指示冲突，以用户最新指示为准，并更新本文件保持一致。

## 六、官方文档索引（参考资料）

本目录开发基于 DSH（DeepSeek Harness），官方文档位于 [deepseek-ai/DeepSeek-Harness](https://github.com/deepseek-ai/DeepSeek-Harness) 仓库的 `docs/` 目录，中英双语。开发前如需查阅规范，优先使用以下文档：

> 💡 **本地查阅**：官方源码已在 `upstream/DeepSeek-Harness/` 建立本地镜像（见第二节「官方上游源码」），需要看具体实现/决策笔记时直接读本地文件（如 `packages/` 源码、`.agents/notes/` 决策记录、`docs/` 中英文档），不必依赖网络；需要更新时在该目录 `git pull`。

**开发基础（入门必读）**
- [第一个插件](https://github.com/deepseek-ai/DeepSeek-Harness/blob/master/docs/user/develop/basic/index.zh.md)：插件本质、三种形态（函数/对象/类）、inject 依赖、自动清理
- [开发一个工具](https://github.com/deepseek-ai/DeepSeek-Harness/blob/master/docs/user/develop/basic/tool.zh.md)：工具定义 DSL
- [插件配置](https://github.com/deepseek-ai/DeepSeek-Harness/blob/master/docs/user/develop/basic/config.zh.md)
- [插件发布](https://github.com/deepseek-ai/DeepSeek-Harness/blob/master/docs/user/develop/basic/publish.zh.md)

**框架层**
- [插件与生命周期](https://github.com/deepseek-ai/DeepSeek-Harness/blob/master/docs/user/develop/framework/index.zh.md)：Fiber 状态机（PENDING → LOADING → ACTIVE/FAILED → UNLOADING → DISPOSED）
- [服务与依赖](https://github.com/deepseek-ai/DeepSeek-Harness/blob/master/docs/user/develop/framework/service.zh.md)
- [事件](https://github.com/deepseek-ai/DeepSeek-Harness/blob/master/docs/user/develop/framework/events.zh.md)

**底层框架（Cordis）**
- [Cordis 入门](https://github.com/deepseek-ai/DeepSeek-Harness/blob/master/docs/cordis-primer.zh.md)
- [Cordis 教程](https://github.com/deepseek-ai/DeepSeek-Harness/blob/master/docs/cordis-tutorial/index.md)：01 第一个插件 / 02 生命周期与副作用 / 03 服务 / 04 事件

**实践食谱（Cookbook）**：`docs/cookbook/`（adding-a-tool、adding-a-package、adding-an-llm-adapter 等）

**核心规范要点**
- 插件 = 导出 `apply(ctx)` 的模块，三种形态：函数 / 对象 / 类（类形式用于向其他插件提供服务）
- 依赖用 `inject` 声明，框架保证依赖就绪后才加载；依赖消失会自动卸载重载
- 一切注册自动清理（事件、工具、定时器）；自定义资源用 `ctx.effect()` 返回 disposer
- 通过 `cordis.yml` 注册插件（`- insert` 或 `- plugin` 行），作为 patch 层叠加；插件路径必须是绝对路径
- 本环境内开发动态插件/编辑组合时，遵循会话内置技能 `cordis-plugin-development` 与 `editing-cordis-compositions`

**插件包标准结构（参照社区实战落地，官方 publish 规范的实践形态）**
- `package.json` 声明 `dsh.bundle.patch` → `cordis.patch.yml`（安装时自动插入插件行）
- 用 tsdown 自包含构建 `lib/`（host 入口 + client bundle），无项目引用、无类型检查
- 构建时 `@deepseek-ai/dsh-*` 一律作 external（未发布到 npm，运行时由宿主模块表提供）
- devDependencies 只用真实发布版本（tsdown / cordis / vitest 等）

**皮肤/UI 插件开发契约**
- 纯呈现层：不注入服务、不发 Cordis 事件、不触及模型请求
- **主题适配（必须）**：插件 UI 样式**必须使用官方皮肤令牌**（`--dsw-alias-*`，如 border-l2/bg-layer-3/label-primary 等）或主题插件提供的皮肤变量，**不得硬编码颜色/背景/边框数值**——保证 theme-center 切换主题（10 款皮肤 + 官方亮/暗）时插件界面自动跟随；个别皮肤缺失令牌时按 right-panel/notify-sound 先例补皮肤限定适配层（选择器限定 `body[data-dsh-<skin>]` 补丁，fallback 引用皮肤自身变量），不得全局覆盖
- 样式全部挂在 `body[data-dsh-<name>]` 属性下，暗色变体用 `body[data-dsh-<name>][data-ds-dark-theme]`；不得用裸类名/全局选择器污染其他皮肤与官方 UI
- 所有写入（body 属性、注入的 DOM、favicon、document.title）必须在 `ctx.effect()` 的 disposer 里**全部收回**（标题仅在仍是自己设置时才还原）
- 不携带静态资源文件：内联 SVG / data URI

**插件测试**
- apply 契约测试（vitest + jsdom）：至少断言 body 属性设置/收回、DOM 注入/收回、标题固定/还原成对出现

## 七、Git 版本管理约定

- 本目录使用 git 管理（默认分支 `main`，本地提交；仓库级身份已配置 `LQFHUB` / 15809601162@163.com）。
- **远程仓库同步（降低推送频率）**：`origin` = https://github.com/LQFHUB/dsh-plugin.git；本地每次变更照常提交，但**不必每次提交都推送**——统一在**每个功能开发完成（满足"第三节第 5 点 DoD"）后推送一次**；AGENTS.md 等文档类小变更可随功能批次一起推送；推送时 `git push` 会把全部累积提交一次性推上去。
- 认证：GitHub token 存于本地凭据存储 `/root/.git-credentials`（0600 权限，不入库、不写进任何代码/文档）；token 失效时提示用户更新。
- **每个功能/变更一次提交**：功能开发完成且满足"第三节第 5 点 DoD"后提交；AGENTS.md 的更新可与同批变更一起提交。
- 提交信息格式：`<type>: <描述>`，type 取值 `feat`（新功能）/ `fix`（修复）/ `docs`（文档）/ `chore`（杂项、基础设施）。
- 提交前检查 `git status`，无意外文件（如 IDE 配置、构建产物——已由 `.gitignore` 忽略）。
- 敏感信息（见"第五节"）一律不得提交。
