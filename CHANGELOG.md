# CHANGELOG — 变更记录归档

> AGENTS.md「四、变更记录」超过 5 条后的归档存放处（按原格式、时间倒序）。最新记录始终在 AGENTS.md。

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

### 2026-08-27 theme-center v0.5.0：集成 dsh-catppuccin-theme 玻璃拟态（可开关玻璃质感增强层）

- 变更内容：按用户要求集成 NoNameLeGo/dsh-catppuccin-theme（MIT）的玻璃拟态到 theme-center（插件>主题>外观）。新增**玻璃质感增强层**：color-mix 从皮肤令牌派生四要素（半透明+边框 rim+白顶高光 edge+投影 drop+blur）自动跟随 24 款皮肤、接缝 stamping、html data-tc-glass 门控+blur/frost 滑杆、默认关、服务器同步三字段、外观 Tab「玻璃质感」节；版本 0.5.0
- 涉及路径：`theme-center/lib/{client,index}.js`、`theme-center/tests/smoke.mjs`、`theme-center/package.json`、`theme-center/AGENTS.md`、`AGENTS.md`
- 备注：112/111 双机部署 0.5.0 + 实测四要素生效（header 半透明 color-mix+blur14px+白顶高光+rim）、关闭零残留；npm 0.5.0 已发布

### 2026-08-26 将 112 的 dsh web 配置为 systemd 服务 dsh-web.service 并开机自启（参考 111）

- 变更内容：按用户指示参考 111 的 dsh-web.service，为 112（AI-2/ubuntu-112）新增 systemd 服务 `/etc/systemd/system/dsh-web.service`（`Type=simple`、`WorkingDirectory=/root`、`ExecStart=/usr/local/bin/dsh web`、`Restart=on-failure`、`RestartSec=5`、`StandardOutput/Error=append:/root/dsh-web.log`）；凭据走 `.credentials.yaml`，unit 不硬编码 Key；`systemctl enable --now` 设开机自启并启动（`multi-user.target.wants/dsh-web.service`）；原 setsid 手动进程已停；`/root/restart-dsh.sh` 改为 `systemctl restart dsh-web` 防双进程冲突。
- 涉及路径：112 `/etc/systemd/system/dsh-web.service`、`/root/restart-dsh.sh`、`AGENTS.md`（服务重启前处理说明同步更新）
- 备注：验证通过——服务 `enabled`+`active(running)`（Main PID node）、HTTP 200、`/root/dsh-web.log` 正常追加；sensenova 思考等级（reasoningEfforts）等 settings 配置不受影响、全部保留；同 111 开机自动拉起。

### 2026-08-21 修复 Win 离线包“新建会话 unscoped context”：根因=profile 树混入 @deepseek-ai 副本致 dsh-scope 双份 Symbol；重打 169MB 包并本机完整复现验证

- 变更内容：用户内网机器（WIN10，win-x64 离线包）新建会话报 `agent-presets: refusing to compose an unscoped context`。**排查过程**：①配置全对（settings.describe 显示 gateway provider/agent-default-model 已加载）；②scope 诊断脚本（cordis Context+createScope+scopeOf）机制正常；③111 上最小 profile 复现成功、**用户 zip 完整 profile 复现失败**（同错误）；④二分后**连最小 profile 也失败** → 触发点与插件无关；⑤对照 repro2（成功）vs repro3（失败）目录差异 → **zip 的 `profiles/web/node_modules/@deepseek-ai/` 存在整套 dsh 核心包副本**（14MB：cordis/dsh-scope/dsh-agent-presets/dsh-host-apiproxy/dsh-session 等几十个，打包时装 better-sidebar 依赖时 npm 提升进 profile 树）；111 生产该目录为空（依赖走全局）。**机制**：dsh-scope 被加载两份 → `Symbol("dsh.scope")` 跨实例不相等 → createScope 写 tag、scopeOf 读不到 → unscoped context。**修复**：删除 `profiles/web/node_modules/@deepseek-ai`（插件运行时依赖向上解析到 profiles/node_modules 的 heal 链接/全局树，单份模块）；111 上删副本后最小+完整 8-bundle profile 三种 payload（空/cwd/workspaceId）session.create **全部 ok=True**。**重打**：win-x64 包 169MB（sha `58805c14…`，CRC/48629 清单全过），README 增排错条目（含旧包一键修复命令 `rmdir /s /q ...\profiles\web\node_modules\@deepseek-ai`）
- 涉及路径：`offline-pack/win-x64/{dsh-offline-win-x64.zip（重打 169MB）、README-WIN.md（排错+一键修复）、MANIFEST.sha256}`、`AGENTS.md`
- 备注：教训——**npm 在 profile 目录装插件依赖会把 @deepseek-ai 核心包提升进 profile 树**，与全局树形成双份模块；Symbol 跨实例不相等类问题只会在特定模块（dsh-scope）出现且表现诡异（启动正常、配置正常、仅 agent 创建失败）；打包后必须**检查 profiles/web/node_modules/@deepseek-ai 为空**（与 111 生产对照）；排查方法论：settings.describe 验证配置 → 最小/完整 profile 对照复现 → 目录差异对比 → Symbol 双份推理；用户侧旧包最快修复=删该目录重启，无需重部署
### 2026-08-20 修 Windows“选择工作区 Failed to fetch”：原生目录框在远程/计划任务场景弹不出→强制 browse；31.101 真机端到端验证通过

- 变更内容：用户反馈 31.101 上 Web 界面“选择工作区 / Choose workspace”报 `Failed to fetch`。**根因**（源码定位）：`dsh-host-directory-picker-auto` 按引导时事实选后端——bindHost=127.0.0.1 且非 SSH 环境且平台 win32 → 选 **native**（`dsh-host-directory-picker-native`，koffi→user32 弹系统目录框，**阻塞 HTTP 直到关框**）；本次 dsh 由 SSH/计划任务在 RDP 会话拉起、或不在可交互桌面 → 系统框弹不出 → 请求挂起 → 前端 fetch 拒绝 → `Failed to fetch`。**修复**：无用户配置项，但 resolver 有「设置了 `SSH_CONNECTION`/`SSH_TTY` → 无条件 browse」分支 → VM 上 `dsh-autostart.cmd` 加 `set "SSH_CONNECTION=remote"` 后经计划任务 DSHWeb 重启 → 改用「网页内目录浏览」后端。**真机端到端验证**：本机 ssh 隧道 `13101→VM:3080` + Playwright 浏览器实测——点 Choose workspace 弹出网页内 Select Workspace Directory（列出 VM 目录），选 Documents→Open，左侧 Workspaces 出现 Documents，全程无 Failed to fetch。**包更新**：`win-x64/README-WIN.md` 排错节增加该问题与 `set SSH_CONNECTION=remote` 开关说明；`win-x64/dsh.cmd` 顶部加注释版开关；主包重打（173MB，sha256 `0f5a3a1f…78f58c`，CRC/清单全过）并同步到 VM（31.101 上 dsh 现以 browse 运行，pid 3560，HTTP 200）
- 涉及路径：`offline-pack/win-x64/{dsh-offline-win-x64.zip（重打）、README-WIN.md、dsh.cmd(新增源码)}`、`AGENTS.md`；31.101 上 `C:\Users\LEE\dsh-autostart.cmd`（SSH_CONNECTION）+ 计划任务 DSHWeb
- 备注：dsh 的目录选择后端是“自适应”设计（本地桌面用系统框、远程/无显示用网页浏览），无 settings 开关，仅 env（SSH_CONNECTION/SSH_TTY）可强制 browse，属有意为之的“通过 SSH 启动”信号；远程/受限/计划任务运行 Windows 一律建议 browse；验证册：隧道+Playwright 打开网页→点 Choose workspace→确认弹网页内目录框→选目录→侧栏出现工作区
### 2026-08-20 修复 Windows 离线包启动失败：根因=**必须 Node 22**（Node 20 缺 zstd/withResolvers/stripTypeScriptTypes），Node22 整合进主包重打

- 变更内容：用户在 Win10 VM（31.101）运行 dsh.cmd 报 `createZstdDecompress`/`Promise.withResolvers`/`stripTypeScriptTypes`/`Cannot find package('全局'、6 插件)` 崩溃。**根因确诊（决定性本地复现）**：这些全是 **Node 22 API**（dsh rc.8 用到 `node:zlib` zstd 系列、`Promise.withResolvers`、`node:module.stripTypeScriptTypes`），Win10 是 Node 20.12.2 → 必炸；用官方 Node 20.12.2 在本地 Linux 跑同一 dsh 得到 **逐条一致**的错误（含 16 处 Cannot find package，证明"找不到包"是 Node20 致加载器内部解析不可用的**连锁反应**，非插件放错——插件在 profiles\web\node_modules 与 Linux 同构，Node22 下正常）。对照组 Node22 正常启动 HTTP 服务。**修复**：Node 22 从"可选兜底"升为**必需品并整合进主包**（`dsh-offline-win-x64.zip` 内顶层 `node-v22.23.2-win-x64\`），`dsh.cmd`/`verify.cmd` 重写为**默认用内置 node22.exe**（缺失再退 PATH node 且校验 >=22）；`README-WIN.md` 全文改写（必须 Node 22、附带 3 个 API 缺失症状表、node-pty warn 若 Node22 仍出现则为缺 VC++ 运行库）。重打包 173MB（含 Node22，约 50038 文件 MANIFEST 全过、zip CRC 全过），sha256 `604de9fc…173020`；工作区 `win-x64/MANIFEST.sha256` 已同步为该包内置版本。**VM 真机自动验证受限**：31.101 仅开 RDP(3389)（无 SSH/WinRM），PVE(31.100) API 登录 ticket OK 但后续 GET 被 401（cookie 异常），RDP 自动化不可靠 → 放弃自动远程装；给用户清晰"VM 复测清单"（删旧 .dsh 重新解压新 zip → verify.cmd → dsh.cmd）
- 涉及路径：`offline-pack/win-x64/{dsh-offline-win-x64.zip（重打 173MB）、README-WIN.md（改写）、MANIFEST.sha256（同步）}`, `AGENTS.md`
- 备注：教训——dsh rc.8「engines 无硬要求但代码用 Node22 API」属隐性前置，装机/文档须以 Node22 为基线；本地复现法（下载同版本 Node20 跑同一个 dsh）是跨平台排查的快速手段；插件 bundle 的 bare-name 解析靠 loader 内部 baseUrl=profile 机制，Node 低版本会让其退化裸解析而误报"找不到包"，勿据此改布局
### 2026-08-20 新增 offline-pack/win-x64/：dsh+插件 Windows 离线包（纯 zip，无需联网/管理员，去 dshmarket/web-lan）

- 变更内容：用户要在**完全隔离、内网权限受限、已装 Node v20.12.2** 的 Win10 上装 dsh+插件（不能联网不连内网）→ 产出 Windows 离线 zip。**核心方案**：不复制 Linux 树（原生模块是 ELF、可选依赖只有 linux 变体、有 /root 路径链接，直接拷必挂），而是在 111 上**按 win32-x64 重新解析依赖**产出 Windows 树：`npm install --os=win32 --cpu=x64 --ignore-scripts`（实测该参数能正确选中 win32 平台可选包）。范围（用户确认）：**去** dshmarket、web-lan；**含** theme-center/navbar/notify-sound/describe-image + better-sidebar + global-rules。**布局**：`%USERPROFILE%\.dsh`（家目录）下 `node_modules\`＝win32 全局依赖树（含 `@img/sharp-win32-x64`、`@koromix/koffi-win32-x64`、`@vscode/ripgrep-win32-x64`、`node-addon-require-builtin-win32-x64-msvc`），`profiles\web\`＝profile（better-sidebar/global-rules npm 装 + 4 插件按 `files` 白名单**真实目录**物化，无 `link:`、无符号链接、无 /root 路径 → 不需要管理员权限）；机制依据：`resolveBundleDir` 从安装锚点(全局)+profileDir 两级解析 bundle，插件 walkup 命中 `.dsh\node_modules\@deepseek-ai\*`。产物 `win-x64/dsh-offline-win-x64.zip`（137MB，解压到用户目录即得 `.dsh\`）+ `dsh.cmd`/`verify.cmd`（CRLF）/`README-WIN.md`/`MANIFEST.sha256`（47979 文件全过）+ 可选 `node-v22.23.2-win-x64.zip`（35MB，Node20 ABI 不兼容兜底）。**验证**（本机可做）：npm 实测选中 win32 包、两处树 win32 原生齐（无 linux 变体）、node-pty win32 prebuild 在、插件目录无 dev 文件、`node --check` 关键 JS 过、zip CRC 全过。Windows 侧验收=`verify.cmd`（真实运行只能在目标机，README 已写验收清单）
- 涉及路径：`offline-pack/win-x64/`（新建：dsh-offline-win-x64.zip、node-v22.23.2-win-x64.zip、README-WIN.md、MANIFEST.sha256、SHASUMS256.txt）、`AGENTS.md`
- 备注：dsh rc.8 无 engines 硬要求（仅 2 依赖声明 `>=20`）→ Node 20 够用，Node22 包仅兜底；bash 类工具在 Windows 无 bash 降级（文档注明）；`--port` CLI 不生效需 `--patch` 覆盖 webserver；构建基于 npm 10.9.8 的 `--os/--cpu` 跨平台解析（方案经小包实测可行，构建后抽查 win32 包名为准）；未验证项为 Windows 上真实运行（node-pty/ABI 以 verify.cmd 验收），这是诚实边界
### 2026-08-20 offline-pack 跟进：README 补「完整卸载」说明 + 修复构建脚本 MANIFEST 自排除，重新打包

- 变更内容：用户询问产物位置并要求"加一个完整卸载的说明"——①`offline-pack/README.md` §9 由简短的「卸载与回滚」扩为**完整卸载**：先列"本包装了什么"对照表（Node→/usr/local/lib/nodejs + bin 软链、dsh 全局、pnpm 可选、/root/.dsh、systemd 可选），分**方案 A（只卸程序保留 /root/.dsh 配置数据，可随时重装恢复）**和**方案 B（连配置/会话/Key 彻底删除，先 cp -a 备份）**，附安全注意事项（只删本包软链、勿动原有 node、备份清理 .bak-*）；②复核时**发现并修复构建脚本真 bug**：`build-offline-pack.sh` 第 6 步 MANIFEST 生成把 MANIFEST.sha256 自身也列进去 → `sha256sum -c` 必然 1 FAILED（会误导用户），改 `find -path './MANIFEST.sha256' -prune` 自排除；③重新打包复验全过（43246 条目 100% OK、包内 README 与工作区 md5 一致）；最终产物 sha256 `b4a43028eae1bd13d8067b5d391235ed0837c7d52529a19694545e21de9cabc7`（141MB）
- 涉及路径：`offline-pack/README.md`、`offline-pack/build-offline-pack.sh`、`offline-pack/dsh-offline-rhel8-x86_64.tar.gz`（重建）、`AGENTS.md`
- 备注：包内 MANIFEST.sha256 与 README 均为重建后产物，与工作区源文件一致；卸载不需要离线包（install.sh 仅安装时用）

### 2026-08-20 新增 offline-pack/ 离线部署包（dsh+全部插件+Node.js→RHEL 8 无网服务器），含中文安装文档

- 变更内容：用户需求"把当前服务器 dsh 及所有插件打为离线包，装到不能联网的 RHEL 8 服务器（无 Node）"。产出工作区 `offline-pack/`：①增量式**树拷贝打包**（经全量符号链接扫描确证 `/root/.dsh` 内绝对链接唯一指向 `/usr/local/lib/node_modules/@deepseek-ai/dsh`，两树自洽闭环 → 全局 dsh 装到同路径即可离线运行）；②**排除项**（用户确认）：`settings.yaml`、`.credentials.yaml`、`sessions/`、`attachments/`、`storages/`、`skills/knowledge-base/`（全新实例、不含任何密钥）；③随包下载官方 **node-v22.23.2-linux-x64.tar.xz**（实测要求 glibc≤2.28 → RHEL 8 兼容）与 self-contained pnpm；④`install.sh`（幂等、root、自动备份冲突目录、`--with-pnpm/--systemd/--no-node`，`PREFIX/DSH_HOME` 可覆盖）、`verify.sh`（自检）、`fix-node-pty.sh`（RHEL 8 专用重编译 node-pty）、`dsh-web.service`（systemd 模板，**不含任何真实 Key**）、中文 README（安装/自检/启动/首启配 Key/RHEL8 终端说明/离线限制/卸载安全）；⑤产物 `dsh-offline-rhel8-x86_64.tar.gz`（141MB，tar 统一 `--owner=0 --group=0`，自佐证 MANIFEST.sha256 43246 文件全部通过）。**实测验证**（打包机本机，不触碰 111/112 运行态）：包内官方 node 运行包内 dsh `--version=0.1.0-rc.8`、node-pty 从包内 profile 加载 OK、`--profile web --help` 装配成功、**端到端启动并 HTTP 200 提供前端**（`--patch` 覆盖 webserver 端口 3099，日志 `dsh web: http://127.0.0.1:3099 (LAN: …:3099)`）；install.sh 沙盒干跑（PREFIX/DSH_HOME 覆盖）全过并**捕获修复真 bug**：`set -o pipefail` 下 `ldd --version | head -1` 触发 SIGPIPE 杀掉安装脚本 → 改 `awk 'NR==1'`
- 涉及路径：`offline-pack/`（新建：README.md、install.sh、verify.sh、fix-node-pty.sh、build-offline-pack.sh、dsh-web.service、dsh-offline-rhel8-x86_64.tar.gz、node/ 下载源）、`AGENTS.md`
- 备注：**RHEL 8 已知点**：node-pty@1.1.0 为 glibc 2.35 环境本地编译（要求≥2.34），RHEL 8(g2.28) 加载失败但 better-sidebar 内置惰性加载+优雅降级（终端 tab 提示，不影响 dsh web 其余功能），`fix-node-pty.sh` 走本地源重编译修复；**`--port/--host` CLI 实测不生效**，改端口需 `--patch`/`cordis.patch.yml` 覆盖 webserver 行（README 已写明）；Playwright MCP patch 离线会优雅跳过；离线机器增删插件需另做离线源。打包基于 111 当前状态（dsh rc.8 + 各插件最新版）；本任务不修改 111/112 运行态；打包机需联网下载官方 Node 包（唯一网络动作）；产物与脚本在 NFS 工作区（`1000:uucp`），安装脚本/文档源文件亦在本目录可复现

