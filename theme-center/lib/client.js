window.__ModuleLoader__.load({
	id: "dsh-theme-center",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region lib/client.js
		/**
		 * theme-center — 浏览器半区。
		 *
		 * 在「设置 > 插件配置」注册一张「主题」卡片（settings.plugin.item，
		 * 参考官方 bash/agent-loop 插件卡片的外框与皮肤中心 skin-center 的
		 * 交互），内置 10 款皮肤（原样复用 zhu1090093659/dsh-web-ui 的
		 * bundle，由宿主半区经 /api/theme-center/bundle/<id> 同源分发）：
		 * 每款皮肤支持「试穿」（实时预览、不持久化）与「应用」（持久化到
		 * localStorage，刷新后自动恢复），另有亮/暗预览切换（官方 theme
		 * 服务）与背景遮罩滑杆（--dsw-skin-scrim）。
		 *
		 * 主题执行走内核自身的模块系统（与皮肤中心 try-on 相同路径）：
		 * <script> 加载同源 bundle → __ModuleLoader__ 注册工厂 →
		 * __DSH_MODULES__.import 物化（自动注入皮肤样式）→ apply(miniCtx)
		 * 挂载。miniCtx 只提供 effect 生命周期，get 委托真实上下文
		 * （ths/trading 皮肤可读取 connection 服务，缺失时优雅降级）。
		 *
		 * 引擎为纯呈现层：不写配置文件、不发 cordis 事件、不触及模型请求；
		 * 所有写入（body 属性、样式、favicon、document.title、DOM）都由
		 * 皮肤自身的 disposer 收回，切换/卸载即完全还原。
		 */
		const react = require("react");

		/** 主题条目：official 为内置「官方默认」，10 款皮肤来自 dsh-web-ui，6 款自研（纯令牌重映射）。 */
		const THEMES = [
			{ id: "official", name: "官方默认", accent: null, tagline: "还原 DeepSeek Harness 原生外观（无皮肤）", attr: null, package: null, readsScrim: false },
			{ id: "blue-fantasy", name: "蓝色幻想", accent: "#4a5fa8", tagline: "鲸鱼插画背景 · periwinkle 靛蓝调色板 · 半透明面板", attr: "data-dsh-blue-fantasy", package: "@linxin666/dsh-client-ui-skin-blue-fantasy", readsScrim: true },
			{ id: "dragon-heir", name: "龙的传人", accent: "#c3272b", tagline: "墨龙穿云 · 万里长城双主题 · 朱砂龙印", attr: "data-dsh-dragon-heir", package: "@linxin666/dsh-client-ui-skin-dragon-heir", readsScrim: false },
			{ id: "harbor", name: "夕港", accent: "#ff9d5c", tagline: "暮光蓝港 · 日落橙辉 · 半透明夜色面板", attr: "data-dsh-harbor", package: "@linxin666/dsh-client-ui-skin-harbor", readsScrim: true },
			{ id: "miku", name: "初音未来 · 电子歌姬", accent: "#2e9bff", tagline: "蓝紫双马尾 · 01 编号 · 音符波形 · 电子歌姬主题", attr: "data-dsh-miku", package: "@linxin666/dsh-client-ui-skin-miku", readsScrim: false },
			{ id: "minecraft", name: "Minecraft 方块世界", accent: "#7cbd4b", tagline: "动态全景天空盒 · 方块按钮 · 告示牌输入框", attr: "data-dsh-minecraft", package: "@linxin666/dsh-client-ui-skin-minecraft", readsScrim: false },
			{ id: "qq98", name: "QQ2008 怀旧版", accent: "#2b7cd9", tagline: "水晶蓝桌面 · 玻璃深蓝标题栏 · 戴围巾企鹅", attr: "data-dsh-retro", package: "@linxin666/dsh-client-ui-skin-qq98", readsScrim: false },
			{ id: "ths", name: "同花顺风格", accent: "#e60012", tagline: "品牌红标题栏 · 实时行情状态栏 · 灰蓝数据终端", attr: "data-dsh-ths", package: "@linxin666/dsh-client-ui-skin-ths", readsScrim: false },
			{ id: "trading", name: "交易终端", accent: "#f23645", tagline: "实时行情跑马灯 · 长桥港美股行情 · 红涨绿跌", attr: "data-dsh-trading", package: "@linxin666/dsh-client-ui-skin-trading", readsScrim: false },
			{ id: "whale-song", name: "鲸吟", accent: "#4d8fd4", tagline: "深海鲸语女神背景 · 冰蓝海洋调色板 · 金色细线点缀", attr: "data-dsh-whale-song", package: "@linxin666/dsh-client-ui-skin-whale-song", readsScrim: true },
			{ id: "xp", name: "Windows XP (Luna)", accent: "#316ac5", tagline: "Luna 蓝窗口条 · 绿色开始按钮 · Bliss 蓝天桌面", attr: "data-dsh-xp", package: "@linxin666/dsh-client-ui-skin-xp", readsScrim: false },
			{ id: "catppuccin", name: "紫粉拿铁", accent: "#89b4fa", tagline: "紫粉奶油系 · GitHub 最流行配色 · Mocha/Latte 双形态", attr: "data-dsh-catppuccin", package: "@user/dsh-client-ui-skin-catppuccin", readsScrim: false },
			{ id: "mint-fresh", name: "清新浅绿", accent: "#2fb47a", tagline: "薄荷绿清新风 · 白绿通透 · 亮暗双形态", attr: "data-dsh-mint-fresh", package: "@user/dsh-client-ui-skin-mint-fresh", readsScrim: false },
			{ id: "cyber-neon", name: "赛博朋克", accent: "#22d3ee", tagline: "霓虹青紫赛博风 · 深空蓝黑 + 发光点缀 · 亮暗双形态", attr: "data-dsh-cyber-neon", package: "@user/dsh-client-ui-skin-cyber-neon", readsScrim: false },
			{ id: "apple-minimal", name: "苹果官网风", accent: "#0071e3", tagline: "苹果极简通透风 · 大留白 + 柔和灰阶 · 亮暗双形态", attr: "data-dsh-apple-minimal", package: "@user/dsh-client-ui-skin-apple-minimal", readsScrim: false },
			{ id: "tokyo-night", name: "东京夜色", accent: "#7aa2f7", tagline: "程序员霓虹经典 · 深蓝紫 + 蓝青点缀 · 亮暗双形态", attr: "data-dsh-tokyo-night", package: "@user/dsh-client-ui-skin-tokyo-night", readsScrim: false },
			{ id: "nord", name: "北欧极地", accent: "#88c0d0", tagline: "极地冰蓝冷淡风 · 低饱和灰蓝 · 亮暗双形态", attr: "data-dsh-nord", package: "@user/dsh-client-ui-skin-nord", readsScrim: false },
			{ id: "skin-ocean", name: "深海蓝", accent: "#4d86f8", tagline: "DeepSeek 品牌深海调 · 深蓝沉浸 · 暗色系", attr: "data-dsh-skin-ocean", package: "@user/dsh-client-ui-skin-skin-ocean", readsScrim: false },
			{ id: "skin-graphite", name: "石墨灰", accent: "#b9bdc8", tagline: "中性石墨灰 · 极简克制 · 暗色系", attr: "data-dsh-skin-graphite", package: "@user/dsh-client-ui-skin-skin-graphite", readsScrim: false },
			{ id: "skin-forest", name: "森林绿", accent: "#34d37b", tagline: "森林绿 · 清新自然 · 暗色系", attr: "data-dsh-skin-forest", package: "@user/dsh-client-ui-skin-skin-forest", readsScrim: false },
			{ id: "skin-sunset", name: "日落紫", accent: "#c084fc", tagline: "日落紫 · 暖紫暮色 · 暗色系", attr: "data-dsh-skin-sunset", package: "@user/dsh-client-ui-skin-skin-sunset", readsScrim: false },
			{ id: "skin-midnight", name: "深夜黑", accent: "#7c8cff", tagline: "纯黑 OLED · 极简深邃 · 暗色系", attr: "data-dsh-skin-midnight", package: "@user/dsh-client-ui-skin-skin-midnight", readsScrim: false },
			{ id: "skin-paper", name: "暖纸", accent: "#b45309", tagline: "暖纸米黄 · 护眼柔和 · 亮色系", attr: "data-dsh-skin-paper", package: "@user/dsh-client-ui-skin-skin-paper", readsScrim: false },
			{ id: "skin-sakura", name: "樱花粉", accent: "#db2777", tagline: "樱花粉 · 温柔治愈 · 亮色系", attr: "data-dsh-skin-sakura", package: "@user/dsh-client-ui-skin-skin-sakura", readsScrim: false },
		];
		const THEME_BY_ID = new Map(THEMES.map((t) => [t.id, t]));

		//#region 存储与状态
		const STORAGE_KEY = "dsh-theme-center:active:v1";
		const SCRIM_KEY = "dsh-theme-center:scrim:v1";
		const BUNDLE_ROUTE = "/api/theme-center/bundle";

		/** 读 localStorage（不可用返回 null，绝不抛出）。 */
		function readStored(key) {
			try {
				return window.localStorage.getItem(key);
			} catch {
				return null;
			}
		}

		/** 写 localStorage（不可用静默忽略）。 */
		function writeStored(key, value) {
			try {
				window.localStorage.setItem(key, value);
			} catch {
				/* 存储不可用 — 仅内存态 */
			}
		}

		/** 持久化的主题 id；非法/缺失回退官方默认。 */
		function readSavedTheme() {
			const id = readStored(STORAGE_KEY);
			return THEME_BY_ID.has(id) ? id : "official";
		}

		/** 持久化的背景遮罩 0-100；非法/缺失为 0。 */
		function readScrim() {
			const value = Number(readStored(SCRIM_KEY));
			return Number.isFinite(value) && value >= 0 && value <= 100 ? value : 0;
		}

		/** 引擎快照（不可变替换，useSyncExternalStore 兼容）。 */
		let state = { current: "official", persisted: readSavedTheme(), busy: null, error: null, scrim: readScrim() };
		const listeners = new Set();
		function setState(patch) {
			state = Object.assign({}, state, patch);
			for (const listener of [...listeners]) listener();
		}
		function subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		}
		function getSnapshot() {
			return state;
		}
		//#endregion

		//#region 背景遮罩
		/** 写入 --dsw-skin-scrim（0 时移除变量，与皮肤内默认一致）并持久化。 */
		function applyScrim(value) {
			const clamped = Math.max(0, Math.min(100, Math.round(value)));
			if (clamped <= 0) document.body.style.removeProperty("--dsw-skin-scrim");
			else document.body.style.setProperty("--dsw-skin-scrim", String(clamped / 100));
			writeStored(SCRIM_KEY, String(clamped));
			setState({ scrim: clamped });
		}
		//#endregion

		//#region 聊天宽度
		/** 宽度预设：WIDTH_PRESETS[0] 即默认宽度（896px）。 */
		const WIDTH_PRESETS = [896, 1024, 1152, 1280, 1440, 1600];
		const WIDTH_KEY = "dsh-theme-center:width:v1";
		/** 宽度样式元素（apply 时挂载；null 表示未挂载）。 */
		let widthStyleEl = null;

		/** 宽度规则：加宽对话列与派生输入框、释放用户气泡上限（作用域限定插件 body 属性）。 */
		function widthCss(px) {
			return (
				"body[data-dsh-theme-center] [data-conversation-scroll]{" +
				"--dsh-chat-content-width:" + px + "px;" +
				"--dsh-composer-card-max-width:calc(var(--dsh-chat-content-width) + 32px)" +
				"}" +
				'body[data-dsh-theme-center] [data-conversation-scroll] [class*="userStack"]{max-width:100% !important}'
			);
		}

		/** 读持久化宽度；非法/缺失回退默认档。 */
		function readSavedWidth() {
			const value = Number(readStored(WIDTH_KEY));
			return WIDTH_PRESETS.includes(value) ? value : WIDTH_PRESETS[0];
		}

		/** 宽度 store：外观面板控件读写同一状态并持久化。 */
		let currentWidth = readSavedWidth();
		const widthListeners = new Set();
		function setWidth(px) {
			if (!WIDTH_PRESETS.includes(px)) return;
			currentWidth = px;
			writeStored(WIDTH_KEY, String(px));
			if (widthStyleEl !== null) widthStyleEl.textContent = widthCss(px);
			for (const listener of [...widthListeners]) listener();
		}
		function subscribeWidth(listener) {
			widthListeners.add(listener);
			return () => {
				widthListeners.delete(listener);
			};
		}
		function getWidthSnapshot() {
			return currentWidth;
		}
		//#endregion

		//#region 聊天区精简
		const FOCUS_KEY = "dsh-theme-center:focus:v1";
		/** 默认压制百分比（0 = 默认展示，100 = 最大压制）。 */
		const FOCUS_DEFAULT = 70;
		/** 压制样式元素（apply 时挂载；null 表示未挂载）。 */
		let focusStyleEl = null;

		/**
		 * 压制 CSS 模板：全部插值规则以 --tc-focus（0-1）线性缩放——0 时各
		 * 属性计算值与官方默认完全一致；非插值规则（错误卡标题截断）与整组
		 * 规则一起由 body[data-tc-focus] 门控（pct=0 时属性不存在，规则失效）。
		 * 只改字号/行高/透明度/尺寸，不写任何颜色——皮肤令牌不变即天然适配
		 * theme-center 全部皮肤与官方亮/暗。
		 */
		function focusCss(fraction) {
			const F = "body[data-dsh-theme-center][data-tc-focus]";
			const TITLE = "font-size:calc(14px - 2px * var(--tc-focus));line-height:calc(24px - 6px * var(--tc-focus))";
			const ICON = "width:calc(14px - 3px * var(--tc-focus));height:calc(14px - 3px * var(--tc-focus))";
			return [
				F + "{--tc-focus:" + fraction + "}",
				// Think 思考行：标题/摘要字号变小、摘要变淡、图标缩小
				F + ' [data-variant="think"] [class*="title"]{' + TITLE + ";opacity:calc(1 - .25 * var(--tc-focus))}",
				F + ' [data-variant="think"] [class*="summary"]{' + TITLE + ";opacity:calc(1 - .4 * var(--tc-focus))}",
				F + ' [data-variant="think"] [class*="leading"] svg{' + ICON + "}",
				// 工具调用卡：标题变小、摘要变淡、图标缩小
				F + ' [data-chat-flow-kind="tool-call"] [class*="title"]{' + TITLE + "}",
				F + ' [data-chat-flow-kind="tool-call"] [class*="summary"]{opacity:calc(1 - .4 * var(--tc-focus))}',
				F + ' [data-chat-flow-kind="tool-call"] [class*="leading"] svg{' + ICON + "}",
				// Cordis 插件卡行整体变矮（min-height 32px → 22px）
				F + ' [data-chat-flow-kind="tool-call"] [data-tool="cordis_run"] [class*="row"],' +
					F + ' [data-chat-flow-kind="tool-call"] [data-tool="cordis_stop"] [class*="row"],' +
					F + ' [data-chat-flow-kind="tool-call"] [data-tool="cordis_undefine"] [class*="row"]{min-height:calc(32px - 10px * var(--tc-focus))}',
				// 上下文注入卡：标题变小、来源变淡、图标缩小
				F + ' [data-chat-flow-kind="context"] [class*="title"]{' + TITLE + "}",
				F + ' [data-chat-flow-kind="context"] [class*="source"]{opacity:calc(1 - .4 * var(--tc-focus))}',
				F + ' [data-chat-flow-kind="context"] [class*="leading"] svg{' + ICON + "}",
				// 错误工具卡标题截断（门控规则，pct>0 即生效）
				F + ' [data-chat-flow-kind="tool-call"] [data-state="error"] [class*="title"]{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}',
			].join("");
		}

		/** 读持久化压制百分比；缺失/非法回退默认（70）。注意 Number(null)=0，空存储必须回退默认而非 0。 */
		function readSavedFocus() {
			const raw = readStored(FOCUS_KEY);
			if (raw === null) return FOCUS_DEFAULT;
			const value = Number(raw);
			return Number.isFinite(value) && value >= 0 && value <= 100 ? value : FOCUS_DEFAULT;
		}

		/**
		 * 把当前压制百分比落到页面：>0 挂 body[data-tc-focus] 门控属性并写入
		 * 样式元素（--tc-focus 插值），=0 移除门控属性（整组规则失效 = 默认展示）。
		 */
		function applyFocusState(pct) {
			if (pct <= 0) {
				delete document.body.dataset.tcFocus;
				return;
			}
			document.body.dataset.tcFocus = "";
			if (focusStyleEl !== null) focusStyleEl.textContent = focusCss(pct / 100);
		}

		/** 压制 store：外观面板控件读写同一状态并持久化。 */
		let currentFocus = readSavedFocus();
		const focusListeners = new Set();
		function setFocus(pct) {
			const clamped = Math.max(0, Math.min(100, Math.round(pct)));
			if (clamped === currentFocus) return;
			currentFocus = clamped;
			writeStored(FOCUS_KEY, String(clamped));
			applyFocusState(clamped);
			for (const listener of [...focusListeners]) listener();
		}
		function subscribeFocus(listener) {
			focusListeners.add(listener);
			return () => {
				focusListeners.delete(listener);
			};
		}
		function getFocusSnapshot() {
			return currentFocus;
		}
		//#endregion

		//#region 表格列宽
		/**
		 * 表格撑满列宽：官方 markdown 渲染器把表格设为 width:max-content 且
		 * td/th max-width 封顶 min(30vw,320px)——中文长文本被压进 320px 窄列
		 * 疯狂换行，表格只占列宽一半。这里在助手回答/用户消息内覆盖为
		 * 撑满整列 + 解除列上限（超宽表格仍由官方 overflow-x 容器横向滚动）。
		 * 只作用于 [data-chat-flow-kind] 稳定属性，不依赖 hash 类名。
		 */
		const TABLE_CSS =
			'body[data-dsh-theme-center] [data-chat-flow-kind="assistant-step"] table,' +
			'body[data-dsh-theme-center] [data-chat-flow-kind="user"] table{width:100% !important;max-width:100% !important}' +
			'body[data-dsh-theme-center] [data-chat-flow-kind="assistant-step"] th,' +
			'body[data-dsh-theme-center] [data-chat-flow-kind="assistant-step"] td,' +
			'body[data-dsh-theme-center] [data-chat-flow-kind="user"] th,' +
			'body[data-dsh-theme-center] [data-chat-flow-kind="user"] td{max-width:none}';
		//#endregion

		//#region 外观扩展（会话区字号 / 网站字体 / 隐藏开关）
		const TEXT_SCALE_KEY = "dsh-theme-center:textscale:v1";
		/** 会话区字号缩放范围（%），100 = 官方原样。 */
		const TEXT_SCALE_MIN = 75;
		const TEXT_SCALE_MAX = 150;
		const TEXT_SCALE_STEP = 5;
		const TEXT_SCALE_DEFAULT = 100;
		const FONT_KEY = "dsh-theme-center:font:v1";
		const HIDE_KEY = "dsh-theme-center:hide:v1";
		/** 外观扩展样式元素（apply 时挂载；null 表示未挂载）。 */
		let appearanceStyleEl = null;

		/** 全站字体选项表：default = 系统默认（不注入规则）；stack 为完整 font-family 列表。 */
		const FONTS = [
			{ id: "default", name: "系统默认", stack: null },
			{ id: "msyh", name: "微软雅黑", stack: '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Helvetica Neue", sans-serif' },
			{ id: "pingfang", name: "苹方 PingFang", stack: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", sans-serif' },
			{ id: "sourcehan", name: "思源黑体", stack: '"Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' },
			{ id: "songti", name: "宋体", stack: 'SimSun, "Songti SC", "Source Han Serif SC", serif' },
			{ id: "inter", name: "Inter", stack: 'Inter, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif' },
			{ id: "roboto", name: "Roboto", stack: 'Roboto, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif' },
			{ id: "jetbrains", name: "JetBrains Mono 等宽", stack: '"JetBrains Mono", "SF Mono", Consolas, "PingFang SC", monospace' },
		];
		const FONT_BY_ID = new Map(FONTS.map((f) => [f.id, f]));
		/**
		 * 官方 markdown 标题字体令牌基线（0.1.0-rc.6+ 实测：._markdown_ h1..h4 用
		 * --dsw-font-markdown-h1..h4，h5/h6 用 --dsw-font-markdown-base-strong，
		 * 均为固定 px，不随容器字号联动；DSH 升级需复核）。
		 * [令牌名, 字重, 字号, 行高]
		 */
		const HEADING_FONTS = [
			["--dsw-font-markdown-h1", "700", "24px", "34px"],
			["--dsw-font-markdown-h2", "700", "22px", "32px"],
			["--dsw-font-markdown-h3", "700", "20px", "30px"],
			["--dsw-font-markdown-h4", "600", "16px", "28px"],
			["--dsw-font-markdown-base-strong", "600", "16px", "28px"],
		];
		/** 生成标题令牌覆盖段（字号/行高按 --tc-text-scale 缩放，family 由调用方决定）。 */
		function headingTokensCss(family) {
			return HEADING_FONTS.map(
				([name, weight, size, lh]) =>
					name + ":" + weight + " calc(" + size + " * var(--tc-text-scale))/calc(" + lh + " * var(--tc-text-scale)) " + family,
			).join(";");
		}

		/** 读持久化字号百分比；缺失/非法回退 100（注意 Number(null)=0 陷阱）。 */
		function readSavedTextScale() {
			const raw = readStored(TEXT_SCALE_KEY);
			if (raw === null) return TEXT_SCALE_DEFAULT;
			const value = Number(raw);
			return Number.isFinite(value) && value >= TEXT_SCALE_MIN && value <= TEXT_SCALE_MAX ? value : TEXT_SCALE_DEFAULT;
		}

		/** 读持久化字体 id；未知回退系统默认。 */
		function readSavedFont() {
			const id = readStored(FONT_KEY);
			return FONT_BY_ID.has(id) ? id : "default";
		}

		/** 读持久化隐藏开关；缺失/非法回退全不隐藏。 */
		function readSavedHide() {
			try {
				const raw = JSON.parse(readStored(HIDE_KEY) || "{}");
				return { think: !!raw.think, tool: !!raw.tool, context: !!raw.context };
			} catch {
				return { think: false, tool: false, context: false };
			}
		}

		/**
		 * 外观扩展 CSS 渲染器：一次生成会话区字号缩放 + 全站字体 + 隐藏开关全部规则。
		 * 缩放基线 16px/28px 来自官方 --dsw-font-markdown-base 实测（0.1.0-rc.6+，
		 * DSH 升级改基线需复核）；em 系标题/段落随容器联动，固定 px 元素（inline
		 * code 14px、pre 13px/22px）按同比例 calc 覆盖。标题 h1-h6 官方为固定 px
		 * 令牌（HEADING_FONTS），缩放时重定义令牌（family 用 var(--dsw-font-family)，
		 * 与官方基线等价，且让标题随全站字体联动）。只作用于 markdown 容器与
		 * 用户气泡文字——Think 行（data-variant=think）、工具卡（tool-call）、
		 * 上下文卡（context）不在其中，字号不受缩放影响（由聊天区精简调节）。
		 * 换字体走双路覆盖（--dsw-font-family 变量 + markdown/气泡容器 font-family
		 * + 标题令牌重定义），代码字体 --ds-font-family-code 保持不动。
		 * 全部规则带 body 门控属性前缀。
		 */
		function appearanceCss(state) {
			const parts = [];
			if (state.textScale !== TEXT_SCALE_DEFAULT) {
				const F = "body[data-dsh-theme-center][data-tc-scale]";
				const SCALE = "calc(16px * var(--tc-text-scale))";
				const LHEIGHT = "calc(28px * var(--tc-text-scale))";
				parts.push(
					F + "{--tc-text-scale:" + (state.textScale / 100) + ";" + headingTokensCss("var(--dsw-font-family)") + "}",
					F + ' [data-chat-flow-kind="assistant-step"] [class*="_markdown_"],' + F + ' [data-chat-flow-kind="user"] [class*="_markdown_"]{font-size:' + SCALE + ";line-height:" + LHEIGHT + "}",
					F + ' [data-chat-flow-kind="assistant-step"] :where(p,li,blockquote,th,td){font-size:' + SCALE + ";line-height:" + LHEIGHT + "}",
					F + ' [data-chat-flow-kind="assistant-step"] :not(pre) > code{font-size:calc(14px * var(--tc-text-scale))}',
					F + ' [data-chat-flow-kind="assistant-step"] pre{font-size:calc(13px * var(--tc-text-scale));line-height:calc(22px * var(--tc-text-scale))}',
					F + ' [data-chat-flow-kind="user"] [data-time-hover-root] > div:first-child > div{font-size:' + SCALE + ";line-height:" + LHEIGHT + "}",
				);
			}
			if (state.font !== "default") {
				const stack = FONT_BY_ID.get(state.font).stack;
				const F = 'body[data-dsh-theme-center][data-tc-font="' + state.font + '"]';
				parts.push(
					// 基线 --tc-text-scale:1：仅换字体时标题令牌 calc 乘 1 = 官方字号
					"body[data-dsh-theme-center]{--tc-text-scale:1}",
					F + "{--dsw-font-family:" + stack + ";" + headingTokensCss(stack) + "}",
					F + ' [data-chat-flow-kind="assistant-step"] [class*="_markdown_"],' + F + ' [data-chat-flow-kind="user"] [class*="_markdown_"]{font-family:' + stack + "}",
					F + ' [data-chat-flow-kind="user"] [data-time-hover-root] > div:first-child > div{font-family:' + stack + "}",
				);
			}
			if (state.hide.think) parts.push('body[data-dsh-theme-center][data-tc-hide~="think"] [data-variant="think"]{display:none !important}');
			if (state.hide.tool) parts.push('body[data-dsh-theme-center][data-tc-hide~="tool"] [data-chat-flow-kind="tool-call"]{display:none !important}');
			if (state.hide.context) parts.push('body[data-dsh-theme-center][data-tc-hide~="context"] [data-chat-flow-kind="context"]{display:none !important}');
			return parts.join("");
		}

		/**
		 * 把外观扩展状态落到页面：重写样式文本 + 设置/移除三个 body 门控属性
		 * （data-tc-scale / data-tc-font / data-tc-hide，空格分隔值 + ~= 选择器）。
		 */
		function applyAppearanceState() {
			if (currentTextScale === TEXT_SCALE_DEFAULT) delete document.body.dataset.tcScale;
			else document.body.dataset.tcScale = "";
			if (currentFont === "default") delete document.body.dataset.tcFont;
			else document.body.dataset.tcFont = currentFont;
			const hides = [];
			if (currentHide.think) hides.push("think");
			if (currentHide.tool) hides.push("tool");
			if (currentHide.context) hides.push("context");
			if (hides.length === 0) delete document.body.dataset.tcHide;
			else document.body.dataset.tcHide = hides.join(" ");
			if (appearanceStyleEl !== null) {
				appearanceStyleEl.textContent = appearanceCss({ textScale: currentTextScale, font: currentFont, hide: currentHide });
			}
		}

		/** 外观扩展 store：三个状态共享一个快照（useSyncExternalStore 需稳定引用）。 */
		let currentTextScale = readSavedTextScale();
		let currentFont = readSavedFont();
		let currentHide = readSavedHide();
		let appearanceSnapshot = { textScale: currentTextScale, font: currentFont, hide: currentHide };
		const appearanceListeners = new Set();
		function notifyAppearance() {
			appearanceSnapshot = { textScale: currentTextScale, font: currentFont, hide: currentHide };
			for (const listener of [...appearanceListeners]) listener();
		}
		function subscribeAppearance(listener) {
			appearanceListeners.add(listener);
			return () => {
				appearanceListeners.delete(listener);
			};
		}
		function getAppearanceSnapshot() {
			return appearanceSnapshot;
		}
		function setTextScale(pct) {
			const clamped = Math.max(TEXT_SCALE_MIN, Math.min(TEXT_SCALE_MAX, Math.round(pct)));
			if (clamped === currentTextScale) return;
			currentTextScale = clamped;
			writeStored(TEXT_SCALE_KEY, String(clamped));
			applyAppearanceState();
			notifyAppearance();
		}
		function setFont(id) {
			if (!FONT_BY_ID.has(id) || id === currentFont) return;
			currentFont = id;
			writeStored(FONT_KEY, id);
			applyAppearanceState();
			notifyAppearance();
		}
		function setHide(key, value) {
			if (!Object.prototype.hasOwnProperty.call(currentHide, key)) return;
			const next = Object.assign({}, currentHide, { [key]: !!value });
			if (JSON.stringify(next) === JSON.stringify(currentHide)) return;
			currentHide = next;
			writeStored(HIDE_KEY, JSON.stringify(next));
			applyAppearanceState();
			notifyAppearance();
		}
		//#endregion

		//#region 主题引擎
		/** 当前挂载的非官方主题条目及其 disposer。 */
		let currentTheme = null;
		let currentDispose = null;
		/** 真实客户端上下文（apply 时注入），供 miniCtx.get 委托。 */
		let realCtxRef = null;
		/** 引擎启动时的页面标题基线（皮肤挂载前重置，保证各皮肤快照的原始标题一致）。 */
		let stockTitle = null;
		/** 插件已卸载标记：在途加载完成后不再挂载。 */
		let disposed = false;
		/** 串行泵：同一时刻只有一个主题加载/挂载，最新请求胜出。 */
		let pumpBusy = false;
		let pending = null;

		/** 极简 ctx：effect 走内部 disposer 栈（逆序回收）；get 委托真实上下文。 */
		function miniCtx(realCtx) {
			const disposers = [];
			return {
				effect(callback) {
					disposers.push(callback());
					return () => {};
				},
				get(key) {
					if (realCtx === null) return undefined;
					try {
						return realCtx.get(key);
					} catch {
						return undefined;
					}
				},
				__disposeAll() {
					for (const dispose of disposers.reverse()) dispose();
				},
			};
		}

		/** 以真实同源 <script> 加载皮肤 bundle（与内核 defaultLoadBundle 同路径）。 */
		function loadBundleScript(url) {
			return new Promise((resolve, reject) => {
				const el = document.createElement("script");
				el.async = true;
				el.src = url;
				el.addEventListener("load", () => {
					el.remove();
					resolve();
				}, { once: true });
				el.addEventListener("error", () => {
					el.remove();
					reject(new Error("皮肤 bundle 加载失败：" + url));
				}, { once: true });
				document.head.append(el);
			});
		}

		/** 内核客户端模块系统（window.__DSH_MODULES__）。 */
		function windowModules() {
			return window.__DSH_MODULES__;
		}

		/** 加载并物化一个皮肤，返回其 apply。 */
		async function loadThemeApply(theme) {
			const modules = windowModules();
			if (modules === undefined) throw new Error("window.__DSH_MODULES__ 不可用，无法加载皮肤");
			try {
				modules.invalidate(theme.package);
			} catch {
				/* 未注册过的包：忽略 */
			}
			await loadBundleScript(BUNDLE_ROUTE + "/" + encodeURIComponent(theme.id));
			const surface = await modules.import(theme.package);
			if (typeof surface !== "object" || surface === null || typeof surface.apply !== "function") {
				throw new Error('皮肤 "' + theme.id + '" 的 bundle 未导出 apply');
			}
			return surface.apply;
		}

		/** 卸载一个已挂载主题：disposer + 模块失效 + 移除 loader 注入的样式标签。 */
		function cleanupTheme(theme, dispose) {
			try {
				dispose();
			} catch (error) {
				console.error("[theme-center] 卸载 " + theme.id + " 失败:", error);
			}
			const modules = windowModules();
			if (modules !== undefined) {
				try {
					modules.invalidate(theme.package);
				} catch {
					/* 忽略 */
				}
			}
			for (const el of document.querySelectorAll("style[data-plugin=" + JSON.stringify(theme.package) + "]")) {
				el.remove();
			}
		}

		/** 卸载当前挂载的主题（如有）。 */
		function disposeCurrent() {
			if (currentTheme !== null && currentDispose !== null) {
				cleanupTheme(currentTheme, currentDispose);
			}
			currentTheme = null;
			currentDispose = null;
		}

		/** 挂载失败后的残留回滚（皮肤 apply 中途抛错时）。 */
		function rollbackResidue(theme) {
			document.body.removeAttribute(theme.attr);
			for (const el of [...document.body.children]) {
				if (el.id !== "root" && (el.hasAttribute("data-skin-chrome") || el.hasAttribute(theme.attr))) {
					el.remove();
				}
			}
		}

		/**
		 * 执行一个主题任务（串行泵的一项）。挂载成功后才卸载旧主题，
		 * 加载失败保持旧主题可见，挂载抛错则回滚该主题残留。
		 * @param theme - 主题条目。
		 * @param persist - 是否持久化为选择。
		 */
		async function runJob(theme, persist) {
			if (theme.id === "official") {
				disposeCurrent();
				if (persist) writeStored(STORAGE_KEY, "official");
				setState({ current: "official", persisted: persist ? "official" : state.persisted, busy: null, error: null });
				return;
			}
			setState({ busy: theme.id });
			// 先卸载旧主题、再加载并挂载新主题（顺序必须如此）：
			// ① 同一主题「试穿后再应用」时，旧实例的 disposer 会收回新实例
			//    刚写入的属性/背景/favicon（两者写同一处），先卸载保证任意
			//    切换序列互不干扰；
			// ② 皮肤的 CSS 在 import 物化时注入、apply 不会重新注入——若
			//    在加载之后才卸载，旧实例的样式清理会误删新主题的样式标签，
			//    先卸载让加载阶段重新注入 CSS。
			// 语义：加载失败时页面回到官方默认并显示错误（bundle 路由由本
			// 插件自持，加载失败仅发生在路由不可用等异常情形）。
			disposeCurrent();
			let apply;
			try {
				apply = await loadThemeApply(theme);
			} catch (error) {
				if (!disposed) setState({ busy: null, error: "「" + theme.name + "」加载失败：" + (error && error.message || String(error)) });
				return;
			}
			if (disposed) {
				cleanupTheme(theme, () => {});
				return;
			}
			const ctx = miniCtx(realCtxRef);
			try {
				// 皮肤会在 apply 内快照 document.title 作为还原基线；连续切换时
				// 若不重置，后装皮肤会把前一个皮肤的标题当成原始值。挂载前统一
				// 重置为引擎基线，保证任意切换序列的标题都能还原。
				if (stockTitle !== null) document.title = stockTitle;
				apply(ctx);
			} catch (error) {
				// 中途抛错：disposer 栈不完整，按残留配方回滚
				try {
					ctx.__disposeAll();
				} catch {
					/* 忽略 */
				}
				cleanupTheme(theme, () => {});
				rollbackResidue(theme);
				setState({ busy: null, error: "「" + theme.name + "」应用失败：" + (error && error.message || String(error)) });
				return;
			}
			currentTheme = theme;
			currentDispose = () => ctx.__disposeAll();
			if (persist) writeStored(STORAGE_KEY, theme.id);
			setState({ persisted: persist ? theme.id : state.persisted, current: theme.id, busy: null, error: null });
		}

		/** 串行泵：顺序执行请求，最新请求胜出（pending 覆盖）。 */
		async function pump() {
			if (pumpBusy) return;
			pumpBusy = true;
			try {
				while (pending !== null) {
					const job = pending;
					pending = null;
					const theme = THEME_BY_ID.get(job.id);
					if (theme !== undefined) await runJob(theme, job.persist);
				}
			} finally {
				pumpBusy = false;
			}
		}

		/**
		 * 请求切换主题（试穿 persist=false / 应用 persist=true）。
		 * 正在加载同一主题时重复点击：试穿忽略，应用只补写持久化。
		 */
		function requestTheme(id, persist) {
			const theme = THEME_BY_ID.get(id);
			if (theme === undefined) return;
			if (state.busy === id) {
				if (persist) {
					writeStored(STORAGE_KEY, id);
					setState({ persisted: id });
				}
				return;
			}
			if (id === state.current && state.busy === null && state.persisted === id) return;
			pending = { id, persist };
			void pump();
		}

		/** 对外引擎句柄（卡片使用）。 */
		const engine = {
			subscribe,
			getSnapshot,
			request: requestTheme,
			setScrim: applyScrim,
			/** 退出试穿：恢复持久化的选择。 */
			exitPreview() {
				requestTheme(state.persisted, false);
			},
		};
		//#endregion

		//#region 卡片样式
		/** 「主题」卡片样式：作用域 body[data-dsh-theme-center]，令牌驱动。 */
		const CARD_CSS = [
			"body[data-dsh-theme-center] .tc-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}",
			"body[data-dsh-theme-center] .tc-card:hover{border-color:var(--dsw-alias-label-dimmed)}",
			"body[data-dsh-theme-center] .tc-card.tc-open{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}",
			"body[data-dsh-theme-center] .tc-header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;display:flex;align-items:center;gap:12px;padding:14px 16px}",
			"body[data-dsh-theme-center] .tc-header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}",
			"body[data-dsh-theme-center] .tc-headText{display:flex;flex-direction:column;flex:1;gap:4px;min-width:0}",
			"body[data-dsh-theme-center] .tc-name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}",
			"body[data-dsh-theme-center] .tc-desc{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}",
			"body[data-dsh-theme-center] .tc-chevron{color:var(--dsw-alias-label-tertiary);flex:none;display:inline-flex;transition:transform .16s}",
			"body[data-dsh-theme-center] .tc-chevronOpen{transform:rotate(180deg)}",
			"body[data-dsh-theme-center] .tc-pending{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}",
			"body[data-dsh-theme-center] .tc-body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding:12px 0 8px;display:flex;flex-direction:column;gap:10px}",
			"body[data-dsh-theme-center] .tc-toolRow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
			"body[data-dsh-theme-center] .tc-toolLabel{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5;margin-right:2px}",
			"body[data-dsh-theme-center] .tc-pill{appearance:none;font:inherit;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);background:0 0;color:var(--dsw-alias-label-secondary);border-radius:8px;padding:3px 12px;font-size:13px;line-height:1.5}",
			"body[data-dsh-theme-center] .tc-pill:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}",
			"body[data-dsh-theme-center] .tc-pillOn{background:var(--dsw-alias-bg-module-platform);border-color:var(--dsw-alias-label-dimmed);color:var(--dsw-alias-label-primary)}",
			"body[data-dsh-theme-center] .tc-pill:disabled{opacity:.4;cursor:default}",
			"body[data-dsh-theme-center] .tc-row{display:flex;align-items:center;gap:10px;border:1px solid transparent;border-radius:10px;padding:8px 10px;min-width:0}",
			"body[data-dsh-theme-center] .tc-row:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			"body[data-dsh-theme-center] .tc-row.tc-rowCurrent{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform)}",
			"body[data-dsh-theme-center] .tc-rowAccent{width:10px;height:10px;border-radius:50%;flex:none;box-shadow:0 0 0 1px var(--dsw-alias-border-l2)}",
			"body[data-dsh-theme-center] .tc-rowText{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}",
			"body[data-dsh-theme-center] .tc-rowName{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.4}",
			"body[data-dsh-theme-center] .tc-rowTag{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			"body[data-dsh-theme-center] .tc-current{white-space:nowrap;background:var(--dsw-alias-bg-multi-select,var(--dsw-alias-bg-module-platform));color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}",
			"body[data-dsh-theme-center] .tc-btn{appearance:none;font:inherit;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:4px 12px;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-secondary);background:0 0;flex:none}",
			"body[data-dsh-theme-center] .tc-btn:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}",
			"body[data-dsh-theme-center] .tc-btnPrimary{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3);border-color:transparent}",
			"body[data-dsh-theme-center] .tc-btnPrimary:hover:not(:disabled){color:var(--dsw-alias-bg-layer-3)}",
			"body[data-dsh-theme-center] .tc-btn:disabled{opacity:.4;cursor:default}",
			"body[data-dsh-theme-center] .tc-error{color:var(--dsw-alias-state-error-primary);margin:0;font-size:12px;line-height:1.5}",
			"body[data-dsh-theme-center] .tc-scrimRow{display:flex;align-items:center;gap:10px;padding:2px 10px 4px}",
			"body[data-dsh-theme-center] .tc-scrimLabel{color:var(--dsw-alias-label-secondary);font-size:13px;flex:none}",
			"body[data-dsh-theme-center] .tc-scrim{flex:1;min-width:0;accent-color:var(--dsw-alias-brand-primary)}",
			"body[data-dsh-theme-center] .tc-tabs{display:flex;gap:6px;padding:0 10px 6px}",
			"body[data-dsh-theme-center] .tc-tab{appearance:none;font:inherit;cursor:pointer;border:1px solid transparent;background:0 0;color:var(--dsw-alias-label-secondary);border-radius:8px;padding:4px 14px;font-size:13px;line-height:1.5}",
			"body[data-dsh-theme-center] .tc-tab:hover:not(:disabled){color:var(--dsw-alias-label-primary)}",
			"body[data-dsh-theme-center] .tc-tabOn{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary)}",
			"body[data-dsh-theme-center] .tc-secTitle{color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:600;line-height:1.5;margin:4px 10px 0}",
			"body[data-dsh-theme-center] .tc-widthRow{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:0 10px}",
			"body[data-dsh-theme-center] .tc-note{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5;margin:0;padding:0 10px}",
			"body[data-dsh-theme-center] .tc-selectRow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:2px 10px 4px}",
			"body[data-dsh-theme-center] .tc-select{appearance:none;font:inherit;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border-radius:8px;padding:4px 28px 4px 12px;font-size:13px;line-height:1.5;max-width:100%}",
			"body[data-dsh-theme-center] .tc-select:hover{border-color:var(--dsw-alias-label-dimmed)}",
			"body[data-dsh-theme-center] .tc-checkRow{display:flex;align-items:center;gap:8px;padding:2px 10px;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-primary);cursor:pointer}",
			"body[data-dsh-theme-center] .tc-checkRow:hover{color:var(--dsw-alias-label-primary)}",
			"body[data-dsh-theme-center] .tc-check{appearance:none;width:15px;height:15px;border:1px solid var(--dsw-alias-border-l2);border-radius:4px;background:var(--dsw-alias-bg-layer-3);flex:none;margin:0;cursor:pointer;display:inline-grid;place-content:center}",
			"body[data-dsh-theme-center] .tc-check:checked{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}",
			"body[data-dsh-theme-center] .tc-check:checked::after{content:'';width:7px;height:4px;border-left:2px solid var(--dsw-alias-bg-layer-3);border-bottom:2px solid var(--dsw-alias-bg-layer-3);transform:rotate(-45deg) translate(0,-1px)}",
		].join("");
		//#endregion

		//#region 卡片组件
		/** 展开箭头（内联 SVG）。 */
		function Chevron() {
			return react.createElement("svg", {
				width: 14,
				height: 14,
				viewBox: "0 0 16 16",
				"aria-hidden": true,
			}, react.createElement("path", {
				d: "M4 6l4 4 4-4",
				stroke: "currentColor",
				fill: "none",
				strokeWidth: 1.5,
				strokeLinecap: "round",
				strokeLinejoin: "round",
			}));
		}

		/**
		 * 「主题」插件卡片：官方卡片外框 + 皮肤中心式交互。
		 * @param props - 注册注入的 theme 句柄（可选）。
		 */
		function ThemeCard(props) {
			const [open, setOpen] = react.useState(false);
			const [tab, setTab] = react.useState("theme");
			const engineState = react.useSyncExternalStore(engine.subscribe, engine.getSnapshot);
			const widthState = react.useSyncExternalStore(subscribeWidth, getWidthSnapshot);
			const focusState = react.useSyncExternalStore(subscribeFocus, getFocusSnapshot);
			const appearanceState = react.useSyncExternalStore(subscribeAppearance, getAppearanceSnapshot);
			// 亮暗预览句柄可能缺失（主题服务不可用）：用空 store 保持 hooks 数量恒定
			const themeSnap = react.useSyncExternalStore(
				props.theme === null || props.theme === undefined ? () => () => {} : props.theme.subscribe,
				props.theme === null || props.theme === undefined ? () => null : props.theme.getSnapshot,
			);
			const busy = engineState.busy !== null;
			const previewing = engineState.current !== engineState.persisted && engineState.busy === null;

			const headerChildren = [
				react.createElement("span", { className: "tc-headText", key: "head" }, [
					react.createElement("span", { className: "tc-name", key: "n" }, "主题"),
					react.createElement("span", { className: "tc-desc", key: "d" }, "主题：23 款皮肤试穿 / 应用 / 持久记忆 · 外观：聊天宽度 / 精简 / 字号 / 字体 / 隐藏"),
				]),
				engineState.busy !== null
					? react.createElement("span", { className: "tc-pending", key: "p" }, "加载中…")
					: null,
				react.createElement("span", { className: "tc-chevron" + (open ? " tc-chevronOpen" : ""), key: "c" }, react.createElement(Chevron, null)),
			];

			const rows = THEMES.map((theme) => {
				const isCurrent = engineState.current === theme.id && engineState.busy === null;
				const isPersisted = engineState.persisted === theme.id;
				const rowChildren = [
					react.createElement("span", {
						className: "tc-rowAccent",
						key: "a",
						style: theme.accent === null ? { display: "none" } : { background: theme.accent },
					}),
					react.createElement("span", { className: "tc-rowText", key: "t" }, [
						react.createElement("span", { className: "tc-rowName", key: "n" }, theme.name),
						react.createElement("span", { className: "tc-rowTag", key: "g" }, theme.tagline),
					]),
					isCurrent
						? react.createElement("span", { className: "tc-current", key: "c" }, isPersisted ? "当前" : "试穿中")
						: null,
					react.createElement("button", {
						type: "button",
						className: "tc-btn",
						key: "try",
						disabled: busy,
						onClick: () => engine.request(theme.id, false),
					}, "试穿"),
					react.createElement("button", {
						type: "button",
						className: "tc-btn tc-btnPrimary",
						key: "app",
						disabled: busy || (isPersisted && isCurrent),
						onClick: () => engine.request(theme.id, true),
					}, isPersisted ? "已应用" : "应用"),
				];
				return react.createElement("div", {
					className: "tc-row" + (isCurrent ? " tc-rowCurrent" : ""),
					key: theme.id,
				}, rowChildren);
			});

			const bodyChildren = [];
			if (previewing) {
				bodyChildren.push(react.createElement("div", { className: "tc-toolRow", key: "exit" }, [
					react.createElement("span", { className: "tc-toolLabel", key: "l" }, "正在试穿「" + THEME_BY_ID.get(engineState.current).name + "」"),
					react.createElement("button", { type: "button", className: "tc-pill", key: "b", onClick: () => engine.exitPreview() }, "退出试穿"),
				]));
			}
			if (themeSnap !== null) {
				bodyChildren.push(react.createElement("div", { className: "tc-toolRow", key: "pv" }, [
					react.createElement("span", { className: "tc-toolLabel", key: "l" }, "亮暗预览"),
					react.createElement("button", {
						type: "button",
						className: "tc-pill" + (themeSnap.mode === "light" ? " tc-pillOn" : ""),
						key: "light",
						onClick: () => props.theme.set("light"),
					}, "亮色"),
					react.createElement("button", {
						type: "button",
						className: "tc-pill" + (themeSnap.mode === "dark" ? " tc-pillOn" : ""),
						key: "dark",
						onClick: () => props.theme.set("dark"),
					}, "暗色"),
				]));
			}
			bodyChildren.push(react.createElement("div", { key: "rows" }, rows));
			if (engineState.error !== null) {
				bodyChildren.push(react.createElement("p", { className: "tc-error", role: "status", key: "err" }, engineState.error));
			}
			bodyChildren.push(react.createElement("div", { className: "tc-scrimRow", key: "sc" }, [
				react.createElement("label", { className: "tc-scrimLabel", htmlFor: "tc-scrim", key: "l" }, "背景遮罩 " + engineState.scrim + "%"),
				react.createElement("input", {
					id: "tc-scrim",
					className: "tc-scrim",
					type: "range",
					min: "0",
					max: "100",
					step: "5",
					value: String(engineState.scrim),
					key: "i",
					onChange: (event) => engine.setScrim(Number(event.target.value)),
				}),
			]));

			const tabBar = react.createElement("div", { className: "tc-tabs", key: "tabs", role: "tablist" }, [
				react.createElement("button", {
					type: "button",
					className: "tc-tab" + (tab === "theme" ? " tc-tabOn" : ""),
					role: "tab",
					"aria-selected": tab === "theme",
					key: "theme",
					onClick: () => setTab("theme"),
				}, "主题"),
				react.createElement("button", {
					type: "button",
					className: "tc-tab" + (tab === "appearance" ? " tc-tabOn" : ""),
					role: "tab",
					"aria-selected": tab === "appearance",
					key: "appearance",
					onClick: () => setTab("appearance"),
				}, "外观"),
			]);

			// 「外观」面板：聊天宽度预设 + 聊天区精简百分比滑杆
			const appearanceChildren = [
				react.createElement("div", { className: "tc-secTitle", key: "wTitle" }, "聊天宽度"),
				react.createElement("div", { className: "tc-widthRow", key: "wRow" },
					WIDTH_PRESETS.map((px) => react.createElement("button", {
						type: "button",
						className: "tc-pill" + (widthState === px ? " tc-pillOn" : ""),
						key: px,
						onClick: () => setWidth(px),
					}, px + "px"))),
				react.createElement("div", { className: "tc-secTitle", key: "fTitle" }, "聊天区精简"),
				react.createElement("div", { className: "tc-scrimRow", key: "fRow" }, [
					react.createElement("label", { className: "tc-scrimLabel", htmlFor: "tc-focus", key: "l" }, "压制效果 " + focusState + "%"),
					react.createElement("input", {
						id: "tc-focus",
						className: "tc-scrim",
						type: "range",
						min: "0",
						max: "100",
						step: "5",
						value: String(focusState),
						key: "i",
						onChange: (event) => setFocus(Number(event.target.value)),
					}),
				]),
				react.createElement("p", { className: "tc-note", key: "fNote" }, "压制思考行、工具调用卡与上下文注入卡的展示：字号变小、摘要变淡、卡片变矮（0% = 官方默认展示）"),
				react.createElement("div", { className: "tc-secTitle", key: "tsTitle" }, "会话区字号"),
				react.createElement("div", { className: "tc-scrimRow", key: "tsRow" }, [
					react.createElement("label", { className: "tc-scrimLabel", htmlFor: "tc-textscale", key: "l" }, "字号 " + appearanceState.textScale + "%"),
					react.createElement("input", {
						id: "tc-textscale",
						className: "tc-scrim",
						type: "range",
						min: String(TEXT_SCALE_MIN),
						max: String(TEXT_SCALE_MAX),
						step: String(TEXT_SCALE_STEP),
						value: String(appearanceState.textScale),
						key: "i",
						onChange: (event) => setTextScale(Number(event.target.value)),
					}),
				]),
				react.createElement("p", { className: "tc-note", key: "tsNote" }, "缩放助手回答与用户消息文字（思考行/工具卡/上下文卡由「聊天区精简」调节，不受此影响）"),
				react.createElement("div", { className: "tc-secTitle", key: "fontTitle" }, "网站字体"),
				react.createElement("div", { className: "tc-selectRow", key: "fontRow" }, [
					react.createElement("label", { className: "tc-scrimLabel", htmlFor: "tc-font", key: "l" }, "全站字体"),
					react.createElement("select", {
						id: "tc-font",
						className: "tc-select",
						key: "s",
						value: appearanceState.font,
						onChange: (event) => setFont(event.target.value),
					}, FONTS.map((f) => react.createElement("option", { value: f.id, key: f.id }, f.name))),
				]),
				react.createElement("div", { className: "tc-secTitle", key: "hideTitle" }, "隐藏显示"),
				[["think", "隐藏思考行"], ["tool", "隐藏工具调用卡"], ["context", "隐藏上下文注入卡"]].map(([key, label]) =>
					react.createElement("label", { className: "tc-checkRow", key: key }, [
						react.createElement("input", {
							type: "checkbox",
							className: "tc-check",
							checked: !!appearanceState.hide[key],
							key: "i",
							onChange: (event) => setHide(key, event.target.checked),
						}),
						react.createElement("span", { key: "t" }, label),
					])),
			];

			return react.createElement("li", {
				className: "tc-card" + (open ? " tc-open" : ""),
			}, [
				react.createElement("button", {
					type: "button",
					className: "tc-header",
					"aria-expanded": open,
					"aria-label": (open ? "收起" : "展开") + ": 主题与外观",
					key: "h",
					onClick: () => {
						setOpen(!open);
					},
				}, headerChildren),
				open
					? react.createElement("div", { className: "tc-body", key: "b" }, [
						tabBar,
					].concat(tab === "theme" ? bodyChildren : appearanceChildren))
					: null,
			]);
		}
		//#endregion

		//#region apply
		/** 所需服务：slots（卡片注册）。 */
		const inject = ["slots"];

		/**
		 * 注册「主题」卡片并恢复已保存主题。所有写入都随 ctx.effect 收回。
		 * @param ctx - 客户端根上下文。
		 */
		function apply(ctx) {
			if (disposed) return;
			realCtxRef = ctx;
			stockTitle = document.title;
			const body = document.body;

			// 卡片样式作用域属性（皮肤契约：body[data-dsh-<name>]）
			ctx.effect(() => {
				body.dataset.dshThemeCenter = "";
				return () => {
					delete body.dataset.dshThemeCenter;
				};
			}, "theme-center: body scope");

			// 卡片样式
			ctx.effect(() => {
				const styleEl = document.createElement("style");
				styleEl.dataset.plugin = "dsh-theme-center";
				styleEl.dataset.pluginCss = "dsh-theme-center/card";
				styleEl.textContent = CARD_CSS;
				document.head.appendChild(styleEl);
				return () => {
					styleEl.remove();
				};
			}, "theme-center: card styles");

			// 聊天宽度样式：立即应用保存的宽度；随插件卸载收回
			ctx.effect(() => {
				const styleEl = document.createElement("style");
				styleEl.dataset.plugin = "dsh-theme-center";
				styleEl.dataset.pluginCss = "dsh-theme-center/width";
				widthStyleEl = styleEl;
				document.head.appendChild(styleEl);
				setWidth(currentWidth);
				return () => {
					styleEl.remove();
					widthStyleEl = null;
				};
			}, "theme-center: width styles");

			// 聊天区精简样式：立即应用保存的压制百分比；门控属性与样式随卸载收回
			ctx.effect(() => {
				const styleEl = document.createElement("style");
				styleEl.dataset.plugin = "dsh-theme-center";
				styleEl.dataset.pluginCss = "dsh-theme-center/focus";
				focusStyleEl = styleEl;
				document.head.appendChild(styleEl);
				applyFocusState(currentFocus);
				return () => {
					styleEl.remove();
					focusStyleEl = null;
					delete document.body.dataset.tcFocus;
				};
			}, "theme-center: focus styles");

			// 表格列宽样式：静态注入，随插件卸载收回
			ctx.effect(() => {
				const styleEl = document.createElement("style");
				styleEl.dataset.plugin = "dsh-theme-center";
				styleEl.dataset.pluginCss = "dsh-theme-center/table";
				styleEl.textContent = TABLE_CSS;
				document.head.appendChild(styleEl);
				return () => {
					styleEl.remove();
				};
			}, "theme-center: table styles");

			// 外观扩展样式（会话区字号/网站字体/隐藏开关）：恢复持久化状态并挂门控属性，随卸载收回
			ctx.effect(() => {
				const styleEl = document.createElement("style");
				styleEl.dataset.plugin = "dsh-theme-center";
				styleEl.dataset.pluginCss = "dsh-theme-center/appearance";
				appearanceStyleEl = styleEl;
				document.head.appendChild(styleEl);
				applyAppearanceState();
				return () => {
					styleEl.remove();
					appearanceStyleEl = null;
					delete document.body.dataset.tcScale;
					delete document.body.dataset.tcFont;
					delete document.body.dataset.tcHide;
				};
			}, "theme-center: appearance styles");

			// 引擎生命周期：遮罩变量 + 已挂载主题随插件卸载全部收回
			const previousScrim = body.style.getPropertyValue("--dsw-skin-scrim");
			ctx.effect(() => {
				const saved = readScrim();
				if (saved > 0) body.style.setProperty("--dsw-skin-scrim", String(saved / 100));
				return () => {
					disposed = true;
					pending = null;
					disposeCurrent();
					if (previousScrim === "") body.style.removeProperty("--dsw-skin-scrim");
					else body.style.setProperty("--dsw-skin-scrim", previousScrim);
				};
			}, "theme-center: engine lifetime");

			// 主题服务（亮暗预览；缺失则卡片隐藏预览控件）
			let themeHandle = null;
			const themeService = ctx.get("theme");
			if (themeService !== undefined) {
				let cached = null;
				themeHandle = {
					getSnapshot() {
						const snapshot = themeService.getTheme();
						if (cached === null || cached.rev !== snapshot.revision) {
							cached = {
								rev: snapshot.revision,
								mode: snapshot.preference === "system"
									? (snapshot.active && snapshot.active.id) || "light"
									: snapshot.preference,
							};
						}
						return cached;
					},
					subscribe(listener) {
						return ctx.on("theme/change", listener);
					},
					set(id) {
						themeService.setTheme(id);
					},
				};
			}

			// 「主题」卡片注册（官方槽位 settings.plugin.item）
			const slots = ctx.get("slots");
			if (slots !== undefined) {
				slots.inject("settings.plugin.item", () => slots.register({
					name: "settings.plugin.item",
					id: "theme",
					order: 30,
					label: "主题",
					inject: () => ({ theme: themeHandle }),
				}, ThemeCard));
			}

			// 启动时恢复已保存主题（异步，不阻塞 GUI）
			if (state.persisted !== "official") {
				requestTheme(state.persisted, false);
			}
		}

		exports.apply = apply;
		exports.inject = inject;
		//#endregion
		return module.exports;
	}
});
