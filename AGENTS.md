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
<summary>📜 变更记录（共 5 条，点击展开，最新在最上面；更早记录见 `CHANGELOG.md`）</summary>
### 2026-08-29 theme-center v0.5.5：聊天区精简压制增强（摘要/来源补字号压制 + 全部标题淡化 + 更紧凑），用户反馈 100% 仍不够

- 变更内容：用户反馈聊天区精简压制调到 100% 仍不够。实测 100%：工具卡摘要/上下文来源**字号未压**（仍 14px/24px）、工具卡/上下文标题未淡化（opacity 1）。`focusCss` 增强：摘要/来源改用独立 `SUMMARY` 模板（14→11px/行高 24→16px/透明度→0.4，此前只压透明度）、`TITLE` 模板加淡化（→0.55）并更紧凑（14→11.5px/16px）、图标→10px、Cordis 行→18px；0% 仍与官方完全一致（插值不变量）。版本 0.5.4→0.5.5
- 涉及路径：`theme-center/lib/client.js`（focusCss）、`theme-center/tests/smoke.mjs`、`theme-center/package.json`、`theme-center/AGENTS.md`（4.6 + §6 + 变更记录）、`AGENTS.md`
- 备注：本机 GUI 实测 100%：Think/工具/上下文标题 11.5px/16px/0.55、摘要与来源 11px/16px/0.4；**112 已部署验证通过**（新版 TITLE/SUMMARY 规则命中、服务 active）；111 待部署 + npm 待发布；本次一并归档 1 条旧记录（v0.5.0 玻璃拟态）至 CHANGELOG.md（保留 5 条）

### 2026-08-29 theme-center v0.5.4：表格收缩适配内容（fit-content + 解除列宽上下限），消除"内容少却强制很宽、大量空白"

- 变更内容：用户反馈"很少的内容却强制很宽的表格、大量空白"。根因：官方 td/th min-width:100px 按列数硬撑列宽（6 列表格 776px、"开发量"列内容仅 19px 却占 132px）；v0.5.2 表格列宽模块只解除 max-width 未解除 min-width。修复：TABLE_CSS 改 `width:fit-content !important` + `td/th min-width:0`——列宽完全由内容决定：内容少表格收缩无空白、内容多 clamp 到容器不超宽（同时解决上轮 6 列表格溢出 264px 问题）。版本 0.5.3→0.5.4
- 涉及路径：`theme-center/lib/client.js`（TABLE_CSS）、`theme-center/tests/smoke.mjs`、`theme-center/package.json`、`theme-center/AGENTS.md`（4.7 + §6 + 变更记录）、`AGENTS.md`
- 备注：本机 GUI 实测（Playwright 注入）：1280px 视口 6 列表格 928→811/707px、5 列→636px、3 列→566/718px（列 47~131px 紧凑无空白）、内容最多的社区方案表仍占满合理；640px 窄视口 512px 内不溢出；`width:auto` 无效（均分占满）而 `fit-content`/`max-content` 有效；官方 md-table-wide hover 滚动不受影响；`fit-content` 需 Chrome 111+；**112/111 待部署验证**（按流程 112 验证后询问再部署 111）；部署环境本机存在 `theme-center/lib/skins/codex.js`、`lib/meta/codex.json`、根 `CHANGELOG.md` 权限被改 000（既有未提交异常，git 记录 100755/100644/100644），已 chmod 恢复 codex 两个

### 2026-08-29 新增 upstream/：官方 DeepSeek-Harness 源码本地镜像（完整历史部分克隆，可直接看官方变更记录）

- 变更内容：按用户要求将官方仓库 [deepseek-ai/DeepSeek-Harness](https://github.com/deepseek-ai/DeepSeek-Harness) 拉到本目录 `upstream/DeepSeek-Harness/`，作为**只读参考**（开发/排查时本地直接看官方源码、`docs/`、`.agents/notes/`，不依赖网络）。**克隆方式**：`--filter=blob:none`（部分克隆，blob 按需拉取，**完整保留全部提交历史 14226 条，可直接 `git log` 看官方变更记录**）+ `--single-branch --branch master`，规避网络不稳导致的 `premature end of pack file`；当前 HEAD `cd5ef8148`（对应 v0.1.2-alpha.1 发布）；工作区 8953 文件、约 133MB、`git fsck` 通过。**更新方法**：在该目录 `git pull`（按需拉 blob，不稳时加 `-c index.threads=1` 重试）。**纳入约定**：`.gitignore` 忽略 `upstream/`（不误提交进插件仓库）；AGENTS.md 第二节新增「官方上游源码（只读参考）」小节、第六节补充本地源码查阅指引。
- 涉及路径：`upstream/DeepSeek-Harness/`（新建，独立 git 仓库）、`.gitignore`、`AGENTS.md`
- 备注：目录所有权处理——嵌套仓库 git 命令报 `dubious ownership`，用 `git -c safe.directory=<绝对路径>` 或 `GIT_CONFIG_*` 环境变量注入，勿写全局配置；部分克隆初始 `--no-checkout` 后需 `git reset --hard HEAD` 才落地工作区文件

### 2026-08-27 theme-center v0.5.2 + dsh-navbar v0.3.1：玻璃模式 navbar 位置错乱 + 渐变色不兼容修复

- 变更内容：玻璃开启后 navbar（对话节点导航条）位置错乱 + 渐变色不兼容。根因：navbar `sidebarOf()` 的 `left<=10` 在玻璃 sidebarCol margin:12px 下误匹配全宽 AppFrame→anchor 取全宽右缘被钳到对话流左；玻璃 body `background:` shorthand 重置皮肤渐变 background-image。修复：navbar 锚点 `left<=16`+`width<=420`（排除全宽，匹配 sidebarCol）；玻璃 body 背景改 `background-color:`（保留皮肤渐变）；theme-center 0.5.2 + navbar 0.3.1
- 涉及路径：`theme-center/lib/client.js`、`navbar/{src/client/index.ts,lib/client.js}`、`theme-center/package.json`、`navbar/package.json`、`AGENTS.md`
- 备注：112 实测玻璃 on 渐变背景保留、sidebarCol 右缘 268/分隔条 280 稳定；navbar 实际位置需用户浏览器确认；两包已发布 npm + 111 已同步


### 2026-08-27 theme-center v0.5.1：玻璃拟态修复（完整复用原项目 mica 模式达原效果 + 修设置面板锚定）

- 变更内容：用户反馈玻璃质感未达原项目效果 + 设置面板跑左侧边栏。修复：完整复用原项目 glass.module.css（618 行 mica/compat 双模式 + fade/corner）+ 默认 mica(float) 模式 + 原项目 sidebarCol:has(dialog) 规则解决设置面板锚定 + fade DOM + brightness 变量；版本 0.5.1
- 涉及路径：`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`、`theme-center/package.json`、`theme-center/AGENTS.md`、`AGENTS.md`
- 备注：112 mica 实测设置面板 x=399 正常、float 激活、无 JS 错；npm 0.5.1 已发布、111 已同步
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