### 2026-08-20 DSH 0.1.0-rc.8 升级（112 验证 + 111 部署）：theme-center 兼容 rc.8 模块系统（window.__DSH_MODULES__ 移除 → ctx.get("modules")）v0.4.3

- 变更内容：按用户指示 112 升 DSH rc.6→rc.8 并验证有风险插件、通过后升 111（rc.7→rc.8）。**112 实测捕获并修复真兼容性问题**：rc.8 前端重构 client 模块系统，移除 `window.__DSH_MODULES__`（仅保留 `__ModuleLoader__` 注册 facade：mode/pendingQueue/load/create），theme-center 旧版皮肤全部加载失败（status「window.__DSH_MODULES__ 不可用」、body 无皮肤属性）。修复：`windowModules()` 双路径——rc.7 及更早 `window.__DSH_MODULES__`（未升级旧前端兼容） / rc.8 经真实根上下文 `realCtxRef.get("modules")`（dsh-client-modules 以 `ctx.reflect.provide("modules", moduleSystem)` 注册，`import/invalidate` API 与旧全局同构一致）；皮肤 bundle 走 `__ModuleLoader__.load` 自注册，**本身零修改兼容 rc.8**。版本 0.4.2→0.4.3 发布 npm（26 款皮肤全包）。112：DSH rc.8 + better-sidebar 装回 0.13.1（node-pty `allowBuilds: true` 放行本地编译 + profile `dsh.profile.bundles` 补 `dsh-better-sidebar` 注册）后重启；验证全过——console 0 错误、前端 rc.8 全套 bundle 加载、Plugins 三卡片（主题/提示音/图像理解）keyed slot 契约兼容渲染、theme-center 皮肤**自动恢复（catppuccin）与试穿（skin-ocean 深海蓝）**令牌/侧栏渐变/半透明/遮罩全部生效、web-lan LAN 直连全程正常、navbar 锚点（`[data-side=sidebar]` 分隔条）仍在无加载错误（当前会话无节点正常隐藏）、better-sidebar 客户端加载/容器/样式正常。111：备份 `/root/.dsh`（117MB tar）→ 同步 theme-center 0.4.3（md5 `0e342bda` 与本地/112 完全一致）→ npm -g dsh rc.8（官方 registry 强制，npmmirror 延迟）→ 延迟 detach 重启 `dsh-web.service`；验证全过——服务 active、rc.8、**Codex 深蓝皮肤自动恢复**（`--dsw-alias-bg-base #181818`）、三卡片渲染、console 0 错误
- 涉及路径：`theme-center/lib/client.js`、`theme-center/package.json`、`theme-center/AGENTS.md`、`AGENTS.md`；npm `@npm-liqingfeng/dsh-theme-center@0.4.3`；111/112 全局 dsh rc.8、112 `profiles/web/{package.json,dsh.profile.bundles,pnpm-workspace.yaml allowBuilds}`、111/112 `/root/.dsh.bak-rc8-*.tar.gz`
- 备注：**教训**——theme-center 引用的 DSH client 模块系统契约再次兑现「DSH 升级需复核」：rc.8 移除 `window.__DSH_MODULES__`，改为 `ctx.get("modules")`；皮肤执行应在**真实根上下文**取模块系统而非硬编码 window 全局；111 前端从 rc.6(slots) 前端直升 rc.8（keyed slot 契约 0.4.3 兼容）；better-sidebar 此前 112 丢失系 08-17 重装 5 插件时未含（bundles 缺条目），已补装 0.13.1 并验证；112 npmmirror 元数据延迟致 `dsh add` 认不到刚发的 0.4.3，改 profile 目录 `pnpm install --registry=https://registry.npmjs.org/` 强制官方解决；备份产出 `/root/.dsh.bak-rc8-20260820-{020529,022042}.tar.gz`

### 2026-08-17 theme-center 根治「白底白字」：撤销全局 foreground 白、仅自研暗色态保留按钮白字 v0.4.2

- 变更内容：用户反馈"白色主题下仍有白底白字、其他主题也有（不只深海蓝）"。根因确认：v0.4.0 为修暗色按钮做的「14 款 `--dsw-alias-label-primary-foreground/-inverted:#ffffff` 全局兜底」误伤——官方浅底控件（下拉/Open 配置按钮/ghost 等默认浅灰底残留）用 foreground 即白→白字浅底。修复：①**撤销全局 foreground=白**（14 款）；②自研 6 款（cat/mint/cyber/apple/tokyo/nord）仅**暗色态**保留按钮白字（深底白字，亮色态回官方/皮肤自动对比）；③白色主题浅底控件回官方 foreground（浅底深字）。112 四主题两模式实测：白色（paper/sakura）New Session/OpenCfg/Light 卡=浅底深字、暗色（ocean/catppuccin）深底浅字——白底白字全消除；Light 卡沿 v0.4.1 的 module-platform 主题化（#20232a 深 / #f5f5f7 浅）保持。版本 0.4.2
- 涉及路径：`theme-center/lib/skins/`×14、`theme-center/tests/smoke.mjs`、`theme-center/package.json`、`theme-center/AGENTS.md`、`AGENTS.md`
- 备注：**112 验证通过**（4 主题×亮暗，全部满足高对比）；111 已部署（预授权延迟重启）；npm 0.4.2 已发布

### 2026-08-17 theme-center 修复：设置面板 Appearance 主题色卡官方残留浅灰+白字看不清 v0.4.1

- 变更内容：用户反馈"深海蓝的设置>通用设置>外观中浅色背景是白色、文字/图标也是白色，很多主题同样"。ui-ux-pro-max 审查 + 程序化定位：`.VOzbGW_panel` 内 Appearance 主题色卡 `._8HJdBW_themeCube._8HJdBW_selected` 背景走 `--dsw-alias-bg-module-platform`，而 dsh-skin 7 款（深海蓝等 27 令牌子集）未定义该令牌→落官方默认中灰 `#35363c` + 主题浅白字 → 浅灰底浅字模糊；border 走官方 `neutral-bluish-400` 浅灰刺眼。修复：14 款覆盖 `--dsw-alias-bg-module-platform` 为主题面板色（暗 #20232a/亮 #f5f5f7）+ `.VOzbGW_panel ._8HJdBW_selected{border-color:var(--dsw-alias-border-l2)}`；**踩坑**：首版用 `{{}}` 双花括号拼 CSS 生成空规则（CSSOM 排查发现），改单花括号后生效；harbor 自带 module-platform 深蓝无需改；112 复测深海蓝选中"Light"卡 bg 53,54,56→32,35,42（主题深面板）、border 浅灰细边框、深底浅字清晰；版本 0.4.1
- 涉及路径：`theme-center/lib/skins/`×14、`theme-center/tests/smoke.mjs`、`theme-center/package.json`、`theme-center/AGENTS.md`、`AGENTS.md`
- 备注：**112 验证通过**；111 已部署（预授权延迟重启）；npm 0.4.1 已发布

### 2026-08-17 theme-center 14 款皮肤：侧边栏 codex 式渐变色 + 按钮可读性兜底 v0.4.0

- 变更内容：用户反馈"其他主题没有类似 codex 的渐变色；有的白色主题新会话按钮白底白字看不清，很多按钮类似"。承接 v0.3.8（背景磨砂+组件适配）。本次：①**侧边栏 codex 式渐变**——v0.3.8 的背景光晕在 body 被内容层大面积遮挡几乎不可见（采样色差≤10），codex 渐变显眼处其实是侧边栏；给 14 款 `--dsw-specific-sidebar-fill` 覆盖为「顶部品牌 radial 光晕 + 135deg 对角三段渐变」（亮色浅品牌色系、暗色深品牌色系），nav-item active 同步适配；112 采样侧边栏顶→底色差明显（樱花粉 #f3cfdd→#e9b4cc、紫粉拿铁 #bdc7e2→#a0aacc、深海蓝 #14203a→#0d172a）——"看得到类似 codex 的对角渐变+顶部光晕"；②**按钮可读性**：程序化审查发现自研 6 款暗色态按钮 fill 与 label-primary-foreground 同色（对比 1.4~1.9 模糊）、dsh-skin 7 款完全未定义这些令牌（落官方默认）、harbor 全同色 1.0；白色主题实测 New Session 白底深字正常；统一兜底：14 款追加 `--dsw-alias-label-primary-foreground/-inverted:#ffffff`（所有深底按钮白字，对比≥6.4），112 复测 catppuccin 暗/skin-ocean 暗按钮底深字浅清晰、skin-paper 白底深字正常；版本 0.4.0
- 涉及路径：`theme-center/lib/skins/`×14、`theme-center/tests/smoke.mjs`、`theme-center/package.json`、`theme-center/AGENTS.md`、`AGENTS.md`
- 备注：**112 验证通过**；111 已部署（预授权延迟重启）；npm 0.4.0 已发布；skin bundle 至今多轮追加（background/layer/sidebar/foreground 覆盖段累积较大，建议后续一次清理合并为干净 CSS）

### 2026-08-17 theme-center 14 款皮肤统一：codex 式对角渐变 + 磨砂玻璃 + 可读性修复 v0.3.8

- 变更内容：用户要求"参考 codex 的渐变色与磨砂玻璃，其他主题也实现过渡色和磨砂效果；检查配色合理性（尤其白主题/组件不匹配）；注意图标与弱文字搭配看不清"。范围=14 款（上游仅 harbor + 自研 6 + dsh-skin 7；用户冻结 9 款 dsh-web-ui 不改）。分 8 轮实施：①审计（ui-ux-pro-max 配色/对比规范 + PIL 采样）定位问题：亮色主题侧边栏深品牌色（6 款）、发送按钮官方淡蓝 `#679EFE`（dsh-skin 未覆盖 button-info-fill）、mask 半透明品牌蓝、无磨砂；②修复组件：亮色侧边栏浅色化、发送按钮 info=品牌色、mask 中性黑、设置面板不透明；③-⑦打磨砂/渐变：root+卡片自身 backdrop-filter blur、面板 rgba 降透明（亮 0.72/暗 0.78）、按 ui-ux-pro-max「Modern Dark/Glass」规范做**codex 式对角 135deg 多段线性基底 + 品牌 radial 光晕**（避开纯黑纯白）；**踩坑**：CSS `radial-gradient(circle 55% 45% ...)` circle 双值非法→整条声明被丢回退旧值（浏览器 CSSOM 排查后改单值）；headless 无 GPU 不合成 backdrop-filter→磨砂需真实浏览器/soft 渲验证；⑧可读性：弱文字（label-tertiary/caption/dimmed）按半透明面板叠加模型重算对比——亮款加深、暗款提亮至 ≥4.7（原 3.3~4.5，sakura/paper 易看不清），harbor dimmed 保留弱灰禁用态；smoke 增 14 款磨砂/组件/亮色侧边栏断言；版本 0.3.8
- 涉及路径：`theme-center/lib/skins/`×14、`theme-center/tests/smoke.mjs`、`theme-center/package.json`、`theme-center/README.md`、`theme-center/AGENTS.md`、`AGENTS.md`
- 备注：**112 验证通过**（程序化：root/卡片 blur、面板 rgba、mask 黑、侧边栏浅色、发送按钮品牌色、tertiary 对比 4.76~12.27；视觉模型：樱花粉亮色"卡片半透明透出被模糊粉色光晕+对角渐变+玻璃层叠"、深海蓝暗色"磨砂半透明+深蓝光晕+景深"）；111 已部署（预授权延迟重启）；npm 0.3.8 已发布；14 款 bundle 在 0.3.3 新增 + 后期多轮追加段（大文件，包含多段 background/layer 覆盖，后续可清理合并）

### 2026-08-17 theme-center 修复 Codex 深蓝：侧边栏渐变方向反了 + 设置面板遮罩变蓝 v0.3.4

- 变更内容：用户反馈①侧边栏过渡色反了（应左上→右下黑→蓝）、②打开设置面板遮罩背景奇怪颜色。修复：① sidebar-fill `180deg`（上蓝下黑）→ `135deg` **左上黑→右下蓝**（暗/亮同步，body 暗色蓝黑光晕移右下呼应）；② **遮罩根因**：官方 `.VOzbGW_mask` 用 `--dsw-alias-bg-mask-1`（alias_set 按 brandDeep 生成 `rgba(30,111,208,0.4)` **半透明深蓝蒙层**）叠模糊背景=奇怪色；mask 系列改中性黑（暗 mask-1 `rgba(0,0,0,0.42)`/0.20/0.52/0.88，亮 0.30/0.12/0.40/0.80），遮罩=背景暗化+官方 blur(2px)+root blur(20px) 磨砂；smoke 断言更新（135deg+mask 黑）；版本 0.3.4
- 涉及路径：`theme-center/lib/skins/codex.js`、`theme-center/tests/smoke.mjs`、`theme-center/package.json`、`theme-center/AGENTS.md`、`AGENTS.md`
- 备注：**112 实测全过**（mask `rgba(0,0,0,0.42)`+blur(2px)、sidebar 135deg 左黑右蓝、root blur、panel 不透明；视觉模型评审：遮罩自然深黑毛玻璃/背景清晰模糊/渐变协调/无颜色异常）；111 已部署（预授权延迟重启）+ npm 0.3.4 已发布

### 2026-08-17 theme-center 新增自研皮肤：Codex 深蓝（参考 image/1.png 配色——黑底 + 蓝黑过渡渐变 + 磨砂毛玻璃，亮暗双形态）v0.3.3

