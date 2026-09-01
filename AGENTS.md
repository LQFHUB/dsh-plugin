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
<summary>📜 变更记录（共 6 条：5 条历史 + 1 条归档动作，点击展开，最新在最上面；更早记录见 `CHANGELOG.md`）</summary>
### 2026-09-01 theme-center v0.5.6 发布 npm（`@npm-liqingfeng/dsh-theme-center@0.5.6`）

- 变更内容：v0.5.6（屏蔽聊天宽度版）发布 npm。**踩坑：npm 账号开 2FA，普通 token 发布 403，需 publish 权限 + bypass 2FA 的 granular token**（前两个 token 无效，第三个有效）；本机默认 registry 为 npmmirror，发布显式 `--registry=https://registry.npmjs.org/`；NPM_TOKEN 已记入知识库 autu.md。describe-image/notify-sound 的 0.1.1 早已是 npm latest（本次核对确认无需再发）。
- 涉及路径：npm 包 `@npm-liqingfeng/dsh-theme-center@0.5.6`；知识库 `autu.md`；`~/.npmrc`（本目录仅 `theme-center/AGENTS.md` 记录变更）
- 备注：npmjs latest=0.5.6（npmmirror 镜像同步有延迟）；112 的 file: tarball 引用可保留不强制改回 npm
### 2026-09-01 111（正式机）升级 dsh 0.1.1-rc.2 → 0.1.2-alpha.3 + 插件全量升级（navbar 移除）

- 变更内容：111 按知识库升级指南跨 4 大版本升级（rc.2 → alpha.3，一次遇全部历史破坏性变更）。**关键踩坑：external link 插件在 alpha.3 无法解析宿主模块**——theme-center/notify-sound/describe-image 报 `Cannot find package '@deepseek-ai/schemastery'`（alpha.3 启动自动生成 `profiles/node_modules` 共享宿主模块，但 external 目录向上解析不经过它，导致 crash loop）。**解决**：`/root/.dsh/external/node_modules` → symlink 指向 `/root/.dsh/profiles/node_modules`，插件向上解析命中（4 个 external 插件静态加载测试通过）。升级内容：dsh `npm install -g @deepseek-ai/dsh@0.1.2-alpha.3`；external rsync 升级 theme-center 0.5.5→0.5.6、web-lan 1.0.0→2.2.1（scope `@user/`→`@npm-liqingfeng/`，package.json 依赖名+bundles 同步改）、describe-image 0.1.0→0.1.1、notify-sound 0.1.0→0.1.1；better-sidebar 0.17.1→0.18.0-alpha.0、dshmarket 1.36.0→1.38.1（pnpm install）；**navbar 移除**（external 目录 + 依赖 + bundles）。
- 涉及路径：111 `/root/.dsh/external/`（4 插件升级 + navbar 删除 + node_modules symlink）、`/root/.dsh/profiles/web/package.json`（备份 `package.json.bak-20260901_015604-before-alpha3`）、`/usr/local/lib/node_modules/@deepseek-ai/dsh`（本目录无文件变更）
- 备注：**回归全过**——服务 active/0 错误、插件 7 个（navbar 移除）、web-lan 免 token（无 token 303+Set-Cookie、带 cookie 200）、isLoopback 补丁落盘、mcp-client alpha.3（mcp-playwright patch 保留）、浏览器 console 0 错误、theme-center 宽度屏蔽保持（无「聊天宽度」节 + 官方 clamp 变量 + 23 款皮肤 + 双 Tab）、官方拖拽手柄在、better-sidebar 工作台、dshmarket v1.38.1（Installed 6）。⚠️ **`/root/.dsh/external/node_modules` symlink 勿删**（alpha.3 external 插件依赖它解析宿主模块）；web-lan scope 已变 `@npm-liqingfeng/`；重启两次后免认证生效（web-lan 补丁机制同 112）；rsync external 时用 `--exclude=node_modules/` 防把开发仓库 node_modules 带入
### 2026-09-01 归档 1 条旧记录至 CHANGELOG.md

- 变更内容：变更记录超 5 条，将最旧「2026-08-31 112 升级 dsh v0.1.2-alpha.2 + 移除 web-lan/navbar + 官方局域网访问」归档至 `CHANGELOG.md`（按原格式、时间倒序存放）；归档动作不计数
- 涉及路径：`AGENTS.md`、`CHANGELOG.md`
- 备注：AGENTS.md 保留最新 5 条历史记录
### 2026-09-01 112 升级 dsh 0.1.2-alpha.2 → 0.1.2-alpha.3 + 回归验证（含 web-lan 双重启要点）

