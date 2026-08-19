# AGENTS.md — theme-center 主题开发规范

本文件是 `theme-center/`（DSH 主题插件：10 款皮肤 + 「主题」设置卡片）的**开发约定与变更记录**。
**以后所有主题开发（新增皮肤、修改主题插件、开发其他主题类插件）都按本规范执行。**

## 一、定位与边界（必须）

- 主题插件是**纯视觉呈现层**：不注入服务、不发 Cordis 事件、不触及模型请求。
- 主题切换为**纯浏览器机制**：皮肤 bundle 按需加载执行，即时生效。
- **持久化双层**：配置真源在**服务器**（宿主半区经 dsh-settings 用户层写入 profile settings.yaml 的 `theme-center:` 段，等价用户在设置界面修改；官方 apiproxy 白名单不含第三方命名空间，故经插件自持路由 `/theme-center/settings` 读写）；浏览器 localStorage 降级为**首屏缓存**（先按缓存渲染、服务器视图到达后以服务器为真源收敛）。服务器不可用时静默降级为仅本机 localStorage 模式，绝不抛错。
- 与 dsh-web-ui 皮肤中心（skin-center）**不建议并存**（双方都会写 body 主题属性）；本插件已内置其全部皮肤。

## 二、包结构与文件职责

| 文件 | 职责 |
|---|---|
| `package.json` | 包名 `@npm-liqingfeng/dsh-theme-center`（npm 发布名；原 `dsh-theme-center` 已被他人占用，2026-08-17 改）；`dsh.bundle.patch → ./cordis.patch.yml`；`dsh.client { inject: [], platform: "web" }`；`files` 含 `lib/skins`；`publishConfig.access: public` |
| `cordis.patch.yml` | `- insert: - id: theme-center / name: '@npm-liqingfeng/dsh-theme-center'` |
| `lib/index.js` | 宿主半区：`/api/theme-center/bundle/<id>` 同源分发路由 |
| `lib/client.js` | 浏览器半区：主题引擎 + 「主题」设置卡片（手写 `__ModuleLoader__` bundle，纯 JS/React.createElement） |
| `lib/skins/<id>.js` | 皮肤 bundle，**上游产物原样拷贝、零修改** |
| `lib/meta/<id>.json` | 对应皮肤 `skin.json` 元数据副本（注册表数据源） |
| `tests/smoke.mjs` | node 内置冒烟测试（`node tests/smoke.mjs`）：包形状/宿主/注册表/一体化模块/apply 契约与收回 |
| `README.md` | 中文：用途、安装、使用、皮肤清单、来源与许可 |
| `LICENSE` | BSD-3-Clause，注明皮肤来源（zhu1090093659/dsh-web-ui）与封装代码作者 |
| `AGENTS.md` | 本规范文件 |

## 三、新增 / 更新皮肤流程（必须遵守）

1. **拉取 bundle**：从上游 `packages/skins/<id>/lib/client.js` 原样下载到 `lib/skins/<id>.js`——**零修改**（保持与上游一致，便于日后同步更新；上游改动时重新拉取覆盖即可）。
2. **登记注册表**：在 `lib/client.js` 顶部 `THEMES` 常量追加条目，字段（与 `skin.json` 一一对应）：
   ```js
   { id: "<id>", name: "<中文名>", accent: "<主色>", tagline: "<一句话说明>",
     attr: "<bodyAttr，以 skin.json 为准>", package: "<@scope/dsh-client-ui-skin-<id>>",
     readsScrim: <是否读 --dsw-skin-scrim> }
   ```
3. **备份元数据**：`skin.json` 副本存入 `lib/meta/<id>.json`。
4. **验证**：`node --check` 全部 JS；112 部署后全量冒烟（见第六节）。
5. **变更记录**：本文件"七、变更记录"追加一条。

## 四、主题引擎与执行机制规范

### 4.1 分发路由（宿主半区）
- 前缀路由 `/api/theme-center/bundle/<id>`，`ctx.get("webServer")` 存在时经 `ctx.effect` 注册（disposer 收回）。
- **同源护栏必须**：`Sec-Fetch-Site === 'cross-site'` 拒绝；Origin 与 Host 不一致拒绝（防止 localhost CSRF）。
- id 先过白名单正则（`/^[a-z0-9-]+$/`）+ 注册表校验再拼路径；bundle 文件缺失返回 404。
- 注册失败只 `console.error`、**绝不抛出**（不能让 GUI 启动失败）。

### 4.2 执行路径（浏览器半区）
- 皮肤经内核自身模块系统执行（与皮肤中心 try-on 同路径）：`__DSH_MODULES__.invalidate(pkg)` → 同源 `<script>` 加载 bundle（`__ModuleLoader__.load` 注册工厂）→ `import(pkg)` 物化（CSS 自动注入）→ `surface.apply(miniCtx)`。
- **无 eval、无 CSP `unsafe-eval` 依赖**。
- miniCtx 只提供：`effect(callback)`（内部 disposer 栈，`__disposeAll` 逆序回收）+ `get(key)`（**委托真实上下文**，ths/trading 可读 connection；缺失返回 undefined 优雅降级）。

### 4.3 切换语义（必须）
- **串行泵**：同一时刻只有一个加载/挂载，`pending` 覆盖实现最新请求胜出；加载期间重复点击同主题：试穿忽略、应用只补写持久化。
- **挂载成功后才卸载旧主题**（加载失败旧主题保持可见，避免闪烁）。
- 皮肤 `apply` 中途抛错：按**残留配方**回滚——`__disposeAll` + `invalidate` + 移除 `style[data-plugin=<pkg>]` + 移除 body 属性 + 移除 `data-skin-chrome` 元素（保留 `#root` 与其他插件元素）。
- 插件卸载（ctx.effect disposer）：置 `disposed` 标记（在途加载完成不再挂载）、dispose 当前主题、还原遮罩变量原值。
- **顺序固定为：先卸载旧主题 → 再加载并挂载新主题**（`disposeCurrent()` 必须放在 `loadThemeApply()` 之前）。两个原因（均 2026-08-16 实测踩坑）：
  1. 同一主题「先试穿再应用」时，旧实例的 disposer 会收回新实例刚写入的属性/背景/favicon（两者写同一处），后卸载会让界面看似回到官方默认；
  2. 皮肤的 CSS 在 `import` 物化时注入、`apply` 不会重新注入——若在加载之后才卸载，旧实例的样式清理会误删新主题的样式标签（调色板重映射丢失）。
  语义：加载失败时页面回到官方默认并显示错误（bundle 路由由本插件自持，加载失败仅发生在路由不可用等异常情形）。

### 4.4 持久化
- **双层结构：服务器为真源，localStorage 为首屏缓存**（见 4.9）。服务器配置在 profile settings 用户层（settings.yaml 的 `theme-center:` 段）；浏览器 localStorage 键仅作首屏缓存与降级兜底。
- 主题：localStorage 键 `dsh-theme-center:active:v1`（值 = 主题 id 或 `official`）；非法/缺失回退 `official`。
- 遮罩：`dsh-theme-center:scrim:v1`（0-100）；值为 0 时**移除** `--dsw-skin-scrim` 变量（与皮肤默认一致）。
- 聊天宽度：`dsh-theme-center:width:v1`（6 档预设之一，默认 896）；非法/缺失回退默认档。
- 聊天区精简：`dsh-theme-center:focus:v1`（0-100，**默认 80**）；**缺失必须回退 80 而非 0**（`Number(null)=0` 陷阱，smoke 测试曾捕获）；值为 0 时**移除** `body[data-tc-focus]` 门控属性（整组压制规则失效 = 官方默认展示）。
- 存储不可用：静默退化为内存态，不抛出。
- 启动时（apply）先按缓存立即恢复已保存状态（不阻塞 GUI），服务器视图到达后以服务器为真源收敛。

### 4.5 标题链基线（必须，防缺陷）
- 改 `document.title` 的皮肤在 apply 内快照"挂载时标题"作为还原基线；**连续切换时若不重置，后装皮肤会把前一皮肤的标题当成原始值**。
- 修复约定：引擎在 apply 时捕获基线 `stockTitle = document.title`，**每次挂载皮肤前重置 `document.title = stockTitle`**，保证任意切换序列的标题都能还原。

