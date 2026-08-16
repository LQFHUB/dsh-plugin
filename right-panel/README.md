# dsh-right-panel — DSH Web GUI 右侧面板插件

> **⚠️ 已卸载（2026-08-16）**：本插件已从 111/112 卸载，由 [DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar)（VSCode 风格右侧侧边栏工作台：文件资源管理器 / CodeMirror 编辑器 / 终端 / Git / 浏览器 / 子代理，npm 安装 `dsh-better-sidebar`，MIT）替代。代码保留在本仓库供回滚——如需恢复：`dsh plugin --profile web add link:/root/.dsh/external/right-panel` 后重启 dsh web 即可。

项目会话打开时，聊天区右侧出现「预览」与「文件/变更」两块面板：浏览工作目录文件树、多格式预览与编辑、真实 git 变更操作，宽度可拖拽调整并按项目持久化。

> 本插件**复用** [zhu1090093659/dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui) 仓库 `dsh-aionui-panel` 包（npm 发布名 `@linxin666/dsh-client-ui-aionui-panel@0.1.16`）的构建产物（`lib/index.js` 宿主半区 + `lib/client.js` 浏览器半区），Apache-2.0 授权，见 [LICENSE](LICENSE)。基于上游做若干适配与增强（见下文「与上游的差异」）。

## 功能

- **Explorer（最右栏，默认 260px，范围 220~500px，**默认折叠**）**：`文件 / 变更` 双 tab。
  - 文件树：整行点击展开/收起文件夹，点击文件在预览面板打开；顶部按文件名搜索（防抖 150ms，点击结果定位到树中）。
  - 变更（SCM）：真实 git 状态（porcelain v1），支持 stage / unstage / discard（untracked 走删除，tracked 走 restore，批量放弃有确认）。
- **拖文件入输入框**：文件树中的文件行可拖拽到聊天输入框，松手即把相对路径插入当前会话草稿（agent 收到消息后自行读取该文件）。
- **Preview（右二栏，默认 480px，范围 340~1200px，**刷新后默认折叠**）**：多 tab 预览 markdown / html / code / diff / csv / pdf / word / excel / ppt / 图片 / 文本 / url；源码/预览切换、分屏编辑（比例持久化）、保存（mtime 冲突检测）、下载、刷新、dirty 点、中键关闭、右键菜单批量关闭（dirty 确认）。**代码与 markdown 代码块内置轻量语法高亮**（自研 tokenizer，无外部依赖；js/ts 家族、python、go、rust、c 家族、shell、yaml/toml/ini 等配置、markdown、diff 等 13 个语言组，hljs 兼容类名，配色跟随官方亮/暗主题与 theme-center 全部皮肤）。
- **布局交互**：拖拽左缘把手调宽（双击把手复位默认宽度）；两级宽度钳位保证聊天区 ≥ 360px；折叠 = 宽度缩 0 且组件保持挂载（树展开态/预览 tab 不丢），折叠后右侧出现浮动展开按钮。
- **持久化**：宽度、折叠状态、树展开态、SCM 视图、预览 tab 均按项目隔离持久化（localStorage，LRU 上限 12 个 scope），读取一律范围校验，非法值回退默认。
- **明暗双主题**：跟随 GUI（`body[data-ds-dark-theme]`）；本仓库 theme-center 的 10 款皮肤全部适配右侧面板（8 款由皮肤 bundle 自带适配，harbor/trading 由本插件皮肤适配层补齐，见「与上游的差异」）。

## 安装

```sh
# 开发调试（本仓库方式）：复制 right-panel/ 到目标机，link 方式安装
dsh plugin --profile web add link:/root/.dsh/external/right-panel
```

安装后**重启 dsh web**，打开带工作目录的项目会话即可看到右侧面板；非项目会话（无 cwd）面板自动隐藏。

## 数据源与安全

- 真实数据源：宿主进程经 `/aionui-panel/*` HTTP 路由提供目录列举、文件读取（文本 80k 字符上限 / 图片 data URL）、写入（mtime 冲突检测）、文件名搜索（跳过 `.git` / `node_modules`）、git status / diff / stage / unstage / discard，以及 SSE 变更流（fs 监听 + git 30s 轮询，单次探测 15s 超时兜底；git 缺失时 SCM 优雅降级、文件树不受影响）。
- **工作区门卫**：所有操作路径必须落在已注册 workspace 内（realpath 规范化 + 前缀校验），浏览器只能读写项目根下的相对路径。
- **同源护栏**：所有 `/aionui-panel/*` 路由仅接受同源请求（`Sec-Fetch-Site: cross-site` 或 Origin 与 Host 不一致即 403 `cross-site-request-rejected`），恶意网页无法通过 CSRF 驱动 fs/git 路由；无 Origin/Sec-Fetch-Site 的请求（curl 等本地单用户工具）放行。

