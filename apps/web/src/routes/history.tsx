import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '../lib/api-client'
import type { Reading, UniversalReport, UniversalSnapshot } from '../lib/types'

export const Route = createFileRoute('/history')({ ssr: false, component: HistoryPage })

const LABELS: Record<string, string> = { bazi: '八字', western: '西方本命盘', transit: '当前行运', ziwei: '紫微斗数', tarot: '塔罗', iching: '易经', compatibility: '合盘', comprehensive: '综合报告', daily: '每日运势' }

function HistoryPage() {
  const [legacy, setLegacy] = useState<Array<Reading & { profileName: string }>>([])
  const [snapshots, setSnapshots] = useState<Array<UniversalSnapshot & { profileName?: string; secondaryProfileName?: string }>>([])
  const [reports, setReports] = useState<UniversalReport[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    void Promise.all([api.listReadings(), api.listDivinations(), api.listUniversalReports()])
      .then(([oldItems, results, reportItems]) => { setLegacy(oldItems); setSnapshots(results); setReports(reportItems) })
      .finally(() => setLoading(false))
  }, [])
  return <div className="content-page"><header><span className="section-number">历史</span><h1>所有结果与报告</h1><p>跨八字、西占、紫微、塔罗、易经、合盘和日运恢复记录。</p></header>
    {loading ? <p>正在读取…</p> : <>
      <section className="history-section"><h2>完整报告</h2><div className="history-list">{reports.map((report) => <Link className="history-card-link" key={report.id} to="/report/$reportId" params={{ reportId: report.id }}><article><div><span>{LABELS[report.mode]}</span><h2>{report.title}</h2><p>{report.summary}</p></div><time>{new Date(report.createdAt).toLocaleString('zh-CN')}</time></article></Link>)}</div></section>
      <section className="history-section"><h2>确定性结果</h2><div className="history-list">{snapshots.map((item) => <article key={item.id}><div><span>{LABELS[item.mode]} · {item.profileName ?? '独立占问'}</span><h2>{item.secondaryProfileName ? `${item.profileName} × ${item.secondaryProfileName}` : LABELS[item.mode]}</h2><p>{item.engineId} {item.engineVersion}</p></div><time>{new Date(item.createdAt).toLocaleString('zh-CN')}</time></article>)}</div></section>
      {legacy.length ? <section className="history-section"><h2>早期八字报告</h2><div className="history-list">{legacy.map((reading) => <Link className="history-card-link" key={reading.id} to="/reading/$readingId" params={{ readingId: reading.id }}><article><div><span>{reading.profileName}</span><h2>{reading.title}</h2><p>{reading.summary}</p></div><time>{new Date(reading.createdAt).toLocaleString('zh-CN')}</time></article></Link>)}</div></section> : null}
    </>}
  </div>
}