### 4.6 聊天区精简模块（必须）
- 只作用于聊天区过程展示：Think 思考行（`[data-variant="think"]`）、工具调用卡（`[data-chat-flow-kind="tool-call"]`，含 Bash/Read/Cordis 插件卡）、上下文注入卡（`[data-chat-flow-kind="context"]`）。
- **插值不变量**：所有规则以 `--tc-focus`（0-1）+ `calc()` 线性插值，`0` 时各属性计算值与官方默认**完全一致**；非插值规则（错误卡标题 ellipsis）由 `body[data-tc-focus]` 门控，pct=0 时整组失效。
- **只改字号/行高/透明度/尺寸，不写任何颜色**——皮肤令牌不动即天然适配全部皮肤与亮/暗；选择器一律作用域限定 `body[data-dsh-theme-center][data-tc-focus]`，不污染官方 UI 与其他插件。
- 宽度规则作用域限定 `body[data-dsh-theme-center]`，覆盖 `--dsh-chat-content-width` / `--dsh-composer-card-max-width` 并释放 userStack 上限。
- 三个样式元素（card/width/focus）均挂 `data-plugin="dsh-theme-center"` + 各自 `data-pluginCss`，disposer 全量收回（含门控属性）。

### 4.7 表格列宽模块（必须）
- **动机**：官方 markdown 渲染器 `table { width:max-content }` + `td/th { max-width: min(30vw,320px) }`——中文长文本被压进 320px 窄列疯狂换行，表格只占列宽一半（2026-08-16 实测 452px/896px）。
- 覆盖规则：助手回答/用户消息内（`[data-chat-flow-kind="assistant-step"|"user"]`）`table{width:100% !important;max-width:100% !important}` + `td/th{max-width:none}`；**只依赖稳定 data 属性，不依赖 hash 类名**；超宽表格仍由官方 `overflow-x:auto` 容器横向滚动。
- 常开不设开关（用户确认）；样式独立 `<style>`（`data-pluginCss="dsh-theme-center/table"`），disposer 收回。

### 4.8 外观扩展模块（必须）
- 三组功能共用单个 `<style>`（`data-pluginCss="dsh-theme-center/appearance"`）与三个 body 门控属性，值变化整体重写样式文本；disposer 移除样式与全部属性。
- **会话区字号缩放**：门控 `data-tc-scale` + `--tc-text-scale`（0.75–1.5）；缩放基线 **16px/28px 硬编码**；**默认 80%**（`TEXT_SCALE_DEFAULT`）与**官方原样锚点 100%**（`TEXT_SCALE_OFFICIAL`，pct=100 移除门控）**解耦**——默认值非 100 时门控仍生效（来源：官方 `--dsw-font-markdown-base` 实测，0.1.0-rc.6+，**DSH 升级改基线需复核**）；只作用于 markdown 容器/用户气泡文字，**Think 行/工具卡/上下文卡不在其中不受缩放影响**（由 4.6 精简调节）；固定 px 元素（inline code 14px、pre 13px/22px）同比例 calc 覆盖；**用户消息通道用 `USER_TEXT_KINDS` 数组 + `userKindsSel(prefix, suffix)` 生成器**——`['user','steering']`：用户经 **steering 通道发送的消息官方标记为 `steering`** 而非 `user`（2026-08-17 用户实测"发送的内容字号突然变大"定位：steering 消息 16px 未缩放；页面 kind 全量：user/assistant-step/tool-call/context/turn-tail/command/steering）；**CSS 逗号分隔选择器列表中前缀只作用于第一项**，故必须用 `userKindsSel` 逐项展开完整前缀（`prefix + ' [data-chat-flow-kind="<k>"]' + suffix`）——v1 字符串拼接曾致 user 分支退化"字号设在 user 容器上、被官方文本类显式 16px 覆盖"（111 实测捕获）；缩放/字体/表格规则一律走该生成器，**新增用户类通道必须同步加进数组**（DSH 升级需复核）；**输入框（composer）16px 基线**（实测 0.1.0-rc.6，锚点 `[data-composer-card="true"]` 稳定属性、页面唯一 textarea，DSH 升级需复核）；**官方为三层架构**（`uV2eYG_*` 等 hash 类名不可依赖）：`backdrop`（absolute，`color: var(--dsw-alias-label-primary)`）渲染**用户可见文字**、`textarea` 文字透明（`rgba(0,0,0,0)`）只承载光标与选中高亮、`mirror`（visibility:hidden）高度测量，三层 `font-size/line-height: inherit` 继承自 textarea 父层 `grow`——故缩放规则作用于 **`div:has(> textarea)` 父层**（避免 hash 类名）而非 textarea 自身：只缩放 textarea 会让用户看到的 backdrop 文字不变、仅选中高亮变小（2026-08-17 用户实测反馈"输入未选中不缩放、全选才像缩放"）；**只缩放 font-size、行高保持官方 24px**（textarea 文字顶部对齐，行高一起缩小会致文字上移贴边、与周边控件错位——视觉模型实测确认）；**标题 h1-h6 官方为固定 px 令牌**（`HEADING_FONTS` 基线：h1 700 24/34、h2 700 22/32、h3 700 20/30、h4 600 16/28、h5/h6 走 `--dsw-font-markdown-base-strong` 600 16/28；实测 `._markdown_ h1..h4` 用 `font: var(--dsw-font-markdown-hN)`，**DSH 升级需复核**），缩放时在门控 body 上**重定义这些令牌**（`weight calc(size * var(--tc-text-scale))/calc(lh * var(--tc-text-scale)) family`）——标题字号随滑杆缩放、family 用 `var(--dsw-font-family)` 随全站字体（与官方基线等价）；pct=100 移除门控=官方原样。
- **全站字体**：门控 `data-tc-font="<id>"`；`FONTS` 常量表（default=系统默认不注入）；覆盖路径三条——body `--dsw-font-family` 变量 + markdown/用户气泡容器 `font-family` + **标题令牌重定义**（`headingTokensCss(stack)`，字号 calc 乘 `--tc-text-scale`，故仅换字体时须先注入基线 `body[data-dsh-theme-center]{--tc-text-scale:1}`，字号×1=官方原值）；**代码字体 `--ds-font-family-code` 保持不动**。
- **隐藏开关**：门控 `data-tc-hide`（空格分隔值，选择器 `~="think"|"tool"|"context"`）；纯 CSS `display:none !important`，不触碰消息数据；隐藏优先于 4.6 压制。
- 持久化键：`textscale:v1`（75-150，缺失回退 80，`Number(null)=0` 陷阱）、`font:v1`（id，未知回退 default）、`hide:v1`（JSON 布尔）。

### 4.9 服务端同步模块（必须）——一处配置、所有终端生效
- **宿主半区**：`installSettingsSection` 注册 `theme-center` 命名空间（schemastery `Config` schema：theme/scrim/width/focus/textScale/font/hideThink/hideTool/hideContext 共 9 字段全带默认（**focus 默认 80、textScale 默认 80**），默认值 = 官方原样）+ 自持路由 `/theme-center/settings`（GET 视图 / POST 批量写 set/unset，**同源护栏 + revision 栅栏**，内部经 `settings.replace(settingsNamespace(...))` 整层提交 → 落盘 profile settings.yaml 用户层）；settings/webServer 缺失静默跳过，注册失败绝不抛出。官方 apiproxy 白名单不含第三方命名空间，故必须自建路由（notify-sound 同款先例）。
- **浏览器半区**：`ThemeCenterSettingsScope`（SettingsScope 契约：getSnapshot/subscribe/set/unset/refresh）——启动 GET、写即 POST（`tail` 链串行，revision 由宿主保证）、`SYNC_INTERVAL_MS = 15000` 轮询 + visibilitychange/focus 刷新；`sanitizeServerValue` 逐字段清洗（非法回退默认，绝不抛错）。
- **写路径**：全部 setter（主题 runJob persist=true / applyScrim / setWidth / setFocus / setTextScale / setFont / setHide）在写本地缓存后排队服务器写——离散字段即时提交、滑杆字段（scrim/focus/textScale）400ms 尾随去抖；`applyingRemote` 标志置位期间跳过回写（防回环）。
- **读路径（服务器为真源）**：服务器视图就绪后按快照去重（revision+value key）；用户层为空 → **一次性迁移**本地状态上推（老用户升级不丢配置）；用户层有值 → `applyRemoteState` 逐字段 diff 应用（主题走 `requestTheme(id,false,adopt)`：写缓存但不写服务器；其余字段复用 setter）。
- **降级**：路由不可达/命名空间缺失 → 作用域 status 'unavailable' → 仅本机 localStorage 模式照常工作，恢复后下次轮询自动收敛；卡片内 `.tc-sync` 行显示「已同步 / 同步中 / 仅本机」。
- 试穿/亮暗预览为瞬态，不持久化、不写服务器；localStorage 键语义不变（仅降级为缓存）。
- 持久化键与部署注意：111/112 各持一份 settings.yaml，**配置不跨机同步**（宿主独立）；`@deepseek-ai/{schemastery,dsh-settings}` 未发布 npm，部署目录需建 `node_modules/@deepseek-ai` symlink（同 notify-sound 流程）。

