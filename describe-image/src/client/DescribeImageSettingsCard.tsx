/**
 * 「图像理解」设置卡：只提供「可用视觉模型」下拉——模型来自 DSH 模型设置
 * （设置 > 模型），端点、密钥、协议全部复用模型设置，用户无需配置任何
 * 参数。注册进官方 `settings.plugin.item` 槽位（Web GUI 插件配置页渲染），
 * 绑定到 `describe-image` 设置命名空间。
 * @module dsh-describe-image/client/DescribeImageSettingsCard
 */

import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope, SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import { useEffect, useState } from 'react'
import { PluginSettingsCard } from './PluginSettingsCard.tsx'
import { CardForm, booleanField, textField, type CardActions, type CardShell, type FieldState as CardFieldState } from './settings-form.ts'
import { t } from './locales.ts'
import { S as css } from './styles.ts'

/** The describe-image fields this card edits (the namespace's full schema). */
export interface DescribeImageSettings {
  baseURL?: string
  model?: string
  apiKey?: string
  apiKeyEnv?: string
  defaultPrompt?: string
  maxBytes?: number
  maxOutputTokens?: number
  timeoutMs?: number
  apiStyle?: 'chat-completions' | 'responses'
  /** 复用 DSH 模型设置（设置 > 模型）中已配置的视觉模型。 */
  useConfiguredModel?: boolean
  /** 已配置模型所在 provider（llm 可配置 provider 名）。 */
  configuredProvider?: string
  /** 已配置模型中选中的视觉模型 id。 */
  configuredModelId?: string
}

/** What the describe-image card renders. */
export interface DescribeImageSettingsCardState extends CardShell {
  /** 隐藏字段：保存恒写 true（卡片只支持已配置模型）。 */
  useConfiguredModel: CardFieldState
  configuredProvider: CardFieldState
  configuredModelId: CardFieldState
}

/** The registration-side face the card's slot entry injects. */
export interface DescribeImageSettingsCardFace extends CardActions {
  hooks: {
    /** Card snapshot bound by the renderer as useDescribeImageSettingsCard. */
    describeImageSettingsCard: SnapshotStore<DescribeImageSettingsCardState>
  }
}

/** Bridges the `describe-image` scope onto the card's staged form. */
export class DescribeImageSettingsCardController {
  private readonly form: CardForm<DescribeImageSettings>
  private readonly store: SnapshotStore<DescribeImageSettingsCardState>

  /** @param scope - the bound settings scope for the `describe-image` namespace. */
  constructor(scope: SettingsScope<DescribeImageSettings>) {
    this.form = new CardForm(scope, [
      booleanField('useConfiguredModel'),
      textField('configuredProvider'),
      textField('configuredModelId'),
    ])
    this.store = this.form.bind(() => this.projection())
  }

  private projection(): DescribeImageSettingsCardState {
    return {
      ...this.form.shell(),
      useConfiguredModel: this.form.field('useConfiguredModel'),
      configuredProvider: this.form.field('configuredProvider'),
      configuredModelId: this.form.field('configuredModelId'),
    }
  }

  /**
   * Build the face the card's slot registration injects. 保存始终把
   * useConfiguredModel 置 true（隐藏写入：卡片只支持已配置模型，兼容历史
   * 上切到过「自定义端点」的旧配置）。
   * @returns the card's snapshot and its form actions.
   */
  inject(): DescribeImageSettingsCardFace {
    const actions = this.form.actions()
    return {
      hooks: { describeImageSettingsCard: this.store },
      ...actions,
      save: () => {
        actions.edit('useConfiguredModel', 'true')
        actions.save()
      },
    }
  }
}

/** Props the renderer binds for the describe-image card. */
export type DescribeImageSettingsCardProps =
  PropsRuntime<'settings.plugin.item'>
  & InjectFace<DescribeImageSettingsCardFace>

/** 可用视觉模型条目（GET /describe-image/models）。 */
interface AvailableVisionModel {
  provider: string
  providerName: string
  model: string
  modelName: string
}

/**
 * 「使用已配置模型」的选择器：拉取模型设置中可用视觉模型列表，选中即
 * 填充 provider 与模型两个字段。加载失败 / 空列表渲染说明文案。
 */
export function ConfiguredModelPicker(props: {
  disabled: boolean
  selectedProvider: string
  selectedModel: string
  onPick: (provider: string, model: string) => void
}) {
  const [models, setModels] = useState<AvailableVisionModel[] | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    fetch('/describe-image/models')
      .then(response => response.json())
      .then((envelope: { ok?: unknown; value?: { models?: AvailableVisionModel[] } }) => {
        if (!alive) return
        if (envelope.ok === true && Array.isArray(envelope.value?.models)) setModels(envelope.value!.models)
        else setFailed(true)
      })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [])
  let body
  if (failed) {
    body = <p className={css.hint}>{t('configured.picker.failed')}</p>
  } else if (models === null) {
    body = <p className={css.hint}>{t('settings.saving')}</p>
  } else if (models.length === 0) {
    body = <p className={css.hint}>{t('configured.picker.empty')}</p>
  } else {
    const selected = props.selectedProvider && props.selectedModel
      ? `${props.selectedProvider}\u0000${props.selectedModel}`
      : ''
    body = (
      <select
        id="settings-describe-image-configured-picker"
        className={css.select}
        disabled={props.disabled}
        value={selected}
        onChange={(event) => {
          const [provider, model] = event.target.value.split('\u0000')
          if (provider && model) props.onPick(provider, model)
        }}
      >
        <option value="">{t('configured.picker.placeholder')}</option>
        {models.map(entry => (
          <option key={`${entry.provider}\u0000${entry.model}`} value={`${entry.provider}\u0000${entry.model}`}>
            {entry.providerName} / {entry.modelName}（{entry.provider} / {entry.model}）
          </option>
        ))}
      </select>
    )
  }
  return (
    <div className={css.field}>
      <div className={css.head}>
        <span className={css.label}>{t('configured.picker.title')}</span>
      </div>
      {body}
    </div>
  )
}

/**
 * Render the describe-image card: 只显示「可用视觉模型」下拉（模型全部来自
 * DSH 模型设置，选中即保存，无其他任何参数）。
 * @param props - the card snapshot and its form actions.
 * @returns the card.
 */
export function DescribeImageSettingsCard(props: DescribeImageSettingsCardProps) {
  const state = props.useDescribeImageSettingsCard(snapshot => snapshot)
  const disabled = !state.writable
  return (
    <PluginSettingsCard
      t={t}
      titleKey="card.title"
      descriptionKey="card.description"
      state={state}
      onSave={props.save}
      onDiscard={props.discard}
    >
      <ConfiguredModelPicker
        disabled={disabled}
        selectedProvider={state.configuredProvider.text}
        selectedModel={state.configuredModelId.text}
        onPick={(provider, model) => {
          props.edit('configuredProvider', provider)
          props.edit('configuredModelId', model)
        }}
      />
      <p className={css.hint}>{t('configured.picker.usesConfigured')}</p>
    </PluginSettingsCard>
  )
}