- 变更内容：用户需求"参考 image/1.png（Codex 主题）的侧边栏和会话区配色开发一个主题，只参考配色"+ "注意过渡色和磨砂质感"；确认亮暗双形态 + 磨砂仅主界面（设置面板不透明）。PIL 像素取色（模型不支持读图）：会话区近黑 `#181818`、侧边栏下部蓝黑渐变带 `#1a212d`→`#1a2030`、卡片/输入框 `#2a2a2a`、accent `#339cff`/`#95c9f9`、文字 `#dfdfdf`/`#b6b6b6`/`#8a8a8a`；生成 161 变量骨架 + 注入 root `backdrop-filter: blur(20px)` 磨砂 + 面板 rgba 半透明（bg-base 不透明）+ `.VOzbGW_panel` 设置面板不透明 + sidebar 蓝黑渐变 + body 双态渐变；踩坑：CSS 字符串拼接注入产生 `n body[...]` 非法选择器，改「解析 const CSS → 改写 → 重序列化」健壮注入；THEMES/SKIN_IDS/meta/smoke+8/README/§6 同步；版本 0.3.3
- 涉及路径：`theme-center/lib/skins/codex.js`、`theme-center/lib/meta/codex.json`、`theme-center/lib/{client,index}.js`、`theme-center/package.json`、`theme-center/tests/smoke.mjs`、`theme-center/README.md`、`theme-center/AGENTS.md`、`AGENTS.md`
- 备注：**112 实测全过**（暗色 bgBase `#181818`/layer1 rgba 半透明/sidebar 蓝黑渐变/root blur(20px)/设置面板 rgb(24,24,24) 不透明；亮色 bgBase `#f7f7f8`/浅灰 sidebar 渐变/blur 保留；视觉模型评审磨砂克制精致、渐变深邃、类 Codex 极简风；验证用服务器 settings theme=codex，验证后还原）；112 为 npm 安装（external 已删），更新走覆盖 `profiles/web/node_modules/@npm-liqingfeng/dsh-theme-center` 包目录 + 重启；111 link 安装（rsync external）；npm 0.3.3 待发布

### 2026-08-17 修复：settings.plugin.item keyed slot 契约适配（rc.7 前端 key=设置命名空间）+ 112 全新安装 5 插件

- 变更内容：112 全新 npm 安装 5 插件后浏览器报 `Failed to load plugins / keyed slot "settings.plugin.item" requires options.key`——根因：112 前端依赖 `dsh-client-ui-slots@0.1.0-rc.7`（111 为 rc.6），rc.7 将 `settings.plugin.item` 改为 **keyed slot：必须 `options.key` 且 key = 卡片编辑的设置命名空间**（官方 dsh-client-ui-settings-plugins 注释 "keyed by the namespace it edits"，渲染按 `entryKey: ns` 过滤）；旧代码只传 `id`（rc.6 list 契约）。修复三插件 `slots.register` 同时补 `key`（兼容 rc.6 list 要求 id + rc.7 keyed 要求 key）：theme-center `key: "theme"→"theme-center"`（**首版 0.3.1 误用 "theme" 致卡片不渲染**，0.3.2 修正；notify-sound/describe-image 的 key 恰等于命名空间首版即成功）；版本 theme-center 0.3.0→0.3.2、notify-sound/describe-image 0.1.0→0.1.1 重新发布 npm；smoke 补 key 契约断言；112 显式版本号升级（`add <pkg>@<ver>`，首次 0.3.2 因刚发布 pnpm 失败重试即好）+ 重启；**112 实测全过**：console 0 错误、Plugins 配置页三卡片渲染（主题/提示音/图像理解）、主题卡片 23 款皮肤 + 双 Tab + 服务端同步提示 + 紫粉拿铁已应用；另确认 112 升级时需 `minimumReleaseAge: 0`（pnpm-workspace.yaml）与 profile `.npmrc` 官方 registry（全局 npmmirror 延迟）
- 涉及路径：`theme-center/{lib/client.js,package.json,tests/smoke.mjs,AGENTS.md}`、`notify-sound/{lib/client.js,package.json}`、`describe-image/{lib/client.js,src/client/index.ts,package.json}`、`AGENTS.md`
- 备注：**教训**：插件设置卡注册 `key` 必须 = 设置命名空间（theme-center 命名空间 `theme-center` 而非卡片 id `theme`）；dsh 前端 rc.6→rc.7 slot 契约变更（list→keyed），111 上 rc.6 前端不受影响（key 忽略）；**111 未同步**（link 安装 + rc.6 前端当前正常，修复版兼容，待用户确认后同步部署）

### 2026-08-17 插件发布 npm：5 个插件全量发布成功（3 个因包名占用/非法作用域改用 @npm-liqingfeng/ ）

- 变更内容：用户需求"将当前目录的几个插件推送到 npm，可在其他 mac/win 上安装使用"——发布前核查（5 包名占用情况：`dsh-describe-image`/`dsh-notify-sound` 未被占用保持原名；`dsh-theme-center` 已被 faster128 于 2026-08-15 占用；`@vlln/dsh-navbar` 的 @vlln 非本账号作用域；`@user/dsh-web-lan` 的 @user 为占位符无法发布），按用户指示"若名称已被占用，就使用我的作用域"改名：`@npm-liqingfeng/dsh-theme-center`（+publishConfig.access: public）、`@npm-liqingfeng/dsh-navbar`（+tsdown banner/src 的 id 同步）、`@npm-liqingfeng/dsh-web-lan`（+publishConfig.access: public）；连带修改：三插件的 `cordis.patch.yml` 插件行 name（patch 按包名解析模块）、client bundle 的模块 id（`lib/client.js` 第 2 行）、navbar `tsdown.config.ts` banner、theme-center smoke 测试 3 处包名断言、web-lan 测试注释、各 README 安装段补 npm 安装方式（`dsh plugin --profile web add <包名>`，保留 link 方式）；**发布**：凭证 = `/root/.npmrc` 中 `//registry.npmjs.org/:_authToken`（已验证 whoami=npm-liqingfeng），发布命令带 `--userconfig=/root/.npmrc --registry=https://registry.npmjs.org/ --cache=<挂载区可写目录>`（HOME 为空 + /root 只读 + 默认 registry 为 npmmirror 的规避），5 包全部 `npm publish --access public` 成功：dsh-describe-image@0.1.0、dsh-notify-sound@0.1.0、@npm-liqingfeng/dsh-navbar@0.3.0、@npm-liqingfeng/dsh-web-lan@1.0.0、@npm-liqingfeng/dsh-theme-center@0.3.0；**验证**：发布前 node --check 全产物 + 测试全绿（theme-center smoke / web-lan 9/9 / notify-sound / describe-image 159/159）+ `npm pack --dry-run` 内容核对（theme-center 23 款皮肤 bundle 完整）；发布后 registry 元数据/版本端点/dist-tags/tarball 下载全过（dsh-navbar 整包元数据 GET 偶发 404 为 CDN 缓存延迟，tarball 200 正常）
- 涉及路径：`theme-center/`（package.json/cordis.patch.yml/lib/client.js/README.md/tests/smoke.mjs/AGENTS.md）、`navbar/`（package.json/cordis.patch.yml/lib/client.js/tsdown.config.ts/README.md）、`web-lan/`（package.json/cordis.patch.yml/lib/index.js/README.md/test/index.test.js）、`describe-image/README.md`、`notify-sound/README.md`、`AGENTS.md`
- 备注：**不改动 111/112 已部署环境**（两机均为 link 本地安装，包名变更无影响，后续同步部署属另一次动作）；`lib/skins/*.js`、`lib/meta/*.json`、THEMES 注册表中的 `@user/dsh-client-ui-skin-*` 为**上游皮肤 bundle 内部模块 id（零修改契约）**，与本插件包名无关，未改动；localStorage 键与 `body[data-dsh-theme-center]` CSS 作用域为运行时标识，未改动；其他机器安装：`dsh plugin --profile web add <包名>`（见各 README）

### 2026-08-17 theme-center 修复：steering 通道用户消息不缩放（USER_TEXT_KINDS 数组 + userKindsSel 每项带完整门控前缀）

- 变更内容：用户反馈"我发送的内容字号突然变大了"（截图 /tmp/zihao-pro.png）——111 实测定位：02:48 发送的消息 `data-chat-flow-kind="steering"`（用户经 steering 通道发送的消息官方标记为 steering 而非 user），`_text_1pfhk_1` 显示 16px 官方原样，同会话 9 条 `user` 消息均 12.8px——规则只覆盖 `user`+`assistant-step` 漏掉 `steering`。修复：`USER_TEXT_KINDS=['user','steering']` 数组 + `userKindsSel(prefix,suffix)` 生成器替换 5 处选择器（字号×2+字体×2+表格）；**v2 修正（111 实测捕获）**：CSS 逗号分隔选择器列表前缀只作用于第一项——v1 字符串拼接致 user 分支退化为"字号设在容器上被官方文本类 16px 覆盖"、steering 分支丢门控前缀；userKindsSel 逐项展开完整前缀后 user/steering 均正确命中文本节点
- 涉及路径：`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`、`theme-center/AGENTS.md`、`AGENTS.md`
- 备注：**112 同构探针实测全过**（user/steering 均 12.8px/22.4px、无错误）；**111 已部署**（用户预授权，md5 `716b6045` 与 112 一致，重启完成，用户自行测试页面）

### 2026-08-17 theme-center 修复：输入框可见文字未缩放——官方三层架构（backdrop/textarea/mirror），缩放规则上移到 textarea 父层

- 变更内容：用户反馈"输入后的内容字号确实不对，但是全选输入后的内容字号是缩放的"——112 实测定位根因：**官方 composer 三层架构**（hash 类名 `uV2eYG_*`）——`backdrop` 渲染用户可见文字、`textarea` 文字透明（`rgba(0,0,0,0)`）只承载光标与选中高亮、`mirror` 隐藏测量，三层 `font-size: inherit` 继承自 textarea 父层 `grow`（16px）；旧规则只缩放 textarea（12.8px）→ 用户看到的 backdrop 文字仍 16px（未选中不缩放），全选时 selection 高亮按 12.8px 绘制（看着像缩放）。修复：规则改为 `[data-composer-card="true"] div:has(> textarea){font-size:calc(16px * var(--tc-text-scale))}`，三层 inherit 一并缩放（不依赖 hash 类名）
- 涉及路径：`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`、`theme-center/AGENTS.md`、`AGENTS.md`
- 备注：**112 实测全过**（80%：grow/backdrop/mirror/textarea 全部 12.8px/24px、全选场景 backdrop 仍 12.8px、无错误）；**111 已部署**（用户预授权，md5 `26f13d54` 与 112 一致，延迟 detach 重启）

### 2026-08-17 theme-center 修复：输入框只缩放字号、行高保持官方 24px（防文字贴边/指针错位）

- 变更内容：用户反馈"输入框的字确实没有缩放，且鼠标指针位置也有问题"——实测+视觉模型定位：文字已缩放（80%→12.8px）但行高 19.2px 致文字上移贴边、与按钮错位（textarea 顶部对齐特性）。修复：输入框规则只缩放 font-size、行高保持官方 24px（80%→12.8px/24px 垂直居中正常）
- 涉及路径：`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`、`theme-center/AGENTS.md`、`AGENTS.md`
- 备注：**112 验证全过**（视觉模型：文字距顶 ~10px 留白、垂直居中，修复前贴边）；**111 已部署**（用户预授权，md5 `e30710c9` 与 112 一致，延迟 detach 重启）

### 2026-08-17 theme-center 默认值调整：压制效果默认 80%、会话区字号默认 80%（官方锚点与默认解耦）

- 变更内容：用户需求"压制效果默认80%，会话区字号默认80%"——`FOCUS_DEFAULT` 70→80、`TEXT_SCALE_DEFAULT` 100→80；**关键解耦**：新增 `TEXT_SCALE_OFFICIAL=100` 作为门控移除条件（原实现"pct=默认时移除 data-tc-scale"，直接改默认 80 会致 80% 不生效）——现 80% 默认正常缩放、100% 仍是官方原样；宿主 schema focus/textScale 默认 80；服务器 user 层 unset 让新默认生效
- 涉及路径：`theme-center/lib/{client,index}.js`、`theme-center/tests/smoke.mjs`、`theme-center/README.md`、`theme-center/AGENTS.md`、`AGENTS.md`
- 备注：**112 验证全过**（默认视图 80/80、浏览器 `--tc-text-scale:0.8`+`--tc-focus:0.8`+门控挂载+输入框 12.8px/19.2px、无错误）；**111 已部署**（用户预授权，md5 `afd2d4e5` 与 112 一致，延迟 detach 重启，服务器已 unset）

### 2026-08-17 修复变更记录折叠结构：`</details>` 提前关闭致 11 条记录在折叠块外

- 变更内容：修复"四、变更记录"折叠问题——原 `</details>` 误置于"theme-center 新增 6 款自研皮肤"记录之后（并行会话追加记录时未挪动闭标签），导致 right-panel 卸载/theme-center 修复/插件一览等 11 条记录显示在折叠块外；已删除提前的闭标签并在最后一条记录（notify-sound 样式统一）之后、`---` 之前恢复唯一闭标签，全部 23 条记录重新纳入折叠
- 涉及路径：`AGENTS.md`
- 备注：用户反馈"变更记录折叠有问题，没有折叠所有变更记录"；已验证结构（details 开/闭各 1，闭标签位于 --- 前）

### 2026-08-17 theme-center 输入框内容随「会话区字号」一同缩放（16px/24px 基线）

- 变更内容：用户需求"输入框输入的内容也同会话区字号一同缩放"——实测定位：输入框 = 页面唯一 textarea（官方基线 16px/24px，hash 类名不可依赖），稳定锚点 `[data-composer-card="true"] textarea`；`appearanceCss` 缩放分支追加该锚点 calc 规则（16px/24px × `--tc-text-scale`，与正文同门控同键），100% 移除门控=官方原样；smoke +1 断言；文档同步（README/theme-center AGENTS §4.8 基线表与验证清单）
- 涉及路径：`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`、`theme-center/README.md`、`theme-center/AGENTS.md`、`AGENTS.md`
- 备注：**112 验证 4/4 全过**（125%→20px/30px、90%→14.4px/21.6px、100% 还原 16px/24px 官方原样）；**111 已部署**（用户预授权，md5 `32e33899` 与 112 一致，延迟 detach 重启）；用户追问"已发送/新发送消息是否缩放"——111 真实会话实测（125%）：历史 7 条 + 新发送 1 条用户消息主文本全部 **20px/35px 匹配缩放**，时间戳 14px 为元信息不缩放属正常；排查中确认此前 111 输入框未缩放系输入框改动未部署 111（本次已补部署）

### 2026-08-17 theme-center 配置保存到服务器：一处配置、所有终端生效 v0.3.0（112 验证 12/12 全过；111 已部署）

- 变更内容：用户需求"主题卡片的配置能否保存到服务器，一处配置，所有终端生效"（确认 111/112 不共享配置）——复用 notify-sound 先例实现服务端持久化：宿主注册 `theme-center` 设置命名空间（schemastery Config 9 字段全带默认）+ 自持路由 `/theme-center/settings`（GET 视图 / POST 批量写、同源护栏 + revision 栅栏、`settings.replace` 整层提交落盘 settings.yaml）；浏览器新增 `ThemeCenterSettingsScope`（15s 轮询 + focus/可见刷新）、`sanitizeServerValue` 清洗、首次同步一次性迁移本地状态、`applyRemoteState` 服务器真源 diff 应用（`applyingRemote` 防回环）、setter 排队服务器写（滑杆 400ms 去抖）、卡片 `.tc-sync` 同步状态行；localStorage 降级为首屏缓存，服务器不可用静默降级仅本机；版本 0.3.0；smoke +30 断言全绿
- 涉及路径：`theme-center/lib/{index,client}.js`、`theme-center/package.json`、`theme-center/tests/smoke.mjs`、`theme-center/README.md`、`theme-center/AGENTS.md`（§1/§4.4/§4.9/验证清单）、`AGENTS.md`；部署目录需建 `node_modules/@deepseek-ai` symlink（同 notify-sound 流程）
- 备注：**用户预授权：112 验证完成后直接部署 111 并重启 dsh-web.service（不再逐次询问）**；**112 双浏览器上下文实测 12/12 全过**（2026-08-17：A 老用户缓存迁移上推 9 字段 → B 全新终端跟随（catppuccin/125%/msyh/隐藏 tool/遮罩 40/宽度 1152/压制 50）→ C 分歧本地服务器胜出 → A 卡片改字体 songti+勾选隐藏上下文落盘服务器 → B ≤15s 自动跟随 → B 刷新持久 → 112 重启后 settings.yaml 持久 → 卡片同步提示「配置已同步」→ 无 console 错误；期间修复 smoke 未覆盖的缺陷：作用域返回对象漏 `mutate` 方法致迁移静默失败（smoke 补作用域契约断言）；验证后状态已还原）；**111 已部署**（用户预授权，rsync 同步 md5 `0ce43900` 与 112 一致 + node_modules symlink + 延迟 detach 重启 dsh-web.service，浏览器 Ctrl+Shift+R 生效）

