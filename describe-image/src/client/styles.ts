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
export const BODY_ATTR = 'data-dsh-describe-image'

/** 类名映射（组件引用）。 */
export const S = {
  card: 'di-card',
  cardOpen: 'di-cardOpen',
  header: 'di-header',
  headText: 'di-headText',
  name: 'di-name',
  description: 'di-description',
  pending: 'di-pending',
  chevron: 'di-chevron',
  chevronOpen: 'di-chevronOpen',
  body: 'di-body',
  readOnly: 'di-readOnly',
  notExposed: 'di-notExposed',
  footer: 'di-footer',
  failed: 'di-failed',
  discard: 'di-discard',
  save: 'di-save',
  field: 'di-field',
  head: 'di-head',
  label: 'di-label',
  badges: 'di-badges',
  badge: 'di-badge',
  reset: 'di-reset',
  input: 'di-input',
  select: 'di-select',
  inputInvalid: 'di-inputInvalid',
  invalid: 'di-invalid',
  hint: 'di-hint',
} as const

/** 样式文本（挂 body[data-dsh-describe-image] 作用域）。 */
export const STYLE_TEXT = `body[data-dsh-describe-image] .di-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}
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
@media (prefers-reduced-motion:reduce){body[data-dsh-describe-image] .di-card,body[data-dsh-describe-image] .di-header,body[data-dsh-describe-image] .di-chevron,body[data-dsh-describe-image] .di-chevronOpen,body[data-dsh-describe-image] .di-discard,body[data-dsh-describe-image] .di-save{transition:none}}`

/**
 * 挂载卡片样式：设置 body 作用域属性 + 注入 <style>（带 plugin 标记，
 * 与官方 bundle 的样式注入一致）。返回的 disposer 全部收回。
 * @returns 卸载函数。
 */
export function installCardStyles(): () => void {
  document.body.setAttribute(BODY_ATTR, '')
  const el = document.createElement('style')
  el.dataset.plugin = 'dsh-describe-image'
  el.textContent = STYLE_TEXT
  document.head.appendChild(el)
  return () => {
    el.remove()
    document.body.removeAttribute(BODY_ATTR)
  }
}
