/**
 * 面向模型的图像理解工具，为纯文本模型提供图像能力。每次调用加载一张图片
 * ——本地文件路径、http(s) URL，或会话附件引用——交给 OpenAI 兼容端点的
 * 视觉语言模型描述；只有返回的文本进入对话，图片本身绝不进入会话记录。
 * API key 每次调用解析（内联配置值 → 凭证服务 → 启动环境），HTTP 客户端
 * 拒绝重定向，bearer 凭证绝不会被转发到配置端点之外。
 *
 * 移植自 zhu1090093659/dsh-web-ui 的 dsh-tool-describe-image（Apache-2.0，
 * 原版权归 deepseek-ai / whitelonng）。适配：插件允许无配置挂载（设置卡
 * 无配置时也能挂上），端点/模型校验在每次调用时进行——组合条目实际配置
 * 时才在加载时校验。「图像理解」设置卡可从 设置 → 插件配置 实时填写字段。
 * @module dsh-describe-image
 */

import type { Context } from '@deepseek-ai/cordis'
import { installSettingsSection } from '@deepseek-ai/dsh-settings'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { GenericCallView } from '@deepseek-ai/dsh-tools'
import { registerAttachRoute } from './attach-routes.ts'
import { registerSettingsRoute, registerModelsRoute } from './settings-routes.ts'
import { resolveConfiguredVision } from './configured-models.ts'
import { DEFAULT_MAX_BYTES } from './media.ts'
import { Config, DESCRIBE_IMAGE_SETTINGS_NAMESPACE, resolveApiKey, resolveConfig, type ResolvedConfig } from './config-resolve.ts'
import { callVision, createVisionCache, loadImage } from './vision-client.ts'

export const name = 'describe-image'
export const inject = ['tools', 'webServer']

// 公开面从拆分模块原样再导出：Config 与其 schema 常量来自 config-resolve；
// 设置卡使用的设置命名空间也来自同一模块。

export { DEFAULT_MAX_BYTES, sniffMimeType } from './media.ts'
export type { ImageMimeType } from './media.ts'
export {
  API_STYLES,
  Config,
  DEFAULT_API_KEY_ENV,
  DEFAULT_API_STYLE,
  DEFAULT_MAX_OUTPUT_TOKENS,
  DEFAULT_PROMPT,
  DEFAULT_TIMEOUT_MS,
  DESCRIBE_IMAGE_SETTINGS_NAMESPACE,
  resolveApiKey,
  resolveConfig,
} from './config-resolve.ts'
export type { ApiStyle, ResolvedConfig } from './config-resolve.ts'
export {
  callVision,
  createVisionCache,
  DEFAULT_CACHE_MAX_ENTRIES,
  DEFAULT_CACHE_TTL_MS,
  extractChatCompletionsContent,
  extractResponsesContent,
  loadImage,
  parseImageAttachmentRef,
  readAttachment,
  readBoundedBody,
  readBoundedText,
  semanticRequestKey,
} from './vision-client.ts'
export type { LoadedImage, VisionCache } from './vision-client.ts'
export {
  SETTINGS_API_PATH,
  SETTINGS_NAMESPACE,
  applySettingsWrites,
  buildSettingsView,
  registerSettingsRoute,
} from './settings-routes.ts'
export type { SettingsView, SettingsWrite } from './settings-routes.ts'
export { MODELS_API_PATH, registerModelsRoute } from './settings-routes.ts'
export {
  listConfiguredVisionModels,
  profileAt,
  resolveConfiguredVision,
} from './configured-models.ts'
export type { ConfiguredVisionModel } from './configured-models.ts'

const DESCRIPTION_HEAD =
  'Inspect one image — a local absolute path, an http(s) URL, or the JSON of an image attachment '
  + 'note — and return the text the user needs. Use when the user references an image file or URL, '
  + 'or when a task needs OCR, chart or diagram reading, screenshot or UI analysis, translation of '
  + 'image text, or photo understanding. '
  + 'Always pass an explicit `prompt` with a precise instruction — e.g. "transcribe all text", '
  + '"extract the table as CSV", "diagnose the UI layout problems", "translate the text into '
  + 'Chinese" — instead of leaving it to the default description: a targeted instruction produces '
  + 'a much more useful answer. '

/** describe_image 调用的校验后参数。 */
export interface DescribeImageArgs {
  image: string
  prompt?: string
}

/**
 * 纯调用视图：通用读取卡，本地路径附带文件位置。
 * @param args - 校验后的调用参数。
 * @returns 一次 describe_image 调用的待执行卡片。
 */
export function describeImageCallView(args: DescribeImageArgs): GenericCallView {
  return {
    card: 'generic',
    title: 'Describe image',
    kind: 'read',
    rawInput: args,
    .../^https?:\/\//i.test(args.image) ? {} : { locations: [{ path: args.image }] },
  }
}

