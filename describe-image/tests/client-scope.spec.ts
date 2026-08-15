/** 浏览器端 DescribeImageSettingsScope 测试：视图拉取、写提交、secret no-op、unavailable 降级。 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { DescribeImageSettingsScope } from '../src/client/settings-scope.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

/** 一个可编程的 fetch stub：按调用序号返回预设响应。 */
function stubFetch(responses: Array<() => unknown>): { calls: Array<{ method: string; body: unknown }> } {
  const calls: Array<{ method: string; body: unknown }> = []
  let index = 0
  vi.stubGlobal('fetch', async (url: string, init?: { method?: string; body?: string }) => {
    calls.push({ method: init?.method ?? 'GET', body: init?.body === undefined ? undefined : JSON.parse(init.body) })
    const response = responses[Math.min(index, responses.length - 1)]()
    index += 1
    return {
      ok: true,
      async json() { return response },
    }
  })
  return { calls }
}

const VIEW = {
  ns: 'describe-image',
  value: { baseURL: 'https://api.example.com/v1', model: 'vision-1', apiStyle: 'chat-completions' },
  base: { baseURL: 'https://api.example.com/v1', model: 'vision-1' },
  user: undefined,
  revision: 3,
  writable: true,
  secrets: [{ path: ['apiKey'], set: true }],
}

describe('DescribeImageSettingsScope', () => {
  it('loads the view and publishes a ready snapshot', async () => {
    stubFetch([() => ({ ok: true, value: VIEW })])
    const scope = new DescribeImageSettingsScope<typeof VIEW.value>()
    await new Promise(resolve => setTimeout(resolve, 0))
    const snapshot = scope.getSnapshot()
    expect(snapshot.status).toBe('ready')
    expect(snapshot.value?.model).toBe('vision-1')
    expect(snapshot.revision).toBe(3)
    expect(snapshot.writable).toBe(true)
    expect(snapshot.mode).toBe('host')
  })

  it('publishes unavailable when the route answers not-ok', async () => {
    stubFetch([() => ({ ok: false, error: { code: 'unavailable' } })])
    const scope = new DescribeImageSettingsScope<Record<string, unknown>>()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(scope.getSnapshot().status).toBe('unavailable')
  })

  it('set posts a write and refreshes the view', async () => {
    const { calls } = stubFetch([
      () => ({ ok: true, value: VIEW }),
      () => ({ ok: true, value: { ...VIEW, value: { ...VIEW.value, model: 'vision-2' }, user: { model: 'vision-2' } } }),
    ])
    const scope = new DescribeImageSettingsScope<Record<string, unknown>>()
    await new Promise(resolve => setTimeout(resolve, 0))
    await scope.set('model', 'vision-2')
    expect(calls[1]).toMatchObject({ method: 'POST', body: { writes: [{ field: 'model', op: 'set', value: 'vision-2' }] } })
    expect(scope.getSnapshot().value?.model).toBe('vision-2')
  })

  it('set with an empty apiKey is a no-op (keeps current key)', async () => {
    const { calls } = stubFetch([() => ({ ok: true, value: VIEW })])
    const scope = new DescribeImageSettingsScope<Record<string, unknown>>()
    await new Promise(resolve => setTimeout(resolve, 0))
    await scope.set('apiKey', '')
    await scope.unset('apiKey')
    expect(calls).toHaveLength(1) // 只有初始 GET，无写请求
    expect(scope.getSnapshot().value?.model).toBe('vision-1')
  })

  it('set with a non-empty apiKey posts the write', async () => {
    const { calls } = stubFetch([
      () => ({ ok: true, value: VIEW }),
      () => ({ ok: true, value: { ...VIEW, user: { apiKey: '' } } }),
    ])
    const scope = new DescribeImageSettingsScope<Record<string, unknown>>()
    await new Promise(resolve => setTimeout(resolve, 0))
    await scope.set('apiKey', 'sk-new')
    expect(calls[1]).toMatchObject({ method: 'POST', body: { writes: [{ field: 'apiKey', op: 'set', value: 'sk-new' }] } })
  })

  it('unset posts a delete for a normal field', async () => {
    const { calls } = stubFetch([
      () => ({ ok: true, value: VIEW }),
      () => ({ ok: true, value: { ...VIEW, user: undefined } }),
    ])
    const scope = new DescribeImageSettingsScope<Record<string, unknown>>()
    await new Promise(resolve => setTimeout(resolve, 0))
    await scope.unset('model')
    expect(calls[1]).toMatchObject({ method: 'POST', body: { writes: [{ field: 'model', op: 'unset' }] } })
  })

  it('notifies subscribers on snapshot changes', async () => {
    stubFetch([
      () => ({ ok: true, value: VIEW }),
      () => ({ ok: true, value: { ...VIEW, value: { ...VIEW.value, model: 'vision-3' } } }),
    ])
    const scope = new DescribeImageSettingsScope<Record<string, unknown>>()
    const seen: string[] = []
    scope.subscribe(() => { seen.push(scope.getSnapshot().status) })
    await new Promise(resolve => setTimeout(resolve, 0))
    await scope.set('model', 'vision-3')
    expect(seen).toContain('ready')
  })
})

