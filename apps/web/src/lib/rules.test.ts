import { describe, expect, it } from 'vitest'
import { calculateBazi } from './bazi'
import { evaluateSnapshot, RULE_PACK } from './rules'
import type { BirthProfile } from './types'

describe('evaluateSnapshot', () => {
  it('links every reading section to explicit evidence', async () => {
    const profile: BirthProfile = {
      id: '00000000-0000-4000-8000-000000000002',
      name: '测试',
      localDate: '1990-01-01',
      localTime: '12:00',
      timePrecision: 'exact',
      gender: 'male',
      location: {
        label: '上海',
        latitude: 31.2304,
        longitude: 121.4737,
        timeZone: 'Asia/Shanghai',
      },
      createdAt: '2026-07-11T00:00:00.000Z',
      updatedAt: '2026-07-11T00:00:00.000Z',
    }
    const result = evaluateSnapshot(await calculateBazi(profile))
    const evidenceIds = new Set(result.evidence.map(({ id }) => id))

    expect(result.dominant).toBe('火')
    expect(result.weakest).toBe('金')
    expect(RULE_PACK).toHaveLength(35)
    expect(result.evidence.length).toBeGreaterThanOrEqual(6)
    expect(
      result.evidence.every((item) => item.ruleId && item.ruleVersion),
    ).toBe(true)
    for (const section of result.sections) {
      expect(section.evidenceIds.length).toBeGreaterThan(0)
      expect(section.evidenceIds.every((id) => evidenceIds.has(id))).toBe(true)
    }
  })
})
