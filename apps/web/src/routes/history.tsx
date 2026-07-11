import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '../lib/api-client'
import type { Reading } from '../lib/types'

export const Route = createFileRoute('/history')({
  ssr: false,
  component: HistoryPage,
})

function HistoryPage() {
  const [readings, setReadings] = useState<
    Array<Reading & { profileName: string }>
  >([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    void api
      .listReadings()
      .then(setReadings)
      .finally(() => setLoading(false))
  }, [])
  return (
    <div className="content-page">
      <header>
        <span className="section-number">历史</span>
        <h1>命盘与报告</h1>
        <p>每次排盘保留独立 Snapshot，报告始终引用原始计算结果。</p>
      </header>
      {loading ? (
        <p>正在读取…</p>
      ) : readings.length === 0 ? (
        <div className="empty-list">
          还没有报告。<Link to="/">建立第一份命盘</Link>
        </div>
      ) : (
        <div className="history-list">
          {readings.map((reading) => (
            <Link
              className="history-card-link"
              key={reading.id}
              to="/reading/$readingId"
              params={{ readingId: reading.id }}
            >
              <article>
                <div>
                  <span>{reading.profileName}</span>
                  <h2>{reading.title}</h2>
                  <p>{reading.summary}</p>
                </div>
                <time>
                  {new Date(reading.createdAt).toLocaleString('zh-CN')}
                </time>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
