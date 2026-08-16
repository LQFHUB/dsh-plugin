window.__ModuleLoader__.load({
	id: "@user/dsh-client-ui-skin-skin-midnight",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		/** 深夜黑 —— 固定色系皮肤（alias-only，源自 KinGao294/dsh-skin，MIT）。
		 * 亮暗同值：颜色自洽（bg/label/border/brand 全套覆盖），不随亮暗切换。 */
		const CSS = "/* \u6df1\u591c\u9ed1 \u2014\u2014 alias-only \u56fa\u5b9a\u8272\u7cfb\u76ae\u80a4\uff08\u6e90\u81ea KinGao294/dsh-skin\uff0cMIT\uff09\u3002 */\nbody[data-dsh-skin-midnight] {\n  --dsw-alias-bg-base: #000000;\n  --dsw-alias-bg-layer-1: #0b0b0f;\n  --dsw-alias-bg-layer-2: #141419;\n  --dsw-alias-bg-layer-3: #1c1c23;\n  --dsw-alias-bg-overlay: #1d1d24;\n  --dsw-alias-border-l1: rgba(255, 255, 255, 0.06);\n  --dsw-alias-border-l2: rgba(255, 255, 255, 0.12);\n  --dsw-alias-label-primary: #e8e8ee;\n  --dsw-alias-label-secondary: #9d9daa;\n  --dsw-alias-label-tertiary: #7c7c88;\n  --dsw-alias-brand-primary: #7c8cff;\n  --dsw-alias-brand-text: #05050a;\n  --dsw-alias-button-primary-hover: #9aa7ff;\n  --dsw-alias-button-primary-dimmed: #141419;\n  --dsw-alias-state-business-primary: #7c8cff;\n  --dsw-alias-state-business-tertiary: #141419;\n  --dsw-alias-interactive-bg-hover: rgba(124, 140, 255, 0.12);\n  --dsw-alias-interactive-bg-active: rgba(124, 140, 255, 0.2);\n  --dsw-alias-markdown-code-block: #08080b;\n  --dsw-alias-markdown-inline-code: #141419;\n  --dsw-specific-sidebar-fill: #08080b;\n  --dsw-specific-sidebar-nav-item-active: #141419;\n  --dsw-specific-sidebar-nav-item-hover: #0e0e13;\n  --dsw-alias-scrollbar-bg-l1: #1c1c23;\n  --dsw-alias-scrollbar-bg-l2: #26262f;\n  --dsw-alias-scrollbar-hover-l1: #31313c;\n  --dsw-alias-scrollbar-hover-l2: #31313c;\n}\n";
		function apply(ctx) {
			const body = document.body;
			body.dataset["dshSkinMidnight"] = "";
			const styleEl = document.createElement("style");
			styleEl.dataset.plugin = "@user/dsh-client-ui-skin-skin-midnight";
			styleEl.dataset.pluginCss = "@user/dsh-client-ui-skin-skin-midnight/skin";
			styleEl.textContent = CSS;
			document.head.appendChild(styleEl);
			ctx.effect(() => () => {
				delete body.dataset["dshSkinMidnight"];
				styleEl.remove();
			}, "@user/dsh-client-ui-skin-skin-midnight: palette");
		}
		exports.apply = apply;
		return module.exports;
	}
});
