import type { ChartSnapshot, Evidence, ReadingSection } from './types'

const ELEMENT_TRAITS: Record<string, string> = {
  木: '生长、规划与向外展开',
  火: '表达、行动与可见度',
  土: '承载、整合与稳定推进',
  金: '判断、边界与结构化',
  水: '观察、流动与信息感知',
}

type Rule = {
  id: string
  version: '1.0.0'
  evaluate: (snapshot: ChartSnapshot) => Evidence | null
}

const elements = ['木', '火', '土', '金', '水'] as const
const tenGodNames = [
  '比肩',
  '劫财',
  '食神',
  '伤官',
  '偏财',
  '正财',
  '七杀',
  '正官',
  '偏印',
  '正印',
]

function evidence(
  rule: Rule,
  id: string,
  title: string,
  summary: string,
  factRefs: string[],
): Evidence {
  return {
    id,
    ruleId: rule.id,
    ruleVersion: rule.version,
    title,
    summary,
    factRefs,
  }
}

const dayMasterRule: Rule = {
  id: 'bazi.day-master',
  version: '1.0.0',
  evaluate(snapshot) {
    const pillar = snapshot.facts.pillars[2]
    const element = pillar.element.slice(0, 1)
    return evidence(
      this,
      'day-master',
      `日主 ${pillar.stem}${element}`,
      `日柱天干为 ${pillar.stem}，对应${ELEMENT_TRAITS[element]}。`,
      ['facts.pillars[2].stem'],
    )
  },
}

const elementRules: Rule[] = elements.flatMap((element) => [
  {
    id: `bazi.element.${element}.dominant`,
    version: '1.0.0',
    evaluate(snapshot) {
      const count = snapshot.facts.elements[element]
      const max = Math.max(...Object.values(snapshot.facts.elements))
      return count === max && count >= 2
        ? evidence(
            this,
            `dominant-${element}`,
            `${element}元素最集中`,
            `${element}出现 ${count} 次，主题更容易围绕${ELEMENT_TRAITS[element]}展开。`,
            [`facts.elements.${element}`],
          )
        : null
    },
  },
  {
    id: `bazi.element.${element}.weak`,
    version: '1.0.0',
    evaluate(snapshot) {
      const count = snapshot.facts.elements[element]
      const min = Math.min(...Object.values(snapshot.facts.elements))
      return count === min
        ? evidence(
            this,
            `weak-${element}`,
            `${element}元素相对少`,
            `${element}出现 ${count} 次，可主动补充${ELEMENT_TRAITS[element]}。`,
            [`facts.elements.${element}`],
          )
        : null
    },
  },
  {
    id: `bazi.element.${element}.absent`,
    version: '1.0.0',
    evaluate(snapshot) {
      return snapshot.facts.elements[element] === 0
        ? evidence(
            this,
            `absent-${element}`,
            `${element}主气未显`,
            `可见干支主气中没有${element}，这只是结构事实，不等于简单的吉凶判断。`,
            [`facts.elements.${element}`],
          )
        : null
    },
  },
])

const tenGodRules: Rule[] = tenGodNames.map((name) => ({
  id: `bazi.ten-god.${name}`,
  version: '1.0.0',
  evaluate(snapshot) {
    const matches = snapshot.facts.tenGods.filter(
      (item) => item.relation === name,
    )
    return matches.length
      ? evidence(
          this,
          `ten-god-${name}`,
          `${name}在天干出现`,
          `${name}出现在${matches.map((item) => item.pillar).join('、')}，解读时可结合对应位置观察。`,
          ['facts.tenGods'],
        )
      : null
  },
}))

