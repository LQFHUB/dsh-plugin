window.__ModuleLoader__.load({
	id: "@user/dsh-client-ui-skin-skin-graphite",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		/** 石墨灰 —— 固定色系皮肤（alias-only，源自 KinGao294/dsh-skin，MIT）。
		 * 亮暗同值：颜色自洽（bg/label/border/brand 全套覆盖），不随亮暗切换。 */
		const CSS = "/* \u77f3\u58a8\u7070 \u2014\u2014 \u6e10\u53d8 + \u6bdb\u73bb\u7483\uff08alias-only\uff0c\u6e90\u81ea KinGao294/dsh-skin\uff0cMIT\uff09\u3002 */\nbody[data-dsh-skin-graphite] {\n  --dsw-alias-bg-base: #0f0f11;\n  --dsw-alias-bg-layer-1: #17171a;\n  --dsw-alias-bg-layer-2: #1e1e22;\n  --dsw-alias-bg-layer-3: #26262b;\n  --dsw-alias-bg-overlay: #27272c;\n  --dsw-alias-border-l1: rgba(255, 255, 255, 0.07);\n  --dsw-alias-border-l2: rgba(255, 255, 255, 0.14);\n  --dsw-alias-label-primary: #ededf0;\n  --dsw-alias-label-secondary: #a2a2ab;\n  --dsw-alias-label-tertiary: #82828c;\n  --dsw-alias-brand-primary: #b9bdc8;\n  --dsw-alias-brand-text: #101012;\n  --dsw-alias-button-primary-hover: #d2d5de;\n  --dsw-alias-button-primary-dimmed: #26262b;\n  --dsw-alias-state-business-primary: #b9bdc8;\n  --dsw-alias-state-business-tertiary: #26262b;\n  --dsw-alias-interactive-bg-hover: rgba(255, 255, 255, 0.08);\n  --dsw-alias-interactive-bg-active: rgba(255, 255, 255, 0.14);\n  --dsw-alias-markdown-code-block: #141417;\n  --dsw-alias-markdown-inline-code: #1e1e22;\n  --dsw-specific-sidebar-fill: #141417;\n  --dsw-specific-sidebar-nav-item-active: #1e1e22;\n  --dsw-specific-sidebar-nav-item-hover: #1a1a1e;\n  --dsw-alias-scrollbar-bg-l1: #2e2e34;\n  --dsw-alias-scrollbar-bg-l2: #383840;\n  --dsw-alias-scrollbar-hover-l1: #45454e;\n  --dsw-alias-scrollbar-hover-l2: #45454e;\n  background-image: radial-gradient(ellipse at 50% 0%, rgba(185,189,200,0.1), transparent 55%), linear-gradient(170deg, #17171b 0%, #0f0f11 55%, #0a0a0c 100%);\n  background-attachment: fixed;\n  background-size: cover;\n  background-position: center;\n  background-repeat: no-repeat;\n}\nbody[data-dsh-skin-graphite] [id='root'] { background: transparent; }\n";
		function apply(ctx) {
			const body = document.body;
			body.dataset["dshSkinGraphite"] = "";
			const styleEl = document.createElement("style");
			styleEl.dataset.plugin = "@user/dsh-client-ui-skin-skin-graphite";
			styleEl.dataset.pluginCss = "@user/dsh-client-ui-skin-skin-graphite/skin";
			styleEl.textContent = CSS;
			document.head.appendChild(styleEl);
			ctx.effect(() => () => {
				delete body.dataset["dshSkinGraphite"];
				styleEl.remove();
			}, "@user/dsh-client-ui-skin-skin-graphite: palette");
		}
		exports.apply = apply;
		return module.exports;
	}
});
