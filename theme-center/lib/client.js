window.__ModuleLoader__.load({
	id: "@npm-liqingfeng/dsh-theme-center",
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
		 * <script> 加载同源 bundle → __ModuleLoader__.load 注册工厂 →
		 * modules.import 物化（自动注入皮肤样式）→ apply(miniCtx)
		 * 挂载。miniCtx 只提供 effect 生命周期，get 委托真实上下文
		 * （ths/trading 皮肤可读取 connection 服务，缺失时优雅降级）。
		 * 模块系统获取：rc.7 及更早 window.__DSH_MODULES__；rc.8 起
		 * window 全局移除，改经 ctx.get("modules")（windowModules 内回退链）。
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
			{ id: "codex", name: "Codex 深蓝", accent: "#339cff", tagline: "Codex AI 极简深空 · 黑底 + 蓝黑过渡渐变 · 磨砂毛玻璃面板 · 亮暗双形态", attr: "data-dsh-codex", package: "@user/dsh-client-ui-skin-codex", readsScrim: false },
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
		/** 写入 --dsw-skin-scrim（0 时移除变量，与皮肤内默认一致）并持久化（本地缓存 + 服务器）。 */
		function applyScrim(value) {
			const clamped = Math.max(0, Math.min(100, Math.round(value)));
			if (clamped <= 0) document.body.style.removeProperty("--dsw-skin-scrim");
			else document.body.style.setProperty("--dsw-skin-scrim", String(clamped / 100));
			writeStored(SCRIM_KEY, String(clamped));
			setState({ scrim: clamped });
			scheduleServerWrite("scrim", clamped);
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

		/** 宽度 store：外观面板控件读写同一状态并持久化（本地缓存 + 服务器）。 */
		let currentWidth = readSavedWidth();
		const widthListeners = new Set();
		function setWidth(px) {
			if (!WIDTH_PRESETS.includes(px)) return;
			currentWidth = px;
			writeStored(WIDTH_KEY, String(px));
			if (widthStyleEl !== null) widthStyleEl.textContent = widthCss(px);
			for (const listener of [...widthListeners]) listener();
			scheduleServerWrite("width", px);
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
		const FOCUS_DEFAULT = 80;
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

		/** 压制 store：外观面板控件读写同一状态并持久化（本地缓存 + 服务器）。 */
		let currentFocus = readSavedFocus();
		const focusListeners = new Set();
		function setFocus(pct) {
			const clamped = Math.max(0, Math.min(100, Math.round(pct)));
			if (clamped === currentFocus) return;
			currentFocus = clamped;
			writeStored(FOCUS_KEY, String(clamped));
			applyFocusState(clamped);
			for (const listener of [...focusListeners]) listener();
			scheduleServerWrite("focus", clamped);
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

		// 用户消息通道：user + steering（用户经 steering 通道发送的消息官方标记为
		// steering 而非 user，2026-08-17 用户实测"发送的内容字号突然变大"定位；
		// DSH 升级需复核）。生成带门控前缀的选择器列表——CSS 逗号分隔列表中
		// 前缀只作用于第一项，故每项必须自带完整前缀（userKindsSel）。
		const USER_TEXT_KINDS = ['user', 'steering'];
		function userKindsSel(prefix, suffix) {
			return USER_TEXT_KINDS.map((k) => prefix + ' [data-chat-flow-kind="' + k + '"]' + suffix).join(',');
		}

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
			userKindsSel('body[data-dsh-theme-center]', ' table') + '{width:100% !important;max-width:100% !important}' +
			'body[data-dsh-theme-center] [data-chat-flow-kind="assistant-step"] th,' +
			'body[data-dsh-theme-center] [data-chat-flow-kind="assistant-step"] td,' +
			userKindsSel('body[data-dsh-theme-center]', ' th') + ',' +
			userKindsSel('body[data-dsh-theme-center]', ' td') + '{max-width:none}';
		//#endregion

		//#region 外观扩展（会话区字号 / 网站字体 / 隐藏开关）
		const TEXT_SCALE_KEY = "dsh-theme-center:textscale:v1";
		/** 会话区字号缩放范围（%），100 = 官方原样。 */
		const TEXT_SCALE_MIN = 75;
		const TEXT_SCALE_MAX = 150;
		const TEXT_SCALE_STEP = 5;
		/** 会话区字号默认值（无配置时）——80%。 */
		const TEXT_SCALE_DEFAULT = 80;
		/** 官方原样锚点：100% 时移除门控=官方字号（与默认值解耦，默认可为非 100）。 */
		const TEXT_SCALE_OFFICIAL = 100;
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
			if (state.textScale !== TEXT_SCALE_OFFICIAL) {
				const F = "body[data-dsh-theme-center][data-tc-scale]";
				const SCALE = "calc(16px * var(--tc-text-scale))";
				const LHEIGHT = "calc(28px * var(--tc-text-scale))";
				parts.push(
					F + "{--tc-text-scale:" + (state.textScale / 100) + ";" + headingTokensCss("var(--dsw-font-family)") + "}",
					F + ' [data-chat-flow-kind="assistant-step"] [class*="_markdown_"],' + userKindsSel(F, ' [class*="_markdown_"]') + '{font-size:' + SCALE + ";line-height:" + LHEIGHT + "}",
					F + ' [data-chat-flow-kind="assistant-step"] :where(p,li,blockquote,th,td){font-size:' + SCALE + ";line-height:" + LHEIGHT + "}",
					F + ' [data-chat-flow-kind="assistant-step"] :not(pre) > code{font-size:calc(14px * var(--tc-text-scale))}',
					F + ' [data-chat-flow-kind="assistant-step"] pre{font-size:calc(13px * var(--tc-text-scale));line-height:calc(22px * var(--tc-text-scale))}',
					userKindsSel(F, ' [data-time-hover-root] > div:first-child > div') + '{font-size:' + SCALE + ";line-height:" + LHEIGHT + "}",
					// 输入框（composer）：官方基线 16px 实测（0.1.0-rc.6，DSH 升级需复核），
					// 锚点 data-composer-card="true"（稳定属性，页面唯一 textarea），与正文同门控同比例。
					// 官方为三层架构：backdrop 渲染可见文字 / textarea 透明文字+光标 / mirror 高度测量，
					// 三层 font-size 均 inherit 自 textarea 父层（grow）——只缩放 textarea 会让用户
					// 看到的 backdrop 文字不变、仅选中高亮变小（2026-08-17 用户实测反馈"输入未选中
					// 不缩放、全选才像缩放"），故直接缩放父层 div:has(> textarea)，三层一并生效；
					// 只缩放 font-size、行高保持官方 24px（文字顶部对齐，行高一起缩小
					// 会让文字上移贴边、与周边按钮错位——视觉模型 2026-08-17 实测确认）
					F + ' [data-composer-card="true"] div:has(> textarea){font-size:calc(16px * var(--tc-text-scale))}',
				);
			}
			if (state.font !== "default") {
				const stack = FONT_BY_ID.get(state.font).stack;
				const F = 'body[data-dsh-theme-center][data-tc-font="' + state.font + '"]';
				parts.push(
					// 基线 --tc-text-scale:1：仅换字体时标题令牌 calc 乘 1 = 官方字号
					"body[data-dsh-theme-center]{--tc-text-scale:1}",
					F + "{--dsw-font-family:" + stack + ";" + headingTokensCss(stack) + "}",
					F + ' [data-chat-flow-kind="assistant-step"] [class*="_markdown_"],' + userKindsSel(F, ' [class*="_markdown_"]') + '{font-family:' + stack + "}",
					userKindsSel(F, ' [data-time-hover-root] > div:first-child > div') + '{font-family:' + stack + "}",
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
			if (currentTextScale === TEXT_SCALE_OFFICIAL) delete document.body.dataset.tcScale;
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

				//#region 玻璃质感增强层（参考 NoNameLeGo/dsh-catppuccin-theme MIT；color-mix 从皮肤令牌派生，自动跟随任意主题亮/暗）
		const GLASS_KEY = "dsh-theme-center:glass:v1";
		const GLASS_FIELD = { enabled: "glassEnabled", blur: "glassBlur", frost: "glassFrost" };
		const GLASS_BLUR_DEFAULT = 14;
		const GLASS_FROST_DEFAULT = 50;
		const GLASS_ENABLED_DEFAULT = false;

		function readSavedGlass() {
			try {
			const raw = readStored(GLASS_KEY);
			if (raw === null) return { enabled: GLASS_ENABLED_DEFAULT, blur: GLASS_BLUR_DEFAULT, frost: GLASS_FROST_DEFAULT };
			const obj = JSON.parse(raw);
			return { enabled: obj.enabled === true, blur: Number.isFinite(obj.blur) ? Math.max(0, Math.min(40, obj.blur)) : GLASS_BLUR_DEFAULT, frost: Number.isFinite(obj.frost) ? Math.max(0, Math.min(100, obj.frost)) : GLASS_FROST_DEFAULT };
			} catch { return { enabled: GLASS_ENABLED_DEFAULT, blur: GLASS_BLUR_DEFAULT, frost: GLASS_FROST_DEFAULT }; }
		}

		let glassStyleEl = null;
		let glassStampDisposer = null;
		let glassFadeEls = null;

		const GLASS_CSS = "/* ============================================================================\n * Catppuccin glass layer — a toggleable glassmorphism skin for the DeepSeek\n * Harness web GUI, riding on top of the Catppuccin themes.\n *\n * Every rule is gated on the `data-tc-glass` attribute the plugin puts on\n * <html> while enabled (removed on disable), so off == the stock UI, exactly.\n * The fill colours are derived from the ACTIVE theme's design tokens via\n * color-mix(), so the glass automatically picks up the current Catppuccin\n * flavour (Latte / Frappé / Macchiato / Mocha) — or the stock light/dark\n * palette when no Catppuccin theme is active.\n *\n * Glass recipe (aligned with DSH-Transparent-UI-Plugin / Aqua):\n *  - FLAT translucent fill (no vertical gradient — a darker bottom stop\n *    reads as a black fade band inside the composer);\n *  - a visible rim border, scheme-aware (dark hairline on light, luminous\n *    hairline on dark);\n *  - a white top-edge inner highlight (the \"glass edge light\") — always\n *    white, stronger on light glass, a whisper on dark glass;\n *  - one soft drop shadow, tinted cool on light and deep neutral on dark.\n * All four are shared custom properties, so every pane (header / sidebar /\n * composer / trajectory / menus / dialogs) stays in lock step and the\n * frost slider moves the whole skin live.\n *\n * Selectors deliberately use attribute/element hooks and stable data-* seams\n * (never hashed module classes) so the layer survives recompiles.\n * ========================================================================== */\n\n/* ---------- Knobs: the settings row writes --tc-glass-blur (px),\n   --tc-glass-frost (0-1.4 alpha multiplier; 50 on the slider = 1x) and\n   the scheme-aware brightness fractions onto <html>. The glass surfaces\n   consume them, so the sliders move the whole skin live.\n   NOTE: the recipes are defined on BODY — they reference the --dsw-alias-*\n   theme tokens that the presenter writes onto body as inline variables, and\n   a var() reference inside a custom property is substituted where the\n   property is defined (computed-value time), so defining the recipes on\n   <html> would leave them unresolvable (html cannot inherit up from body).\n   The dark branch keys off the body's own data-ds-dark-theme attribute, so\n   both schemes are resolved in one pass. ---------- */\n[data-tc-glass] body {\n  /* FLAT glass tones: one even fill per elevation (ported from Aqua — its\n     vertical gradient's darker bottom stop read as a black fade inside the\n     composer). `card` is the main panes, `raised` the small controls that\n     must read a touch more opaque than the sheet under them, `hover` the\n     answered state. */\n  --tc-glass-card: color-mix(in srgb, var(--dsw-alias-bg-layer-1) calc(52% * var(--tc-glass-frost, 1)), transparent);\n  --tc-glass-card-raised: color-mix(in srgb, var(--dsw-alias-bg-layer-1) calc(64% * var(--tc-glass-frost, 1)), transparent);\n  --tc-glass-card-hover: color-mix(in srgb, var(--dsw-alias-bg-layer-1) calc(76% * var(--tc-glass-frost, 1)), transparent);\n  /* Rim: a real hairline so the pane's silhouette stays readable over a\n     busy backdrop (the bare border-l2 token was too faint to carve the\n     glass out of the page ground). */\n  --tc-glass-rim: color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent);\n  --tc-glass-rim-soft: color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent);\n  /* Edge light: the glass signature — a white inner line along the top\n     edge. Must be WHITE, not the label token: under a light scheme the\n     label colour is dark, which turned the \"highlight\" into a dark seam. */\n  --tc-glass-edge: inset 0 1px 0 rgba(255, 255, 255, 0.42);\n  /* Drop: one soft shadow per pane, cool-tinted on light. */\n  --tc-glass-drop: 0 10px 32px color-mix(in srgb, var(--dsw-alias-bg-mask-2) 38%, transparent);\n}\n\n[data-tc-glass] body[data-ds-dark-theme] {\n  /* Dark scheme: a luminous rim (light catches the glass edge), a whisper\n     of edge light, and a deep neutral drop for separation from the\n     backdrop. */\n  --tc-glass-rim: color-mix(in srgb, var(--dsw-alias-label-primary) 24%, transparent);\n  --tc-glass-rim-soft: color-mix(in srgb, var(--dsw-alias-label-primary) 16%, transparent);\n  --tc-glass-edge: inset 0 1px 0 rgba(255, 255, 255, 0.08);\n  --tc-glass-drop: 0 10px 32px rgba(2, 6, 14, 0.45);\n}\n\n/* Canvas: a SOLID ground — the theme's own base colour (方案 A: Latte\n   #eff1f5 / Frappé #303446 / Macchiato #24273a / Mocha #1e1e2e), so the\n   background always matches the active flavour with zero hardcoding and\n   text keeps the theme's native contrast. The brightness knob mixes\n   white (light scheme) or black (dark scheme) straight into this colour,\n   so the slider still works on the solid ground. The frame and the\n   conversation / details columns go transparent so the ground shows\n   through behind the glass. */\n[data-tc-glass] body {\n  background: color-mix(in srgb,\n    color-mix(in srgb, var(--dsw-alias-bg-base), #ffffff calc(var(--tc-glass-brightness-white, 0) * 100%)),\n    #000000 calc(var(--tc-glass-brightness-black, 0) * 100%));\n}\n\n[data-tc-glass] [data-tc-glass-frame] {\n  background: transparent;\n}\n\n[data-tc-glass] [data-phase],\n[data-tc-glass] [data-tc-glass-details] {\n  background: transparent;\n}\n\n/* The floating header card sits ABOVE the transcript: the scroll body slides\n   up behind the frosted glass (negative margin) and its padding starts\n   content below the card, so scrolling text passes under the header and stays\n   visible through the blur instead of hard-clipping at the card edge. */\n[data-tc-glass-float] [data-phase='active'] header {\n  position: relative;\n  z-index: 8;\n}\n\n/* The floating header breaks the code block banner's sticky anchoring, so\n   disable stickiness — the banner stays on its code block and scrolls with\n   it instead of sliding over the header and drifting. */\n[data-tc-glass-float] [class*='banner'] {\n  position: static;\n}\n\n[data-tc-glass-float] [data-phase='active'] [data-conversation-scroll] {\n  margin-top: -95px;\n  padding-top: 107px;\n}\n\n/* Active phase: drop the composer seat's opaque bottom slab and fade band\n   entirely so the glass card reads as one piece over the backdrop. */\n[data-tc-glass] [data-phase] [class*='composerSeat'][class*='composerSeat'] {\n  background: none;\n}\n\n/* ---------- Page edge fades: 13px gradient blur bands pinned to the top\n   and bottom of the viewport (ported from DSH-Transparent-UI-Plugin). They\n   sit BELOW the floating glass (header / composer / sidebar hold z-index 8)\n   but ABOVE the scrolling chat content — content melting into an edge\n   passes under the blur, while the glass cards themselves stay sharp.\n   The veil is whisper-thin and scheme-aware (a touch of white on light, a\n   touch of black on dark): at clear-frost defaults a thicker fill reads as\n   a film under the glass panes. Click-transparent, so nothing is\n   blocked. ---------- */\n[data-tc-glass] [data-tc-glass-fade] {\n  position: fixed;\n  left: 0;\n  right: 0;\n  height: 13px;\n  z-index: 7;\n  pointer-events: none;\n  backdrop-filter: blur(5px);\n  background: rgba(255, 255, 255, 0.18);\n}\n\n[data-tc-glass] body[data-ds-dark-theme] [data-tc-glass-fade] {\n  background: rgba(0, 0, 0, 0.14);\n}\n\n[data-tc-glass] [data-tc-glass-fade='top'] {\n  top: 0;\n  -webkit-mask-image: linear-gradient(180deg, black 0%, transparent 100%);\n  mask-image: linear-gradient(180deg, black 0%, transparent 100%);\n}\n\n[data-tc-glass] [data-tc-glass-fade='bottom'] {\n  bottom: 0;\n  -webkit-mask-image: linear-gradient(0deg, black 0%, transparent 100%);\n  mask-image: linear-gradient(0deg, black 0%, transparent 100%);\n}\n\n/* ---------- Corner language: 14px surfaces, 10px controls, 8px atoms. ---------- */\n[data-tc-glass-float] [role='menu'],\n[data-tc-glass-float] [role='dialog'],\n[data-tc-glass-float] [role='alert'],\n[data-tc-glass-float] [data-tc-glass-surface] {\n  border-radius: 14px;\n}\n\n[data-tc-glass-float] [role='menuitem'],\n[data-tc-glass-float] [role='tooltip'],\n[data-tc-glass-float] [class*='pill'] {\n  border-radius: 8px;\n}\n\n[data-tc-glass-float] button[class*='button'] {\n  border-radius: 10px;\n}\n\n[data-tc-glass-float] [class*='iconButton'],\n[data-tc-glass-float] [class*='searchButton'] {\n  border-radius: 8px;\n}\n\n/* Block family (code / terminal / diff / read / web / search): the corner\n   variables ride the same elements, so banners and footers follow the\n   14px surface radius (ported from Aqua). */\n[data-tc-glass-float] [class*='block'] {\n  border-radius: 14px;\n  --dsl-code-block-border-radius: 14px;\n  --dsl-diff-radius: 14px;\n  --dsl-read-radius: 14px;\n  --dsl-terminal-radius: 14px;\n  --dsl-web-radius: 14px;\n  --dsl-search-radius: 14px;\n}\n\n/* Composer attach \"+\": a frosted bead on the card's own glass — the raised\n   recipe, so it reads as a brighter bead rather than a solid token. */\n[data-tc-glass-float] [data-tc-glass-add] {\n  background: var(--tc-glass-card-raised);\n  border: 1px solid var(--tc-glass-rim);\n  box-shadow: var(--tc-glass-edge);\n  backdrop-filter: blur(var(--tc-glass-blur, 14px));\n}\n\n[data-tc-glass-float] [data-tc-glass-add]:hover:not(:disabled) {\n  background: var(--tc-glass-card-hover);\n}\n\n/* New-session button: the same raised recipe as the \"+\" — always a touch\n   more opaque than the surrounding cards so it reads as the primary action\n   on the glass sheet. */\n[data-tc-glass-float] [data-tc-glass-surface] {\n  background: var(--tc-glass-card-raised);\n  border: 1px solid var(--tc-glass-rim);\n  box-shadow: var(--tc-glass-edge);\n  backdrop-filter: blur(var(--tc-glass-blur, 14px));\n}\n\n[data-tc-glass-float] [data-tc-glass-surface]:hover:not(:disabled) {\n  background: var(--tc-glass-card-hover);\n}\n\n/* Chat message bubbles: frosted glass over the solid page ground. A touch\n   clearer than the panes (46% vs 52%) so long transcripts\n   stay airy; the fill comes from theme tokens, so the four Catppuccin\n   palettes stay faithful instead of a fixed white/black tint.\n   Scoped to the conversation transcript (data-conversation-scroll): the\n   bare `[class*='bubble']` substring also hits third-party widgets whose\n   class merely contains \"bubble\" (e.g. dsh-whale-widget's `.dshwv-bubble`,\n   a body-level SVG speech bubble) and frosted them with an unwanted\n   translucent box + rim + radius. The transcript holds only DSH's own\n   user / command-input bubbles, so narrowing here keeps the glass off\n   foreign bubble-shaped widgets without a per-plugin blacklist. */\n[data-tc-glass-float] [data-conversation-scroll] [class*='bubble'] {\n  border-radius: 14px;\n  border: 1px solid var(--tc-glass-rim-soft);\n  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) calc(46% * var(--tc-glass-frost, 1)), transparent);\n  backdrop-filter: blur(var(--tc-glass-blur, 14px));\n}\n\n/* Card family: hover cards, panels, plugin cards, tool cards, the composer. */\n[data-tc-glass-float] [class*='card'] {\n  border-radius: 14px;\n}\n\n/* ---------- Session header (顶栏): a detached glass card, shared recipe.\n   A uniform rim on all four sides: a transparent bottom edge used to cut\n   the border-line at the rounded corners (the visible side borders stop at\n   the corner's midpoint), which read as a broken contour. Keeping the same\n   hairline all the way round makes the outline continuous around the corner.\n   The drop shadow alone still separates the card from the chat below. ---------- */\n[data-tc-glass-float] header {\n  margin: 12px 16px 0;\n  padding: 10px 16px 8px;\n  border: 1px solid var(--tc-glass-rim);\n  border-radius: 20px;\n  background: var(--tc-glass-card);\n  box-shadow: var(--tc-glass-edge), var(--tc-glass-drop);\n  backdrop-filter: blur(var(--tc-glass-blur, 14px));\n}\n\n[data-tc-glass-float] header::after {\n  display: none;\n}\n\n/* Collapsed: the floating rail reaches 12px into the chat gutter, so the\n   header card steps right (28px inset = 16px clear of the rail's edge) —\n   the sidebar keeps its geometry, the top bar does the adjusting (ported\n   from Aqua). */\n[data-tc-glass-float] [data-tc-glass-frame][data-sidebar-collapsed] header {\n  margin-left: 28px;\n}\n\n/* ---------- Sidebar (侧边栏): header-style glass card; the token fill on\n   the column and its inner chrome goes transparent so the glass reads. The\n   root width inline-style is released so content follows the glass panel. ---------- */\n[data-tc-glass-float] [class*='sidebarCol'] {\n  --dsw-specific-sidebar-fill: transparent;\n  position: relative;\n  /* Above the header card (8): the settings panel is a fixed overlay\n     trapped in this stacking context, so the sidebar itself must outrank\n     the header or the panel's top edge sits under the top bar (ported\n     from the original project). */\n  z-index: 9;\n  margin: 12px;\n  padding: 10px 12px 14px;\n  border: 1px solid var(--tc-glass-rim);\n  /* Luminous right edge: the accent-coloured hairline where the sidebar\n     meets the chat, stronger on light glass, subdued on dark. */\n  border-right-color: color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color) 40%, transparent);\n  border-radius: 20px;\n  background: var(--tc-glass-card);\n  box-shadow: var(--tc-glass-edge), var(--tc-glass-drop);\n  overflow: hidden;\n}\n\n[data-tc-glass-float] body[data-ds-dark-theme] [class*='sidebarCol'] {\n  border-right-color: color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color) 22%, transparent);\n}\n\n/* While the settings dialog is open, the sidebar must not carry ANY\n   backdrop-filter: it re-anchors the dialog's fixed overlay into the\n   column (the panel traps at the column width instead of its designed\n   width) — ported from Aqua. */\n[data-tc-glass-float] [class*='sidebarCol']:has([role='dialog']) {\n  backdrop-filter: none;\n}\n\n/* The sidebar's own glass blur (kept off the rule above so the dialog\n   guard can drop it cleanly). */\n[data-tc-glass-float] [class*='sidebarCol'] {\n  backdrop-filter: blur(var(--tc-glass-blur, 14px));\n}\n\n/* Collapsed rail: floats too (mica mode) — same geometry as the original\n   project: a 12px left margin plus a matching negative right margin (outer\n   size unchanged, the main column does not move; the rail just reaches\n   12px into the chat gutter), 16px corners, and a margin transition that\n   runs on the same clock as the app's own collapse crossfade. */\n[data-tc-glass-float] [data-tc-glass-frame][data-sidebar-collapsed] [class*='sidebarCol'] {\n  margin: 12px -12px 12px 12px;\n  padding: 0;\n  border-radius: 16px;\n  transition: margin 150ms var(--ds-ease-in-out), border-radius 150ms var(--ds-ease-in-out);\n}\n\n/* The sidebar root freezes at the expanded column width via an inline style\n   — release it so the content follows the glass panel's width. Scoped to the\n   dedicated seam: a broad `[class*='root']` selector would also hit the\n   settings panel (rendered inside the sidebar column) and collapse its rows. */\n[data-tc-glass-float] [data-tc-glass-frame]:not([data-sidebar-collapsed]) [data-tc-glass-sidebar-root] {\n  width: 100% !important;\n}\n\n/* ---------- Trajectory view (轨迹视图): a glass panel aligned with the\n   header card's left/right edges, frosted like the other surfaces. ---------- */\n[data-tc-glass-float] [data-tc-glass-trajectory] {\n  margin: 8px 16px 12px;\n  width: calc(100% - 32px);\n  height: calc(100% - 20px);\n  border: 1px solid var(--tc-glass-rim);\n  border-radius: 20px;\n  background: var(--tc-glass-card);\n  box-shadow: var(--tc-glass-edge), var(--tc-glass-drop);\n  backdrop-filter: blur(var(--tc-glass-blur, 14px));\n  overflow: hidden;\n}\n\n/* The toolbar and timeline surfaces go transparent so the glass shows through. */\n[data-tc-glass-float] [data-tc-glass-trajectory] [role='toolbar'],\n[data-tc-glass-float] [data-tc-glass-trajectory] section[aria-label='Trajectory timeline'] {\n  background: transparent;\n}\n\n/* ---------- Composer (输入框): the start-chat glass recipe — 24px corners,\n   frosted translucent fill, backdrop blur, soft drop shadow. ---------- */\n[data-tc-glass-float] [data-composer-card],\n[data-tc-glass-float] [data-composer-card]::after {\n  border-radius: 24px;\n}\n\n[data-tc-glass-float] [data-composer-card] {\n  position: relative;\n  /* Above the scrolling content and the code-banner stack (max 7), so the\n     frosted card always reads as one piece over the transcript. */\n  z-index: 8;\n  background: var(--tc-glass-card);\n  border: 1px solid var(--tc-glass-rim);\n  box-shadow: var(--tc-glass-edge), var(--tc-glass-drop);\n  backdrop-filter: blur(var(--tc-glass-blur, 14px));\n}\n\n/* ---------- Composer + stats line (统计行): ONE glass slab (ported from\n   Aqua v1.3). Once the stats line is docked underneath, the WHOLE inputbar\n   becomes a single pane — one background, blur, border and shadow on the\n   wrapper; the card and the stats band turn transparent inside it, so\n   their frost and tone can never drift apart. The only seam cue is one\n   hairline divider where the two pieces meet.\n   The shell constrains the dock's child to the chat content width\n   (specificity (0,4,1), max-width 620px), so the slab pins its width with\n   the card's own max-width variable plus !important — the fused footer\n   aligns exactly with the card. ---------- */\n[data-tc-glass-float] [data-tc-glass-inputbar]:not([class*='hero']):not(:has([data-tc-glass-stats])) {\n  padding-bottom: 12px;\n}\n\n[data-tc-glass][data-tc-glass-float] [data-tc-glass-inputbar]:has([data-tc-glass-stats]) {\n  width: var(--dsh-composer-card-max-width) !important;\n  max-width: var(--dsh-composer-card-max-width) !important;\n  margin: 0 auto 12px;\n  padding: 0;\n  border: 1px solid var(--tc-glass-rim);\n  border-radius: 24px;\n  background: var(--tc-glass-card);\n  box-shadow: var(--tc-glass-edge), var(--tc-glass-drop);\n  backdrop-filter: blur(var(--tc-glass-blur, 14px));\n}\n\n/* Inside the slab the composer card is bare content: no glass of its own. */\n[data-tc-glass-float] [data-tc-glass-inputbar]:has([data-tc-glass-stats]) [data-composer-card] {\n  border: none;\n  border-radius: 0;\n  background: transparent;\n  box-shadow: none;\n  backdrop-filter: none;\n}\n\n[data-tc-glass-float] [data-tc-glass-inputbar]:has([data-tc-glass-stats]) [data-composer-card]::after {\n  display: none;\n}\n\n/* The dock band inside the slab: full width, transparent, the hairline\n   divider at the seam is the only remnant of the split. */\n[data-tc-glass][data-tc-glass-float] [data-tc-glass-inputbar]:has([data-tc-glass-stats]) [data-slot] {\n  width: 100% !important;\n  max-width: none !important;\n  margin: 0;\n  padding: 2px 16px 6px;\n  border: none;\n  border-top: 1px solid var(--tc-glass-rim-soft);\n  border-radius: 0;\n  background: transparent;\n  box-shadow: none;\n  backdrop-filter: none;\n}\n\n/* The stats row inside the band: plain text, no own glass. It must keep a\n   container-constrained width (100% + the shell's own max-width, exactly\n   like the stock row): in the flex column the row is a direct flex item\n   (the slot anchor is display:contents), and `width:auto` there would let\n   it shrink to its content width, which makes scrollWidth == clientWidth\n   and disables the stock \"hover for full text\" tooltip (it only arms when\n   the row is truncated). */\n[data-tc-glass][data-tc-glass-float] [data-tc-glass-inputbar] [data-slot] [data-tc-glass-stats] {\n  width: 100% !important;\n  min-width: 0;\n  margin: 0;\n  padding: 4px 0 0 !important;\n  border: none;\n  border-radius: 0;\n  background: none;\n  box-shadow: none;\n  backdrop-filter: none;\n}\n\n/* The live segment keeps a right inset so it does not touch the band edge. */\n[data-tc-glass][data-tc-glass-float] [data-tc-glass-inputbar] [data-slot] [data-dsh-live-tps] {\n  padding-right: 0;\n}\n\n/* ---------- Sidebar: the selected session gets an accent bar and a soft halo. ---------- */\n[data-tc-glass-float] [role='treeitem'][aria-selected='true'] {\n  box-shadow:\n    inset 2px 0 0 var(--dsw-specific-sidebar-nav-item-active-accent),\n    0 0 16px color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color) 20%, transparent);\n}\n\n/* ---------- Hover light: buttons and menu cells answer with a soft ring. ---------- */\n[data-tc-glass-float] button[class*='button']:hover:not(:disabled),\n[data-tc-glass-float] [role='menuitem']:hover:not(:disabled) {\n  box-shadow:\n    0 0 12px color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color) 20%, transparent),\n    inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-border-l3) 60%, transparent);\n}\n\n/* ---------- Menus: the raised glass recipe. ---------- */\n[data-tc-glass-float] [role='menu'] {\n  background: var(--tc-glass-card-raised);\n  border: 1px solid var(--tc-glass-rim-soft);\n  backdrop-filter: blur(var(--tc-glass-blur, 14px));\n}\n\n/* ---------- Model-parade menu: the composer 模型选择弹层（含分组列表的那\n   个）通用菜单配方太透（约 9% 不透明度），铺在聊天内容上几乎看不清；\n   设置面板是 ~55% 的磨砂，清晰得多。这里单独把它提浓到 layer-2 @ 70%（仍\n   跟随主题 token、保留 blur），达到与设置面板相当的清晰度。Scoped with\n   :has([role='group'] > [role='menuitemradio']) 只命中带分组清单的模型弹层，\n   普通上下文菜单不受影响。 ---------- */\n[data-tc-glass-float] [role='menu']:has([role='group'] > [role='menuitemradio']) {\n  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 70%, transparent);\n}\n\n/* ---------- Model picker provider-group titles: 每个模型提供方的分组名\n   （如 \"DeepSeek\"、\"Agnes\"、\"opencode-go\"）做成一枚贴合文字的胶囊标签，\n   像侧栏「新会话」按钮那样被容器包起来——细描边 + 玻璃填充 + 全圆角，\n   宽度收缩到只包住文本（inline-flex + width:fit-content），不再占满整行，\n   也不需要原来那个不透明实底条。保留 sticky 吸顶：选项滚动经过时胶囊\n   浮在组上方。Scoped with :has(> [role='menuitemradio']) 只命中模型分组，\n   不影响其他菜单里的 group 行。 ---------- */\n[data-tc-glass-float] [role='menu'] [role='group']:has(> [role='menuitemradio']) > :first-child {\n  display: inline-flex;\n  align-items: center;\n  margin: 3px 0 5px 6px;\n  padding: 3px 10px;\n  border: 1px solid var(--tc-glass-rim);\n  border-radius: 999px;\n  background: var(--tc-glass-card-raised);\n  backdrop-filter: blur(var(--tc-glass-blur, 14px));\n  width: fit-content;\n}\n\n/* ---------- Settings / modal dialogs: the raised panel becomes the same\n   live glass as the other surfaces. Scoped to `aria-modal=true` so small\n   role=dialog popups (the context meter, etc.) keep their own surfaces —\n   and this panel carries no fixed-position descendants, so backdrop-filter\n   cannot re-anchor anything. The panel rides the same --tc-glass-* knobs,\n   so dragging blur / frost / brightness in the glass row is a live\n   preview on the panel itself. ---------- */\n[data-tc-glass-float] [role='dialog'][aria-modal='true'] {\n  background: var(--tc-glass-card-raised);\n  border: 1px solid var(--tc-glass-rim);\n  box-shadow: var(--tc-glass-edge);\n  backdrop-filter: blur(var(--tc-glass-blur, 14px));\n}\n\n/* ---------- Readability on the glass: a 1px halo blurs the backdrop right\n   at the glyph edges (the closest CSS can get to \"frost the background\n   near the text\"), scheme-aware so it lifts the glyphs away from the\n   page ground instead of dirtying them (ported from Aqua). ---------- */\n[data-tc-glass] [data-conversation-scroll] {\n  text-shadow: 0 0 1px rgba(255, 255, 255, 0.5);\n}\n\n[data-tc-glass] body[data-ds-dark-theme] [data-conversation-scroll] {\n  text-shadow: 0 0 1px rgba(0, 0, 0, 0.4);\n}\n\n/* Composer placeholder and stats text: neutral, scheme-adaptive tones from\n   the label tokens — no colour cast fighting the glass. */\n[data-tc-glass-float] [data-composer-card] textarea::placeholder {\n  color: color-mix(in srgb, var(--dsw-alias-label-primary) 45%, transparent);\n}\n\n[data-tc-glass-float] [data-tc-glass-inputbar] [data-slot] {\n  color: var(--dsw-alias-label-secondary);\n}\n\n/* ---------- Page transitions: opacity-only (a running transform would\n   re-anchor position:fixed descendants mid-flight). ---------- */\n[data-tc-glass-float] [data-phase='hero'] {\n  animation: dsh-glass-in 0.32s var(--ds-ease-in-out);\n}\n\n[data-tc-glass-float] [data-phase='active'] {\n  animation: dsh-glass-in 0.3s var(--ds-ease-in-out);\n}\n\n[data-tc-glass-float] [data-testid^='view-'] {\n  animation: dsh-glass-in 0.26s var(--ds-ease-in-out);\n}\n\n[data-tc-glass-float] [data-tool] {\n  animation: dsh-glass-rise 0.3s var(--ds-ease-in-out) both;\n}\n\n[data-tc-glass-float] [role='dialog'] {\n  animation: dsh-glass-dialog-in 0.24s var(--ds-ease-in-out);\n}\n\n@keyframes dsh-glass-in {\n  from { opacity: 0; }\n}\n\n@keyframes dsh-glass-rise {\n  from { opacity: 0; transform: translateY(6px); }\n}\n\n@keyframes dsh-glass-dialog-in {\n  from { opacity: 0; transform: translateY(8px) scale(0.985); }\n}\n\n/* ---------- Keyboard focus and text selection. ---------- */\n[data-tc-glass] :focus-visible {\n  outline: 2px solid color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color) 85%, transparent);\n  outline-offset: 1px;\n}\n\n[data-tc-glass] ::selection {\n  background: color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color) 35%, transparent);\n}\n\n/* ---------- Compatibility mode: stock layout, generic glass material.\n   The layout rules above are gated on data-tc-glass-float, so in compat\n   mode the stock layout stays byte-for-byte; the conservative surface\n   families get the frosted blur so other plugins' UI picks up the glass\n   with zero coordination. Dialogs keep their stock surface (see above). ---------- */\n[data-tc-glass-compat] [role='menu'],\n[data-tc-glass-compat] [role='tooltip'],\n[data-tc-glass-compat] [class*='card'],\n[data-tc-glass-compat] [class*='panel'],\n[data-tc-glass-compat] [class*='popover'],\n[data-tc-glass-compat] [class*='dropdown'] {\n  backdrop-filter: blur(12px);\n}\n\n/* Compat-mode bubbles are narrowed to the transcript like the float-mode\n   rule above, for the same reason: the generic `[class*='bubble']`\n   substring would blur foreign widgets (e.g. dsh-whale-widget's body-level\n   `.dshwv-bubble`) that only share the word \"bubble\" in their class name. */\n[data-tc-glass-compat] [data-conversation-scroll] [class*='bubble'] {\n  backdrop-filter: blur(12px);\n}\n\n/* Compatibility-mode modal panels: same live translucent fill as the float\n   mode (the generic blur above alone would sit behind an opaque panel). */\n[data-tc-glass-compat] [role='dialog'][aria-modal='true'] {\n  background: var(--tc-glass-card-raised);\n  border: 1px solid var(--tc-glass-rim);\n  backdrop-filter: blur(var(--tc-glass-blur, 12px));\n}\n\n/* ---------- Reduced motion: keep the static look, drop every effect. ---------- */\n@media (prefers-reduced-motion: reduce) {\n  [data-tc-glass-float] [data-phase='hero'],\n  [data-tc-glass-float] [data-phase='active'],\n  [data-tc-glass-float] [data-testid^='view-'],\n  [data-tc-glass-float] [data-tool],\n  [data-tc-glass-float] [role='dialog'] {\n    animation: none;\n  }\n}\n";
		function glassCss() {
			return GLASS_CSS;
		}

		const GLASS_SEAMS = [
			{ attribute: "data-tc-glass-frame", selector: ":has(> [class*='sidebarCol'])" },
			{ attribute: "data-tc-glass-sidebar-root", selector: "[class*='sidebarCol'] [class*='root']", first: true },
			{ attribute: "data-tc-glass-surface", selector: "button[class*='newSession']" },
			{ attribute: "data-tc-glass-trajectory", selector: "[data-conversation-composer-overlay]" },
			{ attribute: "data-tc-glass-details", selector: "[class*='detailsCol'] [class*='root']", first: true },
			{ attribute: "data-tc-glass-inputbar", selector: ":has(> [data-composer-card])" },
			{ attribute: "data-tc-glass-add", selector: "[data-composer-card] [class*='add']" },
			{ attribute: "data-tc-glass-stats", selector: "[data-slot='conversation.composer.dock'] [class*='root']" },
		];
		function stampGlass() {
			for (const seam of GLASS_SEAMS) {
						if (seam.first) { const el = document.querySelector(seam.selector); if (el !== null && !el.hasAttribute(seam.attribute)) el.setAttribute(seam.attribute, ""); }
						else { for (const el of document.querySelectorAll(seam.selector)) { if (!el.hasAttribute(seam.attribute)) el.setAttribute(seam.attribute, ""); } }
			}
		}
		function startGlassStamper() { stampGlass(); if (typeof MutationObserver === "undefined") return () => {}; const o = new MutationObserver(stampGlass); o.observe(document.documentElement, { childList: true, subtree: true }); return () => o.disconnect(); }

		function applyGlassState() {
			const html = document.documentElement;
			if (currentGlass.enabled) {
				// 默认 compat 模式（温和玻璃：只玻璃化浮层面板/气泡/菜单，不改布局）；mica(浮动卡) 需显式设 data-tc-glass-float
				if (html != null) { html.setAttribute("data-tc-glass", ""); html.setAttribute("data-tc-glass-float", ""); html.style.setProperty("--tc-glass-blur", String(currentGlass.blur) + "px"); html.style.setProperty("--tc-glass-frost", String(currentGlass.frost / 50)); html.style.setProperty("--tc-glass-brightness-white", "0"); html.style.setProperty("--tc-glass-brightness-black", "0"); }
				if (glassFadeEls === null) {
					const mk = (pos) => { const el = document.createElement("span"); el.setAttribute("data-tc-glass-fade", pos); el.setAttribute("aria-hidden", "true"); return el; };
					glassFadeEls = [mk("top"), mk("bottom")];
					for (const el of glassFadeEls) document.body.appendChild(el);
				}
			} else {
				if (html != null) { html.removeAttribute("data-tc-glass"); html.removeAttribute("data-tc-glass-compat"); html.removeAttribute("data-tc-glass-float"); html.style.removeProperty("--tc-glass-blur"); html.style.removeProperty("--tc-glass-frost"); html.style.removeProperty("--tc-glass-brightness-white"); html.style.removeProperty("--tc-glass-brightness-black"); }
				if (glassFadeEls !== null) { for (const el of glassFadeEls) el.remove(); glassFadeEls = null; }
			}
			if (glassStyleEl !== null) glassStyleEl.textContent = glassCss();
		}

		let currentGlass = readSavedGlass();
		function setGlass(key, value) {
			if (!Object.prototype.hasOwnProperty.call(currentGlass, key)) return;
			const clamped = key === "enabled" ? !!value : Math.max(0, Math.min(key === "blur" ? 40 : 100, Math.round(value)));
			const next = Object.assign({}, currentGlass, { [key]: clamped });
			if (JSON.stringify(next) === JSON.stringify(currentGlass)) return;
			currentGlass = next; writeStored(GLASS_KEY, JSON.stringify(next)); applyGlassState(); notifyAppearance(); scheduleServerWrite(GLASS_FIELD[key], next[key]);
		}
		//#endregion

/** 外观扩展 store：三个状态共享一个快照（useSyncExternalStore 需稳定引用）。 */
		let currentTextScale = readSavedTextScale();
		let currentFont = readSavedFont();
		let currentHide = readSavedHide();
		let appearanceSnapshot = { textScale: currentTextScale, font: currentFont, hide: currentHide, glass: currentGlass };
		const appearanceListeners = new Set();
		function notifyAppearance() {
			appearanceSnapshot = { textScale: currentTextScale, font: currentFont, hide: currentHide, glass: currentGlass };
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
			scheduleServerWrite("textScale", clamped);
		}
		function setFont(id) {
			if (!FONT_BY_ID.has(id) || id === currentFont) return;
			currentFont = id;
			writeStored(FONT_KEY, id);
			applyAppearanceState();
			notifyAppearance();
			scheduleServerWrite("font", id);
		}
		function setHide(key, value) {
			if (!Object.prototype.hasOwnProperty.call(currentHide, key)) return;
			const next = Object.assign({}, currentHide, { [key]: !!value });
			if (JSON.stringify(next) === JSON.stringify(currentHide)) return;
			currentHide = next;
			writeStored(HIDE_KEY, JSON.stringify(next));
			applyAppearanceState();
			notifyAppearance();
			scheduleServerWrite(HIDE_FIELD[key], next[key]);
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

		/** 内核客户端模块系统：0.1.0-rc.7 及更早暴露为 window.__DSH_MODULES__；rc.8 起 window 全局移除，改经 client 根上下文 ctx.get("modules") 提供（dsh-client-modules 经 ctx.reflect.provide("modules", moduleSystem) 注册）。 */
		function windowModules() {
			if (window.__DSH_MODULES__ !== undefined) return window.__DSH_MODULES__;
			try {
				const ctx = realCtxRef;
				return ctx !== null && typeof ctx.get === "function" ? ctx.get("modules") : undefined;
			} catch {
				return undefined;
			}
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
		 * @param persist - 是否持久化为选择（卡片「应用」：写本地缓存 + 服务器）。
		 * @param adopt - 是否采纳服务器选择（远程同步：写本地缓存但不写服务器）。
		 */
		async function runJob(theme, persist, adopt) {
			if (theme.id === "official") {
				disposeCurrent();
				if (persist || adopt) writeStored(STORAGE_KEY, "official");
				setState({ current: "official", persisted: persist || adopt ? "official" : state.persisted, busy: null, error: null });
				if (persist) scheduleServerWrite("theme", "official");
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
			if (persist || adopt) writeStored(STORAGE_KEY, theme.id);
			setState({ persisted: persist || adopt ? theme.id : state.persisted, current: theme.id, busy: null, error: null });
			if (persist) scheduleServerWrite("theme", theme.id);
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
					if (theme !== undefined) await runJob(theme, job.persist, job.adopt);
				}
			} finally {
				pumpBusy = false;
			}
		}

		/**
		 * 请求切换主题（试穿 persist=false / 应用 persist=true / 采纳服务器 adopt）。
		 * 正在加载同一主题时重复点击：试穿忽略，应用只补写持久化。
		 */
		function requestTheme(id, persist, adopt) {
			const theme = THEME_BY_ID.get(id);
			if (theme === undefined) return;
			if (state.busy === id) {
				if (persist || adopt) {
					writeStored(STORAGE_KEY, id);
					setState({ persisted: id });
					if (persist) scheduleServerWrite("theme", id);
				}
				return;
			}
			if (id === state.current && state.busy === null && state.persisted === id) return;
			pending = { id, persist, adopt };
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
			"body[data-dsh-theme-center] .tc-sync{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5;margin:0;padding:0 10px}",
			"body[data-dsh-theme-center] .tc-syncOk{color:var(--dsw-alias-state-success-primary)}",
			"body[data-dsh-theme-center] .tc-syncWarn{color:var(--dsw-alias-state-warn-primary)}",
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
			const syncSnap = react.useSyncExternalStore(subscribeSyncScope, getSyncScopeSnapshot);
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
							react.createElement("div", { className: "tc-secTitle", key: "glassTitle" }, "玻璃质感"),
				react.createElement("label", { className: "tc-checkRow", key: "glassEnable" }, [
					react.createElement("input", { type: "checkbox", className: "tc-check", checked: !!appearanceState.glass.enabled, key: "i", onChange: (event) => setGlass("enabled", event.target.checked) }),
					react.createElement("span", { key: "t" }, "启用玻璃拟态（边框/高光/投影，配色自动跟随当前主题）"),
				]),
				react.createElement("div", { className: "tc-scrimRow", key: "glassBlurRow" }, [
					react.createElement("label", { className: "tc-scrimLabel", htmlFor: "tc-glass-blur", key: "l" }, "模糊度 " + appearanceState.glass.blur + "px"),
					react.createElement("input", { id: "tc-glass-blur", className: "tc-scrim", type: "range", min: "0", max: "40", step: "1", value: String(appearanceState.glass.blur), key: "i", onChange: (event) => setGlass("blur", Number(event.target.value)) }),
				]),
				react.createElement("div", { className: "tc-scrimRow", key: "glassFrostRow" }, [
					react.createElement("label", { className: "tc-scrimLabel", htmlFor: "tc-glass-frost", key: "l" }, "磨砂度 " + appearanceState.glass.frost + "%"),
					react.createElement("input", { id: "tc-glass-frost", className: "tc-scrim", type: "range", min: "0", max: "100", step: "5", value: String(appearanceState.glass.frost), key: "i", onChange: (event) => setGlass("frost", Number(event.target.value)) }),
				]),
				react.createElement("p", { className: "tc-note", key: "glassNote" }, "开启后顶栏/侧边栏/输入框/统计行/聊天气泡呈磨砂玻璃卡片（半透明+边框+白顶高光+投影），关闭=官方原样"),
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
						react.createElement("p", {
							className: "tc-sync" + (syncSnap.status === "ready" ? " tc-syncOk" : syncSnap.status === "loading" ? "" : " tc-syncWarn"),
							key: "sync",
						}, syncSnap.status === "ready"
							? "配置已同步到服务器，所有终端生效"
							: syncSnap.status === "loading"
								? "正在同步服务器配置…"
								: "服务器配置不可用，仅本机生效"),
					].concat(tab === "theme" ? bodyChildren : appearanceChildren))
					: null,
			]);
		}
		//#endregion

		//#region 服务端同步（一处配置、所有终端生效）
		const SETTINGS_API_PATH = "/theme-center/settings";
		/** 轮询间隔：服务器配置变更后其余终端在 ≤SYNC_INTERVAL_MS 内跟随。 */
		const SYNC_INTERVAL_MS = 15000;
		/** 滑杆类字段服务器写去抖（拖动时防刷屏）。 */
		const WRITE_DEBOUNCE_MS = 400;
		/** 去抖字段（离散控件即时写）。 */
		const SERVER_DEBOUNCED_FIELDS = { scrim: true, focus: true, textScale: true , glassBlur: true, glassFrost: true };
		/** 隐藏开关本地键 → 服务器字段名。 */
		const HIDE_FIELD = { think: "hideThink", tool: "hideTool", context: "hideContext" };

		/** 服务器字段默认值（与宿主 Config schema 默认一致）。 */
		function serverDefaults() {
			return {
				theme: "official",
				scrim: 0,
				width: WIDTH_PRESETS[0],
				focus: FOCUS_DEFAULT,
				textScale: TEXT_SCALE_DEFAULT,
				font: "default",
				hideThink: false,
				hideTool: false,
				hideContext: false,
				glassEnabled: false,
				glassBlur: 14,
				glassFrost: 50,
			};
		}

		/** 服务器视图 value 逐字段清洗（非法回退默认，绝不抛错）。 */
		function sanitizeServerValue(value) {
			const d = serverDefaults();
			if (!value || typeof value !== "object") return d;
			const out = Object.assign({}, d);
			if (typeof value.theme === "string" && (value.theme === "official" || THEME_BY_ID.has(value.theme))) out.theme = value.theme;
			const num = (v, min, max, fb) => {
				const n = Number(v);
				return Number.isFinite(n) && n >= min && n <= max ? n : fb;
			};
			out.scrim = num(value.scrim, 0, 100, d.scrim);
			out.width = WIDTH_PRESETS.includes(Number(value.width)) ? Number(value.width) : d.width;
			out.focus = num(value.focus, 0, 100, d.focus);
			out.textScale = num(value.textScale, TEXT_SCALE_MIN, TEXT_SCALE_MAX, d.textScale);
			if (typeof value.font === "string" && FONT_BY_ID.has(value.font)) out.font = value.font;
			out.hideThink = value.hideThink === true;
			out.hideTool = value.hideTool === true;
			out.hideContext = value.hideContext === true;
			out.glassEnabled = value.glassEnabled === true;
			out.glassBlur = num(value.glassBlur, 0, 40, 14);
			out.glassFrost = num(value.glassFrost, 0, 100, 50);
			return out;
		}

		/** 本地当前状态 → 服务器批量写（首次同步迁移 / 全量上推用）。 */
		function localStateToWrites() {
			return [
				{ field: "theme", op: "set", value: state.persisted },
				{ field: "scrim", op: "set", value: state.scrim },
				{ field: "width", op: "set", value: currentWidth },
				{ field: "focus", op: "set", value: currentFocus },
				{ field: "textScale", op: "set", value: currentTextScale },
				{ field: "font", op: "set", value: currentFont },
				{ field: "hideThink", op: "set", value: currentHide.think === true },
				{ field: "hideTool", op: "set", value: currentHide.tool === true },
				{ field: "hideContext", op: "set", value: currentHide.context === true },
				{ field: "glassEnabled", op: "set", value: currentGlass.enabled === true },
				{ field: "glassBlur", op: "set", value: currentGlass.blur },
				{ field: "glassFrost", op: "set", value: currentGlass.frost },
			];
		}

		/** 直连 /theme-center/settings 的作用域（SettingsScope 契约：getSnapshot/subscribe/set/unset/refresh）。 */
		function ThemeCenterSettingsScope(endpoint) {
			let snapshot = { status: "loading", value: undefined, user: undefined, revision: undefined, writable: false };
			const listeners = [];
			let tail = Promise.resolve();

			function publish(next) {
				snapshot = next;
				for (const listener of [...listeners]) listener();
			}
			function accept(envelope) {
				const view = envelope && envelope.value;
				if (!view || typeof view !== "object") {
					publishUnavailable();
					return;
				}
				publish({
					status: "ready",
					value: sanitizeServerValue(view.value),
					user: view.user,
					revision: view.revision,
					writable: view.writable === true,
				});
			}
			function publishUnavailable() {
				publish({ status: "unavailable", value: undefined, user: undefined, revision: undefined, writable: false });
			}
			function refresh() {
				return window.fetch(endpoint)
					.then((response) => {
						if (!response.ok) {
							publishUnavailable();
							return;
						}
						return response.json();
					})
					.then((envelope) => {
						if (envelope === undefined) return;
						if (envelope.ok !== true) {
							publishUnavailable();
							return;
						}
						accept(envelope);
					})
					.catch(() => publishUnavailable());
			}
			/** 批量写（串行：并发写按调用顺序落盘；revision 栅栏由宿主保证）。 */
			function mutate(writes) {
				tail = tail.then(() => window.fetch(endpoint, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ writes }),
				})
					.then((response) => {
						if (!response.ok) {
							publishUnavailable();
							return null;
						}
						return response.json();
					})
					.then((envelope) => {
						if (envelope === null) return;
						if (envelope.ok !== true) {
							publishUnavailable();
							return;
						}
						accept(envelope);
					})
					.catch(() => publishUnavailable()));
				return tail;
			}

			void refresh();
			return {
				getSnapshot: () => snapshot,
				subscribe(fn) {
					listeners.push(fn);
					return () => {
						const i = listeners.indexOf(fn);
						if (i >= 0) listeners.splice(i, 1);
					};
				},
				set: (field, value) => mutate([{ field, op: "set", value }]),
				unset: (field) => mutate([{ field, op: "unset" }]),
				mutate,
				refresh,
			};
		}

		/** 同步作用域实例（apply 时创建；null = 未初始化/已卸载）。 */
		let syncScope = null;
		/** 远程应用标志：置位期间 setter 跳过服务器回写（防回环）。 */
		let applyingRemote = false;
		/** 字段去抖定时器表。 */
		const serverWriteTimers = {};

		/**
		 * 排队一次服务器写：离散字段即时提交，滑杆字段 400ms 尾随去抖。
		 * 远程应用期间（applyingRemote）与作用域不可用时静默跳过。
		 */
		function scheduleServerWrite(field, value) {
			if (applyingRemote || syncScope === null) return;
			if (SERVER_DEBOUNCED_FIELDS[field]) {
				if (serverWriteTimers[field] !== undefined) window.clearTimeout(serverWriteTimers[field]);
				serverWriteTimers[field] = window.setTimeout(() => {
					delete serverWriteTimers[field];
					void syncScope.mutate([{ field, op: "set", value }]);
				}, WRITE_DEBOUNCE_MS);
				return;
			}
			void syncScope.mutate([{ field, op: "set", value }]);
		}

		/** 订阅同步状态（卡片提示用；作用域未初始化时返回固定不可用快照）。 */
		const NO_SYNC_SNAPSHOT = { status: "unavailable" };
		function subscribeSyncScope(fn) {
			return syncScope === null ? () => {} : syncScope.subscribe(fn);
		}
		function getSyncScopeSnapshot() {
			return syncScope === null ? NO_SYNC_SNAPSHOT : syncScope.getSnapshot();
		}

		/**
		 * 应用服务器状态（服务器为真源，localStorage 仅作首屏缓存）：
		 * 逐字段与本地比对，不同则以服务器为准——主题走 requestTheme
		 * （adopt：不回写服务器），其余字段复用现有 setter（applyingRemote
		 * 抑制回写）。全部写入同时刷新 localStorage 缓存。
		 */
		function applyRemoteState(value) {
			applyingRemote = true;
			try {
				if (value.theme !== state.persisted) requestTheme(value.theme, false, true);
				const scrim = Math.max(0, Math.min(100, Math.round(value.scrim)));
				if (scrim !== state.scrim) applyScrim(scrim);
				if (WIDTH_PRESETS.includes(value.width) && value.width !== currentWidth) setWidth(value.width);
				if (value.focus !== currentFocus) setFocus(value.focus);
				if (value.textScale !== currentTextScale) setTextScale(value.textScale);
				if (value.font !== currentFont) setFont(value.font);
				setHide("think", value.hideThink);
				setHide("tool", value.hideTool);
				setHide("context", value.hideContext);
				setGlass("enabled", value.glassEnabled);
				setGlass("blur", value.glassBlur);
				setGlass("frost", value.glassFrost);
			} finally {
				applyingRemote = false;
			}
		}

		/**
		 * 同步循环：作用域创建 + 轮询 + 聚焦/可见刷新；服务器视图就绪后
		 * 按「未配置 → 迁移本地状态；已配置 → diff 应用」收敛。全部随
		 * ctx.effect disposer 收回（定时器/监听/作用域）。
		 */
		function startServerSync(ctx) {
			ctx.effect(() => {
				syncScope = new ThemeCenterSettingsScope(SETTINGS_API_PATH);
				const timer = window.setInterval(() => {
					if (syncScope !== null) syncScope.refresh();
				}, SYNC_INTERVAL_MS);
				const onVis = () => {
					if (document.visibilityState === "visible" && syncScope !== null) syncScope.refresh();
				};
				const onFocus = () => {
					if (syncScope !== null) syncScope.refresh();
				};
				document.addEventListener("visibilitychange", onVis);
				window.addEventListener("focus", onFocus);
				return () => {
					window.clearInterval(timer);
					document.removeEventListener("visibilitychange", onVis);
					window.removeEventListener("focus", onFocus);
					syncScope = null;
					for (const key of Object.keys(serverWriteTimers)) {
						window.clearTimeout(serverWriteTimers[key]);
						delete serverWriteTimers[key];
					}
				};
			}, "theme-center: server sync");

			ctx.effect(() => {
				let lastKey = null;
				let off = () => {};
				const listener = () => {
					if (syncScope === null) return;
					const snap = syncScope.getSnapshot();
					if (snap.status !== "ready") return;
					const key = String(snap.revision) + ":" + JSON.stringify(snap.value);
					if (key === lastKey) return;
					lastKey = key;
					const configured = snap.user !== null && typeof snap.user === "object" && Object.keys(snap.user).length > 0;
					if (!configured) {
						void syncScope.mutate(localStateToWrites());
						return;
					}
					applyRemoteState(snap.value);
				};
				off = syncScope.subscribe(listener);
				listener();
				return () => off();
			}, "theme-center: server state apply");
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

			// 玻璃质感增强层：样式 + 接缝 stamping + 恢复持久化，随卸载收回
			ctx.effect(() => {
				const styleEl = document.createElement("style"); styleEl.dataset.plugin = "dsh-theme-center"; styleEl.dataset.pluginCss = "dsh-theme-center/glass"; glassStyleEl = styleEl; document.head.appendChild(styleEl); glassStampDisposer = startGlassStamper(); applyGlassState();
				return () => { styleEl.remove(); glassStyleEl = null; if (glassStampDisposer !== null) { glassStampDisposer(); glassStampDisposer = null; } const html = document.documentElement; if (html != null) { html.removeAttribute("data-tc-glass"); html.removeAttribute("data-tc-glass-compat"); html.removeAttribute("data-tc-glass-float"); html.style.removeProperty("--tc-glass-blur"); html.style.removeProperty("--tc-glass-frost"); html.style.removeProperty("--tc-glass-brightness-white"); html.style.removeProperty("--tc-glass-brightness-black"); } if (glassFadeEls !== null) { for (const el of glassFadeEls) el.remove(); glassFadeEls = null; } };
			}, "theme-center: glass styles");

			// 服务端同步：一处配置、所有终端生效（作用域/轮询/迁移/diff 应用，随卸载收回）
			startServerSync(ctx);

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
					key: "theme-center",
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
