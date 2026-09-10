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
<summary>📜 变更记录（共 7 条：5 条历史 + 2 条归档动作，点击展开，最新在最上面；更早记录见 `CHANGELOG.md`）</summary>

### 2026-09-10 111 升级 dsh 0.1.5-rc.1 后 web-lan 补丁丢失修复（局域网「设置不可用 / 插件配置空白」）

- 变更内容：111 升级 dsh 到 0.1.5-rc.1（23:04 全局重装覆盖 `dsh-client-connection` 包）后，局域网访问报「加载提供方目录失败: settings are unavailable in this browser」、插件配置 TAB 空白。**根因**：web-lan 的文件级补丁被升级覆盖丢失（`lib/client.js` 的 isLoopback 恢复官方表达式、`lib/index.js` 无 `isLanAuthority`），浏览器端 `ctx.remote.$host.isLoopback` 为 false → 官方 `dsh-client-ui-settings` 的 `SettingsDescribeMirror` 取 `persistence: "memory"`（`lib/client.js:1345`）→ `mirrored.view === void 0` → 报错（`ui-settings-models/lib/client.js:1006`），非 loopback 页面所有设置面（模型/插件配置）一并失效。**修复**：① 热补丁 `dsh-client-connection/lib/client.js`（`isLoopback: true`）——0.1.5-rc.1 的 `dsh-client-hmr` 默认挂载并对全部 client bundle 做 500ms stat 轮询，改文件即热重组，**无需重启即生效**；② 预补 host 半区 `lib/index.js`（局域网来源自动种 cookie 免 token）；③ 从本仓库复制 `web-lan/`（v2.3.0）到 `/root/.dsh/external/web-lan` 并 `dsh plugin --profile web add link:...` 装回 profile（`dsh.profile.bundles` 自动追加），以恢复 dsh 升级后的补丁自愈能力。
- 涉及路径：111 `/usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-client-connection/lib/{client.js,index.js}`（备份 `*.bak-pre-weblan-20260910_2333*`）、`/root/.dsh/external/web-lan`、`/root/.dsh/profiles/web/{package.json,pnpm-lock.yaml,cordis.patch.yml}`（备份 `*.bak-pre-weblan-reinstall-20260910_233408`）
- 备注：**热补丁已实测通过**——局域网（192.168.31.111:3080，token URL）「设置→模型」渲染 4 个提供方、「插件配置」渲染 8 张卡，浏览器 console 0 错误 0 警告；`dsh --profile web --dump-config` 退出 0（仍单行 `webserver 0.0.0.0:3080` + 新增 web-lan 行，无重复冲突）；web-lan 单测 10/10 PASS；新表达式正则 `/isLoopback:\s*[^,]+/` 与 `authorizeIndex` 目标行均已空跑校验命中。⚠️ **待重启 111 `dsh-web.service` 使 host 免 token 补丁生效**（该补丁为启动时加载，已在磁盘预打，**只需重启一次**，无需历史「双重启」）；重启后验证无 token 访问 `http://192.168.31.111:3080/` 应 303+Set-Cookie。回滚：cp 回两处 `*.bak-pre-weblan-*` + `dsh plugin --profile web remove @npm-liqingfeng/dsh-web-lan` + 重启。

### 2026-09-10 112 升级 dsh 0.1.2-rc.1 → 0.1.5-alpha.2 + 插件重排（卸 describe-image/better-sidebar、装 modsearch/find-plugin/web-lan）+ theme-center 实测通过

