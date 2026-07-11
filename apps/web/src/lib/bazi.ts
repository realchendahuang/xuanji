import { SolarTime } from 'tyme4ts'
import type {
  BaziFacts,
  BaziMethodology,
  BirthProfile,
  ChartSnapshot,
  Pillar,
} from './types'
import { normalizeBirthTime } from './time'

const STEM_ELEMENT: Record<string, string> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
}

const BRANCH_ELEMENT: Record<string, string> = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水',
}

const ZODIAC: Record<string, string> = {
  子: '鼠',
  丑: '牛',
  寅: '虎',
  卯: '兔',
  辰: '龙',
  巳: '蛇',
  午: '马',
  未: '羊',
  申: '猴',
  酉: '鸡',
  戌: '狗',
  亥: '猪',
}

const YANG_STEMS = new Set(['甲', '丙', '戊', '庚', '壬'])

function toPillar(label: Pillar['label'], value: string): Pillar {
  const stem = value.slice(0, 1)
  const branch = value.slice(1, 2)
  return {
    label,
    stem,
    branch,
    element: `${STEM_ELEMENT[stem]}${BRANCH_ELEMENT[branch]}`,
    yinYang: YANG_STEMS.has(stem) ? '阳' : '阴',
  }
}

export async function calculateBazi(
  profile: BirthProfile,
  methodology: BaziMethodology = {
    yearBoundary: 'lichun',
    dayBoundary: '00:00',
    timeBasis: 'civil',
    luckCycleVersion: 'dayun-v1',
    engine: 'tyme4ts',
  },
): Promise<ChartSnapshot> {
  const normalizedTime = normalizeBirthTime(profile, methodology)
  const [year, month, day] = normalizedTime.calculationDate
    .split('-')
    .map(Number)
  const [hour, minute] = normalizedTime.calculationTime.split(':').map(Number)
  const solar = SolarTime.fromYmdHms(year, month, day, hour, minute, 0)
  const eightChar = solar.getLunarHour().getEightChar()
  const lunarYear = solar
    .getLunarHour()
    .getLunarDay()
    .getLunarMonth()
    .getLunarYear()
    .getSixtyCycle()
    .toString()
  const values = [
    methodology.yearBoundary === 'lunar-new-year'
      ? lunarYear
      : eightChar.getYear().toString(),
    eightChar.getMonth().toString(),
    eightChar.getDay().toString(),
    eightChar.getHour().toString(),
  ]
  const pillars = [
    toPillar('年柱', values[0] ?? ''),
    toPillar('月柱', values[1] ?? ''),
    toPillar('日柱', values[2] ?? ''),
    toPillar('时柱', values[3] ?? ''),
  ]
  const elements: BaziFacts['elements'] = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  for (const pillar of pillars) {
    const stemElement = STEM_ELEMENT[pillar.stem] as keyof typeof elements
    const branchElement = BRANCH_ELEMENT[pillar.branch] as keyof typeof elements
    elements[stemElement] += 1
    elements[branchElement] += 1
  }

  const input = JSON.stringify({ profile, methodology })
  const inputHash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)),
    ),
  )
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')

  return {
    id: crypto.randomUUID(),
    profileId: profile.id,
    mode: 'bazi',
    inputHash,
    engineId: 'tyme4ts',
    engineVersion: '1.5.2',
    methodology,
    facts: {
      pillars,
      dayMaster: pillars[2].stem,
      lunarText: solar.getLunarHour().getLunarDay().toString(),
      zodiac: ZODIAC[pillars[0].branch] ?? '',
      elements,
      normalizedTime,
    },
    createdAt: new Date().toISOString(),
  }
}
