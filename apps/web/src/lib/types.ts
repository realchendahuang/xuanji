export type TimePrecision = 'exact' | 'approximate' | 'unknown'

export type BirthProfile = {
  id: string
  name: string
  localDate: string
  localTime: string
  timePrecision: TimePrecision
  location: {
    label: string
    latitude: number
    longitude: number
    timeZone: string
  }
  createdAt: string
  updatedAt: string
}

export type BaziMethodology = {
  yearBoundary: 'lichun' | 'lunar-new-year'
  dayBoundary: '23:00' | '00:00'
  timeBasis: 'civil' | 'true-solar'
  luckCycleVersion: string
  engine: 'tyme4ts'
}

export type NormalizedBirthTime = {
  instant: string
  zonedDateTime: string
  calculationDate: string
  calculationTime: string
  utcOffset: string
  disambiguation: 'exact' | 'compatible' | 'unknown-noon'
}

export type Pillar = {
  label: '年柱' | '月柱' | '日柱' | '时柱'
  stem: string
  branch: string
  element: string
  yinYang: string
}

export type BaziFacts = {
  pillars: Pillar[]
  dayMaster: string
  lunarText: string
  zodiac: string
  elements: Record<'木' | '火' | '土' | '金' | '水', number>
  normalizedTime: NormalizedBirthTime
}

export type ChartSnapshot = {
  id: string
  profileId: string
  mode: 'bazi'
  inputHash: string
  engineId: 'tyme4ts'
  engineVersion: '1.5.2'
  methodology: BaziMethodology
  facts: BaziFacts
  createdAt: string
}

export type Evidence = {
  id: string
  title: string
  summary: string
  factRefs: string[]
}

export type ReadingSection = {
  title: string
  body: string
  evidenceIds: string[]
}

export type Reading = {
  id: string
  snapshotId: string
  title: string
  summary: string
  sections: ReadingSection[]
  evidence: Evidence[]
  model: string
  gatewayId: string
  createdAt: string
}
