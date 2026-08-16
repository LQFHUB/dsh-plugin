window.__ModuleLoader__.load({
	id: "@user/dsh-client-ui-skin-skin-forest",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		/** 森林绿 —— 固定色系皮肤（alias-only，源自 KinGao294/dsh-skin，MIT）。
		 * 亮暗同值：颜色自洽（bg/label/border/brand 全套覆盖），不随亮暗切换。 */
		const CSS = "/* \u68ee\u6797\u7eff \u2014\u2014 \u6e10\u53d8 + \u6bdb\u73bb\u7483\uff08alias-only\uff0c\u6e90\u81ea KinGao294/dsh-skin\uff0cMIT\uff09\u3002 */\nbody[data-dsh-skin-forest] {\n  --dsw-alias-bg-base: #0a120d;\n  --dsw-alias-bg-layer-1: rgba(16, 26, 19, 0.62);\n  --dsw-alias-bg-layer-2: rgba(23, 36, 26, 0.55);\n  --dsw-alias-bg-layer-3: rgba(30, 46, 34, 0.48);\n  --dsw-alias-bg-overlay: rgba(32, 48, 36, 0.58);\n  --dsw-alias-border-l1: rgba(134, 239, 172, 0.1);\n  --dsw-alias-border-l2: rgba(134, 239, 172, 0.2);\n  --dsw-alias-label-primary: #e7f5eb;\n  --dsw-alias-label-secondary: #9dc4a9;\n  --dsw-alias-label-tertiary: #7ba68a;\n  --dsw-alias-brand-primary: #34d37b;\n  --dsw-alias-brand-text: #04120a;\n  --dsw-alias-button-primary-hover: #5ae295;\n  --dsw-alias-button-primary-dimmed: #17241a;\n  --dsw-alias-state-business-primary: #34d37b;\n  --dsw-alias-state-business-tertiary: #17241a;\n  --dsw-alias-interactive-bg-hover: rgba(52, 211, 123, 0.12);\n  --dsw-alias-interactive-bg-active: rgba(52, 211, 123, 0.2);\n  --dsw-alias-markdown-code-block: #0c1510;\n  --dsw-alias-markdown-inline-code: #17241a;\n  --dsw-specific-sidebar-fill: #0c1510;\n  --dsw-specific-sidebar-nav-item-active: #17241a;\n  --dsw-specific-sidebar-nav-item-hover: #111d15;\n  --dsw-alias-scrollbar-bg-l1: #1e2e22;\n  --dsw-alias-scrollbar-bg-l2: #26402e;\n  --dsw-alias-scrollbar-hover-l1: #2f5038;\n  --dsw-alias-scrollbar-hover-l2: #2f5038;\n  background-image: radial-gradient(ellipse at 50% 0%, rgba(52,211,123,0.16), transparent 55%), radial-gradient(circle at 85% 18%, rgba(52,211,123,0.1), transparent 42%), linear-gradient(165deg, #10231a 0%, #0a120d 55%, #070e0a 100%);\n  background-attachment: fixed;\n  background-size: cover;\n  background-position: center;\n  background-repeat: no-repeat;\n}\nbody[data-dsh-skin-forest] [id='root'] { background: transparent; backdrop-filter: blur(20px) saturate(1.15); -webkit-backdrop-filter: blur(20px) saturate(1.15); }\nbody[data-dsh-skin-forest] .VOzbGW_panel { background: var(--dsw-alias-bg-base); }\n";
		function apply(ctx) {
			const body = document.body;
			body.dataset["dshSkinForest"] = "";
			const styleEl = document.createElement("style");
			styleEl.dataset.plugin = "@user/dsh-client-ui-skin-skin-forest";
			styleEl.dataset.pluginCss = "@user/dsh-client-ui-skin-skin-forest/skin";
			styleEl.textContent = CSS;
			document.head.appendChild(styleEl);
			ctx.effect(() => () => {
				delete body.dataset["dshSkinForest"];
				styleEl.remove();
			}, "@user/dsh-client-ui-skin-skin-forest: palette");
		}
		exports.apply = apply;
		return module.exports;
	}
});