- 变更内容：按用户指示在 112 验证新版 dsh 与插件兼容性。① **升级** `npm install -g @deepseek-ai/dsh@0.1.5-alpha.2`（跨 0.1.3-alpha.1/2、0.1.5-alpha.1/2 共 4 个版本）；② **卸载** `dsh-describe-image`（实测 npm 最新 0.1.2 仍调用旧 `conversation.draftImages`/`releaseDraftImage`，新版改名 `resolveDraftAttachments`/`releaseDraftAttachment` 后钩子静默失效，无适配版）与 `dsh-better-sidebar` 0.18.0-alpha.0（与官方 0.1.5-alpha.1 新增右侧 Sidebar 功能重叠）；③ **安装** `@liustack/modsearch` fork（`link:/root/.dsh/external/modsearch` + `external/node_modules` symlink）、`dsh-find-plugin@0.3.7`、`@npm-liqingfeng/dsh-web-lan@2.3.0`（file: 本地 tarball）；④ 保留 theme-center/notify-sound/global-rules/dshmarket 并回归。web-lan 首次重启 REPAIRED 写盘、二次重启 PATCHED（沿用双重启机制）。
- 涉及路径：112 `/root/.dsh/profiles/web/{package.json,pnpm-lock.yaml,cordis.patch.yml}`（备份 `*.bak-pre-015alpha2-20260910_012420`）、`/root/dsh-sessions-bak-pre-015alpha2-20260910_012420.tgz`、`/root/.dsh/external/modsearch`、`/usr/local/lib/node_modules/@deepseek-ai/dsh`（本目录无文件变更）
- 备注：**验证全过**——服务 active、**插件 7/7 Enabled**（theme-center/notify-sound/global-rules/dshmarket/modsearch/find-plugin/web-lan）、浏览器 console 0 错误 0 警告；**theme-center 实测**：`body[data-dsh-harbor]` 皮肤生效、23 款皮肤卡片渲染、试穿切换 `data-dsh-blue-fantasy` 生效、刷新回落已应用皮肤、`settings.plugin.item`/`settings.section` 槽可用；8 个 `data-tc-glass-*` 接缝命中，仅 `data-tc-glass-details` 因官方移除 Detail 面板失效（纯视觉）；**modsearch**：设置卡渲染 + LAN Host `/modsearch/config` 200 + CLI 引擎实搜通过；**web-lan**：`isLoopback: true` 与 browser-auth 补丁落盘、LAN 无 token 可访问。静态 API 比对：`settings.plugin.item` 槽契约逐字一致、`uiSession.pendingInteractions`/client `sessions`/`registerSearchProvider`/`connection.trustedHosts` 均未变、`ctx.agent`/`Inbox`/persona 插件未使用。⚠️ 日志中 better-sidebar/dshmarket「旧 API 导入失败」为**历史记录**（0.18.0-alpha.0 与 1.39.0 实测 0 命中；systemd 今日仅 2 次启动、NRestarts=0）；peer 范围 `^0.1.2-rc.1` 按 semver 预发布规则不匹配 0.1.5-alpha.2（安装告警，非运行失败）；**会话格式 V2→V3 升级后不可降级读取**；111 升级前需另行验证 modsearch。

### 2026-09-10 归档 5 条旧记录至 CHANGELOG.md

- 变更内容：变更记录超 5 条，将最旧的 4 条（111 升级 alpha.3、112 升级 alpha.3、theme-center 屏蔽聊天宽度、112 安装 knowledge-base skill）移至 `CHANGELOG.md`（按原格式、时间倒序）；后续追加 web-lan 补丁修复记录后再次超限，再将最旧的 1 条（theme-center v0.5.6 发布 npm）移入 `CHANGELOG.md`；归档动作不计数
- 涉及路径：`AGENTS.md`、`CHANGELOG.md`
- 备注：AGENTS.md 保留最新 5 条历史记录
### 2026-09-06 notify-sound v0.1.3 修复「提问/审批/计划评审/目标受阻」提示音不响

- 变更内容：**根因**：浏览器端 `startWatcher` 从 `sessions.list` 快照读 `row.pendingInteraction`，但官方 `SessionSummary` 无此字段（权威数据源是 `ctx.uiSession.pendingInteractions`，kind ∈ approval/question/plan-review），故注意铃声从未触发；goal blocked 检测访问 `projectionValues.goal.phase` 也错两层（官方 `GoalProjection.goal.phase`），同样失效。**修复**：inject 增加 `uiSession`，新增订阅 `uiSession.pendingInteractions` 权威快照（按交互 key 判据：新出现/替换请求响铃、同 key 不重复、消失不响，白名单只处理三类）；goal 投影路径改为 `goal.goal.phase`（兼容 goal 为 null）。测试全 PASS（host 34 + client 47，新增 pending key 判据/清空/错误路径/goal null 用例）。版本 0.1.2 → 0.1.3
- 涉及路径：`notify-sound/{lib/client.js,tests/test-client.mjs,README.md,package.json}`
- 备注：**112 部署验证通过**（2026-09-06，npm pack tarball + file: 引用 + pnpm install + 重启）——真实 ask_user_question 弹提问卡片时探针捕获 ding 合成音（基频 698.46…与参数完全一致）、console 0 错误。**npm 已发布 0.1.3**（发布后下载 tarball 校验含新代码，latest=0.1.3）。⚠️ 112 上 notify-sound 现为 file: 本地 tarball 引用（`/root/dsh-notify-sound-0.1.3.tgz`），**勿删**（theme-center 先例：可保留不强制改回 npm）；回滚：specifier 恢复 `^0.1.2` + pnpm install + 重启。**111 部署待用户确认时机**（需重启 dsh-web，会中断 111 任务与本会话）
### 2026-09-06 modsearch 自维护 fork（设置卡 LAN 信任修复）+ 111 部署文件就绪

