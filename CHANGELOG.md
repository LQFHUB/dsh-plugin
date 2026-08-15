# CHANGELOG — 变更记录归档

> AGENTS.md「四、变更记录」超过 30 条后的归档存放处（按原格式、时间倒序）。最新记录始终在 AGENTS.md。

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


