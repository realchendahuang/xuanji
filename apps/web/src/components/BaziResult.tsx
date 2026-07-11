import type { ChartSnapshot, Reading } from '../lib/types'
import { ChatPanel } from './ChatPanel'

const ELEMENT_COLOR: Record<string, string> = {
  木: '#2f6b55',
  火: '#b63b2a',
  土: '#9b7347',
  金: '#596474',
  水: '#315d78',
}

export function BaziResult({
  snapshot,
  reading,
}: {
  snapshot: ChartSnapshot
  reading: Reading | null
}) {
  const max = Math.max(...Object.values(snapshot.facts.elements), 1)
  return (
    <div className="result-stack">
      <section className="chart-section">
        <div className="section-heading-row">
          <div>
            <span className="section-number">02</span>
            <h2>四柱命盘</h2>
          </div>
          <span className="method-note">
            {snapshot.methodology.yearBoundary === 'lichun'
              ? '立春换年'
              : '农历新年换年'}{' '}
            ·{' '}
            {snapshot.methodology.timeBasis === 'civil' ? '民用时' : '真太阳时'}{' '}
            · {snapshot.methodology.dayBoundary} 换日
          </span>
        </div>
        <div className="pillars">
          {snapshot.facts.pillars.map((pillar) => (
            <article className="pillar" key={pillar.label}>
              <span>{pillar.label}</span>
              <strong>{pillar.stem}</strong>
              <strong>{pillar.branch}</strong>
              <small>
                {pillar.yinYang}
                {pillar.element}
              </small>
            </article>
          ))}
        </div>
        <div className="chart-meta">
          <span>
            日主 <b>{snapshot.facts.dayMaster}</b>
          </span>
          <span>
            生肖 <b>{snapshot.facts.zodiac}</b>
          </span>
          <span>{snapshot.facts.lunarText}</span>
          <span>
            大运{' '}
            <b>
              {snapshot.facts.luckCycle.direction === 'forward'
                ? '顺排'
                : snapshot.facts.luckCycle.direction === 'backward'
                  ? '逆排'
                  : '未定'}
            </b>
          </span>
        </div>
        <div className="fact-grid">
          {snapshot.facts.pillars.map((pillar, index) => (
            <div key={`${pillar.label}-facts`}>
              <span>{pillar.label}</span>
              <b>{snapshot.facts.tenGods[index]?.relation}</b>
              <small>
                藏干 {snapshot.facts.hiddenStems[index]?.stems.join(' · ')}
              </small>
            </div>
          ))}
        </div>
        {snapshot.facts.luckCycle.decades.length ? (
          <div className="decade-strip">
            {snapshot.facts.luckCycle.decades.map((item) => (
              <div key={item.name}>
                <b>{item.name}</b>
                <span>
                  {item.startAge}–{item.endAge} 岁
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="elements-section">
        <div className="section-heading-row compact">
          <div>
            <span className="section-number">03</span>
            <h2>五行分布</h2>
          </div>
        </div>
        <div className="element-bars">
          {Object.entries(snapshot.facts.elements).map(([element, value]) => (
            <div className="element-row" key={element}>
              <span style={{ color: ELEMENT_COLOR[element] }}>{element}</span>
              <div>
                <i
                  style={{
                    width: `${(value / max) * 100}%`,
                    backgroundColor: ELEMENT_COLOR[element],
                  }}
                />
              </div>
              <b>{value}</b>
            </div>
          ))}
        </div>
      </section>

      {reading ? (
        <>
          <section className="reading-section">
            <div className="reading-title-row">
              <div>
                <span>玄机解读</span>
                <h2>{reading.title}</h2>
              </div>
              <small>via {reading.gatewayId}</small>
            </div>
            <p className="reading-summary">{reading.summary}</p>
            <div className="reading-sections">
              {reading.sections.map((section) => (
                <article key={section.title}>
                  <h3>{section.title}</h3>
                  <p>{section.body}</p>
                </article>
              ))}
            </div>
            <div className="evidence-list">
              {reading.evidence.map((item, index) => (
                <details key={item.id}>
                  <summary>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {item.title}
                  </summary>
                  <p>{item.summary}</p>
                </details>
              ))}
            </div>
          </section>
          <ChatPanel reading={reading} snapshot={snapshot} />
        </>
      ) : null}
    </div>
  )
}
