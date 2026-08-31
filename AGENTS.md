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
### 2026-08-31 web-lan v2.0 精简重构：适配 alpha.2 官方原生局域网能力（去掉 apiProxy relay，isLoopback 重写改文件）

- 变更内容：官方 alpha.2 已原生覆盖局域网访问的绝大部分（webserver 0.0.0.0 + trustedHosts 放行特权 API + token 认证），且 `dsh-host-apiproxy` 在 alpha 系列已移除。重构 web-lan v1.0→v2.0：**去掉** apiProxy 特权 API relay（15 方法转发、makeRelay、toFetchHandler import、inject apiProxy——该能力官方原生覆盖且旧依赖已不存在）；**保留** randomUUID polyfill；**改造** isLoopback 重写为直接修改安装的 dsh-client-connection 包 client.js（官方 client-modules 的 serveBundle 从磁盘文件构建响应，改文件即改响应；apply 幂等执行，dsh 升级覆盖后重启自动恢复）。验证：node --test 6/6 PASS；112 部署 + 重启后局域网（非 loopback）访问 Settings→Plugins，主题 / 提示音 / 图像理解等配置卡正常渲染（isLoopback 重写生效、settings describe 走 host 模式）。
- 涉及路径：`web-lan/lib/index.js`、`web-lan/test/index.test.js`、`web-lan/package.json`、`web-lan/README.md`、`AGENTS.md`
- 备注：112 已部署 v2.0 验证通过（部署时先执行 patchClientJsFile 再重启一次到位）；外部插件 better-sidebar/dshmarket 仍临时停用（alpha.2 不兼容）
### 2026-08-31 112 升级 dsh v0.1.2-alpha.2 + 移除 web-lan/navbar + 官方局域网访问

- 变更内容：按用户目标在 112（验证机）升级 dsh 0.1.1-rc.2 → 0.1.2-alpha.2（npm install -g @deepseek-ai/dsh@alpha，npmmirror 已同步）。**移除 dsh-web-lan 与 navbar 插件**（package.json dependencies + dsh.profile.bundles + node_modules 目录）。局域网访问改用**官方原生机制**：cordis.patch.yml 配置 webserver host:0.0.0.0 + 官方 runtime 自动推导 LAN IP 信任（替代 web-lan 的 apiProxy relay，特权 API 不再 403）；认证走官方 token（每次启动随机 launch token + 30 天签名 cookie，首次 `?token=` 访问后免 token）。外部插件 dsh-better-sidebar/dshmarket 因用被移除的 settingsNamespace/installSettingsSection 加载失败，已临时移出 bundles（node_modules 保留待上游适配）。
- 涉及路径：112 `/usr/local/lib/node_modules/@deepseek-ai/dsh`、`/root/.dsh/profiles/web/{package.json,cordis.patch.yml,node_modules}`、`/root/dsh-web.log`
- 备注：服务 active + 0.0.0.0:3080 监听；局域网从 111 访问页面/会话/工具正常；自研插件 + global-rules 在 Global plugins 全部 Enabled+Running；**局域网下插件配置卡不渲染属官方 isLoopback 设计**（非本机 settings describe 走 memory/unavailable），web-lan 的 isLoopback 重写即绕此限制

### 2026-08-31 theme-center 迁移 alpha.2（settings API + data-actions-reveal）

- 变更内容：alpha.2 移除 dsh-settings 顶层导出 settingsNamespace/installSettingsSection（改 SettingsProvider.installSection），且官方 DOM 锚点 data-time-hover-root 改名 data-actions-reveal。迁移 theme-center：① lib/index.js 删除 import、`settings.replace(settingsNamespace(...))` → `settings.replace(SETTINGS_NAMESPACE,...)`、installSettingsSection → `ctx.inject(['settings'])` 内 `sctx.settings.installSection(...)`（保留 try/catch 语义）；② lib/client.js 两处 `[data-time-hover-root]` 选择器改双名兼容（`[data-actions-reveal], [data-time-hover-root]`，userKindsSel 逗号连接）。验证：node --check 两文件 + smoke.mjs PASS + grep 无残留。
- 涉及路径：`theme-center/lib/{index,client}.js`、`AGENTS.md`
- 备注：已部署 112 并验证（Global plugins Enabled+Running、/theme-center/settings 200、皮肤 bundle 加载）

### 2026-08-31 describe-image 迁移 alpha.2（settings API + client store 依赖修正）

- 变更内容：① host 端 settings API 迁移（settingsNamespace/installSettingsSection → installSection + 字符串命名空间，config-resolve.ts/settings-routes.ts/index.ts）；② client 端修复 alpha.2 模块表缺失依赖：`@deepseek-ai/dsh-client-runtime`（rc 时代包名，alpha 已废）→ 运行时实际只用 `createSnapshotStore`，改从 `@deepseek-ai/dsh-client-store`（alpha.2 模块表种子词）导入，tsdown CLIENT_EXTERNALS 与 package.json dsh.client.inject 同步替换。验证：tsdown build 成功、lib/client.js 无 dsh-client-runtime require、112 部署后 console 0 错误 + describe_image 工具被 agent 正常调用（配置解析/错误报告正确）。
- 涉及路径：`describe-image/src/{config-resolve,settings-routes,index}.ts`、`describe-image/src/client/settings-form.ts`、`describe-image/tsdown.config.ts`、`describe-image/package.json`、`describe-image/lib/`、`AGENTS.md`
- 备注：describe_image 成功调用需有效视觉端点配置（112 当前 configuredProvider=opencode-go 无 baseURL、VISION_API_KEY 未设，属配置层待完善）

### 2026-08-29 notify-sound 迁移 dsh-settings v0.1.2-alpha.2 API（installSettingsSection/settingsNamespace 移除 → SettingsProvider.installSection）

- 变更内容：官方 dsh v0.1.2-alpha.2 的 `@deepseek-ai/dsh-settings` 移除了顶层导出 `settingsNamespace()` 与 `installSettingsSection()`，改为 SettingsProvider 实例方法 `installSection(owner, ns, schema, entry, hooks)`。迁移 notify-sound 宿主半区：① 删除 `import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'`（该文件不再用 dsh-settings 任何导出，整行删）；② `settings.replace(settingsNamespace(SETTINGS_NAMESPACE), ...)` → `settings.replace(SETTINGS_NAMESPACE, ...)`；③ `installSettingsSection(ctx, ...)` → 包进 `ctx.inject(['settings'], sctx => sctx.settings.installSection(ctx, SETTINGS_NAMESPACE, Config, config, hooks))`（原无 try/catch，直接执行语义保留）；同步更新 test-host.mjs 假件（fake settings 用 `installSection` 替代旧 `register`）、README.md 配置存储说明。验证：node --check 两文件通过、test-host/test-client 全 PASS、grep 无残留
- 涉及路径：`notify-sound/lib/index.js`、`notify-sound/tests/test-host.mjs`、`notify-sound/README.md`、`AGENTS.md`
- 备注：apply 内 registerSettingsRoute 未受影响；test-host 假件现用 installSection 记录命名空间注册（断言不变）
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
