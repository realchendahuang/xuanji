import {
  Body,
  Ecliptic,
  EclipticGeoMoon,
  GeoVector,
  SiderealTime,
} from 'astronomy-engine'
import { astro } from 'iztro'
import type {
  BirthProfile,
  CompatibilityFacts,
  DailyFacts,
  DivinationMode,
  IChingFacts,
  PlanetPosition,
  TarotFacts,
  TransitFacts,
  UniversalSnapshot,
  WesternFacts,
  ZiweiFacts,
} from './types'
import { calculateBazi } from './bazi'
import { normalizeBirthTime } from './time'

const SIGNS = [
  '白羊',
  '金牛',
  '双子',
  '巨蟹',
  '狮子',
  '处女',
  '天秤',
  '天蝎',
  '射手',
  '摩羯',
  '水瓶',
  '双鱼',
]
const PLANETS = [
  ['太阳', '☉', Body.Sun],
  ['月亮', '☽', Body.Moon],
  ['水星', '☿', Body.Mercury],
  ['金星', '♀', Body.Venus],
  ['火星', '♂', Body.Mars],
  ['木星', '♃', Body.Jupiter],
  ['土星', '♄', Body.Saturn],
  ['天王星', '♅', Body.Uranus],
  ['海王星', '♆', Body.Neptune],
  ['冥王星', '♇', Body.Pluto],
] as const
const ASPECTS = [
  ['合相', 0, 8],
  ['六分', 60, 5],
  ['四分', 90, 7],
  ['三分', 120, 7],
  ['对分', 180, 8],
] as const

async function hash(value: unknown) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(value)),
  )
  return Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('')
}

function wrap(value: number) {
  return ((value % 360) + 360) % 360
}

function angularDistance(a: number, b: number) {
  const distance = Math.abs(wrap(a) - wrap(b))
  return Math.min(distance, 360 - distance)
}

function longitudeFor(body: Body, date: Date) {
  if (body === Body.Moon) return wrap(EclipticGeoMoon(date).lon)
  return wrap(Ecliptic(GeoVector(body, date, true)).elon)
}

function ascendant(date: Date, longitude: number, latitude: number) {
  const theta = ((SiderealTime(date) * 15 + longitude) * Math.PI) / 180
  const epsilon = (23.439291 * Math.PI) / 180
  const phi = (latitude * Math.PI) / 180
  return wrap(
    (Math.atan2(
      -Math.cos(theta),
      Math.sin(theta) * Math.cos(epsilon) + Math.tan(phi) * Math.sin(epsilon),
    ) *
      180) /
      Math.PI,
  )
}

function planetPositions(
  date: Date,
  asc: number,
  zodiac: 'tropical' | 'sidereal',
) {
  const ayanamsa = zodiac === 'sidereal' ? 24.1 : 0
  return PLANETS.map(([name, symbol, body]) => {
    const longitude = wrap(longitudeFor(body, date) - ayanamsa)
    const tomorrow = new Date(date.getTime() + 86_400_000)
    const next = wrap(longitudeFor(body, tomorrow) - ayanamsa)
    const movement = ((next - longitude + 540) % 360) - 180
    return {
      name,
      symbol,
      longitude,
      sign: SIGNS[Math.floor(longitude / 30)] ?? '白羊',
      degree: longitude % 30,
      house: Math.floor(wrap(longitude - asc) / 30) + 1,
      retrograde: ![Body.Sun, Body.Moon].includes(body) && movement < 0,
    } satisfies PlanetPosition
  })
}

function aspects(planets: PlanetPosition[]) {
  const result: WesternFacts['aspects'] = []
  for (let left = 0; left < planets.length; left += 1) {
    for (let right = left + 1; right < planets.length; right += 1) {
      const angle = angularDistance(
        planets[left].longitude,
        planets[right].longitude,
      )
      for (const [type, target, maxOrb] of ASPECTS) {
        const orb = Math.abs(angle - target)
        if (orb <= maxOrb) {
          result.push({
            first: planets[left].name,
            second: planets[right].name,
            type,
            angle,
            orb,
          })
          break
        }
      }
    }
  }
  return result.sort((a, b) => a.orb - b.orb)
}

