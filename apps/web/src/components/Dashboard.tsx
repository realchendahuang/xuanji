import { Link } from '@tanstack/react-router'

const FEATURES = [
  { mode: 'bazi', title: '八字', text: '四柱、十神、五行、大运与规则依据。' },
  { mode: 'western', title: '西方占星', text: '本命盘、宫位、相位与当前行运。' },
  { mode: 'ziwei', title: '紫微斗数', text: '十二宫、主星、四化与大限。' },
  { mode: 'daily', title: '每日运势', text: '按个人档案和日期生成当日提示。' },
  { mode: 'compatibility', title: '合盘', text: '八字与西占双系统关系分析。' },
  { mode: 'tarot', title: '塔罗', text: '单牌、三牌与凯尔特十字。' },
  { mode: 'iching', title: '易经', text: '数字起卦或随机起卦，保存动爻和变卦。' },
  { mode: 'comprehensive', title: '综合报告', text: '聚合多个已生成结果，形成统一报告。' },
] as const

export function Dashboard() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <span className="section-number">PERSONAL ORACLE</span>
        <h1>一个人的玄机工作台</h1>
        <p>先计算，再解释。每个结论都保留来源、方法和版本。</p>
        <div className="hero-actions">
          <Link className="primary-button" to="/profiles/new">新建出生资料</Link>
          <Link className="secondary-button" to="/profiles">选择已有资料</Link>
        </div>
      </section>
      <section className="feature-grid" aria-label="功能入口">
        {FEATURES.map((feature, index) => (
          <Link
            className="feature-card"
            key={feature.mode}
            to="/divination/$mode"
            params={{ mode: feature.mode }}
            search={{ profile: '' }}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
            <b>进入 →</b>
          </Link>
        ))}
      </section>
    </div>
  )
}
