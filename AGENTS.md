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
| `theme-center/` | 主题中心（一体化 v0.3.0）：23 款皮肤 + 「主题/外观」双 Tab 设置卡（试穿/应用/亮暗/遮罩 + 聊天宽度 + 聊天区精简百分比压制 + 会话区字号缩放 + 全站字体 + 隐藏思考/工具/上下文开关）；**配置保存到服务器（settings.yaml），一处配置、所有终端生效**；其他插件 UI 需适配它（见第六节主题适配契约） |
| `web-lan/` | dsh Web 局域网直连（免反代）：crypto polyfill + apiProxy relay + isLoopback |
| `navbar/` | 对话节点导航条（贴左侧边栏，节点跳转/悬停预览/pin 精选，中英文定位） |
| `notify-sound/` | 会话提示音（Web Audio 合成 6 音、事件触发、配置跨浏览器同步、提示音设置卡，皮肤令牌适配） |
| `describe-image/` | 图像理解工具（视觉模型描述图片，configured 模式复用已配置模型 + 「图像理解」设置卡） |
| （外部）`dsh-better-sidebar` | VSCode 风格右侧侧边栏工作台（文件资源管理器/CodeMirror 编辑器/终端/Git/浏览器/子代理，服务化 `ctx.betterSidebar` 三方扩展）——npm 安装，仓库 https://github.com/omdsh-dev/DSH-better-sidebar（MIT） |

## 三、添加新功能的流程（必须遵守）

1. **先询问，再动手**：在添加任何新功能之前，Agent 必须先询问用户：是否创建一个新文件夹来开发该功能（还是放进现有文件夹）。
2. 若用户同意创建新文件夹：按照"目录结构约定"创建文件夹，并在其中开发。
3. 若用户选择放入现有文件夹：说明原因，并只对现有文件夹做最小必要的修改。
4. 开发完成后，**必须**在本文件"四、变更记录"中追加一条记录。
5. **功能完成标准（Definition of Done）**：以下全部满足才算功能完成——功能代码可用且可正常加载；功能文件夹内 README 已写好（用途、使用方法）；必要的测试通过（如有）；变更记录已追加。
6. **部署验证（适用时）**：功能完成且满足 DoD 后，**先安装到 AI-2（192.168.31.112）检查验证**，验证通过后才视为交付完成。**验证通过后必须询问用户是否部署到 111（AI 主机，正式使用）——用户同意后才可部署 111**；111 部署需重启 `dsh-web.service`，会中断该机上其他进行中的任务，故不得自动执行。AI-2 登录方式见知识库 `autu.md`。

## 四、变更记录

<details>
<summary>📜 变更记录（共 30 条，点击展开，最新在最上面；更早记录见 `CHANGELOG.md`）</summary>
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
- 当变更记录条数 **超过 30 条** 时，Agent 应执行归档：将最早的历史记录（保留最新 20 条）移动到同目录的 `CHANGELOG.md`（按原格式、时间倒序存放），并在本节顶部注明"更早记录见 `CHANGELOG.md`"。
- `CHANGELOG.md` 仅作历史存档，不会被注入会话上下文；归档动作本身在 AGENTS.md 中记录一条即可。

## 五、其他规则

- 修改现有代码前，先阅读相关文件夹内的说明文档和现有代码，理解后再动手。
- 不在未询问用户的情况下删除、移动或重命名已有文件夹/文件（`AGENTS.md` 本身除外）。
- **敏感信息安全**：API key、token、密码、凭证等不得硬编码进代码、文档或配置（含本文件）；需要持久保存时放入个人知识库或环境变量。
- **服务重启前处理**：111 上 dsh web 为 systemd 服务 `dsh-web.service`（`Restart=on-failure`，崩溃自动拉起）；112 上为手动进程（`node /usr/local/bin/dsh web`，cwd=/root，日志 /root/dsh-web.log），可用 `/root/restart-dsh.sh` 重启（setsid 触发，ssh 立即返回）。重启服务前先收尾：① 收集/终止后台任务与子代理；② 未完成目标如需继续，用 goal 记录。**重启时无需专门提交 git 变更**。
- **前端自动重连机制（已在 112 实测验证 PASS）**：DSH Web 前端内置自动重连——断线后指数退避无限重试（`dsh-client-connection`：500ms 起、10s 封顶，`while (running)` 无次数上限）；重连成功后 `dsh-client-runtime` 的 `onConnected` 触发 sessions/workspaces 重新同步与 `resync()` 重建会话内容（数据来自服务端持久化的 `/root/.dsh/sessions`）。**实测**（2026-08-15，112）：kill 服务后页面 console 出现 `connection lost, retry #1→#3`，端口 3s 恢复后自动重连、API 同步恢复，全程无需刷新浏览器。注意：页面标签页被浏览器冻结时重连暂停，切回标签页即恢复。
- **语言约定**：功能文件夹内的文档（README 等）与代码注释默认使用中文。
- **`AGENTS.md` 的更新由 Agent 自行决定，无需询问用户**：包括新增/修改/删除规则、调整结构、修订内容等；但每次更新仍必须在"四、变更记录"中追加一条记录。
- 本文件本身的内容更新（如约定变更）也属于变更记录，需同步记录。
- 如果本文件与用户口头指示冲突，以用户最新指示为准，并更新本文件保持一致。

## 六、官方文档索引（参考资料）

本目录开发基于 DSH（DeepSeek Harness），官方文档位于 [deepseek-ai/DeepSeek-Harness](https://github.com/deepseek-ai/DeepSeek-Harness) 仓库的 `docs/` 目录，中英双语。开发前如需查阅规范，优先使用以下文档：

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
