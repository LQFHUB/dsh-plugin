# 🎨 dsh-theme-center

> 个人主题插件：在 **设置 > 插件配置** 新增一张「主题」卡片，内置 **23 款皮肤**（dsh-web-ui 10 款 + 自研 6 款 + dsh-skin 7 款），
> 支持**试穿 / 应用 / 持久记忆**、亮暗预览与背景遮罩调节。
> 皮肤与卡片交互参考 [zhu1090093659/dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui)
> 的皮肤中心（skin-center）实现，其中 10 款皮肤 bundle 原样复用（BSD-3-Clause，见 [LICENSE](LICENSE)），6 款为自研纯令牌重映射皮肤。
> 已部署：AI-2（192.168.31.112，效果验证）与 AI（192.168.31.111，正式使用），
> 均为 `/root/.dsh/external/theme-center` link 方式安装。

---

## ✨ 特性 / Features

- **23 款皮肤一次集齐**：dsh-web-ui 全家桶 10 款（蓝色幻想、龙的传人、夕港、初音未来、Minecraft、QQ2008 怀旧版、同花顺、交易终端、鲸吟、Windows XP）+ 自研 6 款（紫粉拿铁、清新浅绿、赛博朋克、苹果官网风、东京夜色、北欧极地，均亮/暗双形态）+ dsh-skin 精选 7 款（深海蓝、石墨灰、森林绿、日落紫、深夜黑、暖纸、樱花粉，固定色系，源自 [KinGao294/dsh-skin](https://github.com/KinGao294/dsh-skin)，MIT）
- **自研皮肤带氛围背景**：6 款自研皮肤参考各自配色方案的官方美学（Catppuccin 奶油紫调 / Tokyo Night 霓虹城市 / Nord 北极光 / 赛博朋克霓虹光斑 / 薄荷清新 / 苹果极简渐变）——body 光晕渐变背景（纯 CSS，无静态资源）+ 半透明毛玻璃面板，亮色柔和通透、暗色深邃有氛围
- **「主题」设置卡片**：参考官方插件卡片（bash/agent-loop 同款折叠卡）与皮肤中心的交互——每款皮肤一行，含名称、说明、主题色
- **试穿 / 应用**：试穿实时预览不持久化，退出试穿一键还原；应用立即生效并持久记忆（localStorage），刷新 / 重开浏览器自动恢复
- **官方默认一键还原**：切回官方默认即完全还原（body 属性、背景、favicon、标题、注入 DOM 全部收回）
- **亮暗预览切换**：卡片内直接切换亮色 / 暗色（驱动官方主题服务，与「外观」行一致）
- **背景遮罩滑杆**：0–100% 调节背景画遮罩（蓝色幻想 / 夕港 / 鲸吟等带背景画的皮肤生效，写 `--dsw-skin-scrim`）
- **零配置纯浏览器切换**：不写任何 DSH 配置文件、不重载页面、不触碰模型请求；皮肤按需加载（仅应用/试穿时才分发对应 bundle）

## 🎯 界面位置 / Where it lives

```
设置（侧边栏底部） → 插件配置 → 主题 卡片
┌─────────────────────────────────────────────┐
│ ▸ 主题                                      │
│   23 款皮肤主题（dsh-web-ui 10 + 自研 6 + dsh-skin 7）│
│   ┌───────────────────────────────────────┐ │
│   │ 亮暗预览  [亮色] [暗色]               │ │
│   │ ● 官方默认        [试穿] [应用]       │ │
│   │ ● 鲸吟 · 深海鲸语… [试穿] [应用]      │ │
│   │ ● 蓝色幻想 · 鲸鱼… [试穿] [应用]      │ │
│   │ …（共 11 行）                          │ │
│   │ 背景遮罩 40%  ──●────────             │ │
│   └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## 📦 安装 / Installation

```sh
# 把本插件目录放到外部插件目录后链接安装（link 方式，推荐自用）
dsh plugin --profile web add link:/root/.dsh/external/theme-center
```

> ⚠️ 安装后需要**重启 `dsh web`**，并在浏览器里 **Ctrl+Shift+R** 强制刷新一次。

## 🖱️ 使用 / Usage

1. 打开 **设置 → 插件配置 → 主题** 卡片
2. 点某款皮肤的「**试穿**」实时预览效果（此时可配合「亮暗预览」切换看两种形态）；不满意点「**退出试穿**」还原
3. 满意后点「**应用**」——立即生效并持久记忆；刷新页面自动恢复
4. 想回到原生外观：官方默认行点「**应用**」即可，全部皮肤写入彻底还原
5. 带背景画的皮肤（蓝色幻想 / 夕港 / 鲸吟）可拖动「背景遮罩」滑杆调节暗化程度

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

## 🔧 工作原理 / How it works

- **分发**：宿主半区注册同源路由 `GET /api/theme-center/bundle/<id>`（带 Sec-Fetch-Site / Origin 同源护栏），按需返回 `lib/skins/<id>.js`——即 dsh-web-ui 皮肤中心分发产物的原样拷贝
- **执行**：浏览器半区以真实 `<script>` 加载 bundle，经内核自身模块系统（`__ModuleLoader__` 注册 → `__DSH_MODULES__.import` 物化，样式自动注入）后调用皮肤 `apply(miniCtx)` 挂载——与皮肤中心 try-on 同路径，无 eval、无 CSP `unsafe-eval` 依赖
- **miniCtx**：只提供 `effect` 生命周期；`get` 委托真实上下文（同花顺 / 交易终端皮肤可读取 connection 服务，缺失时优雅降级为占位）
- **切换语义**：挂载成功后才卸载旧主题（加载失败旧主题保持可见）；皮肤 `apply` 中途抛错时按残留配方回滚（模块失效、样式标签、body 属性、`data-skin-chrome` 元素）
- **持久化**：`localStorage` 键 `dsh-theme-center:active:v1`（主题 id）、`dsh-theme-center:scrim:v1`（遮罩 0-100）；存储不可用时退化为内存态
- **包结构**：标准 DSH 插件 bundle（`dsh.bundle` 清单 + `dsh.client` web 平台声明），浏览器启动时自动注入

## 🧩 兼容性 / Compatibility

- DeepSeek Harness（本机开发验证版本）+ Cordis `4.x`；现代浏览器
- 需要宿主 `webServer` 服务与浏览器端 `window.__DSH_MODULES__`（内核自带）；缺失时卡片显示错误提示，不影响 GUI
- 与 dsh-web-ui 皮肤中心**不建议并存**（双方都会写 body 主题属性，可能互相干扰）；本插件已内置其全部皮肤，无需再装 dsh-skins

## 🛠️ 开发 / Development

```
theme-center/
├── lib/
│   ├── index.js     Host 入口：/api/theme-center/bundle/<id> 同源分发路由
│   ├── client.js    浏览器 bundle：主题引擎 + 「主题」设置卡片
│   └── skins/       <id>.js ×10：dsh-web-ui 皮肤 bundle 原样拷贝（约 1.3MB）
├── cordis.patch.yml profile 组合层插入条目
├── package.json     包清单（dsh.bundle / dsh.client 声明）
├── README.md
└── LICENSE          BSD-3-Clause
```

**本地迭代**：改完 `lib/` 后同步到 112 `/root/.dsh/external/theme-center/` 并重启 dsh web，浏览器强制刷新验证。

**同步上游皮肤更新**：重新拉取 `packages/skins/<id>/lib/client.js` 覆盖 `lib/skins/<id>.js` 即可（皮肤注册表在 `lib/client.js` 顶部 `THEMES` 常量，元数据在 `lib/meta/` 的 skin.json 副本）。

## 📄 License

皮肤代码与素材 © 2026 [zhu1090093659](https://github.com/zhu1090093659)（[dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui)，BSD-3-Clause）；dsh-skin 7 款皮肤 © [KinGao294](https://github.com/KinGao294)（[dsh-skin](https://github.com/KinGao294/dsh-skin)，MIT）；本插件封装代码 © 2026 LQFHUB，以 [BSD-3-Clause](LICENSE) 发布。
