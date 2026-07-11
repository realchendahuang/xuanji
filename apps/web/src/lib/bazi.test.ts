import { describe, expect, it } from 'vitest'
import { calculateBazi } from './bazi'
import type { BirthProfile } from './types'

const profile: BirthProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: '测试',
  localDate: '1990-01-01',
  localTime: '12:00',
  timePrecision: 'exact',
  location: {
    label: '上海',
    latitude: 31.2304,
    longitude: 121.4737,
    timeZone: 'Asia/Shanghai',
  },
  createdAt: '2026-07-11T00:00:00.000Z',
  updatedAt: '2026-07-11T00:00:00.000Z',
}

describe('calculateBazi', () => {
  it('keeps the golden four-pillar result stable', async () => {
    const snapshot = await calculateBazi(profile)

    expect(
      snapshot.facts.pillars.map(({ stem, branch }) => `${stem}${branch}`),
    ).toEqual(['己巳', '丙子', '丙寅', '甲午'])
    expect(snapshot.facts.dayMaster).toBe('丙')
    expect(snapshot.facts.zodiac).toBe('蛇')
  })

  it('counts the visible stem and branch elements', async () => {
    const snapshot = await calculateBazi(profile)

    expect(snapshot.facts.elements).toEqual({
      木: 2,
      火: 4,
      土: 1,
      金: 0,
      水: 1,
    })
    expect(
      Object.values(snapshot.facts.elements).reduce(
        (sum, count) => sum + count,
        0,
      ),
    ).toBe(8)
  })

  it('supports lunar-new-year and lichun year boundaries explicitly', async () => {
    const boundaryProfile = {
      ...profile,
      localDate: '2025-01-30',
    }
    const lichun = await calculateBazi(boundaryProfile)
    const lunarNewYear = await calculateBazi(boundaryProfile, {
      yearBoundary: 'lunar-new-year',
      dayBoundary: '00:00',
      timeBasis: 'civil',
      luckCycleVersion: 'dayun-v1',
      engine: 'tyme4ts',
    })

    expect(
      `${lichun.facts.pillars[0]?.stem}${lichun.facts.pillars[0]?.branch}`,
    ).toBe('甲辰')
    expect(
      `${lunarNewYear.facts.pillars[0]?.stem}${lunarNewYear.facts.pillars[0]?.branch}`,
    ).toBe('乙巳')
  })
})
