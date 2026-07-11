import { describe, expect, it } from 'vitest'
import { normalizeCumulativeStreamText } from './ChatPanel'

describe('normalizeCumulativeStreamText', () => {
  it('collapses cumulative provider stream fragments', () => {
    expect(
      normalizeCumulativeStreamText(
        '根据根据命命盘盘信息信息，，木木元素元素有有22个个。。',
      ),
    ).toBe('根据命盘信息，木元素有2个。')
  })
})
