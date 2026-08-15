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