### 2026-08-16 theme-center 修复：会话区标题（markdown h1-h6）未随字号百分比缩放（重定义官方标题令牌）+ 归档 34→21 条

- 变更内容：用户反馈"会话区标题的文字大小好像没有缩放"——根因：官方 `._markdown_ h1..h4` 用固定 px 令牌 `--dsw-font-markdown-hN`、h5/h6 用 `--dsw-font-markdown-base-strong`（基线：h1 700 24/34、h2 700 22/32、h3 700 20/30、h4 600 16/28、base-strong 600 16/28），不随容器字号联动（125% 时正文 20px 而 H2 仍 22px）。修复：`theme-center/lib/client.js` 新增 `HEADING_FONTS` 基线表 + `headingTokensCss(family)`，缩放/字体分支均在门控 body 上重定义 5 个标题令牌（`weight calc(size * var(--tc-text-scale))/calc(lh * var(--tc-text-scale)) family`：缩放分支 family=`var(--dsw-font-family)` 随全站字体变量、字体分支=所选 stack 并先注入基线 `--tc-text-scale:1` 保证仅换字体时字号官方原值）——标题字号随滑杆缩放、标题字体随全站字体联动；smoke +7 断言全绿
- 涉及路径：`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`、`theme-center/README.md`、`theme-center/AGENTS.md`
- 备注：**112 已部署重新验证全过**（md5 `12e153c5`）：125% 探针 h1 30/42.5、h2 27.5/40（真实 H2「整体布局」同步）、h3 25/37.5、h4-6 20/35、正文 20/35 全部精确；125%+msyh 组合 h2 27.5+YaHei；仅 msyh（100%）h2 22px+YaHei（字号官方、字体跟随）；默认态 h2 22/32 -apple-system 官方原样、门控全移除、5 样式元素就位、无 console 错误；测试状态已还原默认；**按流程：验证通过，询问用户后再部署 111**；本次同时执行归档（记录 34 条超限：保留最新 20 条，最旧 14 条移至 CHANGELOG.md）

### 2026-08-16 theme-center 新增外观扩展：会话区字号百分比 + 全站字体下拉 + 隐藏开关×3（参考 dsh-chat-tidy，外观 Tab，全部即时生效）

