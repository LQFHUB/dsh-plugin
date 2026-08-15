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

  /** 批量写（串行：并发写按调用顺序落盘）。 */
  private async mutate(writes: readonly ScopeWrite[]): Promise<void> {
    this.tail = this.tail.then(async () => {
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ writes }),
        })
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
    })
    await this.tail
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