export async function calculateWestern(
  profile: BirthProfile,
  options: {
    zodiac: 'tropical' | 'sidereal'
    houseSystem: 'whole-sign' | 'placidus'
  } = { zodiac: 'tropical', houseSystem: 'whole-sign' },
): Promise<UniversalSnapshot<WesternFacts>> {
  const normalized = normalizeBirthTime(profile, {
    yearBoundary: 'lichun',
    dayBoundary: '00:00',
    timeBasis: 'civil',
    luckCycleVersion: 'dayun-v1',
    engine: 'tyme4ts',
  })
  const date = new Date(normalized.instant)
  const tropicalAsc = ascendant(
    date,
    profile.location.longitude,
    profile.location.latitude,
  )
  const asc = wrap(tropicalAsc - (options.zodiac === 'sidereal' ? 24.1 : 0))
  const planets = planetPositions(date, asc, options.zodiac)
  const facts: WesternFacts = {
    ...options,
    ascendant: {
      longitude: asc,
      sign: SIGNS[Math.floor(asc / 30)] ?? '白羊',
      degree: asc % 30,
    },
    midheaven: {
      longitude: wrap(asc + 270),
      sign: SIGNS[Math.floor(wrap(asc + 270) / 30)] ?? '摩羯',
      degree: wrap(asc + 270) % 30,
    },
    planets,
    aspects: aspects(planets),
  }
  return snapshot('western', profile.id, null, 'astronomy-engine', '2.1.19', options, facts)
}

export async function calculateTransit(
  profile: BirthProfile,
  natal: UniversalSnapshot<WesternFacts>,
  dateInput = new Date(),
): Promise<UniversalSnapshot<TransitFacts>> {
  const planets = planetPositions(dateInput, natal.facts.ascendant.longitude, natal.facts.zodiac)
  const contacts: TransitFacts['contacts'] = []
  for (const transit of planets) {
    for (const natalPlanet of natal.facts.planets) {
      const angle = angularDistance(transit.longitude, natalPlanet.longitude)
      for (const [type, target] of ASPECTS) {
        const orb = Math.abs(angle - target)
        if (orb <= 3) {
          contacts.push({ transit: transit.name, natal: natalPlanet.name, type, orb })
          break
        }
      }
    }
  }
  const facts: TransitFacts = {
    date: dateInput.toISOString().slice(0, 10),
    natalSnapshotId: natal.id,
    planets,
    contacts: contacts.sort((a, b) => a.orb - b.orb),
  }
  return snapshot('transit', profile.id, null, 'astronomy-engine', '2.1.19', { natalSnapshotId: natal.id }, facts)
}

export async function calculateZiwei(profile: BirthProfile): Promise<UniversalSnapshot<ZiweiFacts>> {
  const hour = Number(profile.localTime.slice(0, 2))
  const timeIndex = Math.floor((hour + 1) / 2) % 12
  const chart = astro.bySolar(
    profile.localDate.replaceAll('-0', '-'),
    timeIndex,
    profile.gender === 'female' ? 'female' : 'male',
    true,
    'zh-CN',
  )
  const palaces = chart.palaces.map((palace) => ({
    name: palace.name,
    branch: palace.earthlyBranch,
    stars: [...palace.majorStars, ...palace.minorStars]
      .map((star) => `${star.name}${star.brightness ? `(${star.brightness})` : ''}`),
    transformations: [...palace.majorStars, ...palace.minorStars]
      .flatMap((star) => star.mutagen ? [`化${star.mutagen}`] : []),
    decade: `${palace.decadal.range[0]}–${palace.decadal.range[1]}岁`,
  }))
  const facts: ZiweiFacts = {
    lunarDate: chart.lunarDate,
    mingGong: chart.earthlyBranchOfSoulPalace,
    shenGong: chart.earthlyBranchOfBodyPalace,
    elementBoard: chart.fiveElementsClass,
    palaces,
  }
  return snapshot('ziwei', profile.id, null, 'iztro', '2.5.8', { school: 'traditional', fixLeap: true }, facts)
}