## 五、皮肤 / UI 契约（必须，沿用根 AGENTS.md 并强化）

- **主题适配（必须）**：插件 UI 样式**必须使用官方皮肤令牌**（`--dsw-alias-*`：border-l2/bg-layer-3/label-primary 等），**不得硬编码颜色/背景/边框数值**——theme-center 切换 10 款皮肤 + 官方亮/暗时插件界面自动跟随。个别皮肤缺令牌时补**皮肤限定适配层**（选择器限定 `body[data-dsh-<skin>]` 的补丁，fallback 引用皮肤自身变量），**不得全局覆盖**。
- 样式全部挂在 `body[data-dsh-<name>]` 属性下，暗色变体用 `body[data-dsh-<name>][data-ds-dark-theme]`；不得用裸类名/全局选择器污染其他皮肤与官方 UI。
- 所有写入（body 属性、注入的 DOM、favicon、document.title）必须在 `ctx.effect()` 的 disposer 里**全部收回**（标题仅在仍是自己设置时才还原）。
- 不携带静态资源文件：内联 SVG / data URI。
- 皮肤自身的不变量（上游契约）：背景遮罩读 `var(--dsw-skin-scrim, 0)`（带背景画的皮肤）；`data-skin-chrome` 标记注入的 DOM。

## 六、测试与部署验证（必须）

1. **本地检查**：`node --check` 全部 JS；注册表与 `lib/skins/` 文件一一对应；disposer 配对检查。
2. **112 验证**（playwright-core + chromium headless，沿用既有方法）：
   - 页面注入 `theme-center/client.js`；`/api/theme-center/bundle/<id>` 返回 200 + 皮肤脚本；
   - 卡片：25 行（官方默认 + 24 皮肤）、行内容齐全；**双 Tab（主题/外观）渲染与切换**；
   - 试穿 / 退出试穿**完全还原**（属性、背景、样式、DOM、标题）；
   - **先试穿再应用同一主题**：应用后主题保持（属性/背景/样式标签齐全，不回默认）——2026-08-16 实测踩坑场景，必须回归；
   - 应用 / localStorage 持久化 / **刷新自动恢复**；
   - 官方默认**干净还原**（无皮肤属性/样式/DOM，标题还原）；
   - 亮暗预览、背景遮罩滑杆（含持久化）；
   - 24 款皮肤全量冒烟（逐款应用核对 body 属性）；
   - DOM 皮肤抽查（xp 任务栏/开始按钮、miku 标题栏）、多皮肤连续切换标题链；
   - **聊天宽度**：外观 Tab 选档 → 对话列/输入框变宽 + localStorage 持久化 + 刷新恢复；标题栏无宽度按钮；
   - **聊天区精简**：0% / 70% / 100% 三档计算样式断言（Think 标题字号与摘要透明度、工具卡行高、Context 卡来源透明度）；0% 与卸载态完全一致；`body[data-tc-focus]` 门控属性存在/移除成对；
   - **表格列宽**：助手回答内表格 `width=100%`（撑满内容列）、`td/th max-width=none`（>320px 列正常展开）、超宽表格仍横向滚动；用户消息表格同样生效；
   - **外观扩展·字号**：滑块 100%/125%/90% 三档计算样式断言（markdown 容器与 p/表格/代码 = 16px×N、28px×N，容差 0.1px）；**标题 h1-h6 同步缩放**（探针断言 h1 24→30px、h2 22→27.5px、h3 20→25px、h4-6 16→20px @125%，h2 行高 32→40px）；**输入框内容同步缩放**（探针断言 125% → 20px/30px、90% → 14.4px/21.6px、100% 还原 16px/24px）；**Think 行/工具卡/上下文卡字号不变**；`data-tc-scale` 门控存在/移除成对；刷新恢复；
   - **外观扩展·字体**：下拉逐项切换 → `body` 与 markdown 容器 `fontFamily` 命中对应 stack、代码块字体不变；**标题 family 跟随所选字体**（仅字体态字号仍官方：h2 22px + YaHei；字体+125% 组合态：h2 27.5px + YaHei）；default 还原；刷新恢复；
   - **外观扩展·隐藏**：三开关逐项勾选 → 对应元素 `display:none`、取消恢复；与压制 70% 共存；`data-tc-hide` 门控值正确；
   - **服务端同步**（112 双浏览器上下文 A/B）：`curl /theme-center/settings` GET 视图（默认值 + user 空）+ POST set 落盘 settings.yaml `theme-center:` 段 + unset 还原 + 跨站 403 + 非法 body 400/405；**A 通过卡片改主题/字号/字体/隐藏 → B ≤15s 自动跟随**（含主题切换）；B 刷新仍在（服务器真源）；重启 112 服务后仍在（settings.yaml 持久）；新上下文 C 首开即服务器配置；**迁移**：清服务器用户层 + A 有本地 localStorage → 首同步自动上推、B 跟随；**降级**：settings 缺失/路由不可达 → 卡片显示「仅本机生效」、本地修改仍生效、恢复后收敛；`data-tc-*` 门控与同步状态提示齐全；验证后还原（清服务器 user 层 + localStorage）；
   - **主题抽查**：官方暗色 + 1 款暗色皮肤（深海蓝）下压制样式生效且可读；
   - 页面无 theme-center 相关错误；ths/trading 行情 404/405/CORS 为**上游 fail-safe 预期降级**，不视为缺陷。
3. **111 部署**：112 验证通过后**必须询问用户**，同意后才部署（2026-08-17 起「服务端同步」功能用户已预授权：112 验证完成后直接部署 111）；111 重启 `dsh-web.service` 用**延迟 detach 触发**（`setsid bash -c 'sleep 60; systemctl restart dsh-web.service' &`），避免中断当前回合；部署后验证服务 active + 页面注入；用户浏览器需 **Ctrl+Shift+R** 强制刷新。
4. 验证脚本用后清理，不留在仓库。

## 七、变更记录

- 本目录下的**每一次变更**（新建/修改/删除文件、配置等）都必须追加记录；格式同根 `AGENTS.md`（时间倒序，最新在最上面）。
- 记录条目数超过 30 条时归档到 `CHANGELOG.md`（保留最新 20 条）。

### 2026-08-17 精刻 Codex 深蓝：侧边栏多层蓝黑过渡复刻参考图层次（右下蓝黑光晕 + 对角 135deg 多色标）v0.3.5

