# AGENTS.md — theme-center 主题开发规范

本文件是 `theme-center/`（DSH 主题插件：10 款皮肤 + 「主题」设置卡片）的**开发约定与变更记录**。
**以后所有主题开发（新增皮肤、修改主题插件、开发其他主题类插件）都按本规范执行。**

## 一、定位与边界（必须）

- 主题插件是**纯视觉呈现层**：不注入服务、不发 Cordis 事件、不触及模型请求、不写任何 DSH 配置文件。
- 主题切换为**纯浏览器机制**：皮肤 bundle 按需加载执行，即时生效；选择持久化到 localStorage，**不重载页面、不重启服务**。
- 与 dsh-web-ui 皮肤中心（skin-center）**不建议并存**（双方都会写 body 主题属性）；本插件已内置其全部皮肤。

## 二、包结构与文件职责

| 文件 | 职责 |
|---|---|
| `package.json` | 包名 `dsh-theme-center`；`dsh.bundle.patch → ./cordis.patch.yml`；`dsh.client { inject: [], platform: "web" }`；`files` 含 `lib/skins` |
| `cordis.patch.yml` | `- insert: - id: theme-center / name: 'dsh-theme-center'` |
| `lib/index.js` | 宿主半区：`/api/theme-center/bundle/<id>` 同源分发路由 |
| `lib/client.js` | 浏览器半区：主题引擎 + 「主题」设置卡片（手写 `__ModuleLoader__` bundle，纯 JS/React.createElement） |
| `lib/skins/<id>.js` | 皮肤 bundle，**上游产物原样拷贝、零修改** |
| `lib/meta/<id>.json` | 对应皮肤 `skin.json` 元数据副本（注册表数据源） |
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

### 4.4 持久化
- 主题：localStorage 键 `dsh-theme-center:active:v1`（值 = 主题 id 或 `official`）；非法/缺失回退 `official`。
- 遮罩：`dsh-theme-center:scrim:v1`（0-100）；值为 0 时**移除** `--dsw-skin-scrim` 变量（与皮肤默认一致）。
- 存储不可用：静默退化为内存态，不抛出。
- 启动时（apply）异步恢复已保存主题，不阻塞 GUI。

### 4.5 标题链基线（必须，防缺陷）
- 改 `document.title` 的皮肤在 apply 内快照"挂载时标题"作为还原基线；**连续切换时若不重置，后装皮肤会把前一皮肤的标题当成原始值**。
- 修复约定：引擎在 apply 时捕获基线 `stockTitle = document.title`，**每次挂载皮肤前重置 `document.title = stockTitle`**，保证任意切换序列的标题都能还原。

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
   - 卡片：11 行（官方默认 + 10 皮肤）、行内容齐全；
   - 试穿 / 退出试穿**完全还原**（属性、背景、样式、DOM、标题）；
   - 应用 / localStorage 持久化 / **刷新自动恢复**；
   - 官方默认**干净还原**（无皮肤属性/样式/DOM，标题还原）；
   - 亮暗预览、背景遮罩滑杆（含持久化）；
   - 10 款皮肤全量冒烟（逐款应用核对 body 属性）；
   - DOM 皮肤抽查（xp 任务栏/开始按钮、miku 标题栏）、多皮肤连续切换标题链；
   - 页面无 theme-center 相关错误；ths/trading 行情 404/405/CORS 为**上游 fail-safe 预期降级**，不视为缺陷。
3. **111 部署**：112 验证通过后**必须询问用户**，同意后才部署；111 重启 `dsh-web.service` 用**延迟 detach 触发**（`setsid bash -c 'sleep 60; systemctl restart dsh-web.service' &`），避免中断当前回合；部署后验证服务 active + 页面注入；用户浏览器需 **Ctrl+Shift+R** 强制刷新。
4. 验证脚本用后清理，不留在仓库。

## 七、变更记录

- 本目录下的**每一次变更**（新建/修改/删除文件、配置等）都必须追加记录；格式同根 `AGENTS.md`（时间倒序，最新在最上面）。
- 记录条目数超过 30 条时归档到 `CHANGELOG.md`（保留最新 20 条）。

### 2026-08-16 建立本规范文件

- 变更内容：新建本文件，沉淀 theme-center 主题开发规范——定位边界、包结构、皮肤集成流程（上游 bundle 零修改复用 + 注册表 + 元数据）、主题引擎机制（同源分发路由 / 内核模块执行 / miniCtx / 串行泵 / 切换回滚语义 / 持久化键 / 标题链基线）、皮肤 UI 契约（令牌 / 作用域 / 全量收回 / 主题适配必须）、112 验证清单与 111 部署流程、变更记录机制；用户指示"以后主题开发都按照这个规范来"
- 涉及路径：`theme-center/AGENTS.md`
- 备注：规范内容源自 2026-08-15 theme-center 开发与 112 验证全过程（含标题还原链缺陷修复、同源护栏、残留回滚配方等实测结论）
