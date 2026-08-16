window.__ModuleLoader__.load({
	id: "@user/dsh-client-ui-skin-skin-sunset",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		/** 日落紫 —— 固定色系皮肤（alias-only，源自 KinGao294/dsh-skin，MIT）。
		 * 亮暗同值：颜色自洽（bg/label/border/brand 全套覆盖），不随亮暗切换。 */
		const CSS = "/* \u65e5\u843d\u7d2b \u2014\u2014 \u6e10\u53d8 + \u6bdb\u73bb\u7483\uff08alias-only\uff0c\u6e90\u81ea KinGao294/dsh-skin\uff0cMIT\uff09\u3002 */\nbody[data-dsh-skin-sunset] {\n  --dsw-alias-bg-base: #150f1f;\n  --dsw-alias-bg-layer-1: #1d152b;\n  --dsw-alias-bg-layer-2: #261c38;\n  --dsw-alias-bg-layer-3: #302346;\n  --dsw-alias-bg-overlay: #312548;\n  --dsw-alias-border-l1: rgba(233, 213, 255, 0.1);\n  --dsw-alias-border-l2: rgba(233, 213, 255, 0.2);\n  --dsw-alias-label-primary: #f4edfc;\n  --dsw-alias-label-secondary: #c2aee0;\n  --dsw-alias-label-tertiary: #9f8cc2;\n  --dsw-alias-brand-primary: #c084fc;\n  --dsw-alias-brand-text: #1a0f26;\n  --dsw-alias-button-primary-hover: #d4a4fd;\n  --dsw-alias-button-primary-dimmed: #261c38;\n  --dsw-alias-state-business-primary: #c084fc;\n  --dsw-alias-state-business-tertiary: #261c38;\n  --dsw-alias-interactive-bg-hover: rgba(192, 132, 252, 0.14);\n  --dsw-alias-interactive-bg-active: rgba(192, 132, 252, 0.24);\n  --dsw-alias-markdown-code-block: #181022;\n  --dsw-alias-markdown-inline-code: #261c38;\n  --dsw-specific-sidebar-fill: #181022;\n  --dsw-specific-sidebar-nav-item-active: #261c38;\n  --dsw-specific-sidebar-nav-item-hover: #1d1429;\n  --dsw-alias-scrollbar-bg-l1: #302346;\n  --dsw-alias-scrollbar-bg-l2: #3d2d5a;\n  --dsw-alias-scrollbar-hover-l1: #4a3770;\n  --dsw-alias-scrollbar-hover-l2: #4a3770;\n  background-image: radial-gradient(ellipse at 50% 0%, rgba(192,132,252,0.2), transparent 55%), radial-gradient(circle at 82% 22%, rgba(236,72,153,0.12), transparent 44%), linear-gradient(165deg, #241638 0%, #150f1f 55%, #0e0a16 100%);\n  background-attachment: fixed;\n  background-size: cover;\n  background-position: center;\n  background-repeat: no-repeat;\n}\nbody[data-dsh-skin-sunset] [id='root'] { background: transparent; }\n";
		function apply(ctx) {
			const body = document.body;
			body.dataset["dshSkinSunset"] = "";
			const styleEl = document.createElement("style");
			styleEl.dataset.plugin = "@user/dsh-client-ui-skin-skin-sunset";
			styleEl.dataset.pluginCss = "@user/dsh-client-ui-skin-skin-sunset/skin";
			styleEl.textContent = CSS;
			document.head.appendChild(styleEl);
			ctx.effect(() => () => {
				delete body.dataset["dshSkinSunset"];
				styleEl.remove();
			}, "@user/dsh-client-ui-skin-skin-sunset: palette");
		}
		exports.apply = apply;
		return module.exports;
	}
});