- 变更内容：用户反馈"左侧边栏的过渡色不够细节、不够复刻、没有截图的高级"。对 image/1.png 侧边栏做二维颜色矩阵精细采样（x0/70/140…540 × y0/150…1800）：左上 `#1e2024` 灰黑 → 中 `#181818` 纯黑 → 右下 `#1a212d`/`#1a2030` 蓝黑加深，右段 x490+ 仍黑、x420 附近有条带——是复杂二维过渡而非单段线性。重刻 sidebar-fill 为**多层背景**：右下角 `radial-gradient(circle at 88% 94%, rgba(26,32,48,0.60))` 蓝黑光晕 + 左上一缕微光 `rgba(255,255,255,0.025)` + 对角 `linear-gradient(135deg, #1e2024→#181818(30%)→#1a212d(70%)→#1a2030)`；亮色同步（右下淡蓝光晕 + 135deg 浅灰）；body 暗色 backdrop 同步精刻（顶部蓝雾 + 右下蓝光 + 135deg 黑底）；smoke 断言更新（多层 radial+135deg）；版本 0.3.5
- 涉及路径：`theme-center/lib/skins/codex.js`、`theme-center/tests/smoke.mjs`、`theme-center/package.json`、`theme-center/AGENTS.md`
- 备注：**112 实测全过**（sidebar 渐变落点 `pI_x6G_sidebarCol`/`hHd-Xa_root` x0 w280 多层生效；视觉模型评审："左上近纯黑→右下深蓝黑、斜向渐变、极暗色域内微调、有层次感"）；111 已部署（预授权延迟重启）+ npm 0.3.5 已发布

### 2026-08-17 修复 Codex 深蓝：侧边栏渐变方向反了 + 设置面板遮罩变蓝 v0.3.4

- 变更内容：用户反馈①"侧边栏过渡色颜色反了，应该是左上到右下从黑到蓝"、②"打开设置面板后遮罩应该是背景模糊，现在是打开后背景变了很奇怪的颜色"。修复：① sidebar-fill 渐变 `180deg`（上蓝下黑）→ **`135deg` 左上黑→右下蓝**（暗/亮同步；body 暗色 backdrop 蓝黑光晕从左下部移到右下角 88% 88% 呼应）；② **遮罩根因**：官方设置遮罩 `.VOzbGW_mask` 背景用 `--dsw-alias-bg-mask-1`，由 alias_set 用 brandDeep 生成 `rgba(30,111,208,0.4)` **半透明深蓝蒙层**叠在模糊背景上=奇怪颜色；修复 mask 系列改**中性黑**（暗：mask-1 `rgba(0,0,0,0.42)`/mask-2 0.20/mask-3 0.52/mask-photo 0.88；亮：0.30/0.12/0.40/0.80），遮罩=背景暗化+官方 blur(2px)+root blur(20px) 磨砂；smoke 断言更新（135deg + mask 黑）；版本 0.3.4
- 涉及路径：`theme-center/lib/skins/codex.js`、`theme-center/tests/smoke.mjs`、`theme-center/package.json`、`theme-center/AGENTS.md`
- 备注：**112 实测全过**（mask `rgba(0,0,0,0.42)` + blur(2px)、sidebar-fill 135deg 左黑右蓝、root blur、panel 不透明；视觉模型评审：遮罩自然深黑毛玻璃/背景清晰模糊/左侧渐变协调/无颜色异常/类 Codex 极简）；111 已部署（预授权，延迟重启）+ npm 0.3.4 已发布

### 2026-08-17 新增自研皮肤：Codex 深蓝（参考 image/1.png 配色——黑底 + 蓝黑过渡渐变 + 磨砂毛玻璃，亮暗双形态）v0.3.3

- 变更内容：用户需求"参考 image/1.png（Codex 主题）的侧边栏和会话区配色开发一个主题，只参考配色"，并补充"注意过渡色和磨砂质感"；确认亮暗双形态 + 磨砂仅主界面（设置面板不透明）。**取色**（PIL 像素采样，模型不支持读图）：会话区近黑 `#181818` 79%、侧边栏下部大片蓝黑渐变带 `#1a212d`→`#1a2030`（y750~1750 占 60%）、卡片/输入框 `#2a2a2a`、accent 亮蓝 `#339cff`/浅蓝 `#95c9f9`、正文 `#dfdfdf`、次文字 `#b6b6b6`、弱文字 `#8a8a8a`、侧边栏文字 `#c2c3c3`。**实现**：`/tmp/gen-codex-only.py`（由 gen-skins.py 剥离）生成 161 变量亮/暗骨架 → 注入磨砂：root `backdrop-filter: blur(20px) saturate(1.15)` + 面板 rgba 半透明（layer-1 `rgba(30,32,37,0.86)` 等，bg-base 保持不透明）+ `.VOzbGW_panel { background: var(--dsw-alias-bg-base) !important }` 设置面板不透明（hash 类名 DSH 升级需复核）+ sidebar-fill 蓝黑渐变模拟过渡带 + body 双态渐变（暗：`#1e2024`→`#181818` 基底 + 左下部蓝黑光晕；亮：浅白底 + 淡蓝光晕）；**踩坑修复**：CSS 字符串注入拼接 bug 产生 `n body[...]` 非法选择器（规则永不匹配、设置面板仍半透明）——改用「解析 `const CSS` JSON 字符串 → 整体改写 → 重序列化」的健壮注入器（幂等）；注册表 THEMES +1（24 款）、宿主 SKIN_IDS +1、lib/meta/codex.json、smoke +8 断言、README 清单/数量、§6 验证清单 24 款皮肤；版本 0.3.3
- 涉及路径：`theme-center/lib/skins/codex.js`、`theme-center/lib/meta/codex.json`、`theme-center/lib/{client,index}.js`、`theme-center/package.json`（0.3.3）、`theme-center/tests/smoke.mjs`、`theme-center/README.md`、`theme-center/AGENTS.md`
- 备注：**112 实测全过**（暗色 bgBase `#181818` + layer1 rgba 半透明 + sidebar 蓝黑渐变 + root blur(20px) + 设置面板 rgb(24,24,24) 不透明 + body 渐变；亮色 bgBase `#f7f7f8` + 浅灰 sidebar 渐变 + blur 保留；视觉模型评审：磨砂克制精致、渐变深邃、可读性好、类 Codex/现代 IDE 极简风；112 验证用服务器 settings theme=codex，验证后还原）；112 为 npm 安装（external 已不存在），更新走覆盖 `profiles/web/node_modules/@npm-liqingfeng/dsh-theme-center` 包目录 + 重启；**111 待部署**（link 安装，rsync external）；npm 0.3.3 待发布

### 2026-08-17 修复：settings.plugin.item keyed slot 契约（rc.7 前端 key=设置命名空间），发布 0.3.2

- 变更内容：112 全新 npm 安装后浏览器报 `keyed slot "settings.plugin.item" requires options.key` 且主题卡片不渲染——根因：dsh 前端 `dsh-client-ui-slots` 从 rc.6（list 契约，要求 `id`）升级到 **rc.7（keyed 契约，必须 `options.key` 且 key = 卡片编辑的设置命名空间**，官方渲染按 `entryKey: ns` 过滤）；0.3.1 首版 key 误用卡片 id `"theme"`（命名空间是 `theme-center`）致卡片静默不渲染，0.3.2 修正为 `key: "theme-center"`（同时保留 `id: "theme"` 兼容 rc.6 list 契约）。smoke 补 key 契约断言（`key: "theme-center"`）；版本 0.3.0→0.3.2 重新发布 npm；112 显式版本升级 + 重启后实测：Plugins 配置页主题卡片完整渲染（23 款皮肤 + 双 Tab + 服务端同步提示）
- 涉及路径：`theme-center/lib/client.js`、`theme-center/package.json`、`theme-center/tests/smoke.mjs`、`theme-center/AGENTS.md`
- 备注：**规范补充（必须）**：设置卡注册 `slots.register({ name: "settings.plugin.item", id: <卡片id>, key: <设置命名空间>, ... })`——`key` 必须等于插件设置命名空间（本插件为 `theme-center`），`id` 保留兼容旧前端；dsh 前端 slot 契约 rc.6(list)→rc.7(keyed) 已变更，**DSH 升级需复核**；111（rc.6 前端 + link 安装）未同步，待用户确认

### 2026-08-17 包名改为 @npm-liqingfeng/dsh-theme-center 并发布 npm（原 dsh-theme-center 被他人占用）

