import type { UniversalSnapshot } from '../lib/types'

export function UniversalResult({ snapshot }: { snapshot: UniversalSnapshot }) {
  const facts = snapshot.facts as Record<string, unknown>
  return (
    <section className="universal-result">
      <div className="result-title"><div><span className="section-number">RESULT</span><h2>{modeLabel(snapshot.mode)}</h2></div><small>{snapshot.engineId} {snapshot.engineVersion}</small></div>
      {snapshot.mode === 'western' ? <WesternWheel facts={facts} /> : null}
      {snapshot.mode === 'ziwei' ? <ZiweiBoard facts={facts} /> : null}
      {snapshot.mode === 'iching' ? <Hexagram facts={facts} /> : null}
      <div className="facts-table">
        {Object.entries(facts).map(([key, value]) => (
          <details key={key} open={typeof value === 'string' || typeof value === 'number'}>
            <summary>{key}</summary><pre>{typeof value === 'string' ? value : JSON.stringify(value, null, 2)}</pre>
          </details>
        ))}
      </div>
    </section>
  )
}

function modeLabel(mode: string) { return ({ western: '西方本命盘', transit: '当前行运', ziwei: '紫微斗数', tarot: '塔罗牌阵', iching: '易经卦象', compatibility: '关系合盘', daily: '每日运势' } as Record<string, string>)[mode] ?? mode }

function WesternWheel({ facts }: { facts: Record<string, unknown> }) {
  const planets = (facts.planets ?? []) as Array<{ name: string; symbol: string; longitude: number }>
  return <svg className="chart-svg" viewBox="0 0 500 500" role="img" aria-label="西方星盘">
    <circle cx="250" cy="250" r="220" fill="none" stroke="currentColor"/><circle cx="250" cy="250" r="150" fill="none" stroke="currentColor" opacity=".25"/>
    {Array.from({ length: 12 }, (_, index) => { const angle = index * Math.PI / 6; return <line key={index} x1={250 + Math.cos(angle) * 150} y1={250 + Math.sin(angle) * 150} x2={250 + Math.cos(angle) * 220} y2={250 + Math.sin(angle) * 220} stroke="currentColor" opacity=".35"/> })}
    {planets.map((planet) => { const angle = (planet.longitude - 90) * Math.PI / 180; return <g key={planet.name}><circle cx={250 + Math.cos(angle) * 182} cy={250 + Math.sin(angle) * 182} r="15" fill="var(--paper)" stroke="var(--accent)"/><text x={250 + Math.cos(angle) * 182} y={255 + Math.sin(angle) * 182} textAnchor="middle" fontSize="17">{planet.symbol}</text></g> })}
  </svg>
}

function ZiweiBoard({ facts }: { facts: Record<string, unknown> }) {
  const palaces = (facts.palaces ?? []) as Array<{ name: string; branch: string; stars: string[] }>
  return <div className="ziwei-board">{palaces.map((palace) => <div key={palace.name}><span>{palace.branch}</span><b>{palace.name}</b><small>{palace.stars.join(' · ') || '—'}</small></div>)}</div>
}

function Hexagram({ facts }: { facts: Record<string, unknown> }) {
  const lines = (facts.lines ?? []) as number[]
  return <div className="hexagram">{[...lines].reverse().map((line, index) => <div key={index} className={line % 2 ? 'yang' : 'yin'}><i/><i/></div>)}</div>
}