- 变更内容：用户安装 modsearch 5.10.1 后浏览器设置卡报 `request refused: this route answers same-origin loopback only`。根因：111 局域网 IP 访问（web 绑定 `0.0.0.0:3080`），而 modsearch 卡片路由 `/modsearch/config` 用独立 fence 只认 loopback Host（上游 main 同样未修）。按用户指示**拉上游源码自维护**：新增 `modsearch/` fork 文件夹，修复 `dsh/index.js`（① 卡片路由 scoped inject 由 `['webServer']` 改为 `['webServer','connection']`；② 新增 `isTrustedAuthorityHost()` 复刻官方 `client-connection` 的 trustedHosts 匹配；③ `isTrustedRequest(req, trustedHosts)` 接受官方 `connection.trustedHosts`——含从 all-interface bind 推导的 LAN IP，与 `/api` fence 对齐；`sec-fetch-site`/`origin` 同源检查保留）；同步更新 `src/dshPlugin.test.ts`（注入断言 + 新增 LAN 放行/拒止用例，**40/40 通过**）；`pnpm-workspace.yaml` 放行 esbuild（pnpm 11 构建必需）；写 `FORK.md`（差异/构建/部署/升级跟随）。111 部署文件就绪：rsync 到 `/root/.dsh/external/modsearch`（含构建好的 dist），web profile `package.json` modsearch 改 `link:/root/.dsh/external/modsearch` + `pnpm install`（package.json/lockfile 已备份）。
- 涉及路径：`modsearch/`（新 fork 文件夹）；111 `/root/.dsh/external/modsearch`、`/root/.dsh/profiles/web/{package.json,pnpm-lock.yaml}`（备份 `*.bak-pre-modsearch-fork-*`）；`AGENTS.md`
- 备注：**待重启 111 dsh-web 生效**（会中断会话与 111 其他任务，由用户择机确认）；重启后验证 `curl -s -o /dev/null -w "%{http_code}" -H "Host: 192.168.31.111:3080" http://127.0.0.1:3080/modsearch/config` 应 200；升级上游后需按 `FORK.md` 重打补丁；`web_search`/`x_search`/`read_page` 工具走 CLI 不受影响（已实测）
### 2026-09-01 dsh-describe-image / dsh-notify-sound v0.1.2 发布 npm（迁移 alpha.2 API 版）

- 变更内容：**发现 npm 上的 0.1.1 是 8/17 旧代码**（顶层静态 `import { installSettingsSection, settingsNamespace }`，alpha.3 下直接 SyntaxError 加载失败）——本地 8/31 迁移到 `SettingsProvider.installSection` 但未重新发布、版本号未升，此前误判"已发布"。修正：升 **0.1.2** 重新发布（npmjs latest=0.1.2，tarball 校验旧 API=0 / installSection=1）；notify-sound 测试全 PASS；describe-image vitest 45 失败均为测试 mock 基建问题（`CallId is not a function`），**无 lib 逻辑断言失败**（lib 已在 111/112 alpha.3 实测运行正常）。
- 涉及路径：`describe-image/{package.json,lib}`、`notify-sound/{package.json,lib}`；知识库升级指南（第 5/6 点：版本号 + 「判断 npm 是否已发布不能只比版本号」教训）
- 备注：npmjs latest 均为 0.1.2（npmmirror 同步有延迟）；111/112 部署用的旧 0.1.1 代码（rsync/tarball 迁移版）不受影响；以后**本地改代码必须升版本号再发布**
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