describe('DescribeImageSettingsScope 批量写契约（CardForm.save 依赖）', () => {
  it('mutate 返回 BatchResult：ok + 逐字段 landed（回归：旧实现返回 void 导致保存卡死）', async () => {
    stubFetch([
      () => ({ ok: true, value: VIEW }),
      () => ({ ok: true, value: { ...VIEW, value: { ...VIEW.value, model: 'vision-2' }, user: { model: 'vision-2' }, revision: 4 } }),
    ])
    const scope = new DescribeImageSettingsScope<Record<string, unknown>>()
    await new Promise(resolve => setTimeout(resolve, 0))
    const result = await scope.mutate([{ field: 'model', op: 'set', value: 'vision-2' }])
    // 旧实现：mutate 为 Promise<void>，result 为 undefined，result.ok 抛 TypeError
    expect(result.ok).toBe(true)
    expect(result.fields).toEqual([{ field: 'model', landed: true }])
    expect(scope.getSnapshot().value?.model).toBe('vision-2')
  })

  it('批量写未落盘时逐字段 landed=false', async () => {
    stubFetch([
      () => ({ ok: true, value: VIEW }),
      () => ({ ok: true, value: { ...VIEW, user: {} } }), // 服务端未接受 model 写入
    ])
    const scope = new DescribeImageSettingsScope<Record<string, unknown>>()
    await new Promise(resolve => setTimeout(resolve, 0))
    const result = await scope.mutate([{ field: 'model', op: 'set', value: 'vision-2' }])
    expect(result.ok).toBe(true)
    expect(result.fields).toEqual([{ field: 'model', landed: false }])
  })

  it('unset 以读回视图判定落盘', async () => {
    stubFetch([
      () => ({ ok: true, value: VIEW }),
      () => ({ ok: true, value: { ...VIEW, user: undefined } }),
    ])
    const scope = new DescribeImageSettingsScope<Record<string, unknown>>()
    await new Promise(resolve => setTimeout(resolve, 0))
    const result = await scope.mutate([{ field: 'model', op: 'unset' }])
    expect(result.ok).toBe(true)
    expect(result.fields).toEqual([{ field: 'model', landed: true }])
  })

  it('apiKey 以 secret-set 标记判定落盘；空值 no-op 视为 landed', async () => {
    stubFetch([
      () => ({ ok: true, value: VIEW }),
      () => ({ ok: true, value: { ...VIEW, user: { apiKey: '' }, secrets: [{ path: ['apiKey'], set: true }] } }),
    ])
    const scope = new DescribeImageSettingsScope<Record<string, unknown>>()
    await new Promise(resolve => setTimeout(resolve, 0))
    const written = await scope.mutate([{ field: 'apiKey', op: 'set', value: 'sk-new' }])
    expect(written.fields).toEqual([{ field: 'apiKey', landed: true }])
    const noop = await scope.mutate([{ field: 'apiKey', op: 'set', value: '' }])
    expect(noop.ok).toBe(true)
    expect(noop.fields).toEqual([{ field: 'apiKey', landed: true }])
  })

  it('服务端拒绝（envelope ok=false）返回 ok:false + code/message，快照保持 ready', async () => {
    stubFetch([
      () => ({ ok: true, value: VIEW }),
      () => ({ ok: false, error: { code: 'rejected', message: 'baseURL missing' } }),
    ])
    const scope = new DescribeImageSettingsScope<Record<string, unknown>>()
    await new Promise(resolve => setTimeout(resolve, 0))
    const result = await scope.mutate([{ field: 'model', op: 'set', value: 'vision-2' }])
    expect(result.ok).toBe(false)
    expect(result.code).toBe('rejected')
    expect(result.message).toBe('baseURL missing')
    expect(scope.getSnapshot().status).toBe('ready') // 不误降级为 unavailable
    expect(scope.getSnapshot().value?.model).toBe('vision-1') // 草稿保留由卡片处理
  })

  it('网络故障返回 ok:false 并降级 unavailable', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('network down') })
    const scope = new DescribeImageSettingsScope<Record<string, unknown>>()
    await new Promise(resolve => setTimeout(resolve, 0))
    const result = await scope.mutate([{ field: 'model', op: 'set', value: 'vision-2' }])
    expect(result.ok).toBe(false)
    expect(result.fields).toEqual([])
    expect(scope.getSnapshot().status).toBe('unavailable')
  })
})
