window.__ModuleLoader__.load({
	id: "@user/dsh-client-ui-skin-skin-ocean",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		/** 深海蓝 —— 固定色系皮肤（alias-only，源自 KinGao294/dsh-skin，MIT）。
		 * 亮暗同值：颜色自洽（bg/label/border/brand 全套覆盖），不随亮暗切换。 */
		const CSS = "/* \u6df1\u6d77\u84dd \u2014\u2014 alias-only \u56fa\u5b9a\u8272\u7cfb\u76ae\u80a4\uff08\u6e90\u81ea KinGao294/dsh-skin\uff0cMIT\uff09\u3002 */\nbody[data-dsh-skin-ocean] {\n  --dsw-alias-bg-base: #0a101f;\n  --dsw-alias-bg-layer-1: #101a30;\n  --dsw-alias-bg-layer-2: #16233e;\n  --dsw-alias-bg-layer-3: #1c2c4d;\n  --dsw-alias-bg-overlay: #1e2c49;\n  --dsw-alias-border-l1: rgba(148, 163, 184, 0.14);\n  --dsw-alias-border-l2: rgba(148, 163, 184, 0.26);\n  --dsw-alias-label-primary: #e9eef9;\n  --dsw-alias-label-secondary: #a5b3cc;\n  --dsw-alias-label-tertiary: #7e8da8;\n  --dsw-alias-brand-primary: #4d86f8;\n  --dsw-alias-brand-text: #ffffff;\n  --dsw-alias-button-primary-hover: #6d9dfa;\n  --dsw-alias-button-primary-dimmed: #16233e;\n  --dsw-alias-state-business-primary: #4d86f8;\n  --dsw-alias-state-business-tertiary: #16233e;\n  --dsw-alias-interactive-bg-hover: rgba(77, 134, 248, 0.12);\n  --dsw-alias-interactive-bg-active: rgba(77, 134, 248, 0.2);\n  --dsw-alias-markdown-code-block: #0d1426;\n  --dsw-alias-markdown-inline-code: #16233e;\n  --dsw-specific-sidebar-fill: #0d1426;\n  --dsw-specific-sidebar-nav-item-active: #16233e;\n  --dsw-specific-sidebar-nav-item-hover: #121c31;\n  --dsw-alias-scrollbar-bg-l1: #1c2c4d;\n  --dsw-alias-scrollbar-bg-l2: #23365e;\n  --dsw-alias-scrollbar-hover-l1: #2a3f6d;\n  --dsw-alias-scrollbar-hover-l2: #2a3f6d;\n}\n";
		function apply(ctx) {
			const body = document.body;
			body.dataset["dshSkinOcean"] = "";
			const styleEl = document.createElement("style");
			styleEl.dataset.plugin = "@user/dsh-client-ui-skin-skin-ocean";
			styleEl.dataset.pluginCss = "@user/dsh-client-ui-skin-skin-ocean/skin";
			styleEl.textContent = CSS;
			document.head.appendChild(styleEl);
			ctx.effect(() => () => {
				delete body.dataset["dshSkinOcean"];
				styleEl.remove();
			}, "@user/dsh-client-ui-skin-skin-ocean: palette");
		}
		exports.apply = apply;
		return module.exports;
	}
});