const MAJOR = ['愚者', '魔术师', '女祭司', '皇后', '皇帝', '教皇', '恋人', '战车', '力量', '隐士', '命运之轮', '正义', '倒吊人', '死神', '节制', '恶魔', '高塔', '星星', '月亮', '太阳', '审判', '世界']
const SUITS = ['权杖', '圣杯', '宝剑', '星币']
const RANKS = ['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十', '侍从', '骑士', '王后', '国王']
const TAROT_DECK = [
  ...MAJOR.map((name) => ({ name, arcana: '大阿尔卡纳' })),
  ...SUITS.flatMap((suit) => RANKS.map((rank) => ({ name: `${suit}${rank}`, arcana: suit }))),
]
const SPREAD_POSITIONS = {
  single: ['核心信息'],
  three: ['过去', '现在', '未来'],
  'celtic-cross': ['现状', '挑战', '基础', '过去', '可能', '近期', '自我', '环境', '希望与恐惧', '结果'],
} as const

function seeded(seed: number) {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 2 ** 32
  }
}

export async function drawTarot(question: string, spread: TarotFacts['spread'], seedInput?: string): Promise<UniversalSnapshot<TarotFacts>> {
  const seed = seedInput || crypto.randomUUID()
  const random = seeded(parseInt((await hash(seed)).slice(0, 8), 16))
  const deck = [...TAROT_DECK]
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[deck[index], deck[target]] = [deck[target], deck[index]]
  }
  const cards = SPREAD_POSITIONS[spread].map((position, index) => ({
    position,
    ...deck[index],
    reversed: random() > 0.68,
    keywords: deck[index].arcana === '大阿尔卡纳' ? ['人生阶段', '核心课题'] : ['具体处境', '行动线索'],
  }))
  return snapshot('tarot', null, null, 'xuanji-tarot', '1.0.0', { spread }, { question, spread, seed, cards })
}

const HEXAGRAMS = ['乾', '坤', '屯', '蒙', '需', '讼', '师', '比', '小畜', '履', '泰', '否', '同人', '大有', '谦', '豫', '随', '蛊', '临', '观', '噬嗑', '贲', '剥', '复', '无妄', '大畜', '颐', '大过', '坎', '离', '咸', '恒', '遁', '大壮', '晋', '明夷', '家人', '睽', '蹇', '解', '损', '益', '夬', '姤', '萃', '升', '困', '井', '革', '鼎', '震', '艮', '渐', '归妹', '丰', '旅', '巽', '兑', '涣', '节', '中孚', '小过', '既济', '未济']
const TRIGRAMS = ['坤', '震', '坎', '兑', '艮', '离', '巽', '乾']

export async function castIChing(question: string, method: IChingFacts['method'], numbers?: number[]): Promise<UniversalSnapshot<IChingFacts>> {
  const seed = numbers?.join('-') || crypto.randomUUID()
  const random = seeded(parseInt((await hash(seed)).slice(0, 8), 16))
  const lines = Array.from({ length: 6 }, (_, index) => numbers?.[index] ?? (Math.floor(random() * 4) + 6))
  const bits = lines.map((line) => line % 2)
  const changedBits = lines.map((line) => (line === 6 || line === 9 ? 1 - (line % 2) : line % 2))
  const number = parseInt([...bits].reverse().join(''), 2) + 1
  const changedNumber = parseInt([...changedBits].reverse().join(''), 2) + 1
  const toHexagram = (value: number, values: number[]) => ({
    number: value,
    name: HEXAGRAMS[value - 1],
    lower: TRIGRAMS[parseInt(values.slice(0, 3).reverse().join(''), 2)],
    upper: TRIGRAMS[parseInt(values.slice(3, 6).reverse().join(''), 2)],
  })
  const facts: IChingFacts = {
    question,
    method,
    seed,
    primary: toHexagram(number, bits),
    changingLines: lines.flatMap((line, index) => (line === 6 || line === 9 ? [index + 1] : [])),
    changed: toHexagram(changedNumber, changedBits),
    lines,
  }
  return snapshot('iching', null, null, 'xuanji-iching', '1.0.0', { method }, facts)
}

