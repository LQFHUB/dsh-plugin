window.__ModuleLoader__.load({
	id: "dsh-describe-image",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let react = require("react");
let react_jsx_runtime = require("react/jsx-runtime");
let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
//#region src/client/attach.ts
/**
* 上传接缝的浏览器半区：纯草稿拼接计算 + 宿主 /describe-image/attach 路由
* 的上传客户端。浏览器把选中的图片作为 base64 文本发送；宿主校验 magic
* bytes、把字节持久化到附件存储，并返回拼入输入框草稿的
* `[image attachment …]` 注记文本。图片字节绝不进入会话记录——只有注记
* 文本进入。
* @module dsh-describe-image/client/attach
*/
/** The host attach endpoint, same-origin with the web shell. */
const ATTACH_ENDPOINT = "/describe-image/attach";
/**
* Read a picked file as base64 text (no data-URL prefix).
* @param file - the file the user picked.
* @returns the base64 payload, or a structured rejection.
*/
function readFileAsBase64(file) {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onerror = () => resolve({
			ok: false,
			message: "read-failed"
		});
		reader.onload = () => {
			const result = typeof reader.result === "string" ? reader.result : "";
			const comma = result.indexOf(",");
			if (comma < 0) {
				resolve({
					ok: false,
					message: "read-failed"
				});
				return;
			}
			resolve({
				ok: true,
				base64: result.slice(comma + 1)
			});
		};
		reader.readAsDataURL(file);
	});
}
/**
* Upload base64 image bytes to the host attach route.
* @param base64 - the base64 image payload.
* @param mediaType - the declared media type (verified against magic bytes on the host).
* @param name - optional display name.
* @returns the `[image attachment …]` note text, or a structured rejection.
*/
async function uploadImageForDescribe(base64, mediaType, name) {
	let response;
	try {
		response = await fetch(ATTACH_ENDPOINT, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				data: base64,
				mediaType,
				...name === void 0 ? {} : { name }
			})
		});
	} catch {
		return {
			ok: false,
			message: "network-failed"
		};
	}
	let envelope;
	try {
		envelope = await response.json();
	} catch {
		return {
			ok: false,
			message: "bad-response"
		};
	}
	const record = envelope;
	if (typeof record !== "object" || record === null) return {
		ok: false,
		message: "bad-response"
	};
	if (record.ok === true && typeof record.value === "object" && record.value !== null) {
		const value = record.value;
		if (typeof value.note === "string" && value.note !== "") return {
			ok: true,
			note: value.note,
			markdown: typeof value.markdown === "string" ? value.markdown : value.note
		};
		return {
			ok: false,
			message: "bad-response"
		};
	}
	const message = record.error?.message;
	return {
		ok: false,
		message: typeof message === "string" && message !== "" ? message : "server-failed"
	};
}
//#endregion
//#region src/client/send-hook.ts
/**
* 发送拦截：纯文本模型在提交时拒绝图片块，因此携带草稿图片的发送被改写
* 为携带 describe-image 引用的纯文本提示。图片经宿主 attach 路由上传
* （字节留在会话记录之外）、草稿图片被释放，模型通过 describe_image 工具
* 分析它们，而不是收到它读不了的字节。
*
* 钩子就地包装 conversation 服务的 sendSession 方法：结构化（不依赖
* conversation 包的内部类型）、幂等（模块标记防止重复安装）。
* @module dsh-describe-image/client/send-hook
*/
/** Installed-marker key on the wrapped service instance. */
const HOOK_MARKER = "__dshDescribeImageSendHooked";
/**
* Wrap the conversation service so image-bearing sends route through the
* describe-image attach seam. No-op when the service surface is unavailable
* (older shell) or already wrapped.
* @param conversation - the `conversation` service instance.
*/
function installSendHook(conversation) {
	const face = conversation;
	if (face === null || typeof face !== "object") return;
	if (typeof face.sendSession !== "function") return;
	if (typeof face.draftImages !== "function" || typeof face.releaseDraftImage !== "function") return;
	if (face[HOOK_MARKER] === true) return;
	const original = face.sendSession;
	face.sendSession = async (session, text, imageIds, mode) => {
		if (imageIds.length === 0) return original.call(face, session, text, imageIds, mode);
		const attachments = face.draftImages(imageIds);
		if (attachments.length !== imageIds.length) return original.call(face, session, text, imageIds, mode);
		const refs = [];
		for (const attachment of attachments) {
			const read = await readFileAsBase64(attachment.file);
			if (!read.ok) break;
			const upload = await uploadImageForDescribe(read.base64, attachment.file.type, attachment.file.name);
			if (!upload.ok) break;
			refs.push(upload.markdown);
		}
		if (refs.length !== attachments.length) return original.call(face, session, text, imageIds, mode);
		const fullText = [text.trim(), ...refs].filter((part) => part !== "").join("\n");
		const result = await session.prompt([{
			type: "text",
			text: fullText
		}], mode);
		if (!result.ok) throw new Error(`conversation.send failed: ${result.error?.code ?? "unknown"}: ${result.error?.message ?? ""}`);
		for (const id of imageIds) face.releaseDraftImage(id);
	};
	face[HOOK_MARKER] = true;
}
//#endregion
//#region src/client/styles.ts
/**
* describe-image 设置卡的内联样式（由原 settings-card.module.css 转写）。
*
* 不使用 CSS Modules：类名带 `di-` 前缀，全部选择器挂在
* `body[data-dsh-describe-image]` 作用域下（本仓库 UI 插件契约：不污染
* 官方 UI 与其他皮肤）；`installCardStyles` 挂载 body 属性与 <style> 注入，
* 返回的 disposer 全部收回。
*
* 视觉对齐官方 ui-settings-plugins 的 PluginCard / fields CSS：同样的语义
* token、圆角、字号与状态，使本卡与内置 Shell / Agent loop / Web search
* 卡片读起来像亲兄弟。
* @module dsh-describe-image/client/styles
*/
/** 卡片样式作用域：body 属性名。 */
const BODY_ATTR = "data-dsh-describe-image";
/** 类名映射（组件引用）。 */
const S = {
	card: "di-card",
	cardOpen: "di-cardOpen",
	header: "di-header",
	headText: "di-headText",
	name: "di-name",
	description: "di-description",
	pending: "di-pending",
	chevron: "di-chevron",
	chevronOpen: "di-chevronOpen",
	body: "di-body",
	readOnly: "di-readOnly",
	notExposed: "di-notExposed",
	footer: "di-footer",
	failed: "di-failed",
	discard: "di-discard",
	save: "di-save",
	field: "di-field",
	head: "di-head",
	label: "di-label",
	badges: "di-badges",
	badge: "di-badge",
	reset: "di-reset",
	input: "di-input",
	select: "di-select",
	inputInvalid: "di-inputInvalid",
	invalid: "di-invalid",
	hint: "di-hint"
};
/** 样式文本（挂 body[data-dsh-describe-image] 作用域）。 */
const STYLE_TEXT = `body[data-dsh-describe-image] .di-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}
body[data-dsh-describe-image] .di-card:hover{border-color:var(--dsw-alias-label-dimmed)}
body[data-dsh-describe-image] .di-cardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}
body[data-dsh-describe-image] .di-header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:transparent;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}
body[data-dsh-describe-image] .di-header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
body[data-dsh-describe-image] .di-headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}
body[data-dsh-describe-image] .di-name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}
body[data-dsh-describe-image] .di-description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}
body[data-dsh-describe-image] .di-pending{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}
body[data-dsh-describe-image] .di-chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}
body[data-dsh-describe-image] .di-chevronOpen{transform:rotate(180deg)}
body[data-dsh-describe-image] .di-body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}
body[data-dsh-describe-image] .di-readOnly{color:var(--dsw-alias-label-tertiary);margin:12px 0 0;font-size:12px;line-height:1.5}
body[data-dsh-describe-image] .di-notExposed{color:var(--dsw-alias-state-warn-primary);margin:12px 0 0;font-size:12px;line-height:1.5}
body[data-dsh-describe-image] .di-footer{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}
body[data-dsh-describe-image] .di-failed{min-width:0;color:var(--dsw-alias-label-error);flex:1;margin:0;font-size:12px;line-height:1.5;text-overflow:ellipsis;overflow:hidden;white-space:nowrap}
body[data-dsh-describe-image] .di-discard,body[data-dsh-describe-image] .di-save{appearance:none;font:inherit;cursor:pointer;border:1px solid transparent;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}
body[data-dsh-describe-image] .di-discard{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:transparent}
body[data-dsh-describe-image] .di-discard:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}
body[data-dsh-describe-image] .di-save{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}
body[data-dsh-describe-image] .di-discard:disabled,body[data-dsh-describe-image] .di-save:disabled{opacity:.4;cursor:default}
body[data-dsh-describe-image] .di-discard:focus-visible,body[data-dsh-describe-image] .di-save:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
body[data-dsh-describe-image] .di-field{flex-direction:column;gap:6px;padding:12px 0;display:flex}
body[data-dsh-describe-image] .di-field+.di-field{border-top:1px solid var(--dsw-alias-border-l2)}
body[data-dsh-describe-image] .di-head{align-items:center;gap:8px;display:flex}
body[data-dsh-describe-image] .di-label{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:1.5}
body[data-dsh-describe-image] .di-badges{align-items:center;gap:8px;display:inline-flex}
body[data-dsh-describe-image] .di-badge{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}
body[data-dsh-describe-image] .di-reset{font:inherit;color:var(--dsw-alias-label-secondary);cursor:pointer;background:transparent;border:none;padding:0;font-size:12px;line-height:1.5}
body[data-dsh-describe-image] .di-reset:hover:not(:disabled){color:var(--dsw-alias-label-primary)}
body[data-dsh-describe-image] .di-reset:disabled{cursor:default}
body[data-dsh-describe-image] .di-reset:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
body[data-dsh-describe-image] .di-input,body[data-dsh-describe-image] .di-select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}
body[data-dsh-describe-image] .di-input:focus-visible,body[data-dsh-describe-image] .di-select:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
body[data-dsh-describe-image] .di-input:disabled,body[data-dsh-describe-image] .di-select:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
body[data-dsh-describe-image] .di-inputInvalid{border:1px solid var(--dsw-alias-label-error);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}
body[data-dsh-describe-image] .di-inputInvalid:focus-visible{outline:2px solid var(--dsw-alias-label-error);outline-offset:1px;border-color:var(--dsw-alias-label-error)}
body[data-dsh-describe-image] .di-invalid{color:var(--dsw-alias-label-error);margin:0;font-size:12px;line-height:1.5}
body[data-dsh-describe-image] .di-hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}
@media (prefers-reduced-motion:reduce){body[data-dsh-describe-image] .di-card,body[data-dsh-describe-image] .di-header,body[data-dsh-describe-image] .di-chevron,body[data-dsh-describe-image] .di-chevronOpen,body[data-dsh-describe-image] .di-discard,body[data-dsh-describe-image] .di-save{transition:none}}`;
/**
* 挂载卡片样式：设置 body 作用域属性 + 注入 <style>（带 plugin 标记，
* 与官方 bundle 的样式注入一致）。返回的 disposer 全部收回。
* @returns 卸载函数。
*/
function installCardStyles() {
	document.body.setAttribute(BODY_ATTR, "");
	const el = document.createElement("style");
	el.dataset.plugin = "dsh-describe-image";
	el.textContent = STYLE_TEXT;
	document.head.appendChild(el);
	return () => {
		el.remove();
		document.body.removeAttribute(BODY_ATTR);
	};
}
//#endregion
//#region src/client/PluginSettingsCard.tsx
/**
* 插件设置卡的共享外框（由参考包全家桶 shared slice 转写，CSS Modules
* 改为内联样式）：可折叠标题区（插件名 + 用途说明）、内部控件、保存/放弃
* 操作。命名空间不可用时渲染为空——未组合本插件的部署不应显示任何痕迹。
* 镜像官方 ui-plugin-config PluginCard 的自包含切片。
* @module dsh-describe-image/client/PluginSettingsCard
*/
/**
* Render one plugin settings card.
* @param props - the plugin's copy keys, its form state, and its controls.
* @returns the card, or nothing while the namespace is still loading.
*/
function PluginSettingsCard(props) {
	const [open, setOpen] = (0, react.useState)(false);
	const { state } = props;
	if (!state.available) return null;
	const title = props.t(props.titleKey);
	const description = props.t(props.descriptionKey);
	const blocked = !state.dirty || state.invalid || state.saving;
	const cardClass = open ? `${S.cardOpen} ${S.card}` : S.card;
	if (!state.exposed) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
		className: cardClass,
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
			type: "button",
			className: S.header,
			"aria-expanded": open,
			"aria-label": `${props.t(open ? "settings.collapse" : "settings.expand")}: ${title}`,
			onClick: () => {
				setOpen(!open);
			},
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: S.headText,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: S.name,
					title,
					children: title
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: S.description,
					title: description,
					children: description
				})]
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				width: "14",
				height: "14",
				viewBox: "0 0 14 14",
				fill: "none",
				xmlns: "http://www.w3.org/2000/svg",
				className: open ? `${S.chevron} ${S.chevronOpen}` : S.chevron,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z",
					fill: "currentColor"
				})
			})]
		}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: S.body,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: S.notExposed,
				role: "status",
				children: props.t("settings.notExposed")
			})
		}) : null]
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
		className: cardClass,
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
			type: "button",
			className: S.header,
			"aria-expanded": open,
			"aria-label": `${props.t(open ? "settings.collapse" : "settings.expand")}: ${title}`,
			onClick: () => {
				setOpen(!open);
			},
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: S.headText,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: S.name,
						title,
						children: title
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: S.description,
						title: description,
						children: description
					})]
				}),
				state.dirty ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: S.pending,
					title: props.t("settings.unsaved"),
					children: props.t("settings.unsaved")
				}) : null,
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
					width: "14",
					height: "14",
					viewBox: "0 0 14 14",
					fill: "none",
					xmlns: "http://www.w3.org/2000/svg",
					className: open ? `${S.chevron} ${S.chevronOpen}` : S.chevron,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z",
						fill: "currentColor"
					})
				})
			]
		}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: S.body,
			children: [
				!state.writable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: S.readOnly,
					role: "status",
					children: props.t("settings.readOnly")
				}) : null,
				props.children,
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: S.footer,
					children: [
						state.failed ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
							className: S.failed,
							role: "status",
							children: [props.t("settings.saveFailed"), state.failedReason ? " - " + state.failedReason : ""]
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: S.discard,
							disabled: !state.dirty || state.saving,
							onClick: props.onDiscard,
							children: props.t("settings.discard")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: S.save,
							disabled: blocked,
							onClick: props.onSave,
							children: props.t(!state.saving ? "settings.save" : "settings.saving")
						})
					]
				})
			]
		}) : null]
	});
}
/** A staged value field. `numeric` only hints the keypad: which drafts a field accepts is decided by its spec. */
function ValueField(props) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: S.field,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: S.head,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
					className: S.label,
					htmlFor: props.id,
					children: props.label
				}), props.overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: S.badges,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: S.badge,
						children: props.overriddenLabel
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: S.reset,
						disabled: props.disabled,
						onClick: props.onReset,
						children: props.resetLabel
					})]
				}) : null]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				id: props.id,
				className: props.invalid ? S.inputInvalid : S.input,
				type: "text",
				...props.numeric === true ? { inputMode: "numeric" } : {},
				...props.invalid ? { "aria-invalid": true } : {},
				value: props.text,
				placeholder: props.placeholder ?? "",
				disabled: props.disabled,
				onChange: (event) => {
					props.onEdit(event.target.value);
				}
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: props.invalid ? S.invalid : S.hint,
				children: props.invalid ? props.invalidLabel : props.hint
			})
		]
	});
}
/** A staged enumerated field rendered as a select. */
function ChoiceField(props) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: S.field,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: S.head,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
					className: S.label,
					htmlFor: props.id,
					children: props.label
				}), props.overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: S.badges,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: S.badge,
						children: props.overriddenLabel
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: S.reset,
						disabled: props.disabled,
						onClick: props.onReset,
						children: props.resetLabel
					})]
				}) : null]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
				id: props.id,
				className: S.select,
				value: props.text,
				disabled: props.disabled,
				onChange: (event) => {
					props.onEdit(event.target.value);
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
					value: "",
					children: props.inheritLabel
				}), props.choices.map((choice) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
					value: choice.value,
					children: choice.label
				}, choice.value))]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: props.invalid ? S.invalid : S.hint,
				children: props.invalid ? props.invalidLabel : props.hint
			})
		]
	});
}
//#endregion
//#region src/client/settings-form.ts
/** A whole- or decimal-number field. An empty draft clears the field; any other draft that is not a finite number within the constraints blocks the save. */
function numberField(field, constraints = {}) {
	const { integer = false, min } = constraints;
	return {
		field,
		format: (value) => typeof value === "number" ? String(value) : "",
		parse: (text) => {
			const trimmed = text.trim();
			if (trimmed === "") return { kind: "clear" };
			const parsed = Number(trimmed);
			if (!Number.isFinite(parsed)) return void 0;
			if (integer && !Number.isInteger(parsed)) return void 0;
			if (min !== void 0 && parsed < min) return void 0;
			return {
				kind: "set",
				value: parsed
			};
		}
	};
}
/** A free-text field. An empty draft clears the field. */
function textField(field) {
	return {
		field,
		format: (value) => typeof value === "string" ? value : "",
		parse: (text) => {
			const trimmed = text.trim();
			return trimmed === "" ? { kind: "clear" } : {
				kind: "set",
				value: trimmed
			};
		}
	};
}
/**
* A free-text field the Host treats as a secret and redacts from the read-back
* (role('secret') in the section schema). The card still edits it like text,
* but a save never compares the redacted value back and relies on the scope
* reporting the write landed.
*/
function secretField(field) {
	return {
		...textField(field),
		secret: true
	};
}
/** An enumerated string field; only the listed choices are accepted. An empty draft clears the field. */
function choiceField(field, choices) {
	return {
		field,
		format: (value) => typeof value === "string" && choices.includes(value) ? value : "",
		parse: (text) => {
			if (text === "") return { kind: "clear" };
			return choices.includes(text) ? {
				kind: "set",
				value: text
			} : void 0;
		}
	};
}
/**
* Stages one card's edits over one settings namespace and writes them on save.
*
* The Host is the only authority on whether a value was accepted — its
* validators own the constraints no schema can express — so the outcome is
* read back from the section rather than predicted here. A save that did not
* land keeps its drafts, so the user can correct them instead of retyping.
*/
var CardForm = class {
	scope;
	specs;
	staged = /* @__PURE__ */ new Map();
	listeners = /* @__PURE__ */ new Set();
	saving = false;
	failed = false;
	failedReason;
	/** @param scope - the bound settings scope for this card's namespace. */
	constructor(scope, specs) {
		this.scope = scope;
		this.specs = new Map(specs.map((spec) => [spec.field, spec]));
		scope.subscribe(() => {
			this.publish();
		});
	}
	/** Publish a projection of this form, rebuilt whenever the scope or a draft changes. */
	bind(project) {
		const store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)(project());
		this.listeners.add(() => {
			store.set(project());
		});
		return store;
	}
	/** Read the card-level state: what the Host serves, and what a save would do. */
	shell() {
		const snapshot = this.scope.getSnapshot();
		const plan = this.plan();
		return {
			available: snapshot.status !== "loading",
			exposed: snapshot.status === "ready",
			writable: snapshot.writable,
			dirty: plan.length > 0,
			invalid: plan.some((item) => item.run === void 0),
			saving: this.saving,
			failed: this.failed,
			...this.failedReason === void 0 ? {} : { failedReason: this.failedReason }
		};
	}
	/** Read one field's state from the effective section and its staged draft. */
	field(field) {
		const spec = this.specOf(field);
		const staged = this.staged.get(field);
		if (staged === void 0) return {
			text: spec.format(this.sectionValue(field)),
			overridden: this.stored(field),
			invalid: false
		};
		const write = staged.clear ? { kind: "clear" } : spec.parse(staged.text);
		return {
			text: staged.text,
			overridden: write?.kind === "set",
			invalid: write === void 0
		};
	}
	/** The actions the card's slot registration injects. */
	actions() {
		return {
			edit: (field, text) => {
				this.stage(field, {
					text,
					clear: false
				});
			},
			resetField: (field) => {
				this.stage(field, {
					text: this.specOf(field).format(this.baseValue(field)),
					clear: true
				});
			},
			save: () => {
				this.save();
			},
			discard: () => {
				if (this.staged.size === 0 && !this.failed) return;
				this.staged.clear();
				this.failed = false;
				this.failedReason = void 0;
				this.publish();
			}
		};
	}
	/**
	* Write every staged edit, then re-seed from what the Host accepted.
	*
	* When the scope carries the optional batch surface (the dsh-web-ui
	* bridge scope), every planned write rides one mutation so cross-field
	* validate hooks (baseURL+model) judge the batch as a unit instead of
	* deadlocking on per-field writes. Otherwise the per-field loop runs.
	* A field lands only when the Host reports it held the staged value; a
	* landed field's draft is dropped, a failed one stays staged for the user.
	* @returns settlement after every write and the read-back.
	*/
	async save() {
		const plan = this.plan();
		const valid = plan.filter((item) => item.run !== void 0);
		if (plan.length === 0 || this.saving || valid.length !== plan.length) return;
		const plannedWrites = valid.map((item) => item.op);
		const fields = new Set(plan.map((item) => item.field));
		this.saving = true;
		this.failed = false;
		this.failedReason = void 0;
		this.publish();
		const landed = /* @__PURE__ */ new Set();
		const batch = this.batchedScope();
		if (batch !== void 0) {
			const result = await batch.mutate(plannedWrites);
			if (result.ok) {
				for (const field of result.fields) if (field.landed) landed.add(field.field);
			} else this.failedReason = result.message;
		} else for (const item of valid) if (await item.run()) landed.add(item.field);
		for (const field of fields) if (landed.has(field)) this.staged.delete(field);
		this.saving = false;
		this.failed = landed.size !== fields.size;
		this.publish();
	}
	/** The scope's batch surface when it supports one; undefined conservatively otherwise. */
	batchedScope() {
		const candidate = this.scope;
		return typeof candidate?.mutate === "function" ? candidate : void 0;
	}
	/**
	* Every staged edit a save would write. An entry whose draft is not a value
	* its field accepts carries no write: the form is still dirty, and the save
	* refuses rather than dropping the edit. A staged edit that matches the
	* effective section is not a write at all.
	* @returns the planned writes, in the order the fields were staged.
	*/
	plan() {
		const plan = [];
		for (const [field, staged] of this.staged) {
			const spec = this.specOf(field);
			if (staged.clear) {
				if (this.stored(field)) plan.push({
					field,
					op: {
						field,
						op: "unset"
					},
					run: () => this.clear(field)
				});
				continue;
			}
			if (staged.text === spec.format(this.sectionValue(field))) continue;
			const write = spec.parse(staged.text);
			if (write === void 0) plan.push({
				field,
				op: {
					field,
					op: "unset"
				},
				run: void 0
			});
			else if (write.kind === "clear") plan.push({
				field,
				op: {
					field,
					op: "unset"
				},
				run: () => this.clear(field)
			});
			else plan.push({
				field,
				op: {
					field,
					op: "set",
					value: write.value
				},
				run: () => this.store(field, write.value)
			});
		}
		return plan;
	}
	async clear(field) {
		await this.scope.unset(field);
		return !this.stored(field);
	}
	async store(field, value) {
		await this.scope.set(field, value);
		if (this.specOf(field).secret) return true;
		return this.userLayer()?.[field] === value;
	}
	stage(field, edit) {
		this.staged.set(field, edit);
		this.failed = false;
		this.failedReason = void 0;
		this.publish();
	}
	specOf(field) {
		const spec = this.specs.get(field);
		if (spec === void 0) throw new Error(`settings card has no field ${field}`);
		return spec;
	}
	snapshotOf() {
		return this.scope.getSnapshot();
	}
	sectionValue(field) {
		return this.snapshotOf().value?.[field];
	}
	baseValue(field) {
		return this.snapshotOf().base?.[field];
	}
	userLayer() {
		return this.snapshotOf().user;
	}
	stored(field) {
		const user = this.userLayer();
		return user !== void 0 && Object.hasOwn(user, field);
	}
	publish() {
		for (const listener of this.listeners) listener();
	}
};
//#endregion
//#region src/client/locales.ts
/** `describe-image` 浏览器半区的命名空间词典（设置卡文案）。 */
/** 简体中文词典（键集合的源）。 */
const zh = {
	"attach.button.title": "插入图片引用（describe-image 图像理解）",
	"attach.button.aria": "插入图片引用，交给 describe_image 工具分析",
	"attach.uploading": "上传中…",
	"attach.success": "图片引用已插入输入框；发送后文本模型可通过 describe_image 分析这张图片。",
	"attach.error.read": "无法读取所选图片文件。",
	"attach.error.type": "不支持的图片类型，仅接受 PNG / JPEG / GIF / WebP。",
	"attach.error.size": "图片超过 10 MB 上限。",
	"attach.error.noSession": "当前没有可用会话，无法插入图片引用。",
	"attach.error.upload": "上传失败：{error}",
	"card.title": "图像理解",
	"card.description": "describe_image 工具所调用的视觉语言端点。",
	"settings.expand": "展开设置",
	"settings.collapse": "收起设置",
	"settings.notExposed": "当前部署未暴露此命名空间，无法在此编辑；请在挂载配置中填写端点。",
	"settings.unsaved": "有未保存的修改",
	"settings.readOnly": "当前部署的设置为只读。",
	"settings.saveFailed": "保存失败，请重试。",
	"settings.discard": "放弃修改",
	"settings.save": "保存",
	"settings.saving": "保存中…",
	"settings.overridden": "已覆盖",
	"settings.reset": "重置",
	"settings.inherit": "继承",
	"settings.invalidNumber": "需要有效的数字",
	"field.baseURL": "接口地址",
	"field.baseURL.hint": "OpenAI 兼容根地址；按协议追加 /chat/completions 或 /responses。",
	"field.model": "模型",
	"field.model.hint": "该端点提供的视觉模型 id。",
	"field.apiStyle": "接口协议",
	"field.apiStyle.hint": "chat-completions 走 /chat/completions，responses 走 /responses。",
	"field.apiStyle.chatCompletions": "Chat Completions",
	"field.apiStyle.responses": "Responses",
	"field.apiKey": "API Key",
	"field.apiKey.hint": "不写入设置文件。留空表示保持当前密钥。",
	"field.apiKeyEnv": "密钥环境变量",
	"field.apiKeyEnv.hint": "凭证服务解析该环境变量名；空字符串禁用。",
	"field.defaultPrompt": "默认指令",
	"field.defaultPrompt.hint": "调用未带 prompt 参数时的默认指令。",
	"field.maxBytes": "图片字节上限",
	"field.maxBytes.hint": "本地文件与下载一致的字节上限。",
	"field.maxOutputTokens": "输出 token 上限",
	"field.maxOutputTokens.hint": "发给端点的 max_tokens（responses 协议为 max_output_tokens）。",
	"field.timeoutMs": "超时（毫秒）",
	"field.timeoutMs.hint": "单次视觉请求超时。"
};
/** The two dictionaries, keyed by language. */
const dictionaries = {
	zh,
	en: {
		"attach.button.title": "Insert image reference (describe-image vision)",
		"attach.button.aria": "Insert an image reference for the describe_image tool",
		"attach.uploading": "Uploading…",
		"attach.success": "Image reference inserted; the text model can analyze this image via describe_image once you send the message.",
		"attach.error.read": "Could not read the selected image file.",
		"attach.error.type": "Unsupported image type; only PNG / JPEG / GIF / WebP are accepted.",
		"attach.error.size": "The image exceeds the 10 MB bound.",
		"attach.error.noSession": "No active session; cannot insert an image reference.",
		"attach.error.upload": "Upload failed: {error}",
		"card.title": "Image understanding",
		"card.description": "The vision-language endpoint the describe_image tool calls.",
		"settings.expand": "Expand settings",
		"settings.collapse": "Collapse settings",
		"settings.notExposed": "This deployment does not expose the namespace; configure the endpoint in the mount config instead.",
		"settings.unsaved": "Unsaved changes",
		"settings.readOnly": "Settings are read-only in this deployment.",
		"settings.saveFailed": "Save failed; try again.",
		"settings.discard": "Discard",
		"settings.save": "Save",
		"settings.saving": "Saving…",
		"settings.overridden": "Overridden",
		"settings.reset": "Reset",
		"settings.inherit": "Inherit",
		"settings.invalidNumber": "A valid number is required",
		"field.baseURL": "Base URL",
		"field.baseURL.hint": "OpenAI-compatible root URL; /chat/completions or /responses is appended per the API style.",
		"field.model": "Model",
		"field.model.hint": "The vision model id this endpoint provides.",
		"field.apiStyle": "API style",
		"field.apiStyle.hint": "chat-completions posts to /chat/completions; responses posts to /responses.",
		"field.apiStyle.chatCompletions": "Chat Completions",
		"field.apiStyle.responses": "Responses",
		"field.apiKey": "API key",
		"field.apiKey.hint": "Never written to the settings file. Leave empty to keep the current key.",
		"field.apiKeyEnv": "Key environment variable",
		"field.apiKeyEnv.hint": "Resolved through the credential service; empty disables it.",
		"field.defaultPrompt": "Default instruction",
		"field.defaultPrompt.hint": "Used when a call omits its prompt parameter.",
		"field.maxBytes": "Max image bytes",
		"field.maxBytes.hint": "Byte bound for local files and downloads alike.",
		"field.maxOutputTokens": "Max output tokens",
		"field.maxOutputTokens.hint": "The max_tokens sent to the endpoint (max_output_tokens under the responses style).",
		"field.timeoutMs": "Timeout (ms)",
		"field.timeoutMs.hint": "Per-call vision request timeout."
	}
};
/** Current UI language, mirrored from the shell (defaults to zh). */
let currentLanguage = "zh";
/** Switch the client copy language. */
function setLanguage(language) {
	currentLanguage = language;
}
/** Format a `{name}` template with values. */
function format(template, params) {
	return template.replace(/\{([a-zA-Z0-9]+)\}/g, (match, name) => name in params ? String(params[name]) : match);
}
/** Translate one key; falls back to the zh dictionary for unknown keys. */
function t(key, params) {
	const template = (dictionaries[currentLanguage] ?? zh)[key] ?? zh[key];
	return params === void 0 ? template : format(template, params);
}
//#endregion
//#region src/client/DescribeImageSettingsCard.tsx
/** Bridges the `describe-image` scope onto the card's staged form. */
var DescribeImageSettingsCardController = class {
	form;
	store;
	/** @param scope - the bound settings scope for the `describe-image` namespace. */
	constructor(scope) {
		this.form = new CardForm(scope, [
			textField("baseURL"),
			textField("model"),
			choiceField("apiStyle", ["chat-completions", "responses"]),
			secretField("apiKey"),
			textField("apiKeyEnv"),
			textField("defaultPrompt"),
			numberField("maxBytes"),
			numberField("maxOutputTokens"),
			numberField("timeoutMs")
		]);
		this.store = this.form.bind(() => this.projection());
	}
	projection() {
		return {
			...this.form.shell(),
			baseURL: this.form.field("baseURL"),
			model: this.form.field("model"),
			apiStyle: this.form.field("apiStyle"),
			apiKey: this.form.field("apiKey"),
			apiKeyEnv: this.form.field("apiKeyEnv"),
			defaultPrompt: this.form.field("defaultPrompt"),
			maxBytes: this.form.field("maxBytes"),
			maxOutputTokens: this.form.field("maxOutputTokens"),
			timeoutMs: this.form.field("timeoutMs")
		};
	}
	/**
	* Build the face the card's slot registration injects.
	* @returns the card's snapshot and its form actions.
	*/
	inject() {
		return {
			hooks: { describeImageSettingsCard: this.store },
			...this.form.actions()
		};
	}
};
/**
* Render the describe-image card.
* @param props - the card snapshot and its form actions.
* @returns the card.
*/
function DescribeImageSettingsCard(props) {
	const state = props.useDescribeImageSettingsCard((snapshot) => snapshot);
	const disabled = !state.writable;
	const fieldProps = {
		overriddenLabel: t("settings.overridden"),
		resetLabel: t("settings.reset"),
		invalidLabel: t("settings.invalidNumber"),
		disabled
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(PluginSettingsCard, {
		t,
		titleKey: "card.title",
		descriptionKey: "card.description",
		state,
		onSave: props.save,
		onDiscard: props.discard,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
				id: "settings-describe-image-baseurl",
				label: t("field.baseURL"),
				hint: t("field.baseURL.hint"),
				placeholder: "https://api.example.com/v1",
				...fieldProps,
				...state.baseURL,
				onEdit: (text) => {
					props.edit("baseURL", text);
				},
				onReset: () => {
					props.resetField("baseURL");
				}
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
				id: "settings-describe-image-model",
				label: t("field.model"),
				hint: t("field.model.hint"),
				...fieldProps,
				...state.model,
				onEdit: (text) => {
					props.edit("model", text);
				},
				onReset: () => {
					props.resetField("model");
				}
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChoiceField, {
				id: "settings-describe-image-apistyle",
				label: t("field.apiStyle"),
				hint: t("field.apiStyle.hint"),
				inheritLabel: t("settings.inherit"),
				choices: [{
					value: "chat-completions",
					label: t("field.apiStyle.chatCompletions")
				}, {
					value: "responses",
					label: t("field.apiStyle.responses")
				}],
				...fieldProps,
				...state.apiStyle,
				onEdit: (text) => {
					props.edit("apiStyle", text);
				},
				onReset: () => {
					props.resetField("apiStyle");
				}
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
				id: "settings-describe-image-apikey",
				label: t("field.apiKey"),
				hint: t("field.apiKey.hint"),
				...fieldProps,
				...state.apiKey,
				onEdit: (text) => {
					props.edit("apiKey", text);
				},
				onReset: () => {
					props.resetField("apiKey");
				}
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
				id: "settings-describe-image-apikeyenv",
				label: t("field.apiKeyEnv"),
				hint: t("field.apiKeyEnv.hint"),
				...fieldProps,
				...state.apiKeyEnv,
				onEdit: (text) => {
					props.edit("apiKeyEnv", text);
				},
				onReset: () => {
					props.resetField("apiKeyEnv");
				}
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
				id: "settings-describe-image-defaultprompt",
				label: t("field.defaultPrompt"),
				hint: t("field.defaultPrompt.hint"),
				...fieldProps,
				...state.defaultPrompt,
				onEdit: (text) => {
					props.edit("defaultPrompt", text);
				},
				onReset: () => {
					props.resetField("defaultPrompt");
				}
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
				id: "settings-describe-image-maxbytes",
				label: t("field.maxBytes"),
				hint: t("field.maxBytes.hint"),
				numeric: true,
				...fieldProps,
				...state.maxBytes,
				onEdit: (text) => {
					props.edit("maxBytes", text);
				},
				onReset: () => {
					props.resetField("maxBytes");
				}
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
				id: "settings-describe-image-maxoutputtokens",
				label: t("field.maxOutputTokens"),
				hint: t("field.maxOutputTokens.hint"),
				numeric: true,
				...fieldProps,
				...state.maxOutputTokens,
				onEdit: (text) => {
					props.edit("maxOutputTokens", text);
				},
				onReset: () => {
					props.resetField("maxOutputTokens");
				}
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
				id: "settings-describe-image-timeoutms",
				label: t("field.timeoutMs"),
				hint: t("field.timeoutMs.hint"),
				numeric: true,
				...fieldProps,
				...state.timeoutMs,
				onEdit: (text) => {
					props.edit("timeoutMs", text);
				},
				onReset: () => {
					props.resetField("timeoutMs");
				}
			})
		]
	});
}
//#endregion
//#region src/client/settings-scope.ts
/**
* 直连 /describe-image/settings 的设置作用域。初始状态 loading，首次
* GET 成功后 ready；路由不可达/未暴露答 unavailable（卡片显示说明而非
* 表单）。
*/
var DescribeImageSettingsScope = class {
	endpoint;
	snapshot = {
		status: "loading",
		value: void 0,
		base: void 0,
		user: void 0,
		revision: void 0,
		writable: false,
		mode: "host"
	};
	listeners = /* @__PURE__ */ new Set();
	tail = Promise.resolve();
	/** @param endpoint - 宿主设置路由（同源）。 */
	constructor(endpoint = "/describe-image/settings") {
		this.endpoint = endpoint;
		this.refresh();
	}
	getSnapshot() {
		return this.snapshot;
	}
	subscribe(listener) {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}
	/** 写一个字段：apiKey 空值跳过（保持当前密钥）。 */
	async set(field, value) {
		if (field === "apiKey" && (value === "" || value === void 0)) return;
		await this.mutate([{
			field,
			op: "set",
			value
		}]);
	}
	/** 清除一个字段（重新继承 base）；apiKey 不支持清除（保持当前密钥）。 */
	async unset(field) {
		if (field === "apiKey") return;
		await this.mutate([{
			field,
			op: "unset"
		}]);
	}
	/** 批量写（串行：并发写按调用顺序落盘）。 */
	async mutate(writes) {
		this.tail = this.tail.then(async () => {
			try {
				const response = await fetch(this.endpoint, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ writes })
				});
				if (!response.ok) {
					this.publishUnavailable();
					return;
				}
				const envelope = await response.json();
				if (envelope.ok !== true) {
					this.publishUnavailable();
					return;
				}
				this.accept(envelope.value);
			} catch {
				this.publishUnavailable();
			}
		});
		await this.tail;
	}
	/** 拉取最新视图。 */
	async refresh() {
		try {
			const response = await fetch(this.endpoint);
			if (!response.ok) {
				this.publishUnavailable();
				return;
			}
			const envelope = await response.json();
			if (envelope.ok !== true) {
				this.publishUnavailable();
				return;
			}
			this.accept(envelope.value);
		} catch {
			this.publishUnavailable();
		}
	}
	/** 接受一个视图并发布。 */
	accept(value) {
		const view = value;
		this.snapshot = {
			status: "ready",
			value: view.value,
			base: view.base,
			user: view.user,
			revision: view.revision,
			writable: view.writable,
			mode: "host"
		};
		this.publish();
	}
	/** 命名空间不可用：发布 unavailable 快照（卡片显示未暴露说明）。 */
	publishUnavailable() {
		this.snapshot = {
			...this.snapshot,
			status: "unavailable",
			writable: false
		};
		this.publish();
	}
	publish() {
		for (const listener of [...this.listeners]) listener();
	}
};
//#endregion
//#region src/client/index.ts
/** 浏览器半区的 locale 命名空间。 */
const NS = "describe-image";
/** 所需服务：slots（设置卡）、conversation（发送改写）、locale（卡片文案）。 */
const inject = [
	"slots",
	"conversation",
	"locale"
];
/** 应用浏览器半区。 */
function apply(ctx) {
	ctx.effect(installCardStyles, "dsh-describe-image: card styles");
	ctx.effect(() => ctx.locale.register(NS, dictionaries), "dsh-describe-image: dictionaries");
	ctx.effect(() => {
		const sync = () => {
			const lang = document.documentElement.lang;
			setLanguage(lang === "zh" || lang.startsWith("zh-") ? "zh" : "en");
		};
		sync();
		const observer = new MutationObserver(sync);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["lang"]
		});
		return () => observer.disconnect();
	}, "dsh-describe-image: language mirror");
	ctx.inject(["slots", "conversation"], (scope) => {
		const conversation = scope.conversation;
		const slots = scope.slots;
		installSendHook(conversation);
		const settingsCard = new DescribeImageSettingsCardController(new DescribeImageSettingsScope());
		slots.inject("settings.plugin.item", () => slots.register({
			name: "settings.plugin.item",
			id: "describe-image",
			order: 40,
			locale: NS,
			inject: () => settingsCard.inject()
		}, DescribeImageSettingsCard));
	});
}
//#endregion
exports.NS = NS;
exports.apply = apply;
exports.inject = inject;


		return module.exports;
	}
});