- 变更内容：按用户需求（参考 [ChuanTianML/dsh-chat-tidy](https://github.com/ChuanTianML/dsh-chat-tidy) 的语义锚点覆盖手法）在 theme-center 外观 Tab 新增三组功能——`lib/client.js` 新增「外观扩展」模块（单个 `<style>` `dsh-theme-center/appearance` + 三个 body 门控属性 `data-tc-scale`/`data-tc-font`/`data-tc-hide`）：① **会话区字号** 75-150% 滑杆（键 `textscale:v1` 默认 100，16px/28px 基线 calc 缩放 markdown 容器/段落/表格/代码/用户气泡，**不影响思考行/工具卡/上下文卡**，100% 移除门控=官方原样）；② **全站字体** 下拉（键 `font:v1`，8 项字体表，双路覆盖 `--dsw-font-family` + markdown 容器，代码字体不动）；③ **隐藏开关×3**（键 `hide:v1` JSON，`data-tc-hide~=` 门控 + display:none 隐藏思考行/工具卡/上下文卡）；外观 Tab 增至 5 节；新增 tc-select/tc-check 令牌样式；smoke 测试 +15 断言全绿
- 涉及路径：`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`、`theme-center/README.md`、`theme-center/AGENTS.md`、`AGENTS.md`
- 备注：theme-center/AGENTS.md 新增 4.8 外观扩展模块规范与验证清单 3 组条目；**112 已部署验证全过**（2026-08-16：外观 Tab 5 节就位、字号 125%→20px/35px 精确 + 工具卡保持 12.6px 不受缩放影响 + 100% 还原 16px、字体 msyh 双路覆盖 body+markdown、隐藏工具卡 17/17→0→恢复、刷新持久化 125%/msyh 恢复、状态已还原 100%/default/全不隐藏、无 console 错误）；**按流程：验证通过，询问用户后再部署 111**

### 2026-08-16 theme-center 新增表格列宽模块：表格撑满整列 + 解除 320px 列上限（常开，用户确认）

- 变更内容：用户反馈"表格宽度只有会话区一半、列内容挤成很多行"——排查确认官方 markdown 渲染器 `table{width:max-content}` + `td/th{max-width:min(30vw,320px)}` 导致中文长文本被压进 320px 窄列疯狂换行（实测表格 452px/内容列 896px，与聊天宽度/压制插件无关）。修复：`theme-center/lib/client.js` 新增 `TABLE_CSS` + `dsh-theme-center/table` 样式 effect——助手回答/用户消息内（`[data-chat-flow-kind="assistant-step"|"user"]` 稳定属性，不依赖 hash 类名）`table{width:100% !important;max-width:100% !important}` + `td/th{max-width:none}`；超宽表格仍横向滚动；常开不设开关（用户选"直接默认生效"）
- 涉及路径：`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`（+4 断言、样式元素 3→4）、`theme-center/README.md`、`theme-center/AGENTS.md`、`AGENTS.md`
- 备注：实测修复前后：表格 452px→896px、最长单元格 96px→71px（4 行→3 行）；本地 smoke 全绿；**112 已部署验证全过**（2026-08-16：table 样式元素注入、同构探针表格撑满容器 100%、`td max-width=none`、长文本单行渲染、无 console 错误）；**111 已部署生效**（2026-08-16 用户确认后同步 + 延迟 detach 重启 dsh-web.service，client.js md5 `d55c3035` 与 112 一致；浏览器 Ctrl+Shift+R 生效）

### 2026-08-16 删除已归档插件文件夹 chat-width-customizer/ 与 right-panel/（用户确认，仓库 + 111/112 external 副本一并清理）

- 变更内容：用户询问"被合并的插件文件夹可以删除了吗"并确认删除——① `git rm -r chat-width-customizer right-panel`（功能均已并入 theme-center / 被 dsh-better-sidebar 替代，全部代码仍在 git 历史中可随时找回）；② 111/112 的 `/root/.dsh/external/{chat-width-customizer,right-panel}` 一并 `rm -rf`（已不在 profile 注册，无风险），两台机器 external 现仅剩 5 个在用插件；③ 插件一览表移除两行
- 涉及路径：`AGENTS.md`（表格 + 变更记录）；仓库删除 `chat-width-customizer/`、`right-panel/`；111/112 删除 `/root/.dsh/external/chat-width-customizer`、`/root/.dsh/external/right-panel`
- 备注：回滚方式：`git checkout <commit> -- chat-width-customizer right-panel`；CHANGELOG.md 中的历史记录保留不动

### 2026-08-16 theme-center 一体化 v0.2.0：并入聊天宽度 + 新增聊天区精简（卡片双 Tab：主题/外观）

- 变更内容：按用户指示（"把 chat-width-customizer、theme-center 还有当前要开发的功能放到一个插件中，统一放到设置>插件中主题卡片" + 布局选择：卡内双 Tab + 宽度按钮移除 + 压制百分比滑杆）将 theme-center 扩展为一体化插件——① **卡片双 Tab**：「主题」Tab 原 23 款皮肤功能不动；「外观」Tab = 聊天宽度 6 档预设（896-1600px，localStorage 键 `dsh-theme-center:width:v1`，原 chat-width-customizer 功能，**标题栏宽度按钮移除**）；② **聊天区精简**：0-100% 滑杆（键 `dsh-theme-center:focus:v1`，默认 70），以 `--tc-focus` calc() 线性插值压制 Think 思考行/工具调用卡/上下文注入卡（标题 14→12px、摘要/来源淡至 0.6、Cordis 卡行高 32→22px、错误卡 ellipsis），`body[data-tc-focus]` 门控 pct=0 整组失效=官方默认；只改字号/行高/透明度不写颜色→天然适配全部皮肤；③ 新增 `theme-center/tests/smoke.mjs`（node 内置，apply 契约与零残留全绿；捕获并修复 `readSavedFocus` 的 `Number(null)=0` 回退陷阱）；④ chat-width-customizer 归档（文件夹保留，README 标注）
- 涉及路径：`theme-center/lib/client.js`、`theme-center/package.json`（0.2.0）、`theme-center/README.md`、`theme-center/tests/smoke.mjs`（新增）、`theme-center/AGENTS.md`、`chat-width-customizer/README.md`、`AGENTS.md`
- 备注：theme-center/AGENTS.md 已同步 4.4/4.6 规范与第六节验证清单（双 Tab/宽度/压制三档/主题抽查）；本地 smoke 全绿；**112 已部署验证全过**（2026-08-16：body 属性与三样式元素、默认 70% 落地 `--tc-focus:0.7`、工具卡标题 12.6px/摘要 0.72、Think 行同构探针 12.6px/0.825/0.72/图标 11.9px、Cordis 行 100% 时 22px、双 Tab 24 行、宽度 1152 生效+持久化+刷新恢复、压制 0%/100% 端点与门控成对、深海蓝皮肤下压制仍生效+官方干净还原、标题栏无宽度按钮、bundle 路由 200/200 + 越界 404、112 上 smoke 全绿、无 console 错误；112 测试状态已还原 896px/70%/官方）；**部署期间需在 112 profile `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 追加 `dsh-better-sidebar@0.12.2`**（pnpm 11 发布年龄策略拦截该包致所有 dsh plugin 操作失败，非本次代码问题）；**111 已部署生效**（2026-08-16 用户确认后：移除 chat-width-customizer、同步 theme-center（md5 与 112 一致）、延迟 detach 重启 dsh-web.service；111 实测——真实会话 25 个 Think 行 + 48 张工具卡按 70% 压制精确生效（12.6px/0.825/0.72/19.8px）、上下文来源 0.72、无 console 错误；111 profile `pnpm-workspace.yaml` `minimumReleaseAgeExclude` 用包名形式追加 dshmarket/dsh-better-sidebar——111 为 pnpm 11.5.0，与 112 的 11.21.0 对 name@version 格式要求不同）

### 2026-08-16 theme-center 按用户要求移除全部透明/毛玻璃（面板恢复不透明、去 backdrop-filter），保留渐变背景，112 实测全过

- 变更内容：用户反馈"不要透明效果"（先针对设置面板、后要求全部）——13 款新皮肤移除透明与毛玻璃：① `[id='root']` 去 `backdrop-filter: blur(20px)`（保留 transparent 让 body 渐变在空白区透出）；② 面板恢复不透明（layer 系列全部 hex 原值）；③ `.VOzbGW_panel` 规则删除；④ **渐变背景完整保留**
- 涉及路径：`theme-center/lib/skins/`×13（重新生成）、`theme-center/AGENTS.md`、`AGENTS.md`；112 上 `/root/.dsh/external/theme-center/lib/skins/`（已同步）
- 备注：112 两套验证全过（自研 41 项含"面板不透明"新断言 + dsh-skin 33 项）；实测 `rootBackdrop=none`、`layer-1=#ffffff`、渐变保留；**按部署流程：待用户确认后部署 111**

### 2026-08-16 theme-center 13 款新皮肤添加渐变 + 毛玻璃（参考 zhaiyateng/dsh-design-skills glassmorphism 规范），设置面板保持不透明，112 实测全过

- 变更内容：用户要求参考 [zhaiyateng/dsh-design-skills](https://github.com/zhaiyateng/dsh-design-skills)（MIT）设计 skill 加渐变色和毛玻璃——按其 glassmorphism SKILL.md（渐变底 + backdrop-blur ≥15px + 半透明玻璃卡 + 亮边框 + 克制面积）落地 13 款皮肤（自研 6 + dsh-skin 7）：① `[id='root']` 加 `backdrop-filter: blur(20px) saturate(1.15)` + transparent；② 面板透明度调低（亮 0.75/0.68/0.6，暗 0.62/0.55/0.48），bg-base 不透明；③ dsh-skin 7 款补各自色系渐变背景；④ 视觉模型两轮评审调参（blur 16→20px）；**⑤ 用户反馈"设置面板不需要透明效果"——`.VOzbGW_panel { background: var(--dsw-alias-bg-base) }` 设置面板固定不透明**
- 涉及路径：`theme-center/lib/skins/`×13（重新生成）、`theme-center/AGENTS.md`、`AGENTS.md`；112 上 `/root/.dsh/external/theme-center/lib/skins/`（已同步）
- 备注：112 两套验证全过（自研 41 项 + dsh-skin 33 项）；设置面板实测不透明（rgb(244,245,251)）、主界面毛玻璃保留（blur 20px）；`.VOzbGW_panel` 为 CSS-modules hash 类名，DSH 升级后需复核；**按部署流程：待用户确认后部署 111**

### 2026-08-16 theme-center 集成 KinGao294/dsh-skin 7 款精选皮肤（深海蓝/石墨灰/森林绿/日落紫/深夜黑/暖纸/樱花粉）并 112 实测全过

- 变更内容：用户要求参考 [KinGao294/dsh-skin](https://github.com/KinGao294/dsh-skin)（MIT）把主题加进 theme-center——提取其 client bundle 中 SKINS 数组（7 款 × 27 个 --dsw-alias-* 令牌覆盖，5 暗色 2 亮色），按 theme-center 规范生成固定色系 alias-only 皮肤 bundle（亮暗同值、颜色自洽、不映射 static，与 dsh-skin 的 colorScheme 行为等效但不改动官方亮暗属性）；中文名全部就位；注册表 THEMES +7（卡片共 24 行）、宿主 SKIN_IDS +7、lib/meta/ +7、README 许可注明 MIT 来源
- 涉及路径：`theme-center/lib/skins/skin-*.js`×7、`theme-center/lib/meta/skin-*.json`×7、`theme-center/lib/{client,index}.js`、`theme-center/README.md`、`theme-center/AGENTS.md`、`AGENTS.md`；112 上 `/root/.dsh/external/theme-center/`（已同步并重启，client rev `84c512014fd1`）
- 备注：**112 实测 33 项断言全过**（bundle 路由 7/7、卡片 24 行、逐款试穿→应用保持 + bg-base 精确匹配、官方默认干净还原、无 theme-center 错误）；视觉模型评审深海蓝：整体统一深色、可读性好；**按部署流程：待用户确认后部署 111**

### 2026-08-16 theme-center 自研皮肤改造：氛围渐变背景 + 半透明毛玻璃面板（参考各配色方案官方美学）并 112 实测全过

- 变更内容：用户反馈"设计太单调、亮色默认体验不好，找各主题说明/参考然后改造"——改造 6 款自研皮肤：① 参考各主题官方美学设计 body 氛围渐变（Catppuccin 奶油紫调光晕 / Tokyo Night 霓虹城市顶部光斑 / Nord 北极光 / 赛博朋克青紫霓虹 / 薄荷清新 / 苹果极简浅渐变），纯 CSS radial/linear-gradient（无静态资源，符合皮肤契约）；② 面板半透明化（layer-1/2/3 = rgba 0.86/0.8/0.74，bg-base 保持不透明保证底色稳定）实现毛玻璃通透感；③ **关键修复：`body[data-dsh-x] [id='root'] { background: transparent }`**（同 blue-fantasy 手法）——否则 body 渐变被 #root 不透明背景完全挡住（截图验证发现的根因）；④ 暗色霓虹光晕经 2 轮增强（顶部椭圆大光斑 alpha 0.3 左右），用 describe_image 视觉模型对截图评审确认效果
- 涉及路径：`theme-center/lib/skins/`×6（重新生成）、`theme-center/README.md`、`theme-center/AGENTS.md`、`AGENTS.md`；112 上 `/root/.dsh/external/theme-center/lib/skins/`（已同步）
- 备注：**112 实测 41 项断言全过**（含氛围渐变注入 + 面板半透明断言）；视觉模型评审：紫粉拿铁亮色"渐变可见、毛玻璃明显、协调优雅、完成度高"（亮色体验问题解决）、赛博朋克暗色"氛围非常到位、青色大光斑醒目、可读性好、不刺眼"；生成器（/tmp/gen-skins.py）现支持 backdrop 字段（亮/暗渐变）+ mk() 面板半透明化，后续自研皮肤直接复用；**按部署流程：待用户确认后部署 111**（含此前 6 款新皮肤全部变更）

### 2026-08-16 theme-center 新增 6 款自研皮肤（紫粉拿铁/清新浅绿/赛博朋克/苹果官网风/东京夜色/北欧极地，全中文名、亮暗双形态）并 112 实测全过

- 变更内容：用户要求新增主题并"主题名称都使用中文"——按 theme-center 规范流程新增 6 款自研**纯令牌重映射**皮肤（无背景画/无 DOM chrome，每款 ~15KB）：以 qq98 皮肤 161 变量结构（亮/暗双块）为模板写生成器，逐款定义色板（灰阶 21 档 + 品牌主色阶 + 语义色阶 + alias/specific 语义值表）自动生成 bundle；Catppuccin（Mocha/Latte 官方色板）→ 紫粉拿铁、清新浅绿（薄荷绿）、赛博朋克（霓虹青紫）、苹果官网风（极简灰阶）、Tokyo Night → 东京夜色、Nord → 北欧极地；注册表 THEMES 增 6 条（共 17 行）、宿主 SKIN_IDS 白名单增 6 个、lib/meta/ 增 6 个、卡片描述改 16 款
- 涉及路径：`theme-center/lib/skins/`×6、`theme-center/lib/meta/`×6、`theme-center/lib/{client,index}.js`、`theme-center/README.md`、`theme-center/AGENTS.md`、`AGENTS.md`；112 上 `/root/.dsh/external/theme-center/`（已同步，client rev `fbfbf75edacf`）
- 备注：**112 实测 33 项断言全过**（bundle 路由 6/6、卡片 17 行含 6 中文名、逐款试穿→应用保持、亮色/暗色 bg-base 精确匹配、样式标签恰 1、官方默认干净还原、无 theme-center 错误）；踩坑 3 个（已写入 theme-center 规范）：SKIN_IDS 白名单漏加致 404、生成器 data 属性缺 dsh 前缀致作用域不匹配、zh-CN 界面验证需双语定位+先展开侧边栏；**按部署流程：待用户确认后部署 111**

### 2026-08-16 right-panel 卸载，换装 DSH-better-sidebar（111/112 已部署生效）

- 变更内容：用户决定用 [DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar)（VSCode 风格右侧侧边栏工作台：文件资源管理器/CodeMirror 编辑器/终端/Git/浏览器/子代理拓扑，服务化 `ctx.betterSidebar` 供三方插件注册 tab 与文件预览器，MIT）替代自研 right-panel——两机均 `dsh plugin --profile web remove dsh-right-panel`（`/root/.dsh/external/right-panel` 保留可回滚）+ `dsh plugin --profile web add dsh-better-sidebar`（npm 安装 v0.12.1；pnpm 拦截 node-pty 构建脚本 → profile `pnpm-workspace.yaml` `allowBuilds: node-pty: true` 放行后重装成功，node-pty 本地编译通过）
- 涉及路径：`AGENTS.md`、`right-panel/README.md`；111/112 上 profile（deps/bundles 更换）、`/root/.dsh/profiles/web/pnpm-workspace.yaml`（allowBuilds node-pty）
- 备注：112 实测效果（用户已确认满意）：侧边栏默认展开 480px（`#root` margin-right 挤占布局，与 right-panel 的 grid 追加机制不同）、Explorer 文件树根 = 当前会话目录（/root/AI/deepseek/gen，按会话隔离）、CodeMirror 编辑器、xterm 真终端（shell 提示符）、折叠/展开正常、无 console 错误；111 重启 dsh-web.service 后生效（服务 active、`dsh-better-sidebar/client.js?rev=dbd5028ff700` 与 112 一致、right-panel 注入 0）；right-panel 的主题适配（harbor/trading 适配层）与语法高亮等成果保留在 `right-panel/`，需要时可回滚

### 2026-08-16 theme-center 修复：先试穿再应用同一主题回退默认（切换顺序：先卸载→再加载→再挂载）并 112 实测全过

- 变更内容：用户反馈"主题先试穿再应用就会变回默认主题"——112 实测复现（应用后 body 属性被清、背景/样式丢失而 localStorage 已写入）：根因：应用时先挂载新实例、后卸载试穿旧实例，旧实例 disposer（删属性/还原背景/移除 favicon）收回新实例刚写入的同一处 DOM；且若卸载放在加载之后，旧实例样式清理会误删新实例 CSS 标签（CSS 在 import 时注入、apply 不重新注入，调色板重映射丢失）。修复：`theme-center/lib/client.js` 的 `runJob` 中 `disposeCurrent()` 移到 `loadThemeApply()` **之前**（先卸载旧主题→再加载并挂载新主题），语义变为加载失败回官方默认+错误提示（路由自持，异常情形）；theme-center/AGENTS.md 4.3 切换语义与验证清单同步更新
- 涉及路径：`theme-center/lib/client.js`、`theme-center/AGENTS.md`、`AGENTS.md`；112 上 `/root/.dsh/external/theme-center/lib/client.js`（已同步并重启，rev `f625666a7491`）
- 备注：**112 三套回归全过**——复现脚本（试穿鲸吟→应用鲸吟：属性/背景/样式标签齐全）+ 主验证 14 项（试穿/退出/应用/刷新恢复/官方默认干净还原/亮暗/遮罩/标题链）+ 补充验证 + 10 款皮肤全量冒烟，无 theme-center 错误；验证脚本皮肤属性过滤改为白名单 SKIN_ATTRS（排除 notify-sound/describe-image 等其他插件的 data-dsh-* 属性）；**已部署 111**（用户确认后延迟 detach 重启 dsh-web.service，md5 `07d7d4f7`）

### 2026-08-16 插件一览表格移除"部署状态"列

- 变更内容：第二节"现有插件一览"表格精简——删除"部署状态"列，仅保留"文件夹 | 作用"两列
- 涉及路径：`AGENTS.md`
- 备注：用户指示"现有插件一览不要部署状态"

### 2026-08-16 更新插件一览：describe-image、right-panel 已在 111 生效

- 变更内容：第二节"现有插件一览"表格更新——describe-image/ 与 right-panel/ 部署状态由"112 验证通过；111 待确认"改为"111/112 已部署"（7 个插件全部双机部署完成）
- 涉及路径：`AGENTS.md`
- 备注：用户确认"这两个插件111也已经生效了"

### 2026-08-16 新增"现有插件一览"表格 + 变更记录归档（保留 20 条，12 条移入 CHANGELOG）

- 变更内容：第二节新增"现有插件一览"表格（7 个插件文件夹：chat-width-customizer/theme-center/web-lan/navbar/notify-sound/describe-image/right-panel 的作用与部署状态）；同时按归档机制执行归档——记录达 32 条，保留最新 20 条，最旧 12 条移至 CHANGELOG.md 顶部
- 涉及路径：`AGENTS.md`、`CHANGELOG.md`
- 备注：用户指示"将当前目录下的插件目录、作用更新到AGENTS.md文件"

### 2026-08-16 navbar 修复：中文界面 sidebarOf 匹配失败致导航条落入对话流（两级锚点：按钮中英 aria-label + 分隔条兜底）并 112 双语言实测通过

- 变更内容：用户反馈"112 上导航条在会话流区域展示，位置明显有问题"（此前英文 headless 全过但中文浏览器复现失败）——根因：`sidebarOf()` 只查英文 aria-label（`Collapse/Open/Expand sidebar`），中文界面（`lang=zh-CN`）按钮标签为「收起/打开/展开侧边栏」→ 选择器匹配失败 → 返回 null → 兜底 `flow.left + 12` → 导航条落入对话流内部。修复：`sidebarOf()` 两级定位——① 首选按钮 aria-label（**英文 + 中文**）所在列容器（`hHd-Xa_root`，0~280）；② 兜底官方分隔条 `[data-side="sidebar"]`（与语言无关），`position()` 对分隔条路径按其**中心 x** 取侧边栏右缘（实测 handle 276~284 中心 280 = 右缘；注意其父容器 `pI_x6G_frame` 是 AppFrame 全宽，不能向上找容器，第一版实现因此误取 frame.right=1920 被钳制贴对话流）；`src/client/index.ts` 与构建产物 `lib/client.js`（md5 `bb064ccc`）同步、README 更新
- 涉及路径：`navbar/src/client/index.ts`、`navbar/lib/client.js`、`navbar/README.md`、`AGENTS.md`；112 上 `/root/.dsh/external/navbar`（已同步并重启）
- 备注：**112 实测全过（双语言）**——zh-CN 与 en-US × 1920/1280 视口：**展开态 bar.left = sidebar.right + 12（292=280+12，两语言一致）**、窄窗口钳制 gap=8 不侵入对话流、无 console 错误；中文环境折叠跟随（「收起侧边栏」→ bar 67=56+11）与还原（「打开侧边栏」→ 292 delta=12）完整通过；opencode-go mimo-v2.5 视觉模型实看 zh-1920 截图确认「导航条位于侧边栏右缘紧邻位置（+10~15px）、未遮挡消息、布局协调」；修复过程发现 112 会话树类名 `.YDXeBa_sessionRow` 为真实会话节点（`projectRow` 是工作区分组，误点无对话流）

### 2026-08-16 新增 theme-center/AGENTS.md 主题开发规范（以后主题开发按此执行）

- 变更内容：新建 `theme-center/AGENTS.md`（用户指示"以后主题开发都按照这个规范来"）——沉淀 theme-center 开发全过程的规范：① 定位边界（纯视觉呈现层、纯浏览器切换、不写配置不重载）；② 包结构与文件职责表；③ 新增/更新皮肤流程（上游 bundle 零修改复用 + THEMES 注册表 + lib/meta 元数据 + 验证 + 记录）；④ 主题引擎机制（同源护栏分发路由、内核模块执行路径、miniCtx、串行泵、切换/残留回滚语义、持久化键、标题链基线）；⑤ 皮肤/UI 契约（--dsw-alias-* 令牌、body 属性作用域、disposer 全量收回、主题适配必须、内联资源）；⑥ 112 验证清单与 111 部署流程（含延迟 detach 重启）；⑦ 本目录变更记录机制；该文件已随工作区指令注入 theme-center 目录上下文
- 涉及路径：`theme-center/AGENTS.md`、`AGENTS.md`
- 备注：规范内容源自 2026-08-15 theme-center 开发与 112 验证全过程（含标题还原链缺陷修复、同源护栏、残留回滚配方等实测结论）

### 2026-08-16 describe-image 保存卡死修复 + 设置卡只留模型下拉（去掉「模型来源」）+ opencode-go baseURL 配置并 112 实测通过

- 变更内容：用户反馈"修改图像理解模型后保存一直卡在保存中"——根因：`CardForm.save()` 以鸭子类型探测批量写接口（`typeof scope.mutate === 'function'`），而 `DescribeImageSettingsScope` 恰有一个 private `mutate`（编译后即原型方法）→ 误判命中 batch 路径 → `await batch.mutate(...)` 拿到 `Promise<void>` 的 undefined → `result.ok` 抛 TypeError（unhandled）→ `saving` 永远 true。修复：scope 真正实现 `BatchResult` 契约（`mutate` 返回 `{ok, fields:[{field,landed}], code?, message?}`：一次 POST 提交全部写入、按读回视图逐字段判 landed、apiKey 以 secret-set 标记判、服务端拒绝返回 code/message 不误降级 unavailable、网络故障才降级；`set`/`unset` 复用同一实现）。同时按用户新需求**去掉「模型来源」下拉**：设置卡只显示「可用视觉模型」下拉（选中即填 provider/模型），自定义端点 9 字段与切换项全部移除（表单 specs 精简为 useConfiguredModel/configuredProvider/configuredModelId，保存时隐藏写 useConfiguredModel=true 兼容历史 false 状态），schema/路由不变；测试 **159 用例全绿**（新增批量写契约 6 条）
- 涉及路径：`describe-image/`（src/client/settings-scope.ts、src/client/DescribeImageSettingsCard.tsx、tests/client-scope.spec.ts、lib/client.js、README.md）、`AGENTS.md`；112 上 `/root/.dsh/external/describe-image`（已同步并重启）
- 备注：112 实测全过——**保存链路**（playwright 真实 selectOption + .di-save 点击：切 kimi-k3 → 保存 → 服务端落盘 → 刷新回显；切回 mimo-v2.5 → 保存 → 还原；无 console 错误；排查时发现「保存」正则误匹配卡片标题"有未保存的修改"子串导致误点标题=折叠卡片，验证脚本须用 `.di-save` 精确选择）；**卡片只显示模型下拉**（无「模型来源」toggle）；**configured 模式真实调用链路打通**——opencode-go 是 pi-ai 内置 catalog provider（端点 `https://opencode.ai/zen/go`，mimo-v2.5 目录声明 openai-completions + `input:[text,image]`），但其 profile 无 baseURL 会触发 resolveConfiguredVision 报错，已用 DSH 自己的 yaml setIn 序列化路径给 111/112 的 `llm-pi-ai.providers.opencode-go` 补 `baseURL: https://opencode.ai/zen/go/v1`（带 /v1；实测 `…/v1/chat/completions` + 凭证 → HTTP 200 返回 "Red"，不带 /v1 为 404；settings.yaml 为 DSH 自定义 flow 风格，手写行会被 yaml 包报 "Missing , between flow map items" 而 settings-file 解析即抛错——必须经 setIn 规范化写入）；两机凭证均含 OPENCODE_GO_API_KEY；**111 部署文件已同步（client.js md5 `43378e11`），需重启 dsh-web.service 生效——待用户确认**；112 验证后配置已还原 configuredProvider=opencode-go / configuredModelId=mimo-v2.5；验证脚本已清理

### 2026-08-16 新增"主题适配（必须）"开发契约：插件 UI 必须跟随 theme-center 主题切换

- 变更内容：第六节"皮肤/UI 插件开发契约"新增强制条目——插件 UI 样式必须使用官方皮肤令牌（`--dsw-alias-*`）或皮肤变量，不得硬编码颜色/背景/边框；个别皮肤缺令牌时按 right-panel/notify-sound 先例补皮肤限定适配层（选择器限定 body[data-dsh-<skin>] 补丁），不得全局覆盖
- 涉及路径：`AGENTS.md`
- 备注：用户指示"开发的插件主题要适配主题插件切换主题"；right-panel（harbor/trading 适配层）、notify-sound（10 款皮肤 + 暗色 33/33 实测）为本规范先例

### 2026-08-16 notify-sound 皮肤适配实测：10 款皮肤 + 暗色模式全过（ns-card 与主题卡逐项一致）

- 变更内容：用户询问"切换其他样式会适配主题吗"——112 实测（playwright，逐皮肤设置 `dsh-theme-center:active:v1` 后刷新对比计算样式）——**11 款外观（官方默认 + 10 款皮肤，亮色）33/33 全过**：每款下 ns-card 与 tc-card 的边框色/背景/圆角/名称色字号/header padding-gap 逐项相等，卡片背景随皮肤变化（10 种不同背景值：blue-fantasy 半透明、harbor 深蓝半透明、minecraft 深绿、xp 米黄…）；**官方默认暗色 3/3 全过**（Appearance 切 Dark：背景 rgb(44,44,46)/边框 rgb(67,69,74)/名称 rgb(249,250,251) 两张卡完全一致，无错误）。机制确认：样式全部走 `--dsw-alias-*` 官方皮肤令牌，皮肤 bundle 覆盖变量即自动跟随；期间捕获的 404 均为 trading/whale-song 皮肤 `dsh-ticker` 行情请求（404/405 + Binance CORS），属 AGENTS.md 已记录的**上游 fail-safe 预期降级**，与本插件无关
- 涉及路径：`AGENTS.md`（仅记录，验证脚本已清理）
- 备注：样式修复版仅部署 112；按流程待用户确认后部署 111（样式统一 + 皮肤适配验证版）

### 2026-08-16 notify-sound 样式统一：卡片改用官方皮肤令牌体系（对齐 theme-center/官方卡）并 112 实测通过

- 变更内容：用户反馈"提示音卡片和其他卡片样式不统一"——实测对比（playwright 计算样式）：官方 Shell 卡与 theme-center 主题卡均用 `--dsw-alias-*` 皮肤令牌（border-l2 边框、bg-layer-3/2 背景、label-dimmed hover/展开边框、label-primary 15px 600 名称、label-tertiary 描述），而 ns-card 误用不存在的 `--dsw-alias-line-divider`（fallback #e5e5e5 生效）+ 硬编码字号/间距（名称 14px、header padding 12/14 gap 10、无 hover/focus-visible/展开态区分）。修复：`lib/client.js` 卡片 CSS 整体换用与 theme-center 相同的令牌与数值——卡片 `border:1px solid var(--dsw-alias-border-l2)` + `bg-layer-3` + `border-radius:12px` + hover 边框 `label-dimmed` + 展开态 `bg-layer-2`；header `padding:14px 16px;gap:12px;border-radius:12px` + focus-visible 品牌色 outline；名称 15px/600 `label-primary`、描述 13px `label-tertiary`；body `border-top` + `margin:0 16px` 同 theme；行改透明边框 + hover `interactive-bg-hover`；按钮/下拉同 tc-pill/tc-btn 令牌（border-l2、13px、hover label-dimmed）；字符箭头换 theme 同款 SVG chevron（rotate 180deg）
- 涉及路径：`notify-sound/lib/client.js`、`notify-sound/README.md`、`AGENTS.md`；112 上 `/root/.dsh/external/notify-sound`（已同步并重启）
- 备注：测试全绿（宿主 34 + 浏览器 43 断言不变）；112 实测 **6/6 全过**——ns-card 与 tc-card 计算样式逐项相等（边框色/背景/圆角/header padding 14-16/gap 12/名称 15px-600/chevron SVG 同款）、无 console 错误；按流程待用户确认后部署 111


### 2026-08-16 navbar 修复：窄窗口导航条侵入对话流（position 钳制到对话流左缘左侧）并 112 实测通过

- 变更内容：用户反馈"112 上导航条在对话流中展示，位置明显有问题"——复现定位根因：对话流 896px 固定居中，视口 ≤1280px 时其左缘左移（1280px：flow.left=328；1152/1024px：flow.left=312），而导航条固定在 `sidebar.right + 12`（292~332）→ **1280px 重叠 4px、1152/1024px 重叠 20px**，压住对话消息。修复：`position()` 增加钳制 `next = min(anchor, flowLeft - bar.offsetWidth - 8)`——导航条右缘**绝不越过对话流左缘**（保留 8px 间隙）；空间充足（视口 ≥1366px）行为不变仍贴侧边栏 +12，空间不足时导航条左移（1280px 贴 flow 左缘、1152/1024px 微盖侧边栏右缘 16px，两害相权不碰消息）；`src/client/index.ts` 与构建产物 `lib/client.js`（md5 `1fe8d5e0`）同步、README 更新
- 涉及路径：`navbar/src/client/index.ts`、`navbar/lib/client.js`、`navbar/README.md`、`AGENTS.md`；112 上 `/root/.dsh/external/navbar`（已同步并重启）
- 备注：**112 实测全过**（playwright-core + chromium headless，修复前后对比）——修复前 6 视口（1920/1600/1366/1280/1152/1024）：1280 起重叠 4~20px；修复后全视口 overlap=false、gap≥8px（1920/1600/1366 保持 sideDelta=+12 贴侧边栏、1280 bar.left=280 贴 flow 左缘、1152/1024 bar.left=264 gap=8 不碰对话流）、无 console 错误；完整回归（展开 delta=12/折叠跟随/预览朝右弹出/节点数=user 行/active 药丸）全过；112 服务已重启（pid 133397）下发新 rev


### 2026-08-16 describe-image 设置卡极简化：configured 模式默认开启、只显示模型下拉（用户要求"只选已配置模型，不配协议/apikey"）

- 变更内容：用户反馈"现在还是要填写一堆参数，我只希望选择当前已配置的模型即可"——设置卡重构：① `useConfiguredModel` schema 默认改 `true`（新部署开箱即用），未选择模型时 `resolveConfig` 自动降级自定义端点（不报错，首次调用给清晰提示）；② configured 模式**只显示「可用视觉模型」下拉**（选中即填充 provider/模型，端点/密钥/协议全部来自模型设置），其余字段（baseURL/model/apiKey/apiKeyEnv/apiStyle/defaultPrompt/上限）全部隐藏，切到「自定义端点」才显示；③ 修复 boolean 字段渲染 BUG：settings 服务返回 boolean `true` 而 `choiceField` 只认字符串 → 卡片误判为非 configured 分支，改用 `booleanField`；测试 **153 用例全绿**
- 涉及路径：`describe-image/`（src/config-resolve.ts、src/client/{DescribeImageSettingsCard,locales}.tsx/ts、tests/configured-models.spec.ts、lib/、README.md）、`AGENTS.md`
- 备注：112 实测全过——设置卡默认「使用已配置模型」、接口地址/API Key/接口协议均隐藏、下拉列出「Xiaomi MiMo / MiMo V2.5」；选模型 → 保存 → settings 用户层写入 `configuredProvider=xiaomi`/`configuredModelId=mimo-v2.5`；真实调用（模型设置解析端点/密钥 → xiaomimimo）返回描述文本；无 console 错误；验证脚本已清理


### 2026-08-16 新增 notify-sound 会话提示音插件（参考 dsh-plugin-notify-sound 裁剪：仅内置音 + 配置全浏览器同步）并测试全绿

- 变更内容：新建 `notify-sound/` 文件夹（用户确认：参考 ldchaowin/dsh-plugin-notify-sound，去掉自定义音频上传/TTS/按工作区配置，仅内置合成音、区分情况提示音 + 默认配置一套、配置放设置>插件>插件配置卡片，并新增需求"配置所有浏览器同步"）——宿主半区 `lib/index.js`：`installSettingsSection` 注册 `notify-sound` 设置命名空间（schemastery schema 带默认值）+ `/notify-sound/settings` 路由（GET redacted 视图 value/base/user/revision/writable；POST 批量 set/unset 写用户层、revision 栅栏、经 dsh-settings `replace` 提交；同源护栏；settings/webServer 缺失静默不注册）；浏览器半区 `lib/client.js`（`__ModuleLoader__.load` id `dsh-notify-sound`，inject slots+sessions）：`NotifyConfigScope`（SettingsScope 契约直连路由：启动 GET、写即 POST、每 30s + focus/visibilitychange 刷新 → 跨浏览器/设备同步）+ Web Audio 合成 6 音（叮咚/风铃/铃铛/完成/成功/警示，前 5 个沿用参考合成参数、新增 alert 低频方波）+ 事件监听（回合结束、后台任务完成/失败、pendingInteraction 审批/提问/评审、goal 投影 blocked，600ms 同源去抖；注意类不受 quietCurrent 限制）+「提示音」卡片（官方槽位 `settings.plugin.item`，id `notify-sound`，order 35：总开关/当前会话完成不响/完成铃声/通用注意音/5 行注意事件，每行下拉+试听，`body[data-dsh-notify-sound]` 作用域样式 disposer 收回）；默认配置：完成=chime、通用注意=ding、审批/提问/评审=跟随通用、受阻=bell、失败=alert
- 涉及路径：`notify-sound/`（package.json、cordis.patch.yml、lib/{index,client}.js、tests/{test-host,test-client}.mjs、README.md、LICENSE）、`AGENTS.md`
- 备注：测试全绿——宿主 34 断言（schema 默认值/命名空间注册/路由 GET·POST·unset·403·400·405·422·404）+ 浏览器 43 断言（fake window+内存 settings 服务：回合结束默认 chime、quietCurrent/enabled 开关、5 类注意事件、goal blocked 单次不重复、job 完成/失败、定时/聚焦/可见刷新跨浏览器同步、脏数据 sanitize、路由不可达降级默认值、卡片 7 下拉/8 按钮/2 复选）；本地测试经 `node_modules/@deepseek-ai` symlink 解析（@deepseek-ai/* 未发布 npm，部署同流程，见 describe-image README）；**112 已部署验证全过**（link 安装 + schemastery/dsh-settings symlink + 重启；curl GET/POST/unset/403/400/405 + settings.yaml 落盘；playwright chromium 18/18：卡片渲染/默认值/修改持久化/试听发声/刷新回显/双页面同步/无错误，验证后配置已还原默认，验证脚本已清理）；**111 已部署验证通过**（用户确认后重启 dsh-web.service，playwright 5/5：bundle 注入/作用域/样式/卡片渲染/无错误）


### 2026-08-16 111 左侧导航条验证一：16 项实测全过 + pin 精选全链路 + 3 项观察记录

- 变更内容：按用户指示对 111 已部署的左侧导航条（左侧改造版，md5 `779b0905`）做第一轮独立浏览器实测（playwright-core 1.62 + chromium-1234 headless，全程只读，未改动任何部署/代码）——① 部署一致性：部署目录/仓库/服务端下发三方 md5 一致，`__DSH_BOOT__` 登记 `@vlln/dsh-navbar`（rev `e9d1baa1f5fc`，inject dsh-client-runtime/dsh-client-ui-primitives）；② 左侧定位 `bar.left = sidebar.right + 12`（292=280+12）；③ 节点数 = user 行数（2/2、3/3、5/5 多会话一致）；④ 激活药丸恰 1 个；⑤ 悬停预览卡（文本正确、朝对话区右侧弹出、.hover 加长）；⑥ 点击跳转（scrollTop 变化 + 激活跟随 + 目标行贴滚动容器顶 delta=0，容器顶在视口 76px 系页面头部，非缺陷）；⑦ <2 条自动隐藏（0/1 行会话 bar=none）；⑧ **pin 精选全链路**（📌 data-active + 行 data-vlln-pinned + 导航点 .pinned 金色，按序布局会话实测通过并还原）；⑨ 无 console/page 错误、style 唯一
- 涉及路径：`AGENTS.md`（仅记录，无代码改动；验证脚本 /tmp/navbar-*.mjs）
- 备注：**观察项（非阻断，均无视觉影响）**：① 切至 <2 行会话时 bar 隐藏但旧 dots 残留 DOM（display:none，下次重建清除）；② 流式进行中（Running）会话的 turnTail 行临时位于流顶部（user 行 0 之前），此刻 pin 金色节点暂不出现，回合落定按序后恢复——瞬态；③ 111 现有会话最多 5 条 user 消息，>11 滑动窗口无法在本机复现（112 已实测 16 条场景）；会话列表全程动态变化（并行会话活跃），多次扫描均按实际行定位


### 2026-08-16 navbar 改造：对话节点导航条移至左侧（贴左侧边栏右缘）并 111/112 双机验证通过

- 变更内容：用户指示"左侧导航条"——navbar 定位由对话区右缘改为**贴左侧边栏右缘**（`sidebarOf()`：定位 `Collapse/Open/Expand sidebar` 按钮所在侧栏实体容器，`bar.left = sidebar.right + 12`，兜底贴对话流左缘内侧）；悬停预览卡由节点左侧弹出改为**右侧弹出**（朝对话区，`preview.left = r.right + 14`）；`sizeObserver` 增观察侧栏容器（折叠/展开实时跟随）；`src/client/index.ts` 与构建产物 `lib/client.js`、README 同步；111/112 已部署（两机 bundle md5 一致 `779b0905`）
- 涉及路径：`navbar/src/client/index.ts`、`navbar/lib/client.js`、`navbar/README.md`、`AGENTS.md`；111/112 上 `/root/.dsh/external/navbar`（已同步）
- 备注：**验证全过**——111（playwright-core+chromium headless）**16/16**：左侧定位 delta=12、节点数=user 行、悬停预览右侧弹出、点击跳转目标行贴滚动容器顶 **delta=0**、折叠侧边栏导航条跟随左移（292→67）且折叠态仍保持 +12、展开还原、style 唯一、无 console 错误；112 功能项全过（定位/悬停/折叠跟随/还原，跳转在可滚动场景 delta=0 精确）；两处测试环境误报已澄清：① 跳转对齐断言原写"目标行距视口顶 ≤60"，实际滚动容器顶在视口 76px（页面头部），修正为对比容器顶 → delta=0 精确；② 112 现有会话均为短会话（maxScroll=0 无法滚动），缩小视口复测 dot[0] 跳转 delta=0、dot[1] 因目标已完全可见不滚动（scrollIntoView 语义，非缺陷）


### 2026-08-16 describe-image 支持复用 DSH 模型设置中已配置的视觉模型（configured 模式）并 112 实测通过

- 变更内容：用户询问"图像理解能否直接用模型中已经配置好的模型"——调研确认 dsh-llm-pi-ai 支持配置任意 OpenAI 兼容 provider（providers dict + 模型级 `input` 模态声明），实现复用：host 新增 `GET /describe-image/models`（遍历 `llm.listConfigurableProviders` → settings 服务中已配置的 provider section → `listModels` 过滤图像能力，返回可用视觉模型）+ configured 模式执行（配置 `useConfiguredModel` / `configuredProvider` / `configuredModelId`，`resolveConfiguredVision` 每次调用从 provider 配置 section 动态解析 baseURL 与 apiKeyEnv 凭证引用）；设置卡新增「模型来源」（自定义端点 / 使用已配置模型）与「可用视觉模型」下拉（拉取 /describe-image/models，选中即填充 provider/模型字段）；测试 **152 用例全绿**（新增 configured-models 12：profileAt/枚举/解析/校验/端到端）
- 涉及路径：`describe-image/`（src/configured-models.ts、src/settings-routes.ts、src/{index,config-resolve}.ts、src/client/{DescribeImageSettingsCard,locales}.tsx/ts、tests/configured-models.spec.ts、lib/、README.md）、`AGENTS.md`、`CHANGELOG.md`（首次归档）
- 备注：112 实测全过——`settings.yaml` 写入 `llm-pi-ai.providers.xiaomi`（apiKeyEnv: XIAOMI_MIMO_API_KEY、mimo-v2.5 `input: [text,image]`）后 `/describe-image/models` 返回 mimo-v2.5；真实 dsh-llm + pi-ai adapter 组合下 configured 模式工具端到端调用成功（模型设置解析 baseURL/密钥 → xiaomimimo 返回描述）；浏览器设置卡「模型来源」切换 + 下拉列出「Xiaomi MiMo / MiMo V2.5（xiaomi / mimo-v2.5）」、无 console 错误；验证脚本已清理；**本次同时执行首次归档**（记录达 30 条：保留最新 20 条，最早 11 条移至 CHANGELOG.md）



### 2026-08-16 right-panel 预览列默认折叠：刷新页面后不自动展示（恢复 tab 但列收起）

- 变更内容：用户反馈"有侧边栏+代码查看侧边栏不要默认展示，比如刷新页面默认折叠"——explorer 已默认折叠；预览列（代码查看）根因：preview store `setRoot` 恢复持久化 tabs 时 `open: tabs.length > 0`（刷新后恢复的 tab 自动展开预览列 480px）。修复：恢复 tabs 但 `open: false`（预览列保持折叠；open 状态本就不持久化，用户点文件时 openFile 置 true 展开）；冒烟测试新增两条断言（不再按 tabs 自动展开 + open: false）
- 涉及路径：`right-panel/lib/client.js`、`right-panel/tests/smoke.mjs`、`right-panel/README.md`、`AGENTS.md`；112 上 `/root/.dsh/external/right-panel`（同步）
- 备注：112 实测 **4/4 断言全过**——打开文件预览列展开 480px、刷新后预览列默认折叠 1px、再次点文件重新展开 480px、无页面错误；**按部署流程：待用户确认后再部署 111**


### 2026-08-16 right-panel 语法高亮 + 文件类型补充（.config 等）并 112 实测通过

- 变更内容：用户反馈"侧边栏有些文件不支持打开、没有语法高亮是否正常"——调查确认均属上游设计（未知扩展名 → unsupported 占位「此格式暂不支持预览」+ 下载提示；CodeViewer 纯 `<pre><code>` 无高亮，markdown 代码块仅 language-xxx 类名）。用户确认加语法高亮并补充文件类型（.config 打不开：其 ext=`config` 不在 CODE_EXT）。实现（全部在 `lib/client.js`）：① **轻量语法高亮** `highlightCode`（自研正则 tokenizer，无外部依赖，避免引入 hljs ~200KB）：13 个语言组（js 家族/json/python/go/rust/c 家族/shell/配置类/sql/html/css/diff/通用 fallback），token 分类（注释/字符串/数字/关键字/大写类型/函数调用），逐个 escapeHtml 后包 `hljs-*` span（无注入面），CodeViewer 与 markdown fenced code 均接入；配色 `dsh-right-panel/highlight` style 引用 `--aion-*` 变量（官方亮/暗 + theme-center 全部皮肤自动适配），disposer 收回；② CODE_EXT 补充 7 个扩展名：`config`/`json5`/`webmanifest`/`properties`/`desktop`/`service`/`ipynb`；冒烟测试新增 5 条断言（highlightCode/config 扩展名/highlight style/hljs 类名/CodeViewer 接入）
- 涉及路径：`right-panel/lib/client.js`、`right-panel/tests/smoke.mjs`、`right-panel/README.md`、`AGENTS.md`；112 上 `/root/.dsh/external/right-panel`（同步）
- 备注：112 实测 **11/11 断言全过**——.ts 打开且 24 个高亮 span、.py 12 个 span、.config 正常打开（不再 unsupported）、markdown 代码块高亮、XSS 安全（含 `<script>` 文本无注入）、高亮 style 注入、暗色下关键字配色生效 rgb(77,159,255)、无 console 错误；测试文件（rp-test.*）已清理；验证中发现 112 当前会话已是 ruoyi-vue-pro 项目（并行会话创建），测试文件临时放项目目录测完即删；**按新部署流程：待用户确认后再部署 111**


### 2026-08-16 修订部署流程：112 验证通过后先询问，用户同意才部署 111

- 变更内容：第三节第 6 点"部署验证"规则修订——明确 112 验证通过后**必须询问用户是否部署 111**，用户同意后才可部署；原因：111 部署需重启 dsh-web.service，会中断该机其他进行中的任务，不得自动执行
- 涉及路径：`AGENTS.md`
- 备注：用户指示"插件开发完成不要安装到111，先在112上验证好，问我要不要部署到111，我同意后再部署111"


### 2026-08-16 describe-image 修复：设置卡新增 /describe-image/settings 读写接缝（绕过官方命名空间白名单）并 112 实测通过

- 变更内容：用户反馈 112 上「图像理解」设置卡显示"当前部署未暴露此命名空间"——调查确认官方 apiproxy 的 `WEB_SETTINGS_NAMESPACES` 白名单硬编码（agent-loop/shell/locale/…，官方注释明示"adding a section to that page is a decision made here rather than by the registering plugin"），第三方命名空间一律 `settings-not-exposed`。自包含修复：host 半区新增 `/describe-image/settings` 路由（GET redacted 视图 value/base/user/revision/writable + secrets 标记；POST 批量 set/unset 写用户层、revision 栅栏、空 apiKey 不覆盖、内部经 dsh-settings `replace` 提交 → installSettingsSection onChange 触发 → 工具下次调用即生效；同源护栏）+ 浏览器端 `DescribeImageSettingsScope`（实现 SettingsScope 契约直连该路由，secret no-op 语义），设置卡不再依赖官方 settingsScope（inject 移除 settingsScope 服务）；attach-routes 导出 readJsonBody/json 供复用；测试 **140 用例全绿**（新增 settings-routes 10 + client-scope 7）
- 涉及路径：`describe-image/`（src/settings-routes.ts、src/client/settings-scope.ts、src/{index,attach-routes,client/index}.ts、tests/{settings-routes,client-scope}.spec.ts、lib/、README.md）、`AGENTS.md`
- 备注：112 实测全过——curl GET/POST settings 路由（写入 baseURL/model → 用户层生效、redacted 视图不泄密钥）；浏览器（playwright-core+chromium headless）设置 → Plugins 卡渲染「图像理解」卡、展开显示 9 字段表单、已写入的 `baseURL=https://api.xiaomimimo.com/v1` `model=mimo-v2.5` 正确回显、无 notExposed 提示、无 console 错误（排查期间用 apply 探针确认 bundle apply/effect/样式注入均正常，此前"卡片未渲染"判断系 playwright tab 点击方式误报，原生 el.click() 正常）；describe-image 宿主依赖修复（`@deepseek-ai/schemastery` scoped + symlink）已随 112 部署生效，不再拖垮启动


### 2026-08-16 新增 navbar 对话节点导航条插件（零修改复用 vlln/dsh-navbar）并部署 112 验证 + 111 正式使用

- 变更内容：新建 `navbar/` 文件夹（用户指示"参考 https://github.com/vlln/dsh-navbar 实现对话节点导航条"）——**零修改复用**上游（MIT，上游提交 `10e9d1546db2`）：官方 bundle 插件形态（`dsh.bundle.patch`→cordis.patch.yml insert `dsh-navbar`/`@vlln/dsh-navbar`，Node half 空 apply，client bundle 24KB 为 tsdown 构建产物，包名保留 `@vlln/dsh-navbar` 以保持 `__ModuleLoader__.load({id})` 与包名强绑定）；功能 = 对话区右缘等距节点串（每 user 消息一节点）、激活药丸跟随阅读位置、悬停预览卡（6 行截断）、整条连续悬停（间隙无死区）、滚轮切换、整条可点跳转（按最近节点）、>11 节点滑动窗口、<2 条 user 消息自动隐藏、精选 pin（assistant 操作条 📌，金色节点 + localStorage 按会话持久化）；零数据通道依赖，只靠官方锚点（`data-time-hover-root`/`data-chat-flow`/`data-turn-tail`/`conversation.chat.assistant-actions` 插槽，均已核对本机 0.1.0-rc.6 bundle 存在）；随仓库保留上游 src/ 与 tsdown.config.ts 以便改版重建
- 涉及路径：`navbar/`（package.json、cordis.patch.yml、lib/{client.js,index.mjs}、src/{client/index.ts,index.mjs}、tsdown.config.ts、pnpm-workspace.yaml、README.md、LICENSE）、`AGENTS.md`；111/112 上 `/root/.dsh/external/navbar`（安装）、`/root/.dsh/profiles/web/`（依赖与 bundles 登记）
- 备注：**112 实测全过**（playwright-core + chromium，多轮验证：无 stub 真实浏览器 5/5——bundle 注入、节点数=user 消息数、悬停预览、点击跳转+active 药丸、无页面错误；16 条消息长对话验证窗口截断 10 dots+more 细点、滚轮切换、间隙整条可点、active 跟随滚动到顶=首节点、样式单一 style 标签；<2 条 user 消息自动隐藏为设计行为）——验证期 112 为共享验证机，并行会话部署 right-panel/describe-image 多次重启服务致验证中断，重跑通过；期间发现并**临时移除** 112 上损坏的 dsh-right-panel（bundle id 未注册，UI 阻断）与缺 `@deepseek-ai/dsh-settings` 依赖的 dsh-describe-image（拖垮启动，并行会话已处理并恢复），验证完成后均已还原；**112 测试会话已清理**（删除 6 个验证创建的会话目录 + workspace.json/session_projcache.json 索引同步清理，备份 `.bak-navbar-cleanup`，112 现仅剩原有「验证通过」会话）；111 部署完成（delayed detach 重启 dsh-web.service 避免中断回合），111 实测 10/10 全过（bundle 注入、元素存在、1 条隐藏/2 条出现、节点数正确、悬停预览、点击跳转+active、无错误）；**用户看不到导航条的排查结论：需 Ctrl+Shift+R 强制刷新（bundle 仅页面加载时获取，自动重连不重拉）+ 打开 ≥2 条 user 消息的会话**；112 当前若重启会因 describe-image 缺依赖崩溃（并行会话处理中）


### 2026-08-16 right-panel 默认折叠侧边栏；目录问题澄清（用户确认展示的就是会话目录）

- 变更内容：用户指示"默认关闭侧边栏"——right-panel 浏览器半区两处改动：① createLayoutStore 初始 `explorerCollapsed` 由 false 改为 true（默认折叠）；② layoutSetRoot 恢复逻辑由 `=== "collapsed"`（localStorage 无值即展开）改为 `!== "expanded"`（仅显式展开过才展开，默认关闭）；冒烟测试新增两条断言（初始 true + 恢复逻辑）。目录问题澄清：用户先后反馈"打开的目录不是当前工作目录/是用户根目录"，经调查 112 上所有会话 cwd=/root（唯一 workspace /root），面板显示的正是当前会话目录（= 会话 cwd），GUI workspace chip（`pXSMma_workspace`）亦显示 root，一一对应；GUI 新建 workspace 支持目录选择（`workspaces.createDirectory`，directory-picker 挂 `conversation.hero.workspace.directoryFlow` 槽位），会话 cwd 跟随所选 workspace；用户随后确认"看错了，当前展示的就是会话目录"，无需代码改动
- 涉及路径：`right-panel/lib/client.js`、`right-panel/tests/smoke.mjs`、`AGENTS.md`；112 上 `/root/.dsh/external/right-panel`（同步）
- 备注：112 实测默认折叠 PASS——无持久化时 explorer 1px（折叠）+ 浮动展开按钮 flex + grid 5 轨含 0px；显式展开后 localStorage 写 `project-panel-collapse:<root>=expanded`，刷新后仍展开 260px；若用户浏览器存过 expanded 会记住展开（Ctrl+Shift+R 后仍展开可手动折叠一次，或清 localStorage）


### 2026-08-16 right-panel 主题适配：补齐 harbor/trading 两款皮肤的 --aion-* 面板变量

- 变更内容：用户反馈"修改主题后右侧面板与主题不匹配"——调查确认 theme-center 10 款皮肤中 8 款自带面板适配（bundle 定义 `--aion-*` 变量 + `body[data-dsh-x] [data-aionui-*]` 微调样式，xp 实测跟随），**harbor（夕港）/ trading（交易终端）两款上游 bundle 完全缺适配**（0 变量，上游 npm 0.1.16 最新版同样缺失，为上游固有缺口）；实测 harbor 亮色下官方 UI 为深色半透明纱（`--dsw-alias-bg-layer-1:#181f36b3`、body color-scheme:dark）而面板白色 #f9fafb。方案：在 right-panel 浏览器半区新增**皮肤适配层**（`SKIN_ADAPT_CSS` 常量 + `skin-adapt` effect）——静态注入选择器限定的变量补丁（`body[data-dsh-harbor]` / `body[data-dsh-trading]` / `body[data-dsh-trading][data-ds-dark-theme]`），取值优先引用皮肤自身变量（var(--dsw-alias-*)/var(--dsh-trd-*)，皮肤调色实时跟随），fallback 为实测值；仅这两款皮肤应用时生效，其余 8 款不受干扰，style 随 disposer 收回（卸载/热重载无残留）
- 涉及路径：`right-panel/lib/client.js`、`right-panel/tests/smoke.mjs`、`right-panel/README.md`、`AGENTS.md`；112 上 `/root/.dsh/external/right-panel`（同步）
- 备注：112 实测 **16/16 断言全过**——harbor 面板背景 rgba(24,31,54,.7) 深蓝半透明+浅色文字（与官方 UI 一致）、trading 亮色 #fff/#1b2431、trading 暗色 #10151d/#dbe2ec、xp 等已适配皮肤回归不受影响、官方默认完全还原、无 console 错误；目录问题调查结论：面板根 = 会话创建时的静态 cwd（DSH 无会话内动态 workdir 机制，112 唯一 workspace=/root），目录问题后续澄清：用户确认看错，面板展示的就是当前会话目录（会话 cwd），无需代码改动（见下一条记录）


### 2026-08-16 新增 right-panel 右侧面板插件（复用 dsh-web-ui aionui-panel 产物）并部署 112 验证

- 变更内容：新建 `right-panel/` 文件夹（用户指示"参考 zhu1090093659/dsh-web-ui 开发右侧面板插件"，对应其 `packages/dsh-aionui-panel` / npm `@linxin666/dsh-client-ui-aionui-panel@0.1.16`，Apache-2.0 注明出处）——vendor 上游构建产物：宿主半区 `lib/index.js`（workspace 门卫 + fs/git 服务 + `/aionui-panel/*` 路由（list/read/write/search/delete/git status·diff·stage·unstage·discard/raw）+ SSE 变更流 + systemPrompt 公告，注入 webServer/subprocess/workspaceRegistry/systemPrompt）与浏览器半区 `lib/client.js`（向 shell 三栏 grid 追加「预览 + 文件/变更」两列：文件树/文件名搜索/10+ 格式多 tab 预览/SCM/拖文件入输入框/宽度拖拽与按项目持久化）；两处适配：① 访问护栏由上游 loopback-only 改为同源护栏（Sec-Fetch-Site/Origin 校验，允许局域网 IP 访问，与 theme-center 一致）；② client.js 模块 id 由上游包名本地化为 `dsh-right-panel`（共 11 处含 5 个 CSS 去重键，client-modules 要求注册 id 与包名一致，否则浏览器端无法激活）；包名 `dsh-right-panel`，insert id `ui-dsh-right-panel`，`dsh.client.inject` 保留上游三项；README/LICENSE/冒烟测试（tests/smoke.mjs，node 内置）齐全
- 涉及路径：`right-panel/`（package.json、cordis.patch.yml、lib/index.js、lib/client.js、tests/smoke.mjs、README.md、LICENSE）、`AGENTS.md`；112 上 `/root/.dsh/external/right-panel`（安装）
- 备注：112 部署验证通过——**link 安装注意：首次 `dsh plugin add link:` 只登记依赖、可能未进 `dsh.profile.bundles`（本次即如此），重跑一次 add（幂等）即补齐，装完务必 `dsh plugin list` / `--dump-config` 确认 bundle 已登记**；playwright-core + chromium 实测 21/21 断言全过（两列挂载/5 轨 grid/260px 默认/目录展开/预览 480px 与内容渲染/搜索命中/拖拽 1:1 与双击复位/折叠 1px 边框与浮动展开/SCM 非仓库降级/localStorage 持久化与刷新恢复/xp 皮肤并存）+ 拖文件入输入框 PASS；宿主路由全流程 curl 验证（读写/mtime 冲突/搜索/删除/门卫越界 403/SCM status·diff·stage·unstage·discard/untracked 删除/跨站 403/同源放行/SSE）；测试仓库 /root/rp-git-test 已清理；验证期间并行会话部署 describe-image 多次重启 112 服务致测试中断，重跑通过；⚠️ 112 当前 describe-image host bundle 引用 `@deepseek-ai/dsh-settings` 解析失败会拖垮启动（其部署会话处理中，与本插件无关），如遇 112 服务反复掉线可临时 `dsh plugin remove dsh-describe-image` 排查

### 2026-08-16 新增 web-lan 局域网直连插件（免反代）并部署 112 验证 + 111 正式使用

- 变更内容：新建 `web-lan/` 文件夹（host 插件 `@user/dsh-web-lan` v1.0.0）——dsh Web 局域网直连（免反代）三件套：① index.html 注入 crypto.randomUUID polyfill（纯 HTTP 局域网来源无安全上下文）；② 15 个特权 /api 方法（settings/credentials/host/agentPreset/llm.discoverModels）经 apiProxy relay 放行局域网客户端配置模型与插件；③ 重写 dsh-client-connection client.js 使浏览器端 isLoopback 恒为 true（插件配置卡片非本机可渲染）；bundle patch（cordis.patch.yml）自带 webserver 0.0.0.0:3080 配置，`dsh plugin add link:` 安装后自动应用，无需再手动改 profile patch；README/LICENSE 齐全，单元测试 node:test 9/9 通过（polyfill 注入、isLoopback 重写、relay 转发/500 兜底、特权方法清单）
- 涉及路径：`web-lan/`（lib/index.js、package.json、cordis.patch.yml、README.md、LICENSE、test/index.test.js）、`AGENTS.md`；111/112 上 `/root/.dsh/external/web-lan`（安装）、`/root/.dsh/profiles/web/`（package.json 依赖与 bundles 登记、cordis.patch.yml 清空为 []）
- 备注：旧临时版（`/root/AI/deepseek/dsh-web-lan` symlink + profile patch 手动安装）已按用户要求在 111/112 卸载（删 symlink、patch 清空，备份 `.bak-web-lan-v1`）；112 实测 4 项全过（polyfill marker、`isLoopback: true`、局域网来源 settings.describe/credentials.describe 返回业务响应、插件列表登记），111 同 4 项验证通过（111 安装由用户手动完成：安装命令中断后用户手动 `dsh plugin add` 并启动服务，安装结果与标准流程一致）

### 2026-08-16 新增 describe-image 图像理解插件（参考 dsh-web-ui dsh-tool-describe-image 移植）

- 变更内容：新建 `describe-image/` 文件夹（用户指示"参考 zhu1090093659/dsh-web-ui 实现图像理解插件"，对应其 `packages/dsh-tool-describe-image`，Apache-2.0 注明出处）——host 半区注册 `describe_image` 工具（本地路径 / http(s) URL / 附件引用 / 裸附件 id 四种输入 → OpenAI 兼容视觉端点，chat-completions / responses 双协议，只返回文本进对话，图片字节绝不进会话记录）+ `installSettingsSection` 注册 `describe-image` 设置命名空间 + `/describe-image` prefix 路由（POST attach 上传→附件存储→markdown 引用；GET raw/<id> 回读渲染；同源护栏）；浏览器半区（tsdown 构建，`window.__ModuleLoader__.load` 官方 bundle 格式）：发送改写（拖拽/粘贴图片 → describe-image 引用）+ 「图像理解」设置卡（官方槽位 `settings.plugin.item`，id `describe-image`，order 40，9 字段 staged form，secret 字段不回读）+ 中英词典；适配点：上游全家桶槽位 `web-ui.plugin.item` 改为官方槽位、CSS Modules 改内联样式（`body[data-dsh-describe-image]` 作用域）、新增同源护栏、包名 `dsh-describe-image`；配置默认留空可挂载，设置卡填写即时生效（端点为知识库已配置的 xiaomimimo `mimo-v2.5`，密钥走环境变量/设置卡 secret，不写明文）；测试 123 用例全绿（工具端到端 / attach 路由 / 设置 section / 真实 Loader+cordis.yml 组合 / 语义缓存 / 发送改写），`@deepseek-ai/dsh-*` 经 vitest alias 从本机 DSH 全局安装树解析（npm root -g）
- 涉及路径：`describe-image/`（package.json、cordis.patch.yml、pnpm-workspace.yaml、tsdown.config.ts、tsconfig.json、vitest.config.ts、src/×15、tests/×8、lib/{index,invariant,client}.js、README.md、LICENSE）、`AGENTS.md`
- 备注：构建产物 lib/ 随源码提交（link 安装直接可用）；本机 pnpm store 曾因共享挂载 `.pnpm-store/v11/index.db` 权限 000 报 SQLITE_ERROR，chmod 644 修复；测试需 DSH 环境（README 注明）；部署目标 112（验证）+ 111（正式使用），密钥建议 `XIAOMI_MIMO_API_KEY` 环境变量注入

### 2026-08-15 theme-center 部署到 111（AI 主机，正式使用）

- 变更内容：插件部署到本机 111（AI，`/root/.dsh/external/theme-center`，`dsh plugin add link:` 安装，bundles 已登记，client.js md5 与 112 验证版本一致）；延迟 detach 触发 `systemctl restart dsh-web.service`（避免中断当前回合，前端自动重连恢复）；README 部署目标更新为 112（验证）+ 111（正式使用）
- 涉及路径：`theme-center/README.md`、`AGENTS.md`；111 上 `/root/.dsh/external/theme-center`（安装）
- 备注：111 为 systemd 服务（dsh-web.service）；重启后需验证服务 active 与页面注入 `theme-center/client.js`

### 2026-08-15 新增 theme-center 主题插件：集成 dsh-web-ui 全部 10 款皮肤 + 「主题」设置卡片

- 变更内容：新建 `theme-center/` 文件夹（个人主题插件，纯视觉、不含宽度定制）——按用户指示参考 zhu1090093659/dsh-web-ui 的皮肤中心（skin-center）实现：在「设置 > 插件配置」注册「主题」卡片（官方槽位 `settings.plugin.item`，id `theme`，参考官方 bash/agent-loop 卡片外框与皮肤中心交互），内置该仓库全部 10 款皮肤（蓝色幻想/龙的传人/夕港/初音未来/Minecraft/QQ2008/同花顺/交易终端/鲸吟/XP，bundle 原样复用，BSD-3-Clause 注明出处），支持试穿/应用/持久记忆（localStorage `dsh-theme-center:active:v1`）、亮暗预览（官方 theme 服务）与背景遮罩滑杆（`--dsw-skin-scrim`）；宿主半区注册同源路由 `/api/theme-center/bundle/<id>`（webServer，带同源护栏）按需分发 `lib/skins/` 内 bundle，浏览器半区走内核 `__ModuleLoader__`/`__DSH_MODULES__` 执行（同皮肤中心 try-on 路径，无 eval、无配置写入、无页面重载）；miniCtx.get 委托真实上下文（ths/trading 可读 connection，缺失降级）
- 涉及路径：`theme-center/`（package.json、cordis.patch.yml、lib/index.js、lib/client.js、lib/skins/×10、lib/meta/×10、README.md、LICENSE）、`AGENTS.md`
- 备注：皮肤 bundle 约 1.3MB 原样内置；与 dsh-web-ui 皮肤中心不建议并存（README 已注明）；**已在 112 部署验证通过**（`/root/.dsh/external/theme-center` link 安装，bundle rev `ba60879d425c`；playwright-core + chromium headless 共 3 轮 40+ 断言全过：主题卡片 11 行、试穿/退出试穿完全还原、应用/持久化/刷新恢复、官方默认干净还原、亮暗预览、遮罩滑杆、10 款皮肤全量冒烟、xp/miku DOM 与标题链还原）；开发中发现并修复标题还原链缺陷（连续切换时后装皮肤会快照前一皮肤标题，挂载前统一重置为引擎基线）；ths/trading 行情请求 404/405/CORS 为上游 fail-safe 预期降级（未装 dsh-fun-ticker/dsh-longbridge），不影响使用

### 2026-08-15 chat-width-customizer 部署到 111（AI 主机）并修复 pnpm 状态文件损坏

- 变更内容：插件同步部署到 111（192.168.31.111，`/root/.dsh/external/chat-width-customizer`，`dsh plugin add link:` 安装，bundles 已登记）；修复 111 profile 的 `node_modules/.modules.yaml`（pnpm 状态文件损坏导致 pnpm 崩溃，备份为 `.modules.yaml.bak` 后删除重建）；重启 dsh-web.service（detach 延迟触发，避免中断当前回合）后验证通过：服务 active、页面注入 `chat-width-customizer/client.js?rev=979d48e91068`（与 112 同版本）；README 部署目标更新为 112（验证）+ 111（正式使用）
- 涉及路径：`chat-width-customizer/README.md`、`AGENTS.md`；111 上 `/root/.dsh/external/chat-width-customizer`、`/root/.dsh/profiles/web/`（安装与修复）
- 备注：111 为 systemd 服务（dsh-web.service，unit 自带 DEEPSEEK_API_KEY）；重启中断了运行中的会话回合，前端自动重连恢复；git 提交后按约定推送

### 2026-08-15 在 112 实测验证自动重连并写入机制与方法

- 变更内容：第五节新增"前端自动重连机制（已在 112 实测验证 PASS）"条目——记录重连机制细节（dsh-client-connection 指数退避无限重试 500ms→10s、dsh-client-runtime onConnected → resync 重建会话内容）与实测结果（kill 服务后 console 出现 retry #1→#3，端口 3s 恢复后自动重连、API 同步恢复，全程未刷新浏览器）；"服务重启前处理"补充 112 手动进程说明（/root/restart-dsh.sh，setsid 触发）
- 涉及路径：`AGENTS.md`、112 上 `/root/restart-dsh.sh`（新建）
- 备注：用户要求"重连机制和方法写入 AGENTS.md，写入前先在 112 验证"；用 playwright-core + chromium headless 实测（页面临听 console 与 API 请求）

### 2026-08-15 修订"服务重启前处理"：前端自动重连恢复，无需刷新浏览器

- 变更内容：第五节"服务重启前处理"规则更新——明确 DSH Web 前端内置自动重连机制（dsh-client-connection：断线后指数退避无限重试，500ms 起、10s 封顶；dsh-client-runtime：重连成功后 onConnected 触发 resync 重建会话内容，数据来自服务端持久化的 /root/.dsh/sessions），重启后无需刷新浏览器即可自动继续；补充标签页被浏览器冻结时重连暂停的说明
- 涉及路径：`AGENTS.md`
- 备注：用户咨询"重启后不刷新浏览器能否自动继续"；经代码探查确认自动重连机制后更新规则

### 2026-08-15 修订"服务重启前处理"：重启无需提交 git、刷新由用户自行处理

- 变更内容：第五节"服务重启前处理"规则修订——移除"提交未提交的 git 变更"步骤；重启后会话恢复由用户自行刷新浏览器完成，不再由 Agent 处理
- 涉及路径：`AGENTS.md`
- 备注：用户指示"不需重启时提交git变更，重启后我自己会手动刷新浏览器"

### 2026-08-15 新增"服务重启前处理"约定

- 变更内容：第五节新增"服务重启前处理"规则——重启 dsh web 前先收尾（终止后台任务/子代理、提交 git、goal 记录未完成目标）；会话历史持久化于 /root/.dsh/sessions，重启后恢复原会话继续
- 涉及路径：`AGENTS.md`
- 备注：用户咨询"111 重启服务时会话中断如何处理"；111 上 dsh web 为 systemd 服务 dsh-web.service（Restart=on-failure）

### 2026-08-15 变更记录支持折叠

- 变更内容：历史记录条目包入 `<details>` 折叠块，默认折叠点击展开；记录格式说明与归档机制规则保留在折叠块外
- 涉及路径：`AGENTS.md`
- 备注：用户反馈变更记录内容太多影响阅读

> 最新记录在最上面。

### 2026-08-15 降低 GitHub 推送频率

- 变更内容：第七节"远程仓库同步"规则由"每次提交后必须推送"改为"功能开发完成（DoD）后推送一次"；文档类小变更随功能批次一起推送
- 涉及路径：`AGENTS.md`
- 备注：用户指示"降低推送GitHub频率"；本次规则变更按新约定本地提交、不立即推送

### 2026-08-15 chat-width-customizer 调整：默认宽度改 896px、移除跨标签页同步

- 变更内容：按用户反馈调整 client.js——默认宽度由 748px 改为 896px（PRESETS 改为 `[896, 1024, 1152, 1280, 1440, 1600]`，`PRESETS[0]` 即默认）；localStorage 键升级为 `dsh-chat-width-customizer:width:v2`（旧值自动失效回到新默认）；移除先前添加的 storage 事件跨标签页同步（用户确认不需要跨浏览器同步）；README 同步更新预设与默认宽度描述；已同步 112 的 `/root/.dsh/external/chat-width-customizer/` 并重启 dsh web，client bundle rev 已更新生效
- 涉及路径：`chat-width-customizer/lib/client.js`、`chat-width-customizer/README.md`、`AGENTS.md`
- 备注：112 上需浏览器强制刷新（Ctrl+Shift+R）加载新 bundle；旧 localStorage 值（748 等）因 v2 键自动失效

### 2026-08-15 新增 chat-width-customizer 主题插件 v1（复用上游仓库并部署 112）

- 变更内容：新建 `chat-width-customizer/` 文件夹，复用 magicOF2/dsh-chat-width-customizer（MIT）全部代码作为主题插件 v1（第一版零修改）；README 注明复用来源与部署目标；已安装到 AI-2（192.168.31.112）的 dsh web profile（`dsh plugin add link:/root/.dsh/external/chat-width-customizer`，112 上补装 pnpm 11.21.0），重启 dsh web 后页面已注入插件 client bundle，待用户浏览器验证效果；`.gitignore` 的 `lib/` 规则修正为 `/lib/`（避免忽略功能文件夹的 lib 代码）
- 涉及路径：`chat-width-customizer/`（package.json、lib/index.js、lib/client.js、cordis.patch.yml、README.md、LICENSE）、`.gitignore`、`AGENTS.md`
- 备注：112 上插件目录位于 `/root/.dsh/external/chat-width-customizer`（link 方式安装），后续迭代只需同步该目录并重启 dsh web 即可生效；回滚可用 `dsh plugin --profile web remove dsh-chat-width-customizer`

### 2026-08-15 新增"部署验证"约定：插件先装到 AI-2 (31.112) 验证

- 变更内容：第三节新增第 6 点"部署验证（适用时）"——功能完成且满足 DoD 后，如需实际环境验证，先安装到 AI-2（192.168.31.112）检查验证，验证通过才视为交付完成；登录方式指向知识库 autu.md
- 涉及路径：`AGENTS.md`
- 备注：用户指示"插件开发查看效果先安装到31.112上检查验证效果"；当前暂不开发具体插件

### 2026-08-15 关联远程仓库 LQFHUB/dsh-plugin 并推送

- 变更内容：添加远程 `origin`（https://github.com/LQFHUB/dsh-plugin.git）并推送 main；git 身份更新为 LQFHUB / 15809601162@163.com；第七节新增远程同步约定；认证 token 存入本地凭据存储（不入库）
- 涉及路径：`AGENTS.md`、`.git/config`、`/root/.git-credentials`（仅本地，不入库）
- 备注：用户新建 GitHub 仓库并提供 token；token 已存本地凭据存储，不写入任何代码/文档/提交

### 2026-08-15 新增"七、Git 版本管理约定"，初始化 git 仓库

- 变更内容：初始化 git 仓库（main 分支，仓库级身份 dsh-plugin）；新增第七节 Git 约定（每功能一次提交、提交信息 `<type>: <描述>`、提交前检查 status）；新建 `.gitignore`（忽略 IDE 配置与构建产物）
- 涉及路径：`AGENTS.md`、`.gitignore`、`.git/`
- 备注：用户确认使用 git 并写入约定

### 2026-08-15 补充完成标准、敏感信息安全与语言约定

- 变更内容：第三节新增第 5 点"功能完成标准（DoD）"（代码可用、README 写好、测试通过、变更记录追加）；第五节新增"敏感信息安全"（凭证不硬编码，存入知识库/环境变量）与"语言约定"（文档与注释默认中文）两条规则
- 涉及路径：`AGENTS.md`
- 备注：用户询问 AGENTS.md 还缺什么，评估后补充

### 2026-08-15 社区参考内容内联化：删除"社区参考仓库"小节

- 变更内容：按用户指示删除"社区参考仓库"小节，将其有价值的规范直接内联进"核心规范要点"：新增"插件包标准结构"（dsh.bundle.patch + cordis.patch.yml + tsdown 自包含构建）、"皮肤/UI 插件开发契约"（纯呈现层、body 属性作用域样式、ctx.effect 全部收回、内联资源）、"插件测试"（apply 契约测试）三个小节
- 涉及路径：`AGENTS.md`
- 备注：用户口头指示（不新增社区参考仓库小节，有价值的内容直接写入 AGENTS.md）

### 2026-08-15 添加社区参考仓库 zhu1090093659/dsh-web-ui

- 变更内容：在"六、官方文档索引"新增"社区参考仓库"小节，收录 dsh-web-ui 仓库及其插件包结构、皮肤开发契约、契约测试等参考价值说明
- 涉及路径：`AGENTS.md`
- 备注：用户提供仓库链接，评估后认为有参考价值（插件/皮肤开发契约），已注明其 skill 仅抽取规范结论

### 2026-08-15 建立变更记录归档机制

- 变更内容：新增归档规则（见本节末尾"归档机制"），防止 AGENTS.md 无限膨胀占用会话上下文
- 涉及路径：`AGENTS.md`
- 备注：AGENTS.md 会被作为工作区指令完整注入每个会话，需控制体积

### 2026-08-15 修订规则：AGENTS.md 更新无需询问用户

- 变更内容：新增规则"AGENTS.md 的更新由 Agent 自行决定，无需询问用户"；删除/移动/重命名文件需询问的规则明确排除 `AGENTS.md` 本身
- 涉及路径：`AGENTS.md`
- 备注：用户口头指示（改 AGENTS.md 不需要问，Agent 自行决定是否更新）

### 2026-08-15 添加"六、官方文档索引"章节

- 变更内容：新增官方文档索引章节，收录 DSH（DeepSeek Harness）官方插件开发文档链接（开发基础、框架层、Cordis 教程、Cookbook）与核心规范要点
- 涉及路径：`AGENTS.md`
- 备注：官方仓库 [deepseek-ai/DeepSeek-Harness](https://github.com/deepseek-ai/DeepSeek-Harness)，文档位于其 `docs/` 目录

### 2026-08-15 创建 AGENTS.md，确立本目录开发约定

- 变更内容：创建本文件，确立目录用途（个人插件开发）、每功能一个文件夹的结构约定、添加新功能前先询问用户、变更必须记录等规则
- 涉及路径：`AGENTS.md`


