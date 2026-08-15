/**
 * 设置卡的浏览器端作用域：绕开官方 apiproxy 的 settings 命名空间白名单，
 * 直连宿主 /describe-image/settings 路由。
 *
 * 实现 {@link SettingsScope} 契约（getSnapshot/subscribe/set/unset），
 * CardForm 无需改动即可驱动：GET 拉取 redacted 视图（value/base/user/
 * revision/writable + secrets 标记），set/unset 经 POST 批量写提交，写后
 * 重新拉取视图并发布快照。secret（apiKey）在 wire 上 redact：空值 set 与
 * unset 均为 no-op（保持当前密钥），非空 set 写入。
 * @module dsh-describe-image/client/settings-scope
 */

import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'

/** 宿主返回的命名空间视图。 */
interface SettingsView {
  ns: string
  value: Record<string, unknown> | undefined
  base: unknown
  user: unknown
  revision: number | undefined
  writable: boolean
  secrets: Array<{ path: string[]; set: boolean }>
}

/** 一条批量写。 */
interface ScopeWrite {
  field: string
  op: 'set' | 'unset'
  value?: unknown
}

/** GET 视图的 HTTP 信封。 */
interface ViewEnvelope {
  ok?: unknown
  value?: unknown
  error?: { code?: unknown; message?: unknown } | null
}

/** 一次批量写中单个字段的落盘结果（settings-form 的 BatchedFieldResult 契约）。 */
export interface ScopeBatchFieldResult {
  field: string
  landed: boolean
}

/**
 * 批量写结果（settings-form 的 BatchResult 契约）：一次 POST 提交全部
 * 写入，按读回视图逐字段报告是否落盘；服务端拒绝时携带 code/message。
 */
export interface ScopeBatchResult {
  ok: boolean
  fields: ScopeBatchFieldResult[]
  code?: string
  message?: string
}

/**
 * 直连 /describe-image/settings 的设置作用域。初始状态 loading，首次
 * GET 成功后 ready；路由不可达/未暴露答 unavailable（卡片显示说明而非
 * 表单）。
 */
export class DescribeImageSettingsScope<T> implements SettingsScope<T> {
  private snapshot: SettingsScopeSnapshot<T> = {
    status: 'loading',
    value: undefined,
    base: undefined,
    user: undefined,
    revision: undefined,
    writable: false,
    mode: 'host',
  }
  private readonly listeners = new Set<() => void>()
  private tail: Promise<void> = Promise.resolve()

  /** @param endpoint - 宿主设置路由（同源）。 */
  constructor(private readonly endpoint: string = '/describe-image/settings') {
    void this.refresh()
  }

  getSnapshot(): SettingsScopeSnapshot<T> {
    return this.snapshot
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** 写一个字段：apiKey 空值跳过（保持当前密钥）。 */
  async set(field: string, value: unknown): Promise<void> {
    if (field === 'apiKey' && (value === '' || value === undefined)) return
    await this.mutate([{ field, op: 'set', value }])
  }

  /** 清除一个字段（重新继承 base）；apiKey 不支持清除（保持当前密钥）。 */
  async unset(field: string): Promise<void> {
    if (field === 'apiKey') return
    await this.mutate([{ field, op: 'unset' }])
  }

  /**
   * 批量写：一次 POST 提交全部写入，按读回视图逐字段报告落盘结果。
   *
   * 这是 settings-form 探测的批量写表面（duck typing：`typeof scope.mutate
   * === 'function'`），必须完整实现 BatchResult 契约——若只是返回
   * Promise<void>，CardForm.save 会拿到 undefined 并抛 TypeError，卡片
   * 永远停在「保存中」。写按调用顺序串行（tail 链），并发写不会交错。
   * @param writes - 本次保存的全部写入。
   * @returns 批量结果：ok=false 时 fields 为空、携带服务端 code/message。
   */
  async mutate(writes: readonly ScopeWrite[]): Promise<ScopeBatchResult> {
    return this.serialize(async () => {
      let envelope: ViewEnvelope | undefined
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ writes }),
        })
        envelope = await response.json() as ViewEnvelope
      } catch {
        // 网络故障 / 响应不是 JSON：命名空间视为不可达。
        this.publishUnavailable()
        return { ok: false, fields: [], code: 'rejected' }
      }
      if (envelope === undefined || envelope.ok !== true) {
        // 服务端拒绝（403/422/…）：保持当前快照，由卡片显示失败原因，
        // 不降级为 unavailable（仅网络故障才视为命名空间不可达）。
        if (envelope === undefined) this.publishUnavailable()
        return {
          ok: false,
          fields: [],
          code: typeof envelope?.error?.code === 'string' ? envelope.error.code : 'rejected',
          message: typeof envelope?.error?.message === 'string' ? envelope.error.message : undefined,
        }
      }
      this.accept(envelope.value)
      return this.fieldResults(writes, envelope.value as SettingsView)
    })
  }

  /** 按读回视图判定每条写入是否落盘。 */
  private fieldResults(writes: readonly ScopeWrite[], view: SettingsView): ScopeBatchResult {
    const user = (view.user ?? {}) as Record<string, unknown>
    const secretPaths = new Set((view.secrets ?? [])
      .filter(secret => secret.path.length === 1)
      .map(secret => secret.path[0]))
    const fields = writes.map(write => {
      let landed: boolean
      if (write.op === 'unset') {
        landed = !Object.hasOwn(user, write.field)
      } else if (write.field === 'apiKey' && (write.value === '' || write.value === undefined)) {
        landed = true // 空密钥 no-op：保持当前密钥，无写入即已达成
      } else if (write.field === 'apiKey') {
        // secret 值不回读，以 redacted 视图的 secret-set 标记判定落盘。
        landed = secretPaths.has('apiKey')
      } else {
        landed = user[write.field] === write.value
      }
      return { field: write.field, landed }
    })
    return { ok: true, fields }
  }

  /** 把一条写任务串到 tail 链上并等待它自己完成（前序写先落盘）。 */
  private serialize<T>(task: () => Promise<T>): Promise<T> {
    const run = this.tail.then(task)
    this.tail = run.then(() => undefined, () => undefined)
    return run
  }

  /** 拉取最新视图。 */
  private async refresh(): Promise<void> {
    try {
      const response = await fetch(this.endpoint)
      if (!response.ok) {
        this.publishUnavailable()
        return
      }
      const envelope = await response.json() as ViewEnvelope
      if (envelope.ok !== true) {
        this.publishUnavailable()
        return
      }
      this.accept(envelope.value)
    } catch {
      this.publishUnavailable()
    }
  }

  /** 接受一个视图并发布。 */
  private accept(value: unknown): void {
    const view = value as SettingsView
    this.snapshot = {
      status: 'ready',
      value: view.value as T | undefined,
      base: view.base,
      user: view.user,
      revision: view.revision,
      writable: view.writable,
      mode: 'host',
    }
    this.publish()
  }

  /** 命名空间不可用：发布 unavailable 快照（卡片显示未暴露说明）。 */
  private publishUnavailable(): void {
    this.snapshot = {
      ...this.snapshot,
      status: 'unavailable',
      writable: false,
    }
    this.publish()
  }

  private publish(): void {
    for (const listener of [...this.listeners]) listener()
  }
}
