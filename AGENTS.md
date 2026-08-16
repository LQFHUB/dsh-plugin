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
| `chat-width-customizer/` | 聊天区宽度定制（预设档位，localStorage 持久化） |
| `theme-center/` | 主题中心：10 款皮肤 + 「主题」设置卡（试穿/应用/亮暗/遮罩）；其他插件 UI 需适配它（见第六节主题适配契约） |
| `web-lan/` | dsh Web 局域网直连（免反代）：crypto polyfill + apiProxy relay + isLoopback |
| `navbar/` | 对话节点导航条（贴左侧边栏，节点跳转/悬停预览/pin 精选，中英文定位） |
| `notify-sound/` | 会话提示音（Web Audio 合成 6 音、事件触发、配置跨浏览器同步、提示音设置卡，皮肤令牌适配） |
| `describe-image/` | 图像理解工具（视觉模型描述图片，configured 模式复用已配置模型 + 「图像理解」设置卡） |
| `right-panel/` | 右侧面板（文件树/多格式预览/SCM/语法高亮）——**已于 2026-08-16 卸载**，由 DSH-better-sidebar 替代（代码保留可回滚） |
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
<summary>📜 变更记录（共 26 条，点击展开，最新在最上面；更早记录见 `CHANGELOG.md`）</summary>

### 2026-08-16 theme-center 新增 6 款自研皮肤（紫粉拿铁/清新浅绿/赛博朋克/苹果官网风/东京夜色/北欧极地，全中文名、亮暗双形态）并 112 实测全过

- 变更内容：用户要求新增主题并"主题名称都使用中文"——按 theme-center 规范流程新增 6 款自研**纯令牌重映射**皮肤（无背景画/无 DOM chrome，每款 ~15KB）：以 qq98 皮肤 161 变量结构（亮/暗双块）为模板写生成器，逐款定义色板（灰阶 21 档 + 品牌主色阶 + 语义色阶 + alias/specific 语义值表）自动生成 bundle；Catppuccin（Mocha/Latte 官方色板）→ 紫粉拿铁、清新浅绿（薄荷绿）、赛博朋克（霓虹青紫）、苹果官网风（极简灰阶）、Tokyo Night → 东京夜色、Nord → 北欧极地；注册表 THEMES 增 6 条（共 17 行）、宿主 SKIN_IDS 白名单增 6 个、lib/meta/ 增 6 个、卡片描述改 16 款
- 涉及路径：`theme-center/lib/skins/`×6、`theme-center/lib/meta/`×6、`theme-center/lib/{client,index}.js`、`theme-center/README.md`、`theme-center/AGENTS.md`、`AGENTS.md`；112 上 `/root/.dsh/external/theme-center/`（已同步，client rev `fbfbf75edacf`）
- 备注：**112 实测 33 项断言全过**（bundle 路由 6/6、卡片 17 行含 6 中文名、逐款试穿→应用保持、亮色/暗色 bg-base 精确匹配、样式标签恰 1、官方默认干净还原、无 theme-center 错误）；踩坑 3 个（已写入 theme-center 规范）：SKIN_IDS 白名单漏加致 404、生成器 data 属性缺 dsh 前缀致作用域不匹配、zh-CN 界面验证需双语定位+先展开侧边栏；**按部署流程：待用户确认后部署 111**

</details>

### 2026-08-16 right-panel 卸载，换装 DSH-better-sidebar（111/112 已部署生效）

- 变更内容：用户决定用 [DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar)（VSCode 风格右侧侧边栏工作台：文件资源管理器/CodeMirror 编辑器/终端/Git/浏览器/子代理拓扑，服务化 `ctx.betterSidebar` 供三方插件注册 tab 与文件预览器，MIT）替代自研 right-panel——两机均 `dsh plugin --profile web remove dsh-right-panel`（`/root/.dsh/external/right-panel` 保留可回滚）+ `dsh plugin --profile web add dsh-better-sidebar`（npm 安装 v0.12.1；pnpm 拦截 node-pty 构建脚本 → profile `pnpm-workspace.yaml` `allowBuilds: node-pty: true` 放行后重装成功，node-pty 本地编译通过）
- 涉及路径：`AGENTS.md`、`right-panel/README.md`；111/112 上 profile（deps/bundles 更换）、`/root/.dsh/profiles/web/pnpm-workspace.yaml`（allowBuilds node-pty）
- 备注：112 实测效果（用户已确认满意）：侧边栏默认展开 480px（`#root` margin-right 挤占布局，与 right-panel 的 grid 追加机制不同）、Explorer 文件树根 = 当前会话目录（/root/AI/deepseek/gen，按会话隔离）、CodeMirror 编辑器、xterm 真终端（shell 提示符）、折叠/展开正常、无 console 错误；111 重启 dsh-web.service 后生效（服务 active、`dsh-better-sidebar/client.js?rev=dbd5028ff700` 与 112 一致、right-panel 注入 0）；right-panel 的主题适配（harbor/trading 适配层）与语法高亮等成果保留在 `right-panel/`，需要时可回滚

### 2026-08-16 theme-center 修复：先试穿再应用同一主题回退默认（切换顺序：先卸载→再加载→再挂载）并 112 实测全过

- 变更内容：用户反馈"主题先试穿再应用就会变回默认主题"——112 实测复现（应用后 body 属性被清、背景/样式丢失而 localStorage 已写入）：根因：应用时先挂载新实例、后卸载试穿旧实例，旧实例 disposer（删属性/还原背景/移除 favicon）收回新实例刚写入的同一处 DOM；且若卸载放在加载之后，旧实例样式清理会误删新实例 CSS 标签（CSS 在 import 时注入、apply 不重新注入，调色板重映射丢失）。修复：`theme-center/lib/client.js` 的 `runJob` 中 `disposeCurrent()` 移到 `loadThemeApply()` **之前**（先卸载旧主题→再加载并挂载新主题），语义变为加载失败回官方默认+错误提示（路由自持，异常情形）；theme-center/AGENTS.md 4.3 切换语义与验证清单同步更新
- 涉及路径：`theme-center/lib/client.js`、`theme-center/AGENTS.md`、`AGENTS.md`；112 上 `/root/.dsh/external/theme-center/lib/client.js`（已同步并重启，rev `f625666a7491`）
- 备注：**112 三套回归全过**——复现脚本（试穿鲸吟→应用鲸吟：属性/背景/样式标签齐全）+ 主验证 14 项（试穿/退出/应用/刷新恢复/官方默认干净还原/亮暗/遮罩/标题链）+ 补充验证 + 10 款皮肤全量冒烟，无 theme-center 错误；验证脚本皮肤属性过滤改为白名单 SKIN_ATTRS（排除 notify-sound/describe-image 等其他插件的 data-dsh-* 属性）；**已部署 111**（用户确认后延迟 detach 重启 dsh-web.service，md5 `07d7d4f7`）

</details>

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
