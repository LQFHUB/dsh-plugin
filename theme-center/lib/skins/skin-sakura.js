window.__ModuleLoader__.load({
	id: "@user/dsh-client-ui-skin-skin-sakura",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		/** 樱花粉 —— 固定色系皮肤（alias-only，源自 KinGao294/dsh-skin，MIT）。
		 * 亮暗同值：颜色自洽（bg/label/border/brand 全套覆盖），不随亮暗切换。 */
		const CSS = "/* \u6a31\u82b1\u7c89 \u2014\u2014 \u6e10\u53d8 + \u6bdb\u73bb\u7483\uff08alias-only\uff0c\u6e90\u81ea KinGao294/dsh-skin\uff0cMIT\uff09\u3002 */\nbody[data-dsh-skin-sakura] {\n  --dsw-alias-bg-base: #fdf5f7;\n  --dsw-alias-bg-layer-1: #ffffff;\n  --dsw-alias-bg-layer-2: #f9e8ee;\n  --dsw-alias-bg-layer-3: #f2dae3;\n  --dsw-alias-bg-overlay: #fffbfc;\n  --dsw-alias-border-l1: rgba(190, 80, 120, 0.1);\n  --dsw-alias-border-l2: rgba(190, 80, 120, 0.18);\n  --dsw-alias-label-primary: #3b2530;\n  --dsw-alias-label-secondary: #8b6576;\n  --dsw-alias-label-tertiary: #a27f8f;\n  --dsw-alias-brand-primary: #db2777;\n  --dsw-alias-brand-text: #ffffff;\n  --dsw-alias-button-primary-hover: #ec4899;\n  --dsw-alias-button-primary-dimmed: #f9e8ee;\n  --dsw-alias-state-business-primary: #db2777;\n  --dsw-alias-state-business-tertiary: #f9e8ee;\n  --dsw-alias-interactive-bg-hover: rgba(219, 39, 119, 0.08);\n  --dsw-alias-interactive-bg-active: rgba(219, 39, 119, 0.14);\n  --dsw-alias-markdown-code-block: #f9e8ee;\n  --dsw-alias-markdown-inline-code: #f2dae3;\n  --dsw-specific-sidebar-fill: #f9e8ee;\n  --dsw-specific-sidebar-nav-item-active: #f2dae3;\n  --dsw-specific-sidebar-nav-item-hover: #f6e0e8;\n  --dsw-alias-scrollbar-bg-l1: #eccfda;\n  --dsw-alias-scrollbar-bg-l2: #e4c0cf;\n  --dsw-alias-scrollbar-hover-l1: #d9afc1;\n  --dsw-alias-scrollbar-hover-l2: #d9afc1;\n  background-image: radial-gradient(ellipse at 50% 0%, rgba(219,39,119,0.14), transparent 55%), radial-gradient(circle at 85% 18%, rgba(236,72,153,0.08), transparent 42%), linear-gradient(165deg, #fef9fb 0%, #fdf5f7 55%, #f7e9ee 100%);\n  background-attachment: fixed;\n  background-size: cover;\n  background-position: center;\n  background-repeat: no-repeat;\n}\nbody[data-dsh-skin-sakura] [id='root'] { background: transparent; }\n";
		function apply(ctx) {
			const body = document.body;
			body.dataset["dshSkinSakura"] = "";
			const styleEl = document.createElement("style");
			styleEl.dataset.plugin = "@user/dsh-client-ui-skin-skin-sakura";
			styleEl.dataset.pluginCss = "@user/dsh-client-ui-skin-skin-sakura/skin";
			styleEl.textContent = CSS;
			document.head.appendChild(styleEl);
			ctx.effect(() => () => {
				delete body.dataset["dshSkinSakura"];
				styleEl.remove();
			}, "@user/dsh-client-ui-skin-skin-sakura: palette");
		}
		exports.apply = apply;
		return module.exports;
	}
});