- 变更内容：npm 最新 alpha.3（8/31）升级 112：`npm install -g @deepseek-ai/dsh@0.1.2-alpha.3`（524 依赖包更新）。**升级前 API 兼容性核对**（下载 alpha.2/alpha.3 逐项对比）：dsh-settings 导出（SettingsConflictError/SettingsProvider/redactSecrets）、dsh-client-ui-slots 导出（SlotCore 等）**完全一致**；官方拖拽宽度逻辑保留（`dsh.conversation.contentWidth` 3 处引用不变）；connection 的 `isLoopback` 表达式逐字一致（web-lan 补丁目标）；alpha.3 移除 SQLite Session 后端——112 未使用无影响。
- 涉及路径：112 `/usr/local/lib/node_modules/@deepseek-ai/dsh`、`/root/dsh-web.log`（本目录无文件变更）
- 备注：**⚠️ 升级后必须重启两次**（实测踩坑）：dsh 升级覆盖 connection 包 → 第一次重启 web-lan apply 把补丁写到磁盘但模块已加载（免认证仍 401）→ **第二次重启**模块才加载 patch 后文件（LAN 无 token 访问恢复 303+Set-Cookie、带 cookie 200）。**回归全过**：theme-center v0.5.6 宽度屏蔽保持（5 样式元素、官方 824px 拖拽值保留、手柄在）、better-sidebar/dshmarket/notify-sound/describe-image 正常、页面 console 0 错误
### 2026-09-01 theme-center v0.5.6 屏蔽聊天宽度（官方 alpha.1+ 拖拽调宽接管）+ 112 部署验证通过

- 变更内容：官方 v0.1.2-alpha.1+ 已提供会话流宽度拖拽调整（localStorage 本机）。theme-center 聊天宽度（6 档预设，覆盖 `--dsh-chat-content-width`）与官方并存冲突（实测 theme-center 在 `[data-conversation-scroll]` 的声明压制官方拖拽）。用户决策：屏蔽 theme-center 聊天宽度，官方拖拽接管、不影响官方功能。删 `theme-center/lib/client.js` 宽度模块（WIDTH_PRESETS/widthCss/setWidth 等 8 处关联）、服务端同步 width 处理；`lib/index.js` schema 保留 width（死字段）；smoke 更新（宽度断言改 doesNotMatch、样式元素 6→5）。版本 0.5.5→0.5.6
- 涉及路径：`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`、`theme-center/package.json`（0.5.6）、`theme-center/AGENTS.md`（4.4/4.6/§6 + 变更记录）、`AGENTS.md`
- 备注：**112 部署验证通过**（npm pack tarball + file: 引用 + pnpm install + 重启）——屏蔽后 scroll 上 `--dsh-chat-content-width` 回落官方 `clamp(680px,…)`、消息列宽 680px、样式元素 5 个、设置卡无「聊天宽度」节、console 0 错误；**官方拖拽实测可用**：680→824px、localStorage `dsh.conversation.contentWidth=824` 写入。⚠️ 112 上 theme-center/web-lan 现均为 file: 本地 tarball 引用（`/root/npm-liqingfeng-dsh-theme-center-0.5.6.tgz`、`/root/dsh-web-lan-2.2.0.tgz`），**勿删**；回滚：specifier 恢复 `^0.5.5` + pnpm install + 重启
### 2026-09-01 112 安装 knowledge-base skill（复制自 111，端到端验证通过）

- 变更内容：参考 111 的 `/root/.dsh/skills/knowledge-base/SKILL.md` 在 112 安装知识库 skill：`mkdir -p /root/.dsh/skills/knowledge-base` + scp 复制（md5 `dc0063e4…` 与 111 一致）。112 的 `/mnt/ug/share` 已挂载同一 NFS（192.168.31.200:/volume1/share，rw），知识库数据路径 `/mnt/ug/share/Obsidian/note1/OneNote/AI/PI/knowledge-base/` 直接可达，无需额外挂载。dsh-skill-filesystem 从 `$DSH_HOME/skills` 扫描（111/112 同机制）。重启 dsh-web 后在 112 新建会话让 agent 列技能，确认可见 `knowledge-base`（仅此一个，ui-ux-pro-max 未要求装）。
- 涉及路径：112 `/root/.dsh/skills/knowledge-base/SKILL.md`（本目录无文件变更）
- 备注：SKILL.md 权限 600（root 可读）；顺带归档「2026-08-31 web-lan v2.0」至 CHANGELOG.md（历史记录保持 5 条）
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
