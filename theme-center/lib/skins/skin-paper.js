window.__ModuleLoader__.load({
	id: "@user/dsh-client-ui-skin-skin-paper",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		/** 暖纸 —— 固定色系皮肤（alias-only，源自 KinGao294/dsh-skin，MIT）。
		 * 亮暗同值：颜色自洽（bg/label/border/brand 全套覆盖），不随亮暗切换。 */
		const CSS = "/* \u6696\u7eb8 \u2014\u2014 \u6e10\u53d8 + \u6bdb\u73bb\u7483\uff08alias-only\uff0c\u6e90\u81ea KinGao294/dsh-skin\uff0cMIT\uff09\u3002 */\nbody[data-dsh-skin-paper] {\n  --dsw-alias-bg-base: #faf7f1;\n  --dsw-alias-bg-layer-1: rgba(255, 255, 255, 0.75);\n  --dsw-alias-bg-layer-2: rgba(244, 239, 229, 0.68);\n  --dsw-alias-bg-layer-3: rgba(235, 227, 212, 0.6);\n  --dsw-alias-bg-overlay: rgba(255, 253, 248, 0.7);\n  --dsw-alias-border-l1: rgba(120, 96, 48, 0.1);\n  --dsw-alias-border-l2: rgba(120, 96, 48, 0.18);\n  --dsw-alias-label-primary: #2e2a22;\n  --dsw-alias-label-secondary: #6f675a;\n  --dsw-alias-label-tertiary: #8e8578;\n  --dsw-alias-brand-primary: #b45309;\n  --dsw-alias-brand-text: #ffffff;\n  --dsw-alias-button-primary-hover: #d97706;\n  --dsw-alias-button-primary-dimmed: #f4efe5;\n  --dsw-alias-state-business-primary: #b45309;\n  --dsw-alias-state-business-tertiary: #f4efe5;\n  --dsw-alias-interactive-bg-hover: rgba(180, 83, 9, 0.08);\n  --dsw-alias-interactive-bg-active: rgba(180, 83, 9, 0.14);\n  --dsw-alias-markdown-code-block: #f4efe5;\n  --dsw-alias-markdown-inline-code: #f0e9da;\n  --dsw-specific-sidebar-fill: #f4efe5;\n  --dsw-specific-sidebar-nav-item-active: #ebe3d4;\n  --dsw-specific-sidebar-nav-item-hover: #eee7d8;\n  --dsw-alias-scrollbar-bg-l1: #e0d6c2;\n  --dsw-alias-scrollbar-bg-l2: #d8ccb4;\n  --dsw-alias-scrollbar-hover-l1: #cdbfa3;\n  --dsw-alias-scrollbar-hover-l2: #cdbfa3;\n  background-image: radial-gradient(ellipse at 50% 0%, rgba(180,83,9,0.12), transparent 55%), radial-gradient(circle at 85% 20%, rgba(217,119,6,0.07), transparent 42%), linear-gradient(165deg, #fdfbf6 0%, #faf7f1 55%, #f2ecdf 100%);\n  background-attachment: fixed;\n  background-size: cover;\n  background-position: center;\n  background-repeat: no-repeat;\n}\nbody[data-dsh-skin-paper] [id='root'] { background: transparent; backdrop-filter: blur(20px) saturate(1.15); -webkit-backdrop-filter: blur(20px) saturate(1.15); }\nbody[data-dsh-skin-paper] .VOzbGW_panel { background: var(--dsw-alias-bg-base); }\n";
		function apply(ctx) {
			const body = document.body;
			body.dataset["dshSkinPaper"] = "";
			const styleEl = document.createElement("style");
			styleEl.dataset.plugin = "@user/dsh-client-ui-skin-skin-paper";
			styleEl.dataset.pluginCss = "@user/dsh-client-ui-skin-skin-paper/skin";
			styleEl.textContent = CSS;
			document.head.appendChild(styleEl);
			ctx.effect(() => () => {
				delete body.dataset["dshSkinPaper"];
				styleEl.remove();
			}, "@user/dsh-client-ui-skin-skin-paper: palette");
		}
		exports.apply = apply;
		return module.exports;
	}
});
