export type TimePrecision = 'exact' | 'approximate' | 'unknown'

export type BirthProfile = {
  id: string
  name: string
  localDate: string
  localTime: string
  timePrecision: TimePrecision
  gender: 'male' | 'female' | 'unspecified'
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
  hiddenStems: Array<{ branch: string; stems: string[] }>
  tenGods: Array<{ pillar: Pillar['label']; stem: string; relation: string }>
  luckCycle: {
    direction: 'forward' | 'backward' | 'undetermined'
    algorithmVersion: string
    reason: string
    startTime?: string
    startAge?: number
    decades: Array<{ name: string; startAge: number; endAge: number }>
  }
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
  factRefs: string[]
  ruleId: string
  ruleVersion: string
  title: string
  summary: string
}

export type Claim = {
  id: string
  title: string
  body: string
  evidenceIds: string[]
}

export type ReadingSection = Claim

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

export type DivinationMode =
  | 'bazi'
  | 'western'
  | 'transit'
  | 'ziwei'
  | 'tarot'
  | 'iching'
  | 'compatibility'
  | 'comprehensive'
  | 'daily'

export type UniversalSnapshot<TFacts = unknown, TMethodology = unknown> = {
  id: string
  profileId: string | null
  secondaryProfileId?: string | null
  mode: DivinationMode
  inputHash: string
  engineId: string
  engineVersion: string
  methodology: TMethodology
  facts: TFacts
  createdAt: string
}

export type PlanetPosition = {
  name: string
  symbol: string
  longitude: number
  sign: string
  degree: number
  house: number
  retrograde: boolean
}

export type WesternFacts = {
  zodiac: 'tropical' | 'sidereal'
  houseSystem: 'whole-sign' | 'placidus'
  ascendant: { sign: string; degree: number; longitude: number }
  midheaven: { sign: string; degree: number; longitude: number }
  planets: PlanetPosition[]
  aspects: Array<{
    first: string
    second: string
    type: string
    angle: number
    orb: number
  }>
}

export type TransitFacts = {
  date: string
  natalSnapshotId: string
  planets: PlanetPosition[]
  contacts: Array<{
    transit: string
    natal: string
    type: string
    orb: number
  }>
}

export type ZiweiFacts = {
  lunarDate: string
  mingGong: string
  shenGong: string
  elementBoard: string
  palaces: Array<{
    name: string
    branch: string
    stars: string[]
    transformations: string[]
    decade: string
  }>
}

export type TarotFacts = {
  question: string
  spread: 'single' | 'three' | 'celtic-cross'
  seed: string
  cards: Array<{
    position: string
    name: string
    arcana: string
    reversed: boolean
    keywords: string[]
  }>
}

export type IChingFacts = {
  question: string
  method: 'numbers' | 'random'
  seed: string
  primary: { number: number; name: string; upper: string; lower: string }
  changingLines: number[]
  changed: { number: number; name: string; upper: string; lower: string }
  lines: number[]
}

export type CompatibilityFacts = {
  primaryProfileId: string
  secondaryProfileId: string
  systems: Array<{
    mode: 'bazi' | 'western'
    score: number
    strengths: string[]
    tensions: string[]
    evidence: string[]
  }>
  overallScore: number
}

export type DailyFacts = {
  date: string
  profileId: string
  signals: Array<{
    area: '整体' | '事业' | '关系' | '身心'
    score: number
    title: string
    detail: string
  }>
  focus: string
  caution: string
}

export type UniversalReport = {
  id: string
  mode: DivinationMode
  snapshotIds: string[]
  title: string
  summary: string
  sections: ReadingSection[]
  evidence: Evidence[]
  model: string
  gatewayId: string
  createdAt: string
}
