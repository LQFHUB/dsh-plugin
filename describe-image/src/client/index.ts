/**
 * describe-image 插件 — 浏览器半区。不添加输入框自身的控件：官方输入框对
 * 纯文本模型没有图片入口，因此在提交时（installSendHook）把携带图片的发送
 * 改写为 describe-image 引用——这是纯文本模型拿到图片的方式，无需官方视觉
 * 管线。设置卡由 Web GUI 内置的「插件配置」页面渲染：本半区把「图像理解」
 * 卡注册进官方槽位 `settings.plugin.item`（与官方 bash/agent-loop 卡片同
 * 槽位，绑定到宿主侧 `describe-image` 设置命名空间）。
 *
 * 失败策略：任何 DOM/运行时装配失败只记录日志、绝不抛出——浏览器外壳在
 * 插件 apply 抛错时会中断整个启动。
 *
 * 移植自 zhu1090093659/dsh-web-ui 的 dsh-tool-describe-image（Apache-2.0）。
 * 差异：设置卡由全家桶槽位 web-ui.plugin.item 改为官方槽位 settings.plugin.item。
 * @module dsh-describe-image/client
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { installSendHook } from './send-hook.ts'
import { DescribeImageSettingsCard, DescribeImageSettingsCardController, type DescribeImageSettings } from './DescribeImageSettingsCard.tsx'
import { dictionaries, setLanguage, type DescribeImageClientKey } from './locales.ts'
import { installCardStyles } from './styles.ts'
import { DescribeImageSettingsScope } from './settings-scope.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** describe-image 卡片文案。 */
    'describe-image': DescribeImageClientKey
  }

  interface SlotMap {
    /**
     * 官方「插件配置」页内的一张插件卡片（settings.plugin.item 槽位，
     * 与 bash/agent-loop 卡片同列）。
     */
    'settings.plugin.item': { kind: 'list'; scope: 'root'; owner: SettingsPluginItemOwnerProps }
  }
}

/** 卡片 owner 侧 props（槽位不提供任何东西）。 */
export interface SettingsPluginItemOwnerProps {
  /** 标记字段：卡片 owner props 有意为空。 */
  children?: never
}

/** 浏览器半区的 locale 命名空间。 */
export const NS = 'describe-image' as const

/** 所需服务：slots（设置卡）、conversation（发送改写）、locale（卡片文案）。 */
export const inject = ['slots', 'conversation', 'locale']

/** 应用浏览器半区。 */
export function apply(ctx: ClientContext): void {
  // 设置卡样式：body[data-dsh-describe-image] 作用域属性 + <style> 注入，
  // disposer 全部收回。
  ctx.effect(installCardStyles, 'dsh-describe-image: card styles')
  ctx.effect(() => ctx.locale.register(NS, dictionaries), 'dsh-describe-image: dictionaries')
  ctx.effect(() => {
    // 把外壳语言镜像到模块级词典开关。
    const sync = (): void => {
      const lang = document.documentElement.lang
      setLanguage(lang === 'zh' || lang.startsWith('zh-') ? 'zh' : 'en')
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
    return () => observer.disconnect()
  }, 'dsh-describe-image: language mirror')

  ctx.inject(['slots', 'conversation'], (scope: ClientContext) => {
    const conversation = scope.conversation
    const slots = scope.slots

    // 纯文本模型在提交时拒绝图片块：把携带图片的发送改写为
    // describe-image 引用，在到达模型之前完成。
    installSendHook(conversation)

    // 设置卡：直连宿主 /describe-image/settings 路由的自定义作用域
    // （官方 apiproxy 的 settings 白名单不含第三方命名空间，官方
    // settingsScope 只能读到 unavailable——见 settings-routes.ts）。
    const settingsScope = new DescribeImageSettingsScope<DescribeImageSettings>()
    const settingsCard = new DescribeImageSettingsCardController(settingsScope)
    slots.inject('settings.plugin.item', () =>
      slots.register({
        name: 'settings.plugin.item',
        id: 'describe-image',
        key: 'describe-image',
        order: 40,
        locale: NS,
        inject: () => settingsCard.inject(),
      }, DescribeImageSettingsCard))
  })
}
