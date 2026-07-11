import { describe, expect, it } from 'vitest'
import { extractModelText, FakeModelAdapter } from './model'

describe('ModelPort adapters', () => {
  it('returns deterministic text from the fake adapter', async () => {
    expect(await new FakeModelAdapter('测试结果').generate()).toBe('测试结果')
  })
  it('normalizes provider response shapes', () => {
    expect(extractModelText({ response: ' workers ' })).toBe('workers')
    expect(
      extractModelText({ choices: [{ message: { content: ' gateway ' } }] }),
    ).toBe('gateway')
  })
})
