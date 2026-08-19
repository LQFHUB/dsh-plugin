# 🎨 dsh-theme-center

> 个人主题插件（一体化）：在 **设置 > 插件配置** 新增一张「主题」卡片，顶部 **主题 / 外观** 双 Tab——
> **主题**：内置 **24 款皮肤**（dsh-web-ui 10 款 + 自研 7 款 + dsh-skin 7 款），支持**试穿 / 应用 / 持久记忆**、亮暗预览与背景遮罩调节；
> **外观**：**聊天宽度**预设（896–1600px）与**聊天区精简**百分比压制（思考行 / 工具调用卡 / 上下文注入卡）。
> 皮肤与卡片交互参考 [zhu1090093659/dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui)
> 的皮肤中心（skin-center）实现，其中 10 款皮肤 bundle 原样复用（BSD-3-Clause，见 [LICENSE](LICENSE)），6 款为自研纯令牌重映射皮肤。
> 已部署：AI-2（192.168.31.112，效果验证）与 AI（192.168.31.111，正式使用），
> 均为 `/root/.dsh/external/theme-center` link 方式安装。
> 本插件已并入原 chat-width-customizer（聊天宽度）功能，该独立插件已不再安装。

---

## ✨ 特性 / Features

- **24 款皮肤一次集齐**：dsh-web-ui 全家桶 10 款（蓝色幻想、龙的传人、夕港、初音未来、Minecraft、QQ2008 怀旧版、同花顺、交易终端、鲸吟、Windows XP）+ 自研 7 款（紫粉拿铁、清新浅绿、赛博朋克、苹果官网风、东京夜色、北欧极地、Codex 深蓝——后者参考 OpenAI Codex 配色：黑底 + 蓝黑过渡渐变 + 磨砂毛玻璃面板，均亮/暗双形态）+ dsh-skin 精选 7 款（深海蓝、石墨灰、森林绿、日落紫、深夜黑、暖纸、樱花粉，固定色系，源自 [KinGao294/dsh-skin](https://github.com/KinGao294/dsh-skin)，MIT）
- **自研皮肤带氛围背景**：6 款自研皮肤参考各自配色方案的官方美学（Catppuccin 奶油紫调 / Tokyo Night 霓虹城市 / Nord 北极光 / 赛博朋克霓虹光斑 / 薄荷清新 / 苹果极简渐变）——body 光晕渐变背景（纯 CSS，无静态资源）+ 半透明毛玻璃面板，亮色柔和通透、暗色深邃有氛围
- **「主题」设置卡片**：参考官方插件卡片（bash/agent-loop 同款折叠卡）与皮肤中心的交互——每款皮肤一行，含名称、说明、主题色
- **试穿 / 应用**：试穿实时预览不持久化，退出试穿一键还原；应用立即生效并持久记忆（localStorage），刷新 / 重开浏览器自动恢复
- **官方默认一键还原**：切回官方默认即完全还原（body 属性、背景、favicon、标题、注入 DOM 全部收回）
- **亮暗预览切换**：卡片内直接切换亮色 / 暗色（驱动官方主题服务，与「外观」行一致）
- **背景遮罩滑杆**：0–100% 调节背景画遮罩（蓝色幻想 / 夕港 / 鲸吟等带背景画的皮肤生效，写 `--dsw-skin-scrim`）
- **零配置纯浏览器切换**：不写任何 DSH 配置文件、不重载页面、不触碰模型请求；皮肤按需加载（仅应用/试穿时才分发对应 bundle）
- **卡片双 Tab（主题 / 外观）**：一张卡承载全部调整项——「主题」Tab 保持原有皮肤体验；「外观」Tab 收纳聊天宽度与聊天区精简
- **聊天宽度预设**：896 / 1024 / 1152 / 1280 / 1440 / 1600px 六档，对话内容区、输入框、用户气泡一起变宽，localStorage 持久记忆（原 chat-width-customizer 功能，标题栏快捷按钮已移除）
- **聊天区精简百分比**：0–100% 滑杆（**默认 80%**）压制聊天区过程展示——Think 思考行字号变小、摘要变淡、图标缩小；工具调用卡与上下文注入卡标题变小、摘要变淡、卡片变矮（Cordis 插件卡行高 32→22px）；错误工具卡标题 ellipsis 截断。0% = 官方默认展示，插值全程仅改字号/行高/透明度/尺寸，不写任何颜色，自动适配全部皮肤与亮/暗
- **表格撑满列宽**：官方渲染器把表格设为 `width:max-content` 且单元格 `max-width` 封顶 `min(30vw,320px)`——中文长文本被压进 320px 窄列疯狂换行、表格只占列宽一半；本插件在助手回答/用户消息内覆盖为**撑满整列 + 解除列上限**（超宽表格仍横向滚动），无需配置
- **会话区字号百分比**：75%–150% 滑杆（**默认 80%**，100% = 官方原样）缩放助手回答与用户消息文字（16px/28px 基线线性放大，标题/代码/表格/用户气泡联动）与**输入框内容**（16px/24px 基线）；**不影响**思考行、工具调用卡与上下文注入卡（由「聊天区精简」调节）
- **全站字体下拉**：系统默认 / 微软雅黑 / 苹方 / 思源黑体 / 宋体 / Inter / Roboto / JetBrains Mono 等宽——选中即改整个网站 UI 与消息文字字体（`--dsw-font-family` 双路覆盖），代码块等宽字体保持不变
- **隐藏显示开关 ×3**：隐藏思考行 / 隐藏工具调用卡 / 隐藏上下文注入卡，各自独立勾选即时隐藏（纯 CSS display:none，不触碰消息数据）
- **配置保存到服务器 · 一处配置、所有终端生效**：主题/遮罩/宽度/精简/字号/字体/隐藏全部存到服务器设置（profile `settings.yaml` 的 `theme-center:` 段），任何浏览器/设备修改一次，其余终端 ≤15 秒内自动跟随；服务重启配置仍在；**localStorage 降级为首屏缓存**（页面先按缓存立即渲染，服务器视图到达后以服务器为真源收敛）；服务器不可用时静默降级为仅本机生效；老用户首次同步自动把本地配置迁移上推，不丢配置。卡片内有一行同步状态提示（已同步 / 同步中 / 仅本机）

## 🎯 界面位置 / Where it lives

```
设置（侧边栏底部） → 插件配置 → 主题 卡片
┌─────────────────────────────────────────────┐
│ ▸ 主题 · 外观（聊天宽度 / 聊天区精简）        │
│   ┌───────────┬──────────┐                  │
│   │ [主题]    │ [外观]   │   ← 卡片内双 Tab  │
│   ├───────────┴──────────┤                  │
│   │ 亮暗预览  [亮色] [暗色]│                 │
│   │ ● 官方默认        [试穿] [应用]          │
│   │ ● 鲸吟 · 深海鲸语… [试穿] [应用]         │
│   │ …（共 24 行）                            │
│   │ 背景遮罩 40%  ──●────────               │
│   └─────────────────────────────────────────┘
│   （「外观」Tab：）                           │
│   ┌───────────────────────────────────────┐ │
│   │ 聊天宽度  [896px] [1024px] … [1600px] │ │
│   │ 聊天区精简 压制效果 70%  ──●─────     │ │
│   └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## 📦 安装 / Installation

```sh
# 方式一：npm 安装（已发布到 npm registry，推荐——任意 mac/win/linux 机器）
dsh plugin --profile web add @npm-liqingfeng/dsh-theme-center

# 方式二：link 安装（源码目录，用于本地开发）
dsh plugin --profile web add link:/root/.dsh/external/theme-center
```

> ⚠️ 安装后需要**重启 `dsh web`**，并在浏览器里 **Ctrl+Shift+R** 强制刷新一次。

## 🖱️ 使用 / Usage

1. 打开 **设置 → 插件配置 → 主题** 卡片
2. 「**主题**」Tab：点某款皮肤的「**试穿**」实时预览效果（此时可配合「亮暗预览」切换看两种形态）；不满意点「**退出试穿**」还原；满意后点「**应用**」——立即生效并持久记忆，刷新页面自动恢复；想回到原生外观：官方默认行点「**应用**」即可，全部皮肤写入彻底还原
3. 带背景画的皮肤（蓝色幻想 / 夕港 / 鲸吟）可拖动「背景遮罩」滑杆调节暗化程度
4. 「**外观**」Tab → **聊天宽度**：点击档位药丸立即加宽对话区并记忆（全局共享，切会话/刷新均保持）
5. 「**外观**」Tab → **聊天区精简**：拖动「压制效果」滑杆（0–100%）实时调整思考行与工具卡展示强度；0% 恢复官方默认展示

## 🎨 皮肤清单 / Skins

| 皮肤 | 说明 |
| --- | --- |
| 官方默认 | 还原 DeepSeek Harness 原生外观 |
| 蓝色幻想 | DreamSkin「DeepSeek-鲸鱼娘」Codex 主题适配：鲸鱼插画背景 + periwinkle 靛蓝调色板 + 半透明面板 |
| 龙的传人 | 墨龙穿云 / 万里长城双主题，朱砂龙印 favicon，亮暗各一形态 |
| 夕港 | 黄昏港口动漫背景：暮光蓝天空渐入日落橙，半透明夜色面板 |
| 初音未来 · 电子歌姬 | 蓝紫洋红渐变、音符波形标题栏与状态栏 |
| Minecraft 方块世界 | 程序化像素全景天空盒缓慢旋转、方块按钮、告示牌输入框 |
| QQ2008 怀旧版 | 水晶蓝桌面、玻璃深蓝标题栏、戴围巾企鹅 |
| 同花顺风格 | 品牌红标题栏（上证指数行情签）、红涨绿跌状态栏、自选股风格侧边栏 |
| 交易终端 | 实时行情跑马灯（长桥港美股行情）、红涨绿跌交易终端 |
| 鲸吟 | 深海鲸语女神背景画、冰蓝海洋调色板、金色细线点缀（亮/暗深海夜航） |
| Windows XP (Luna) | Luna 蓝窗口条、绿色开始按钮、Bliss 蓝天桌面、侧边栏任务栏 |
| 紫粉拿铁 | Catppuccin（GitHub 最流行配色）：紫粉奶油系，亮 = Latte / 暗 = Mocha |
| 清新浅绿 | 薄荷绿清新风：白绿通透，亮暗双形态 |
| 赛博朋克 | 霓虹青紫赛博风：深空蓝黑 + 发光点缀，亮暗双形态 |
| 苹果官网风 | 苹果极简通透风：大留白 + 柔和灰阶，亮暗双形态 |
| 东京夜色 | Tokyo Night：程序员霓虹经典，深蓝紫 + 蓝青点缀，亮暗双形态 |
| 北欧极地 | Nord：极地冰蓝冷淡风，低饱和灰蓝，亮暗双形态 |
| 深海蓝 | DeepSeek 品牌深海调 · 深蓝沉浸 · 暗色系（dsh-skin） |
| 石墨灰 | 中性石墨灰 · 极简克制 · 暗色系（dsh-skin） |
| 森林绿 | 森林绿 · 清新自然 · 暗色系（dsh-skin） |
| 日落紫 | 日落紫 · 暖紫暮色 · 暗色系（dsh-skin） |
| 深夜黑 | 纯黑 OLED · 极简深邃 · 暗色系（dsh-skin） |
| 暖纸 | 暖纸米黄 · 护眼柔和 · 亮色系（dsh-skin） |
| 樱花粉 | 樱花粉 · 温柔治愈 · 亮色系（dsh-skin） |
| Codex 深蓝 | Codex AI 极简深空 · 黑底 + 蓝黑过渡渐变 · 磨砂毛玻璃面板 · 亮暗双形态（参考 Codex 配色） |

## 🔧 工作原理 / How it works

- **分发**：宿主半区注册同源路由 `GET /api/theme-center/bundle/<id>`（带 Sec-Fetch-Site / Origin 同源护栏），按需返回 `lib/skins/<id>.js`——即 dsh-web-ui 皮肤中心分发产物的原样拷贝
- **执行**：浏览器半区以真实 `<script>` 加载 bundle，经内核自身模块系统（`__ModuleLoader__` 注册 → `__DSH_MODULES__.import` 物化，样式自动注入）后调用皮肤 `apply(miniCtx)` 挂载——与皮肤中心 try-on 同路径，无 eval、无 CSP `unsafe-eval` 依赖
- **miniCtx**：只提供 `effect` 生命周期；`get` 委托真实上下文（同花顺 / 交易终端皮肤可读取 connection 服务，缺失时优雅降级为占位）
- **切换语义**：挂载成功后才卸载旧主题（加载失败旧主题保持可见）；皮肤 `apply` 中途抛错时按残留配方回滚（模块失效、样式标签、body 属性、`data-skin-chrome` 元素）
- **持久化（双层）**：**服务器为真源**——配置存 profile `settings.yaml` 的 `theme-center:` 段（宿主经 dsh-settings 用户层写入，服务重启保留，所有浏览器读同一份）；**localStorage 为首屏缓存**——键 `dsh-theme-center:active:v1`（主题 id）、`scrim:v1`（遮罩 0-100）、`width:v1`（聊天宽度）、`focus:v1`（压制百分比 0-100，默认 70）、`textscale:v1`（会话区字号 75-150，默认 100）、`font:v1`（字体 id）、`hide:v1`（隐藏开关 JSON）；页面加载先按缓存立即渲染，服务器视图到达后以服务器为真源收敛；存储不可用时退化为内存态
- **服务端同步**：宿主注册 `theme-center` 设置命名空间（schemastery schema，9 字段全带默认）+ 自持路由 `/theme-center/settings`（GET 视图 / POST 批量写，同源护栏 + revision 栅栏，内部经 dsh-settings `replace` 提交；官方 apiproxy 白名单不含第三方命名空间，故必须自建路由——notify-sound 同款先例）；浏览器端 `ThemeCenterSettingsScope` 实现 SettingsScope 契约——启动 GET、写即 POST（滑杆字段 400ms 去抖）、15s 轮询 + 聚焦/可见刷新；服务器未配置时首次同步把本地状态一次性迁移上推；服务器状态到达后逐字段 diff 应用（回环抑制：远程应用不回写服务器）；settings 服务缺失/路由不可达 → 静默降级 localStorage 模式
- **聊天宽度**：独立 `<style>` 覆盖 `--dsh-chat-content-width` 与派生 `--dsh-composer-card-max-width`，并释放用户气泡 525px 上限；规则作用域限定 `body[data-dsh-theme-center]`，随插件卸载收回
- **聊天区精简**：独立 `<style>` + `body[data-tc-focus]` 门控属性——所有规则以 `--tc-focus`（0-1）`calc()` 线性插值（0 时与官方默认完全一致）；只改字号/行高/透明度/尺寸，颜色一律走官方令牌，theme-center 全部皮肤与亮/暗自动适配；错误工具卡标题 ellipsis 为非插值规则，由门控属性保证 0% 时不生效
- **表格列宽**：独立 `<style>` 静态覆盖官方表格规则（`width:max-content` → `100%`、`td/th max-width` 封顶 → `none`），选择器只依赖稳定属性 `[data-chat-flow-kind="assistant-step"|"user"]`，不依赖 hash 类名；超宽表格仍由官方 `overflow-x:auto` 容器横向滚动
- **外观扩展（字号/字体/隐藏）**：单个 `<style>`（`dsh-theme-center/appearance`）承载三组规则，值变化整体重写文本；三个 body 门控属性——`data-tc-scale`（字号缩放，100% 时移除=官方原样）、`data-tc-font`（字体 id，default 移除）、`data-tc-hide`（空格分隔值 + `~=` 选择器匹配 think/tool/context）；字号基线 16px/28px 来自官方 `--dsw-font-markdown-base` 实测（DSH 升级需复核）；**标题 h1-h6 官方为固定 px 令牌（24/22/20/16px 基线），缩放时重定义 `--dsw-font-markdown-h1..h4`/`base-strong` 令牌按比例 calc**，标题字号随滑杆缩放、字体随全站字体联动；字体双路覆盖（`--dsw-font-family` 变量 + markdown/气泡容器 `font-family` + 标题令牌重定义），代码字体 `--ds-font-family-code` 不动；隐藏为纯 CSS `display:none`，不触碰消息数据；disposer 移除样式与全部门控属性
- **包结构**：标准 DSH 插件 bundle（`dsh.bundle` 清单 + `dsh.client` web 平台声明），浏览器启动时自动注入

## 🧩 兼容性 / Compatibility

- DeepSeek Harness（本机开发验证版本）+ Cordis `4.x`；现代浏览器
- 需要宿主 `webServer` 服务与浏览器端 `window.__DSH_MODULES__`（内核自带）；缺失时卡片显示错误提示，不影响 GUI
- 与 dsh-web-ui 皮肤中心**不建议并存**（双方都会写 body 主题属性，可能互相干扰）；本插件已内置其全部皮肤，无需再装 dsh-skins

## 🛠️ 开发 / Development

```
theme-center/
├── lib/
│   ├── index.js     Host 入口：/api/theme-center/bundle/<id> 同源分发路由 + theme-center 设置命名空间 + /theme-center/settings 读写路由
│   ├── client.js    浏览器 bundle：主题引擎 + 「主题/外观」设置卡片（含聊天宽度、聊天区精简、服务端同步模块）
│   └── skins/       <id>.js ×23：皮肤 bundle（dsh-web-ui 原样拷贝 + 自研 + dsh-skin）
├── tests/smoke.mjs  node 内置冒烟测试（node tests/smoke.mjs；宿主 import 需 node_modules/@deepseek-ai symlink，同 notify-sound 流程）
├── cordis.patch.yml profile 组合层插入条目
├── package.json     包清单（dsh.bundle / dsh.client 声明）
├── README.md
└── LICENSE          BSD-3-Clause
```

**本地迭代**：改完 `lib/` 后同步到 112 `/root/.dsh/external/theme-center/` 并重启 dsh web，浏览器强制刷新验证。

**同步上游皮肤更新**：重新拉取 `packages/skins/<id>/lib/client.js` 覆盖 `lib/skins/<id>.js` 即可（皮肤注册表在 `lib/client.js` 顶部 `THEMES` 常量，元数据在 `lib/meta/` 的 skin.json 副本）。

## 📄 License

皮肤代码与素材 © 2026 [zhu1090093659](https://github.com/zhu1090093659)（[dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui)，BSD-3-Clause）；dsh-skin 7 款皮肤 © [KinGao294](https://github.com/KinGao294)（[dsh-skin](https://github.com/KinGao294/dsh-skin)，MIT）；本插件封装代码 © 2026 LQFHUB，以 [BSD-3-Clause](LICENSE) 发布。