- 变更内容：用户需求"插件推送到 npm 供其他 mac/win 安装"——发布前核查发现 `dsh-theme-center` 已被 faster128（2026-08-15 发布 1.0.0）占用，按用户指示改用本人作用域：`package.json` name → `@npm-liqingfeng/dsh-theme-center` + 新增 `publishConfig.access: public`；`cordis.patch.yml` 插件行 name 同步；`lib/client.js` 模块 id（第 2 行）同步；smoke 测试 3 处包名断言更新；README 安装段补 npm 方式（`dsh plugin --profile web add @npm-liqingfeng/dsh-theme-center`）；**v0.3.0 已发布于 npm**（`npm publish --access public` 成功，23 款皮肤 bundle 全打包，tarball 下载验证通过）
- 涉及路径：`theme-center/package.json`、`theme-center/cordis.patch.yml`、`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`、`theme-center/README.md`、`theme-center/AGENTS.md`
- 备注：本文件第二节包名描述已同步更新；**localStorage 键、`body[data-dsh-theme-center]` CSS 作用域等运行时标识不变**（与 111/112 已存数据兼容）；`lib/skins/*.js`、`lib/meta/*.json` 内的 `@user/dsh-client-ui-skin-*` 为**上游皮肤 bundle 内部模块 id（零修改契约）**，不改；111/112 已部署环境本次不动（link 安装与包名无关）

### 2026-08-17 修复：steering 通道用户消息不缩放（USER_TEXT_KINDS 数组 + userKindsSel 每项带完整门控前缀）

- 变更内容：用户反馈"我发送的内容字号突然变大了"（截图 /tmp/zihao-pro.png）——111 实测定位：02:48 发送的消息 `data-chat-flow-kind="steering"`（**用户经 steering 通道发送的消息官方标记为 steering 而非 user**），`_text_1pfhk_1` 显示 16px/24px 官方原样，同会话 9 条 `user` 消息均 12.8px——缩放/字体/表格规则只覆盖 `user`+`assistant-step`，漏掉 `steering`。修复：新增 `USER_TEXT_KINDS = ['user','steering']` 数组 + `userKindsSel(prefix, suffix)` 生成器，外观扩展（字号×2 + 字体×2）与表格列宽模块（table/th/td）共 5 处选择器统一替换；**v2 修正（111 实测捕获）**：CSS 逗号分隔选择器列表中**前缀只作用于第一项**——v1 字符串拼接导致 user 分支退化为"字号设在 user 容器上、被官方文本类显式 16px 覆盖"（user 仍 16px）、steering 分支丢失门控前缀；改为 `userKindsSel` 逐项展开完整前缀（`prefix + ' [data-chat-flow-kind="<k>"]' + suffix`），user/steering 均正确命中文本节点；smoke 断言同步（数组形式 + userKindsSel 调用）
- 涉及路径：`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`、`theme-center/AGENTS.md`
- 备注：本文件 4.8 补充「用户消息通道用 USER_TEXT_KINDS 数组 + userKindsSel（每项带完整前缀），新增用户类通道必须同步加进数组」规范；**112 同构探针实测全过**（user 与 steering 探针均 12.8px/22.4px、无错误）；**111 已部署**（用户预授权，md5 `716b6045` 与 112 一致，重启完成）

### 2026-08-17 修复：输入框可见文字未缩放——官方三层架构（backdrop/textarea/mirror），缩放宽上移到 textarea 父层 `div:has(> textarea)`

- 变更内容：用户反馈"输入后的内容字号确实不对，但是全选输入后的内容字号是缩放的"——112 实测定位根因：**官方 composer 为三层架构**（hash 类名 `uV2eYG_*`，DSH 升级需复核）——`backdrop`（absolute，`color: var(--dsw-alias-label-primary)`）渲染**用户可见文字**、`textarea` 文字透明（`rgba(0,0,0,0)`）只承载光标与选中高亮、`mirror`（visibility:hidden）高度测量；三层 `font-size/line-height: inherit` 继承自 textarea 父层 `grow`。旧规则只缩放 `textarea`（80%→12.8px），**用户看到的 backdrop 文字仍是 16px**（故"未选中不缩放"），而全选时 selection 高亮按 textarea 12.8px 绘制（故"全选才像缩放"）。修复：规则改为 `[data-composer-card="true"] div:has(> textarea){font-size:calc(16px * var(--tc-text-scale))}`——命中 textarea 父层（grow），三层 inherit 一并缩放，不依赖 hash 类名；行高仍保持官方 24px；smoke 断言同步更新
- 涉及路径：`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`、`theme-center/AGENTS.md`
- 备注：本文件 4.8 输入框规范补充三层架构说明（规则作用于父层而非 textarea）；**112 实测全过**（80%：grow/backdrop/mirror/textarea 全部 12.8px/24px，全选场景 backdrop 仍 12.8px，无 console 错误）；**111 已部署**（用户预授权，md5 `26f13d54` 与 112 一致，延迟 detach 重启）

### 2026-08-17 修复：输入框只缩放字号、行高保持官方 24px（防文字贴边与指针错位）

- 变更内容：用户反馈"输入框的字确实没有缩放，且鼠标指针位置也有问题"——112/111 实测 + 视觉模型定位：输入框文字实际已随 80% 缩放为 12.8px，但**行高 19.2px（24×0.8）导致文字上移贴住输入框上边缘、与右侧按钮垂直错位**（textarea 文字顶部对齐特性；截图确认"文字顶到上边缘、垂直偏上"）。修复：输入框规则去掉 line-height 缩放，**只缩放 font-size、行高保持官方 24px**——80% 时 12.8px/24px，文字垂直居中留白正常、光标落点正常；smoke 断言同步更新
- 涉及路径：`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`、`theme-center/AGENTS.md`
- 备注：本文件 4.8 输入框基线改为「16px 基线、行高保持官方 24px」；**112 验证全过**（80%：12.8px/24px，视觉模型确认文字距顶 ~10px 留白、垂直居中，修复前为贴边）；**111 已部署**（用户预授权，md5 `e30710c9` 与 112 一致，延迟 detach 重启）

### 2026-08-17 默认值调整：压制效果默认 80%、会话区字号默认 80%（官方原样锚点与默认值解耦）

- 变更内容：用户需求"压制效果默认80%，会话区字号默认80%"——① `FOCUS_DEFAULT` 70→80（宿主 schema `focus.default(80)`、readSavedFocus 回退 80）；② **关键解耦**：`TEXT_SCALE_DEFAULT` 100→80 且新增 `TEXT_SCALE_OFFICIAL = 100`——原实现把「默认值」与「官方原样锚点」耦合（pct=默认时移除 `data-tc-scale` 门控），若直接改默认 80 会导致 80% 时门控移除不生效；现门控移除条件改为 `=== TEXT_SCALE_OFFICIAL`（100），默认 80 时门控正常挂载、缩放生效，用户手动调回 100 即官方原样；宿主 schema `textScale.default(80)`、`serverDefaults`/`sanitize` 自动跟随；③ 服务器 user 层 focus/textScale **unset** 让新默认生效（旧迁移值 70/100 覆盖 schema 默认，112 实测确认）；smoke 断言同步（0.8/门控默认挂载/TEXT_SCALE_OFFICIAL）
- 涉及路径：`theme-center/lib/client.js`、`theme-center/lib/index.js`、`theme-center/tests/smoke.mjs`、`theme-center/README.md`、`theme-center/AGENTS.md`
- 备注：本文件 4.4/4.6（focus 默认 80）、4.8（默认 80 与锚点 100 解耦 + 持久化键回退 80）、4.9（schema 默认 80）同步更新；**112 验证全过**（默认视图 focus 80/textScale 80、浏览器 `--tc-text-scale:0.8`+`--tc-focus:0.8`+`data-tc-scale` 挂载+输入框 12.8px/19.2px、无错误）；**111 已部署**（用户预授权，md5 `afd2d4e5` 与 112 一致，延迟 detach 重启，服务器 focus/textScale 已 unset）

### 2026-08-17 输入框（composer）内容随「会话区字号」一同缩放（16px/24px 基线）