## 与上游的差异（本仓库三处适配）

1. **访问护栏**（`lib/index.js`）：上游的 **loopback-only 护栏**（仅 127.0.0.1/localhost 访问可用）替换为**同源护栏**（与 theme-center 一致）——本环境用户经局域网 IP（如 192.168.31.112）访问 GUI，上游护栏会把这类访问全部 403；同源护栏在保留 CSRF 防护（`Sec-Fetch-Site`/Origin 校验）的同时允许局域网访问。
2. **模块 id 本地化**（`lib/client.js`）：bundle 注册的 `__ModuleLoader__.load({ id })` 由上游包名 `@linxin666/dsh-client-ui-aionui-panel` 统一替换为 `dsh-right-panel`（共 11 处，含 5 个 CSS 注入去重键，均为 bundle 内部自洽标识）——client-modules 要求注册 id 与包名一致，否则插件无法在浏览器端激活。
3. **皮肤适配层**（`lib/client.js`，`SKIN_ADAPT_CSS` + `dsh-right-panel/skin-adapt` style）：theme-center 的 10 款皮肤中，**harbor（夕港）/ trading（交易终端）两款的上游 bundle 未定义 `--aion-*` 面板变量**（上游 0.1.16 最新版同样缺失），面板会保持官方默认亮/暗色、与皮肤观感不匹配（实测 harbor 下官方 UI 是深色半透明纱而面板是白色）。本层静态注入选择器限定的变量补丁（`body[data-dsh-harbor]` / `body[data-dsh-trading]`，含亮/暗变体），取值优先引用皮肤自身变量（`var(--dsw-alias-*)` / `var(--dsh-trd-*)`，皮肤调色实时跟随），仅在这两款皮肤应用时生效，其余 8 款自带适配不受干扰，官方默认/卸载完全还原（style 随 disposer 收回）。
4. **默认折叠**：explorer 初始折叠（仅显式展开过才记忆展开态）；**preview 列刷新后默认折叠**（恢复持久化的 tab 但列收起，点文件即重新展开）——符合"侧边栏不要默认展示、刷新默认折叠"的使用习惯。
5. **语法高亮**（`highlightCode` + `dsh-right-panel/highlight` style）：上游代码预览为纯文本（无高亮），本插件内置轻量正则 tokenizer（注释/字符串/数字/关键字/类型/函数调用），13 个语言组（js 家族 / json / python / go / rust / c 家族 / shell / 配置类 / sql / html / css / diff / 通用），markdown 代码块同样高亮；hljs 兼容类名，配色引用 `--aion-*` 变量自动跟随主题与皮肤；全部 token 经 HTML 转义（无注入面）。
6. **文件类型补充**：CODE_EXT 新增 `config`（`.config`/`xxx.config`，上游缺）、`json5`、`webmanifest`、`properties`、`desktop`、`service`、`ipynb`。

其余产物（路由、服务、组件、公告文本）原样复用，未改动。

## 目录结构

- `lib/index.js` — 宿主半区（cordis 插件：workspace 门卫 + fs/git 服务 + `/aionui-panel/*` 路由 + SSE + systemPrompt 公告），vendor 自上游 + 护栏适配。
- `lib/client.js` — 浏览器半区（向 shell 三栏 grid 追加面板列、Explorer/Preview/SCM、拖拽与持久化），vendor 自上游，仅模块 id 本地化。
- `cordis.patch.yml` — bundle patch（insert `ui-dsh-right-panel` → `dsh-right-panel`）。
- `tests/smoke.mjs` — 宿主 bundle 导出契约冒烟测试（node 内置，无新依赖）。
- `LICENSE` — Apache-2.0（上游许可）。

## 部署

- 验证环境：AI-2（192.168.31.112），`/root/.dsh/external/right-panel` link 安装，重启后以 playwright + chromium 实测。
- 正式使用：AI 主机 111（按用户指示部署）。
- 卸载/回滚：`dsh plugin --profile web remove dsh-right-panel`，重启 dsh web。

## 版权

- 上游：zhu1090093659/dsh-web-ui（`dsh-aionui-panel`，Apache-2.0），其实现为 AionUi（iOfficeAI/AionUi，Apache-2.0）右侧面板系统的复刻（非抄录）。本插件按 Apache-2.0 约定保留署名。