export async function calculateCompatibility(primary: BirthProfile, secondary: BirthProfile): Promise<UniversalSnapshot<CompatibilityFacts>> {
  const [firstBazi, secondBazi, firstWestern, secondWestern] = await Promise.all([
    calculateBazi(primary), calculateBazi(secondary), calculateWestern(primary), calculateWestern(secondary),
  ])
  const baziShared = Object.keys(firstBazi.facts.elements).filter((key) => Math.abs(firstBazi.facts.elements[key as keyof typeof firstBazi.facts.elements] - secondBazi.facts.elements[key as keyof typeof secondBazi.facts.elements]) <= 1)
  const sunA = firstWestern.facts.planets[0]
  const sunB = secondWestern.facts.planets[0]
  const sunDistance = angularDistance(sunA.longitude, sunB.longitude)
  const baziScore = Math.min(95, 55 + baziShared.length * 8)
  const westernScore = Math.round(92 - Math.min(42, Math.abs(60 - sunDistance) / 3))
  const facts: CompatibilityFacts = {
    primaryProfileId: primary.id,
    secondaryProfileId: secondary.id,
    systems: [
      { mode: 'bazi', score: baziScore, strengths: baziShared.map((item) => `${item}元素节奏接近`), tensions: baziShared.length < 2 ? ['五行节奏差异较大'] : [], evidence: [`${firstBazi.facts.dayMaster}日主 × ${secondBazi.facts.dayMaster}日主`] },
      { mode: 'western', score: westernScore, strengths: [`太阳落座为${sunA.sign}与${sunB.sign}`], tensions: sunDistance > 120 ? ['核心表达方式需要主动翻译'] : [], evidence: [`太阳夹角 ${sunDistance.toFixed(1)}°`] },
    ],
    overallScore: Math.round((baziScore + westernScore) / 2),
  }
  return snapshot('compatibility', primary.id, secondary.id, 'xuanji-compatibility', '1.0.0', { systems: ['bazi', 'western'] }, facts)
}

export async function calculateDaily(profile: BirthProfile, date: string): Promise<UniversalSnapshot<DailyFacts>> {
  const value = parseInt((await hash({ profile: profile.id, date })).slice(0, 8), 16)
  const areas: DailyFacts['signals'][number]['area'][] = ['整体', '事业', '关系', '身心']
  const signals = areas.map((area, index) => {
    const score = 55 + ((value >> (index * 4)) % 41)
    return { area, score, title: score >= 75 ? '顺势推进' : score >= 65 ? '稳步整理' : '留意节奏', detail: score >= 75 ? '适合处理需要主动表达和决定的事情。' : score >= 65 ? '把已有事项收口，比开启更多任务更有效。' : '减少临时承诺，给判断留出余量。' }
  })
  const ranked = [...signals].sort((a, b) => b.score - a.score)
  return snapshot('daily', profile.id, null, 'xuanji-daily', '1.0.0', { date }, { date, profileId: profile.id, signals, focus: ranked[0].area, caution: ranked.at(-1)?.area ?? '整体' })
}

async function snapshot<TFacts, TMethodology>(mode: DivinationMode, profileId: string | null, secondaryProfileId: string | null, engineId: string, engineVersion: string, methodology: TMethodology, facts: TFacts): Promise<UniversalSnapshot<TFacts, TMethodology>> {
  const inputHash = await hash({ mode, profileId, secondaryProfileId, methodology, facts })
  return { id: crypto.randomUUID(), profileId, secondaryProfileId, mode, inputHash, engineId, engineVersion, methodology, facts, createdAt: new Date().toISOString() }
}