- 变更内容：用户需求"输入框输入的内容也同会话区字号一同缩放"——111 实测定位：输入框 = 页面唯一 `textarea`（`textareaCount:1`），官方基线 **16px/24px**（与 markdown 的 16/28 不同），hash 类名 `uV2eYG_input` 不可依赖，祖先链稳定锚点 `[data-composer-card="true"]`（曾祖父，composer 卡标记）。实现：`appearanceCss` 缩放分支追加一条规则 `[data-composer-card="true"] textarea{font-size:calc(16px * var(--tc-text-scale));line-height:calc(24px * var(--tc-text-scale))}`——与正文/标题共用 `data-tc-scale` 门控 + `--tc-text-scale`，100% 移除门控=官方原样；只改字号/行高，不碰字体/占位符/颜色；smoke +1 断言
- 涉及路径：`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`（+1）、`theme-center/README.md`、`theme-center/AGENTS.md`
- 备注：本文件 4.8 缩放基线补「输入框 16px/24px（锚点 data-composer-card、DSH 升级需复核）」、§6 验证清单补输入框三档断言；**112 验证 4/4 全过**（125%→20px/30px、90%→14.4px/21.6px、100% 还原 16px/24px 官方原样、无错误）；**111 已部署**（用户预授权，md5 `32e33899` 与 112 一致，延迟 detach 重启）；另实测确认：**已发送/新发送的用户消息均匹配缩放**（111 真实会话 125%：历史 7 条 + 新发送 1 条主文本全部 20px/35px，时间戳 14px 为元信息不缩放属正常）

### 2026-08-17 配置保存到服务器：一处配置、所有终端生效（theme-center 设置命名空间 + /theme-center/settings 路由 + 浏览器同步作用域）v0.3.0

- 变更内容：用户需求"主题卡片的配置能否保存到服务器，一处配置，所有终端生效"，确认 111/112 不共享配置（各自 settings.yaml）——实现（复用 notify-sound 先例）：① 宿主半区 `lib/index.js` 注册 `theme-center` 设置命名空间（schemastery `Config`：theme/scrim/width/focus/textScale/font/hideThink/hideTool/hideContext 9 字段全带默认）+ 自持路由 `/theme-center/settings`（GET 视图 / POST 批量写，同源护栏 + revision 栅栏，`settings.replace(settingsNamespace(...))` 整层提交落盘 settings.yaml 用户层；settings/webServer 缺失静默跳过，注册失败绝不抛出）；② 浏览器半区 `lib/client.js` 新增「服务端同步」模块——`ThemeCenterSettingsScope`（SettingsScope 契约：启动 GET、写即 POST 串行、15s 轮询 + visibilitychange/focus 刷新）、`sanitizeServerValue` 逐字段清洗、`localStateToWrites` 首次同步一次性迁移（老用户升级不丢配置）、`applyRemoteState` 服务器真源 diff 应用（`applyingRemote` 防回环；主题走 `requestTheme(id,false,adopt)` 写缓存不写服务器）、`scheduleServerWrite`（离散字段即时、滑杆 400ms 去抖）、卡片 `.tc-sync` 同步状态行（已同步/同步中/仅本机）；③ 全部 setter 写本地缓存后排队服务器写；④ localStorage 降级为首屏缓存，服务器不可用静默降级仅本机；⑤ 版本 0.3.0；smoke +30 断言（宿主 Config/路由/scope/迁移/回环抑制/同步 effect），fake 环境补 fetch/timers/listeners stub
- 涉及路径：`theme-center/lib/index.js`、`theme-center/lib/client.js`、`theme-center/package.json`（0.3.0）、`theme-center/tests/smoke.mjs`、`theme-center/README.md`、`theme-center/AGENTS.md`；部署目录需建 `node_modules/@deepseek-ai` symlink（同 notify-sound 流程）
- 备注：本文件 §1 定位与边界（持久化双层）、§4.4、新增 §4.9 服务端同步模块规范、§6 验证清单（服务端同步条目 + 111 部署预授权说明）同步更新；**用户确认：111/112 不共享配置；112 验证完成后直接部署 111 并重启（预授权）**；**112 双浏览器上下文实测 12/12 全过**（迁移上推/新终端跟随/服务器胜出/卡片修改落盘/B ≤15s 跟随/刷新与重启持久/同步提示/无错误；踩坑并修复：作用域返回对象漏 `mutate` 方法——smoke 因 fetch stub 走 unavailable 未覆盖该路径，112 实测迁移静默失败（promise 链吞错），已修复并补 smoke「作用域契约完整性」断言（set/unset/mutate/refresh 齐全）；验证后 112 状态已还原）；**111 已部署**（md5 `0ce43900` 与 112 一致，延迟 detach 重启生效）

### 2026-08-16 修复：会话区标题（markdown h1-h6）未随字号百分比缩放（重定义官方标题令牌）

- 变更内容：用户反馈"会话区标题的文字大小好像没有缩放"——112 实测确认根因：官方 markdown 渲染器 `._markdown_ h1..h4` 用 `font: var(--dsw-font-markdown-hN)`、h5/h6 用 `--dsw-font-markdown-base-strong`，均为**固定 px 令牌**（h1 700 24/34、h2 700 22/32、h3 700 20/30、h4 600 16/28、base-strong 600 16/28），不随容器字号联动，而缩放规则只覆盖容器/p/li/blockquote/th/td/code/pre → 125% 时正文 20px 而 H2 仍 22px。修复：新增 `HEADING_FONTS` 基线表 + `headingTokensCss(family)` 生成器，在门控 body 上**重定义 5 个标题令牌**（`weight calc(size * var(--tc-text-scale))/calc(lh * var(--tc-text-scale)) family`）——① 缩放分支 family 用 `var(--dsw-font-family)`（与官方基线等价）；② 字体分支同样重定义令牌（`headingTokensCss(stack)`），字号 calc 乘 `--tc-text-scale`，故仅换字体时先注入基线 `body[data-dsh-theme-center]{--tc-text-scale:1}`（字号×1=官方原值）——标题字体随全站字体联动；smoke +7 断言全绿
- 涉及路径：`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`（+7）、`theme-center/README.md`、`theme-center/AGENTS.md`
- 备注：本文件 4.8 与第六节验证清单同步更新（标题令牌基线表 + 标题缩放/字体断言）；**112 已部署重新验证全过**（2026-08-16，md5 `12e153c5`）：125% 探针 h1 30/42.5、h2 27.5/40（真实 H2「整体布局」27.5/40）、h3 25/37.5、h4-6 20/35、正文 20/35 全部精确；125%+msyh 组合 h2 27.5+YaHei；仅 msyh（100%）h2 22px+YaHei（字号官方、字体跟随）；默认态 h2 22/32 -apple-system 官方原样、门控全移除、appearance 文本空、5 样式元素就位、无 console 错误；测试状态已还原默认；**按流程：验证通过，询问用户后再部署 111**

### 2026-08-16 新增外观扩展模块：会话区字号百分比 + 全站字体下拉 + 隐藏开关×3（参考 dsh-chat-tidy 锚点手法）

