window.__ModuleLoader__.load({
	id: "dsh-chat-width-customizer",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region lib/client.js
		/**
		 * Chat Width Customizer - browser half.
		 *
		 * Adds a "宽度 . NNNpx" pill button to the conversation session header
		 * utilities seat. Clicking cycles through preset widths: the chat column
		 * (--dsh-chat-content-width) and the derived composer card width are
		 * overridden on the stable [data-conversation-scroll] container, and the
		 * shipped 525px cap on the user-message bubble stack is released so both
		 * message kinds fill the widened column.
		 *
		 * The current width lives in module-level state (shared by every
		 * session's header button, kept in sync through a tiny listener set) and
		 * is persisted in localStorage, so a width chosen in one session shows
		 * and applies everywhere - including after switching sessions and after
		 * a page reload. The bundle runtime has no `styles` builtin (that is
		 * dynamic-package only), so CSS lives in one owned <style> element whose
		 * text is rewritten on each width change and which is removed on plugin
		 * stop.
		 */
		const react = require("react");

		/** Required services before mounting. */
		const inject = ["slots"];

		const PRESETS = [748, 896, 1024, 1152, 1280, 1440, 1600];
		const STORAGE_KEY = "dsh-chat-width-customizer:width";

		const STATIC_CSS =
			".cwx-util{border:1px solid var(--dsw-alias-border-l2);height:32px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);cursor:pointer;background:0 0;border-radius:18px;justify-content:center;align-items:center;gap:4px;padding:6px 12px;font-size:13px;font-weight:400;line-height:20px;display:inline-flex}" +
			".cwx-util:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}" +
			".cwx-util span{white-space:nowrap;flex:none}";

		/** Width rules: widen the chat column and the derived composer, release the user-bubble cap. */
		const widthCss = (px) =>
			"[data-conversation-scroll]{" +
			"--dsh-chat-content-width:" + px + "px;" +
			"--dsh-composer-card-max-width:calc(var(--dsh-chat-content-width) + 32px)" +
			"}" +
			'[data-conversation-scroll] [class*="userStack"]{max-width:100% !important}';

		/** Read the persisted width; falls back to the default preset. */
		function readSaved() {
			try {
				const value = Number(window.localStorage.getItem(STORAGE_KEY));
				return PRESETS.includes(value) ? value : PRESETS[0];
			} catch {
				return PRESETS[0];
			}
		}

		/** Module-level shared width store: all session header buttons read and write the same value. */
		const listeners = new Set();
		let currentWidth = readSaved();
		let styleEl = null;

		function setWidth(px) {
			currentWidth = px;
			try {
				window.localStorage.setItem(STORAGE_KEY, String(px));
			} catch { /* storage unavailable - keep in-memory only */ }
			if (styleEl !== null) styleEl.textContent = STATIC_CSS + widthCss(px);
			for (const listener of listeners) listener(px);
		}

		function subscribeWidth(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		}

		function ChatWidthUtility(props) {
			const [value, setValue] = react.useState(currentWidth);
			react.useEffect(() => subscribeWidth(setValue), []);
			const cycle = () => {
				const next = PRESETS[(PRESETS.indexOf(value) + 1) % PRESETS.length];
				setValue(next);
				props.setWidth(next);
			};
			return react.createElement("button", {
				type: "button",
				className: "cwx-util",
				onClick: cycle,
				title: "聊天宽度 Chat width（点击循环切换预设）",
				"aria-label": "聊天宽度 Chat width"
			}, react.createElement("span", null, "宽度 · " + value + "px"));
		}

		function apply(ctx) {
			const slots = ctx.get("slots");
			if (slots === undefined) return;

			styleEl = document.createElement("style");
			styleEl.dataset.plugin = "dsh-chat-width-customizer";
			document.head.appendChild(styleEl);

			// Apply the shared width immediately (saved value on reload, default otherwise).
			setWidth(currentWidth);

			ctx.effect(() => () => {
				styleEl.remove();
				styleEl = null;
			}, "dsh-chat-width-customizer: style element");

			slots.inject("conversation.session.header.utilities", () => slots.register(
				{ name: "conversation.session.header.utilities", id: "chat-width", order: 100 },
				() => react.createElement(ChatWidthUtility, { setWidth })
			));
		}

		exports.apply = apply;
		exports.inject = inject;
		//#endregion
		return module.exports;
	}
});
