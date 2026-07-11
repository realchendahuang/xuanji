import type { ChartSnapshot, Evidence, ReadingSection } from './types'

const ELEMENT_TRAITS: Record<string, string> = {
  木: '生长、规划与向外展开',
  火: '表达、行动与可见度',
  土: '承载、整合与稳定推进',
  金: '判断、边界与结构化',
  水: '观察、流动与信息感知',
}

export function evaluateSnapshot(snapshot: ChartSnapshot) {
  const entries = [...Object.entries(snapshot.facts.elements)].sort(
    ([, left], [, right]) => right - left,
  )
  const [dominant, dominantCount] = entries[0] ?? ['土', 0]
  const [weakest, weakestCount] = entries.at(-1) ?? ['水', 0]
  const dayElement = snapshot.facts.pillars[2]?.element.slice(0, 1) ?? '土'
  const evidence: Evidence[] = [
    {
      id: 'day-master',
      title: `日主 ${snapshot.facts.dayMaster}${dayElement}`,
      summary: `日柱天干为 ${snapshot.facts.dayMaster}，对应${ELEMENT_TRAITS[dayElement]}。`,
      factRefs: ['facts.pillars[2].stem'],
    },
    {
      id: 'dominant-element',
      title: `${dominant}元素最集中`,
      summary: `八个干支主气中，${dominant}出现 ${dominantCount} 次，主题更容易围绕${ELEMENT_TRAITS[dominant]}展开。`,
      factRefs: [`facts.elements.${dominant}`],
    },
    {
      id: 'weakest-element',
      title: `${weakest}元素相对少`,
      summary: `${weakest}出现 ${weakestCount} 次，可以在行动中主动补充${ELEMENT_TRAITS[weakest]}。`,
      factRefs: [`facts.elements.${weakest}`],
    },
  ]
  const sections: ReadingSection[] = [
    {
      title: '核心气质',
      body: `你的日主为${snapshot.facts.dayMaster}${dayElement}，命盘中${dominant}的权重最明显。适合把${ELEMENT_TRAITS[dayElement]}与${ELEMENT_TRAITS[dominant]}放在同一条行动路径上。`,
      evidenceIds: ['day-master', 'dominant-element'],
    },
    {
      title: '行动重点',
      body: `保持已有的${ELEMENT_TRAITS[dominant]}，同时有意识地增加${ELEMENT_TRAITS[weakest]}，会让整体节奏更完整。`,
      evidenceIds: ['dominant-element', 'weakest-element'],
    },
  ]
  return { evidence, sections, dominant, weakest }
}
