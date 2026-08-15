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

import { readFileAsBase64, uploadImageForDescribe } from './attach.ts'

/** One draft image as the conversation service hands it back. */
interface DraftImageFace {
  readonly id: string
  readonly file: File
}

/** One text prompt block. */
interface TextBlock { type: 'text'; text: string }

/** Prompt result shape returned by the session RPC. */
interface PromptResult { ok: boolean; error?: { code: string; message?: string } }

/** The session face needed to re-send a text-only prompt. */
interface SessionPromptFace {
  prompt(content: readonly TextBlock[], mode: string): Promise<PromptResult>
}

/** The conversation-service surface this hook wraps. */
interface ConversationSendFace {
  send(text: string): Promise<void>
  sendSession(session: SessionPromptFace, text: string, imageIds: readonly string[], mode: string): Promise<void>
  draftImages(ids: readonly string[]): readonly DraftImageFace[]
  releaseDraftImage(id: string): void
}

/** Installed-marker key on the wrapped service instance. */
const HOOK_MARKER = '__dshDescribeImageSendHooked'

/**
 * Wrap the conversation service so image-bearing sends route through the
 * describe-image attach seam. No-op when the service surface is unavailable
 * (older shell) or already wrapped.
 * @param conversation - the `conversation` service instance.
 */
export function installSendHook(conversation: unknown): void {
  const face = conversation as ConversationSendFace
  if (face === null || typeof face !== 'object') return
  if (typeof face.sendSession !== 'function') return
  if (typeof face.draftImages !== 'function' || typeof face.releaseDraftImage !== 'function') return
  if ((face as unknown as Record<string, unknown>)[HOOK_MARKER] === true) return

  const original = face.sendSession
  face.sendSession = async (session, text, imageIds, mode): Promise<void> => {
    if (imageIds.length === 0) {
      return original.call(face, session, text, imageIds, mode)
    }
    const attachments = face.draftImages(imageIds)
    if (attachments.length !== imageIds.length) {
      return original.call(face, session, text, imageIds, mode)
    }
    const refs: string[] = []
    for (const attachment of attachments) {
      const read = await readFileAsBase64(attachment.file)
      if (!read.ok) break
      const upload = await uploadImageForDescribe(read.base64, attachment.file.type, attachment.file.name)
      if (!upload.ok) break
      refs.push(upload.markdown)
    }
    if (refs.length !== attachments.length) {
      // Upload fell short: keep the shell's original behavior (which will
      // reject the image block for a text-only model).
      return original.call(face, session, text, imageIds, mode)
    }
    const fullText = [text.trim(), ...refs].filter(part => part !== '').join('\n')
    const result = await session.prompt([{ type: 'text', text: fullText }], mode)
    if (!result.ok) {
      throw new Error(`conversation.send failed: ${result.error?.code ?? 'unknown'}: ${result.error?.message ?? ''}`)
    }
    for (const id of imageIds) face.releaseDraftImage(id)
  }
  ;(face as unknown as Record<string, unknown>)[HOOK_MARKER] = true
}