- 变更内容：按用户需求（参考 [ChuanTianML/dsh-chat-tidy](https://github.com/ChuanTianML/dsh-chat-tidy)，外观 Tab 内新增、全部即时生效）在 `lib/client.js` 新增「外观扩展」模块——单个 `<style>`（`dsh-theme-center/appearance`）+ 三个 body 门控属性（`data-tc-scale` / `data-tc-font` / `data-tc-hide`，值变化整体重写样式文本）：① **会话区字号** 75-150% 滑杆（键 `textscale:v1` 默认 100，缩放基线 16px/28px 硬编码自 `--dsw-font-markdown-base` 实测，calc 乘法覆盖 markdown 容器/p/li/blockquote/th/td/inline code/pre/用户气泡，**Think 行/工具卡/上下文卡不在其中不受缩放影响**，100% 移除门控=官方原样）；② **全站字体** 下拉（键 `font:v1`，FONTS 表 8 项：系统默认/微软雅黑/苹方/思源黑体/宋体/Inter/Roboto/JetBrains Mono 等宽，双路覆盖 `--dsw-font-family` + markdown/气泡容器 font-family，代码字体 `--ds-font-family-code` 不动）；③ **隐藏开关×3**（键 `hide:v1` JSON，`data-tc-hide~=` 门控 + display:none：思考行/工具调用卡/上下文注入卡，隐藏优先于压制）；外观 Tab 增至 5 节（宽度/精简/字号/字体/隐藏），新增 tc-select/tc-check 令牌样式；smoke 测试 +15 断言（样式元素 4→5、门控成对、默认态空文本）
- 涉及路径：`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`、`theme-center/README.md`、`theme-center/AGENTS.md`
- 备注：本文件新增 4.8 外观扩展模块规范与第六节验证清单 3 组条目；**112 已部署验证全过**（2026-08-16：外观 Tab 5 节就位、字号 125%→20px/35px 精确 + 工具卡保持 12.6px 不受缩放影响 + 100% 还原 16px、字体 msyh 双路覆盖 body+markdown、隐藏工具卡 17/17→0→恢复、刷新持久化 125%/msyh 恢复、状态已还原 100%/default/全不隐藏、无 console 错误）；**按流程：验证通过，询问用户后再部署 111**

### 2026-08-16 新增表格列宽模块：表格撑满整列 + 解除 320px 列上限（常开，用户确认）

- 变更内容：用户反馈"表格宽度只有会话区一半、列内容挤成很多行"——排查确认官方 markdown 渲染器 `table{width:max-content}` + `td/th{max-width:min(30vw,320px)}`（中文长文本被压进 320px 窄列疯狂换行，实测表格 452px/内容列 896px）。新增 `TABLE_CSS` + `dsh-theme-center/table` 样式 effect（disposer 收回）：助手回答/用户消息内（`[data-chat-flow-kind="assistant-step"|"user"]` 稳定属性，不依赖 hash 类名）`table{width:100% !important;max-width:100% !important}` + `td/th{max-width:none}`；超宽表格仍由官方 `overflow-x:auto` 容器横向滚动；**常开不设开关**（用户选择"直接默认生效"）
- 涉及路径：`theme-center/lib/client.js`、`theme-center/tests/smoke.mjs`（+4 断言、样式元素 3→4）、`theme-center/README.md`、`theme-center/AGENTS.md`
- 备注：本文件新增 4.7 表格列宽模块规范与第六节验证清单条目；实测修复前后：表格 452px→896px、最长单元格 96px→71px（4 行→3 行）；本地 smoke 全绿；**112 已部署验证全过**（2026-08-16：table 样式元素注入、同构探针表格撑满容器 100%、`td max-width=none`、长文本单行渲染、无 console 错误）；**按流程：验证通过，询问用户后再部署 111**

### 2026-08-16 一体化改造：并入聊天宽度 + 新增聊天区精简（卡片双 Tab：主题/外观）v0.2.0

- 变更内容：按用户布局指示（卡内双 Tab + 宽度按钮移除 + 压制百分比滑杆）将 theme-center 扩展为一体化插件——① `lib/client.js` 新增「聊天宽度」模块（`WIDTH_PRESETS` 6 档 896-1600、键 `dsh-theme-center:width:v1`、`widthCss` 覆盖 `--dsh-chat-content-width`/`--dsh-composer-card-max-width` + 释放 userStack 上限，作用域限 `body[data-dsh-theme-center]`；**不再注册**标题栏宽度按钮）；② 新增「聊天区精简」模块（键 `dsh-theme-center:focus:v1` 默认 80，`focusCss` 全部规则以 `--tc-focus`（0-1）+ `calc()` 线性插值——Think 行/工具调用卡/上下文注入卡的标题字号 14→12px、行高 24→18px、摘要/来源透明度 1→0.6、图标 14→11px、Cordis 卡行高 32→22px、错误卡标题 ellipsis；**只改字号/行高/透明度/尺寸不写颜色**，天然适配全部皮肤；`body[data-tc-focus]` 门控，pct=0 整组失效=官方默认）；③ 卡片双 Tab「主题/外观」：主题 Tab 原内容不动，外观 Tab = 宽度预设药丸 + 压制百分比滑杆（复用 tc-pill/tc-scrim 令牌样式）；④ apply 新增 width/focus 两个 `<style>` effect（`data-pluginCss` 区分，disposer 全收含门控属性）；⑤ 修复 `readSavedFocus` 缺失回退（`Number(null)=0` 陷阱，smoke 测试捕获）；⑥ 新增 `tests/smoke.mjs`（node 内置：包形状/宿主/注册表一一对应/一体化模块存在性/apply 契约与零残留，全绿）；⑦ 版本 0.2.0，README 重写
- 涉及路径：`theme-center/lib/client.js`、`theme-center/package.json`、`theme-center/README.md`、`theme-center/tests/smoke.mjs`（新增）、`theme-center/AGENTS.md`
- 备注：本文件同步新增 4.4 宽度/压制键、4.6 聊天区精简模块规范、第六节验证清单（双 Tab/宽度/压制三档/主题抽查）；chat-width-customizer 已并入本插件（该文件夹保留作归档）；**112 已部署验证全过**（2026-08-16：默认 70% 落地 `--tc-focus:0.7`、工具卡标题 12.6px/摘要 0.72、Think 同构探针 12.6px/0.825/0.72/图标 11.9px、Cordis 行 100% 时 22px、双 Tab 24 行、宽度 1152 持久化+刷新恢复、压制 0%/100% 端点门控成对、深海蓝皮肤下压制仍生效+官方干净还原、bundle 路由 200/200+越界 404、smoke 全绿、无 console 错误；测试状态已还原 896px/70%/官方）；**按流程：验证通过，询问用户后再部署 111**

### 2026-08-16 按用户要求移除全部透明/毛玻璃效果（面板恢复不透明、去掉 backdrop-filter），保留渐变色背景，112 实测全过

- 变更内容：用户反馈"不要透明效果"（先针对设置面板、后要求全部）——13 款新皮肤（自研 6 + dsh-skin 7）移除透明与毛玻璃：① `[id='root']` 去掉 `backdrop-filter: blur(20px)`（只保留 transparent 让 body 渐变在空白区透出）；② 面板恢复不透明（layer-1/2/3/overlay 等全部 hex 原值，不做 rgba 半透明化）；③ `.VOzbGW_panel` 规则删除；④ **渐变背景完整保留**（自研 6 款氛围渐变 + dsh-skin 7 款色系渐变）
- 涉及路径：`theme-center/lib/skins/`×13（重新生成）、`theme-center/AGENTS.md`；112 上 `/root/.dsh/external/theme-center/lib/skins/`（已同步）
- 备注：112 两套验证全过（自研 41 项含"面板不透明"新断言 + dsh-skin 33 项）；实测 `rootBackdrop=none`、`layer-1=#ffffff` 不透明、`background-image` 渐变保留；生成器 mk() 已恢复为不透明（半透明化代码移除）

### 2026-08-16 参考 zhaiyateng/dsh-design-skills（glassmorphism 规范）为 13 款新皮肤添加渐变 + 毛玻璃，设置面板保持不透明，112 实测全过

- 变更内容：用户要求参考 [zhaiyateng/dsh-design-skills](https://github.com/zhaiyateng/dsh-design-skills)（MIT）的设计 skill 为今日主题加渐变色和毛玻璃——按其 glassmorphism SKILL.md 规范（渐变底 + backdrop-filter blur(≥15px) + 半透明面板 + 亮边框 + 克制面积）落地：① 13 款皮肤（自研 6 + dsh-skin 7）`[id='root']` 加 `backdrop-filter: blur(20px) saturate(1.15)`（含 -webkit- 前缀）+ transparent；② 面板透明度调低（亮色 layer1/2/3 = 0.75/0.68/0.6，暗色 0.62/0.55/0.48），bg-base 保持不透明；③ dsh-skin 7 款补各自色系 body 渐变背景（深色款深渐变 + 品牌光斑，亮色款浅渐变 + 淡光斑）；④ 视觉模型评审：深海蓝"毛玻璃明显、渐变可见、比纯色高级"、赛博朋克"方向正确"后 blur 16→20px、暗色面板再透一档；**⑤ 用户反馈"设置面板不需要透明效果"——`.VOzbGW_panel { background: var(--dsw-alias-bg-base) }` 设置面板固定不透明（bg-base 为皮肤不透明底色），实测面板 rgb 完全不透明、主界面毛玻璃保留**
- 涉及路径：`theme-center/lib/skins/`×13（重新生成）、`theme-center/AGENTS.md`；112 上 `/root/.dsh/external/theme-center/lib/skins/`（已同步）
- 备注：112 两套验证全过（自研 41 项 + dsh-skin 33 项）；设置面板实测 `panelBg=rgb(244,245,251)` 不透明、`rootBackdrop=blur(20px)` 保留；`.VOzbGW_panel` 为 CSS-modules hash 类名，DSH 升级后需复核（记录在案）；glassmorphism 规范要点已内化（渐变底是基础/玻璃=半透明+blur≥15px/亮边框/面积克制）

### 2026-08-16 集成 KinGao294/dsh-skin 7 款精选皮肤（深海蓝/石墨灰/森林绿/日落紫/深夜黑/暖纸/樱花粉）并 112 实测全过

- 变更内容：用户要求参考 [KinGao294/dsh-skin](https://github.com/KinGao294/dsh-skin)（MIT）把主题加进来——提取其 client bundle 中 7 款皮肤（SKINS 数组，每款 27 个 --dsw-alias-* 令牌覆盖，5 暗色 2 亮色）按 theme-center 规范转成皮肤 bundle（**固定色系 alias-only**：亮暗同值，颜色自洽，不映射 static、不随亮暗切换——与 dsh-skin 的 colorScheme 行为等效但不动官方亮暗属性）；中文名：深海蓝/石墨灰/森林绿/日落紫/深夜黑/暖纸/樱花粉；注册表 THEMES +7（共 24 行）、宿主 SKIN_IDS +7、lib/meta/ +7、卡片描述改 23 款；许可注明 dsh-skin MIT 来源
- 涉及路径：`theme-center/lib/skins/skin-*.js`×7、`theme-center/lib/meta/skin-*.json`×7、`theme-center/lib/{client,index}.js`、`theme-center/README.md`、`theme-center/AGENTS.md`
- 备注：**112 实测 33 项断言全过**（bundle 路由 7/7、卡片 24 行、逐款试穿→应用保持 + bg-base 精确匹配 + 样式标签恰 1、官方默认干净还原、无 theme-center 错误）；视觉模型评审深海蓝：整体统一深色、文字可读性好（输入框边框/滚动条轻微偏亮为细节，非违和）；生成脚本 /tmp/gen-dsh-skin.py（node 提取 SKINS + python 生成）

### 2026-08-16 自研皮肤改造：氛围渐变背景 + 半透明毛玻璃面板（参考各配色方案官方美学）并 112 实测全过

- 变更内容：用户反馈"设计太单调、亮色默认体验不好"——改造 6 款自研皮肤：① 参考各主题官方美学设计 body 氛围渐变（Catppuccin 奶油紫调光晕 / Tokyo Night 霓虹城市顶部光斑 / Nord 北极光 / 赛博朋克青紫霓虹 / 薄荷清新 / 苹果极简浅渐变），纯 CSS radial/linear-gradient（无静态资源）；② 面板半透明化（layer-1/2/3 = rgba 0.86/0.8/0.74，bg-base 保持不透明保证底色稳定），毛玻璃通透感；③ **关键修复：`body[data-dsh-x] [id='root'] { background: transparent }`**（同 blue-fantasy 手法）——否则 body 渐变被 #root 不透明背景挡住；④ 暗色霓虹光晕经 2 轮增强（顶部椭圆大光斑 alpha 0.3 左右）经视觉模型（describe_image 截图分析）确认到位
- 涉及路径：`theme-center/lib/skins/`×6（重新生成）、`theme-center/README.md`、`theme-center/AGENTS.md`
- 备注：**112 实测 41 项断言全过**（含氛围渐变注入 + 面板半透明断言）；视觉模型评审：紫粉拿铁亮色"渐变可见、毛玻璃明显、协调优雅、完成度高"（亮色体验问题解决）、赛博朋克暗色"氛围非常到位、青色大光斑醒目、可读性好、不刺眼"；生成器（/tmp/gen-skins.py）现支持 backdrop 字段（亮/暗渐变）与 mk() 面板半透明化，后续新增自研皮肤直接复用

### 2026-08-16 新增 6 款自研皮肤（紫粉拿铁/清新浅绿/赛博朋克/苹果官网风/东京夜色/北欧极地，均亮暗双形态）并 112 实测全过

- 变更内容：按用户需求新增 6 款自研纯令牌重映射皮肤（无背景画、无 DOM chrome，每款 ~15KB）——生成流程：以 qq98 皮肤 CSS 的 161 变量结构为模板（亮/暗双块），写生成器（/tmp/gen-skins.py，不入库），每款定义色板（灰阶 21 档 + 品牌主色阶 + 语义色阶 + alias/specific 语义值表）自动生成 bundle；Catppuccin（Mocha/Latte 官方色板）、清新浅绿、赛博朋克、苹果官网风、东京夜色、Nord 六款；主题名全部中文（Catppuccin→紫粉拿铁、Tokyo Night→东京夜色、Nord→北欧极地）；注册表 THEMES 增 6 条（共 17 行）、宿主 SKIN_IDS 白名单增 6 个、lib/meta/ 增 6 个 skin.json、卡片描述改 16 款
- 涉及路径：`theme-center/lib/skins/{catppuccin,mint-fresh,cyber-neon,apple-minimal,tokyo-night,nord}.js`、`theme-center/lib/meta/`×6、`theme-center/lib/client.js`、`theme-center/lib/index.js`、`theme-center/README.md`、`theme-center/AGENTS.md`
- 备注：**112 实测 33 项断言全过**（bundle 路由 6/6、卡片 17 行、逐款试穿→应用保持 + 亮色 bg-base 精确匹配 + 暗色 bg-base 精确匹配 + 样式标签恰 1、官方默认干净还原、无 theme-center 错误）；开发踩坑 3 个：① 宿主 SKIN_IDS 白名单漏加新 id 致路由 404；② 生成器 data_key 未带 dsh 前缀致 body 属性与 CSS 作用域不一致（dataset.Catppuccin → data-catppuccin ≠ data-dsh-catppuccin）；③ 112 界面 zh-CN + 侧边栏默认折叠，验证脚本需双语文本定位 + 先展开侧边栏

### 2026-08-16 修复「先试穿再应用同一主题」回退默认 + 切换顺序规范更新

- 变更内容：用户反馈"主题先试穿再应用就会变回默认主题"——112 实测复现：应用时先挂载新实例、后卸载试穿旧实例，旧实例 disposer（删属性/还原背景/移除 favicon）收回新实例刚写入的同一处 DOM。修复：`runJob` 中 `disposeCurrent()` 移到 `loadThemeApply()` **之前**（先卸载→再加载→再挂载）；期间又发现若卸载放在加载之后，旧实例样式清理会误删新实例的 CSS 标签（CSS 在 import 时注入、apply 不重新注入）——一并由该顺序修复；112 三套回归全过（复现脚本含样式断言 skinStyles≥1 + 主验证 14 项 + 补充验证 + 10 款全量冒烟；验证脚本皮肤属性过滤改为白名单 SKIN_ATTRS，排除 notify-sound/describe-image 等其他插件的 data-dsh-* 属性）；本文件 4.3 切换语义与第六节验证清单同步更新
- 涉及路径：`theme-center/lib/client.js`、`theme-center/AGENTS.md`
- 备注：修复版已部署 112（rev `f625666a7491`）；按部署流程待用户确认后部署 111

### 2026-08-16 建立本规范文件

- 变更内容：新建本文件，沉淀 theme-center 主题开发规范——定位边界、包结构、皮肤集成流程（上游 bundle 零修改复用 + 注册表 + 元数据）、主题引擎机制（同源分发路由 / 内核模块执行 / miniCtx / 串行泵 / 切换回滚语义 / 持久化键 / 标题链基线）、皮肤 UI 契约（令牌 / 作用域 / 全量收回 / 主题适配必须）、112 验证清单与 111 部署流程、变更记录机制；用户指示"以后主题开发都按照这个规范来"
- 涉及路径：`theme-center/AGENTS.md`
- 备注：规范内容源自 2026-08-15 theme-center 开发与 112 验证全过程（含标题还原链缺陷修复、同源护栏、残留回滚配方等实测结论）
