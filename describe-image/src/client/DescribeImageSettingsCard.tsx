/**
 * 「图像理解」设置卡：视觉端点（接口地址、模型、密钥引用）、默认指令与
 * 各项调用上限。注册进官方 `settings.plugin.item` 槽位（Web GUI 插件配置
 * 页渲染），绑定到 `describe-image` 设置命名空间。
 * @module dsh-describe-image/client/DescribeImageSettingsCard
 */

import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope, SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import { useEffect, useState } from 'react'
import { PluginSettingsCard, ChoiceField, ValueField } from './PluginSettingsCard.tsx'
import { CardForm, choiceField, numberField, secretField, textField, type CardActions, type CardShell, type FieldState as CardFieldState } from './settings-form.ts'
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
  baseURL: CardFieldState
  model: CardFieldState
  apiKey: CardFieldState
  apiKeyEnv: CardFieldState
  defaultPrompt: CardFieldState
  maxBytes: CardFieldState
  maxOutputTokens: CardFieldState
  timeoutMs: CardFieldState
  apiStyle: CardFieldState
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
      choiceField('useConfiguredModel', ['false', 'true']),
      textField('configuredProvider'),
      textField('configuredModelId'),
      textField('baseURL'),
      textField('model'),
      choiceField('apiStyle', ['chat-completions', 'responses']),
      secretField('apiKey'),
      textField('apiKeyEnv'),
      textField('defaultPrompt'),
      numberField('maxBytes'),
      numberField('maxOutputTokens'),
      numberField('timeoutMs'),
    ])
    this.store = this.form.bind(() => this.projection())
  }

  private projection(): DescribeImageSettingsCardState {
    return {
      ...this.form.shell(),
      baseURL: this.form.field('baseURL'),
      model: this.form.field('model'),
      apiStyle: this.form.field('apiStyle'),
      apiKey: this.form.field('apiKey'),
      apiKeyEnv: this.form.field('apiKeyEnv'),
      defaultPrompt: this.form.field('defaultPrompt'),
      maxBytes: this.form.field('maxBytes'),
      maxOutputTokens: this.form.field('maxOutputTokens'),
      timeoutMs: this.form.field('timeoutMs'),
      useConfiguredModel: this.form.field('useConfiguredModel'),
      configuredProvider: this.form.field('configuredProvider'),
      configuredModelId: this.form.field('configuredModelId'),
    }
  }

  /**
   * Build the face the card's slot registration injects.
   * @returns the card's snapshot and its form actions.
   */
  inject(): DescribeImageSettingsCardFace {
    return { hooks: { describeImageSettingsCard: this.store }, ...this.form.actions() }
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
    body = (
      <select
        id="settings-describe-image-configured-picker"
        className={css.select}
        disabled={props.disabled}
        value=""
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
 * Render the describe-image card.
 * @param props - the card snapshot and its form actions.
 * @returns the card.
 */
export function DescribeImageSettingsCard(props: DescribeImageSettingsCardProps) {
  const state = props.useDescribeImageSettingsCard(snapshot => snapshot)
  const disabled = !state.writable
  const usingConfigured = state.useConfiguredModel.text === 'true'
  const fieldProps = {
    overriddenLabel: t('settings.overridden'),
    resetLabel: t('settings.reset'),
    invalidLabel: t('settings.invalidNumber'),
    disabled,
  }
  return (
    <PluginSettingsCard
      t={t}
      titleKey="card.title"
      descriptionKey="card.description"
      state={state}
      onSave={props.save}
      onDiscard={props.discard}
    >
      <ChoiceField
        id="settings-describe-image-source"
        label={t('field.useConfiguredModel')}
        hint={t('field.useConfiguredModel.hint')}
        inheritLabel={t('settings.inherit')}
        choices={[
          { value: 'false', label: t('field.useConfiguredModel.plugin') },
          { value: 'true', label: t('field.useConfiguredModel.configured') },
        ]}
        {...fieldProps}
        {...state.useConfiguredModel}
        onEdit={(text) => { props.edit('useConfiguredModel', text) }}
        onReset={() => { props.resetField('useConfiguredModel') }}
      />
      {usingConfigured
        ? (
          <>
            <ConfiguredModelPicker
              disabled={disabled}
              onPick={(provider, model) => {
                props.edit('configuredProvider', provider)
                props.edit('configuredModelId', model)
              }}
            />
            <ValueField
              id="settings-describe-image-configuredprovider"
              label={t('field.configuredProvider')}
              hint={t('field.configuredProvider.hint')}
              {...fieldProps}
              {...state.configuredProvider}
              onEdit={(text) => { props.edit('configuredProvider', text) }}
              onReset={() => { props.resetField('configuredProvider') }}
            />
            <ValueField
              id="settings-describe-image-configuredmodelid"
              label={t('field.configuredModelId')}
              hint={t('field.configuredModelId.hint')}
              {...fieldProps}
              {...state.configuredModelId}
              onEdit={(text) => { props.edit('configuredModelId', text) }}
              onReset={() => { props.resetField('configuredModelId') }}
            />
          </>
        )
        : null}
      <ValueField
        id="settings-describe-image-baseurl"
        label={t('field.baseURL')}
        hint={t('field.baseURL.hint')}
        placeholder="https://api.example.com/v1"
        {...fieldProps}
        {...state.baseURL}
        onEdit={(text) => { props.edit('baseURL', text) }}
        onReset={() => { props.resetField('baseURL') }}
      />
      <ValueField
        id="settings-describe-image-model"
        label={t('field.model')}
        hint={t('field.model.hint')}
        {...fieldProps}
        {...state.model}
        onEdit={(text) => { props.edit('model', text) }}
        onReset={() => { props.resetField('model') }}
      />
      <ChoiceField
        id="settings-describe-image-apistyle"
        label={t('field.apiStyle')}
        hint={t('field.apiStyle.hint')}
        inheritLabel={t('settings.inherit')}
        choices={[
          { value: 'chat-completions', label: t('field.apiStyle.chatCompletions') },
          { value: 'responses', label: t('field.apiStyle.responses') },
        ]}
        {...fieldProps}
        {...state.apiStyle}
        onEdit={(text) => { props.edit('apiStyle', text) }}
        onReset={() => { props.resetField('apiStyle') }}
      />
      <ValueField
        id="settings-describe-image-apikey"
        label={t('field.apiKey')}
        hint={t('field.apiKey.hint')}
        {...fieldProps}
        {...state.apiKey}
        onEdit={(text) => { props.edit('apiKey', text) }}
        onReset={() => { props.resetField('apiKey') }}
      />
      <ValueField
        id="settings-describe-image-apikeyenv"
        label={t('field.apiKeyEnv')}
        hint={t('field.apiKeyEnv.hint')}
        {...fieldProps}
        {...state.apiKeyEnv}
        onEdit={(text) => { props.edit('apiKeyEnv', text) }}
        onReset={() => { props.resetField('apiKeyEnv') }}
      />
      <ValueField
        id="settings-describe-image-defaultprompt"
        label={t('field.defaultPrompt')}
        hint={t('field.defaultPrompt.hint')}
        {...fieldProps}
        {...state.defaultPrompt}
        onEdit={(text) => { props.edit('defaultPrompt', text) }}
        onReset={() => { props.resetField('defaultPrompt') }}
      />
      <ValueField
        id="settings-describe-image-maxbytes"
        label={t('field.maxBytes')}
        hint={t('field.maxBytes.hint')}
        numeric
        {...fieldProps}
        {...state.maxBytes}
        onEdit={(text) => { props.edit('maxBytes', text) }}
        onReset={() => { props.resetField('maxBytes') }}
      />
      <ValueField
        id="settings-describe-image-maxoutputtokens"
        label={t('field.maxOutputTokens')}
        hint={t('field.maxOutputTokens.hint')}
        numeric
        {...fieldProps}
        {...state.maxOutputTokens}
        onEdit={(text) => { props.edit('maxOutputTokens', text) }}
        onReset={() => { props.resetField('maxOutputTokens') }}
      />
      <ValueField
        id="settings-describe-image-timeoutms"
        label={t('field.timeoutMs')}
        hint={t('field.timeoutMs.hint')}
        numeric
        {...fieldProps}
        {...state.timeoutMs}
        onEdit={(text) => { props.edit('timeoutMs', text) }}
        onReset={() => { props.resetField('timeoutMs') }}
      />
    </PluginSettingsCard>
  )
}
