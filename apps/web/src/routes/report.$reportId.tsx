import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '../lib/api-client'
import type { UniversalReport } from '../lib/types'

export const Route = createFileRoute('/report/$reportId')({ ssr: false, component: UniversalReportPage })

function UniversalReportPage() {
  const { reportId } = Route.useParams()
  const [report, setReport] = useState<UniversalReport | null>(null)
  useEffect(() => { void api.getUniversalReport(reportId).then(setReport) }, [reportId])
  if (!report) return <main className="standalone-page"><p>正在加载报告…</p></main>
  return <main className="report-page"><header><span className="section-number">REPORT</span><h1>{report.title}</h1><p>{report.summary}</p><div className="report-actions"><button onClick={() => window.print()}>导出 PDF</button><button onClick={() => downloadSvg(report)}>下载分享图</button></div></header><div className="reading-sections">{report.sections.map((section) => <article key={section.id}><h2>{section.title}</h2><p>{section.body}</p></article>)}</div><section className="evidence-list"><h2>依据</h2>{report.evidence.map((item) => <details key={item.id}><summary>{item.title}</summary><p>{item.summary}</p><small>{item.factRefs.join(' · ')}</small></details>)}</section></main>
}

function downloadSvg(report: UniversalReport) {
  const safe = (value: string) => value.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char] ?? char)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500"><rect width="100%" height="100%" fill="#f8f5ee"/><text x="90" y="130" font-family="serif" font-size="38" fill="#a93628">玄机 XuanJi</text><text x="90" y="230" font-family="serif" font-size="72" fill="#171817">${safe(report.title)}</text><foreignObject x="90" y="310" width="1020" height="900"><div xmlns="http://www.w3.org/1999/xhtml" style="font:36px/1.8 serif;color:#30332f">${safe(report.summary)}</div></foreignObject><text x="90" y="1400" font-family="sans-serif" font-size="22" fill="#747873">${report.createdAt.slice(0, 10)} · ${safe(report.gatewayId)}</text></svg>`
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); link.download = `${report.title}.svg`; link.click(); URL.revokeObjectURL(link.href)
}
