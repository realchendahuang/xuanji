import { Temporal } from '@js-temporal/polyfill'
import type {
  BaziMethodology,
  BirthProfile,
  NormalizedBirthTime,
} from './types'

export function normalizeBirthTime(
  profile: BirthProfile,
  methodology: BaziMethodology,
): NormalizedBirthTime {
  const localTime =
    profile.timePrecision === 'unknown' ? '12:00' : profile.localTime
  const [year, month, day] = profile.localDate.split('-').map(Number)
  const [hour, minute] = localTime.split(':').map(Number)
  const fields = {
    timeZone: profile.location.timeZone,
    year,
    month,
    day,
    hour,
    minute,
  }

  let zoned: Temporal.ZonedDateTime
  let disambiguation: NormalizedBirthTime['disambiguation'] =
    profile.timePrecision === 'unknown' ? 'unknown-noon' : 'exact'
  try {
    zoned = Temporal.ZonedDateTime.from(fields, { disambiguation: 'reject' })
  } catch {
    if (profile.timePrecision === 'exact') {
      throw new Error(
        '该本地时间处于夏令时跳转或重复区间，请改为“大约”并确认时间',
      )
    }
    zoned = Temporal.ZonedDateTime.from(fields, {
      disambiguation: 'compatible',
    })
    disambiguation = 'compatible'
  }

  let calculation = zoned.toPlainDateTime()
  if (methodology.timeBasis === 'true-solar') {
    const offsetHours = Number(zoned.offsetNanoseconds) / 3_600_000_000_000
    const standardMeridian = offsetHours * 15
    const correctionMinutes = Math.round(
      (profile.location.longitude - standardMeridian) * 4,
    )
    calculation = calculation.add({ minutes: correctionMinutes })
  }
  if (methodology.dayBoundary === '23:00' && calculation.hour === 23) {
    calculation = calculation.add({ days: 1 })
  }

  return {
    instant: zoned.toInstant().toString(),
    zonedDateTime: zoned.toString(),
    calculationDate: calculation.toPlainDate().toString(),
    calculationTime: calculation
      .toPlainTime()
      .toString({ smallestUnit: 'minute' }),
    utcOffset: zoned.offset,
    disambiguation,
  }
}