const contextRules: Rule[] = [
  {
    id: 'bazi.luck.forward',
    version: '1.0.0',
    evaluate(snapshot) {
      return snapshot.facts.luckCycle.direction === 'forward'
        ? evidence(
            this,
            'luck-forward',
            '大运顺排',
            snapshot.facts.luckCycle.reason,
            ['facts.luckCycle.direction'],
          )
        : null
    },
  },
  {
    id: 'bazi.luck.backward',
    version: '1.0.0',
    evaluate(snapshot) {
      return snapshot.facts.luckCycle.direction === 'backward'
        ? evidence(
            this,
            'luck-backward',
            '大运逆排',
            snapshot.facts.luckCycle.reason,
            ['facts.luckCycle.direction'],
          )
        : null
    },
  },
  {
    id: 'bazi.luck.undetermined',
    version: '1.0.0',
    evaluate(snapshot) {
      return snapshot.facts.luckCycle.direction === 'undetermined'
        ? evidence(
            this,
            'luck-undetermined',
            '大运顺逆未定',
            snapshot.facts.luckCycle.reason,
            ['facts.luckCycle.direction'],
          )
        : null
    },
  },
  {
    id: 'bazi.time.true-solar',
    version: '1.0.0',
    evaluate(snapshot) {
      return snapshot.methodology.timeBasis === 'true-solar'
        ? evidence(
            this,
            'true-solar-time',
            '采用真太阳时',
            `计算时间为 ${snapshot.facts.normalizedTime.calculationDate} ${snapshot.facts.normalizedTime.calculationTime}。`,
            ['methodology.timeBasis', 'facts.normalizedTime'],
          )
        : null
    },
  },
  {
    id: 'bazi.time.approximate',
    version: '1.0.0',
    evaluate(snapshot) {
      return snapshot.facts.normalizedTime.disambiguation === 'compatible'
        ? evidence(
            this,
            'approximate-time',
            '出生时间存在边界不确定性',
            '该时间使用兼容方式处理 DST 跳转或重复区间。',
            ['facts.normalizedTime.disambiguation'],
          )
        : null
    },
  },
  {
    id: 'bazi.time.unknown',
    version: '1.0.0',
    evaluate(snapshot) {
      return snapshot.facts.normalizedTime.disambiguation === 'unknown-noon'
        ? evidence(
            this,
            'unknown-time',
            '出生时辰未知',
            '系统使用当地中午生成占位时柱，涉及时柱的判断应降低权重。',
            ['facts.normalizedTime.disambiguation'],
          )
        : null
    },
  },
  {
    id: 'bazi.polarity.yang-heavy',
    version: '1.0.0',
    evaluate(snapshot) {
      const count = snapshot.facts.pillars.filter(
        (item) => item.yinYang === '阳',
      ).length
      return count >= 3
        ? evidence(
            this,
            'yang-heavy',
            '天干阳性较集中',
            `四个天干中有 ${count} 个为阳。`,
            ['facts.pillars'],
          )
        : null
    },
  },
  {
    id: 'bazi.polarity.yin-heavy',
    version: '1.0.0',
    evaluate(snapshot) {
      const count = snapshot.facts.pillars.filter(
        (item) => item.yinYang === '阴',
      ).length
      return count >= 3
        ? evidence(
            this,
            'yin-heavy',
            '天干阴性较集中',
            `四个天干中有 ${count} 个为阴。`,
            ['facts.pillars'],
          )
        : null
    },
  },
  {
    id: 'bazi.hidden-stems.present',
    version: '1.0.0',
    evaluate() {
      return evidence(
        this,
        'hidden-stems',
        '地支藏干已记录',
        '报告可追溯每个地支的藏干，但主摘要优先使用可见干支事实。',
        ['facts.hiddenStems'],
      )
    },
  },
]

export const RULE_PACK: Rule[] = [
  dayMasterRule,
  ...elementRules,
  ...tenGodRules,
  ...contextRules,
]

export function evaluateSnapshot(snapshot: ChartSnapshot) {
  const evidenceItems = RULE_PACK.map((rule) => rule.evaluate(snapshot)).filter(
    (item): item is Evidence => Boolean(item),
  )
  const entries = [...Object.entries(snapshot.facts.elements)].sort(
    ([, left], [, right]) => right - left,
  )
  const [dominant] = entries[0] ?? ['土', 0]
  const [weakest] = entries.at(-1) ?? ['水', 0]
  const mainEvidence = evidenceItems.filter(
    (item) =>
      item.id === 'day-master' ||
      item.id.startsWith('dominant-') ||
      item.id.startsWith('weak-'),
  )
  const sections: ReadingSection[] = [
    {
      id: 'claim-core-structure',
      title: '核心结构',
      body: `日主为${snapshot.facts.dayMaster}，${dominant}最集中，${weakest}相对少。`,
      evidenceIds: mainEvidence.map((item) => item.id),
    },
    {
      id: 'claim-action-focus',
      title: '行动重点',
      body: `保留${ELEMENT_TRAITS[dominant]}，同时补充${ELEMENT_TRAITS[weakest]}。`,
      evidenceIds: evidenceItems
        .filter(
          (item) =>
            item.id.startsWith('dominant-') ||
            item.id.startsWith('weak-') ||
            item.id.startsWith('absent-'),
        )
        .map((item) => item.id),
    },
  ]
  return {
    evidence: evidenceItems,
    sections,
    dominant,
    weakest,
    rulePackVersion: 'bazi-core-1.0.0',
  }
}
