import { describe, expect, it } from 'vitest'
import { normalizeBirthTime } from './time'
import type { BaziMethodology, BirthProfile } from './types'

const methodology: BaziMethodology = {
  yearBoundary: 'lichun',
  dayBoundary: '00:00',
  timeBasis: 'civil',
  luckCycleVersion: 'dayun-v1',
  engine: 'tyme4ts',
}

function profile(overrides: Partial<BirthProfile> = {}): BirthProfile {
  return {
    id: crypto.randomUUID(),
    name: '时区测试',
    localDate: '2024-03-10',
    localTime: '02:30',
    timePrecision: 'exact',
    location: {
      label: '纽约',
      latitude: 40.7128,
      longitude: -74.006,
      timeZone: 'America/New_York',
    },
    createdAt: '2026-07-11T00:00:00Z',
    updatedAt: '2026-07-11T00:00:00Z',
    ...overrides,
  }
}

describe('normalizeBirthTime', () => {
  it('rejects an exact time inside a DST gap', () => {
    expect(() => normalizeBirthTime(profile(), methodology)).toThrow('夏令时')
  })

  it('uses compatible disambiguation for an approximate DST gap', () => {
    const normalized = normalizeBirthTime(
      profile({ timePrecision: 'approximate' }),
      methodology,
    )
    expect(normalized.disambiguation).toBe('compatible')
    expect(normalized.zonedDateTime).toContain('America/New_York')
  })

  it('uses local noon when birth time is unknown', () => {
    const normalized = normalizeBirthTime(
      profile({ localDate: '1990-01-01', timePrecision: 'unknown' }),
      methodology,
    )
    expect(normalized.calculationTime).toBe('12:00')
    expect(normalized.disambiguation).toBe('unknown-noon')
  })

  it('applies longitude correction for true solar time', () => {
    const normalized = normalizeBirthTime(
      profile({
        localDate: '1990-01-01',
        localTime: '12:00',
        location: {
          label: '乌鲁木齐',
          latitude: 43.8256,
          longitude: 87.6168,
          timeZone: 'Asia/Shanghai',
        },
      }),
      { ...methodology, timeBasis: 'true-solar' },
    )
    expect(normalized.calculationTime).toBe('09:50')
  })

  it('moves the calculation date at the 23:00 day boundary', () => {
    const normalized = normalizeBirthTime(
      profile({ localDate: '1990-01-01', localTime: '23:30' }),
      { ...methodology, dayBoundary: '23:00' },
    )
    expect(normalized.calculationDate).toBe('1990-01-02')
  })
})