/**
 * 在 `ctx.tools` 注册 `describe_image` 工具。图片绝不进入对话：工具只返回
 * 视觉模型的文本答案。`describe-image` 设置 section 叠加在组合条目之上，
 * 每次调用重新解析，因此 设置 → 插件配置 卡的改动在下次调用即生效。
 * 相同图片 + 指令的重复调用复用短生命周期的语义缓存，避免端点被快速
 * 连调两次。
 *
 * 适配：插件允许无配置挂载（设置卡无配置时也能挂上），端点/模型校验是
 * 惰性的——空组合条目正常加载，首次调用以清晰的"未配置"消息失败；非空
 * 条目仍在加载时急切校验、快速失败。
 * @param ctx - 注册上下文（携带工具注册表）。
 * @param config - 部署配置。
 */
export function apply(ctx: Context, config: Config = {}): void {
  // Loader 在 apply 前填好 schema 默认值，因此未配置的条目也会带上默认
  // 字段。只有真正命名了端点/模型的配置才急切校验——无配置挂载必须静默
  // 加载。
  if (config.baseURL !== undefined || config.model !== undefined) {
    resolveConfig(config)
  }
  let current: () => Config = () => config
  installSettingsSection(ctx, DESCRIBE_IMAGE_SETTINGS_NAMESPACE, Config, config, {
    setSource: (source) => {
      current = source
    },
    onChange: () => {},
    validate: (value) => {
      if (value.baseURL !== undefined || value.model !== undefined) resolveConfig(value)
    },
  })
  const spec = (): ResolvedConfig => resolveConfig(current())
  // 本次挂载作用域内的短生命周期语义缓存：TTL 内相同图片 + 指令复用
  // 上一次答案，避免重复请求端点。
  const visionCache = createVisionCache()
  // webServer 可选（loader-composition 测试无它也能启动）：仅在服务真正
  // 挂载时注册 attach 路由、设置读写路由与已配置模型列表路由。
  registerAttachRoute(ctx, () => current().maxBytes ?? DEFAULT_MAX_BYTES)
  registerSettingsRoute(ctx)
  registerModelsRoute(ctx)
  ctx.tools.register(defineTool({
    name: 'describe_image',
    description: DESCRIPTION_HEAD
      + 'The image may be a local path, an http(s) URL, the JSON object from an `[image attachment …]` '
      + "note, or — the common case when the user used this plugin's input-box image button — a "
      + 'short markdown image reference like `![图片](/describe-image/raw/sha256:abc…)` pasted into '
      + 'the conversation. In the markdown form, take the attachment id from the URL and pass that id '
      + 'as the `image` value (never the whole markdown, and never a made-up path); the tool resolves '
      + 'the id to the stored image. The image itself never enters the conversation — only the '
      + 'returned text is shown to you.',
    parameters: {
      image: {
        type: 'string',
        required: true,
        description: 'Absolute path to a local image file, an http(s) URL of the image, the JSON object from an [image attachment …] note, or the bare attachment id (e.g. sha256:abc…) taken from the markdown image reference ![图片](/describe-image/raw/<id>) that the plugin\'s input-box image button pasted into the conversation.',
      },
      prompt: {
        type: 'string',
        description: 'Your precise instruction for the vision model about this image (e.g. "transcribe all text", "extract the table as CSV", "diagnose the UI problems", "translate the text"). Prefer a targeted prompt over the generic default description.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          text: { type: 'string', required: true },
          model: { type: 'string', required: true },
          image: { type: 'string', required: true },
          mimeType: { type: 'string', required: true, enum: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] },
          bytes: { type: 'integer', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.text }],
    },
    async execute(args, exec) {
      const active = spec()
      let apiKey: string
      let baseURL = active.baseURL
      let model = active.model
      if (active.useConfiguredModel) {
        // 复用 DSH 模型设置（设置 > 模型）中已配置的视觉模型：
        // baseURL/apiKey 从 provider 配置解析，模型用配置选中的 id。
        const configured = await resolveConfiguredVision(ctx, active)
        baseURL = configured.baseURL
        model = configured.model
        apiKey = configured.apiKey
      } else {
        apiKey = await resolveApiKey(ctx, active)
      }
      const image = await loadImage(ctx, args.image, exec.signal, active.maxBytes)
      const text = await callVision({ ...active, baseURL, model }, apiKey, args.prompt ?? active.defaultPrompt, image, exec.signal, visionCache)
      return { text, model, image: args.image, mimeType: image.mimeType, bytes: image.bytes.length }
    },
    presentCall: describeImageCallView,
  }))
}