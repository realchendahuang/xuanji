import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { BaziResult } from '../components/BaziResult'
import { api } from '../lib/api-client'
import type { ChartSnapshot, Reading } from '../lib/types'

export const Route = createFileRoute('/chart/bazi/$snapshotId')({
  ssr: false,
  component: ChartPage,
})

function ChartPage() {
  const { snapshotId } = Route.useParams()
  const [snapshot, setSnapshot] = useState<ChartSnapshot | null>(null)
  const [reading, setReading] = useState<Reading | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api
      .getSnapshot(snapshotId)
      .then(setSnapshot)
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : '命盘加载失败'),
      )
  }, [snapshotId])
  if (error)
    return (
      <main className="standalone-page">
        <p>{error}</p>
      </main>
    )
  if (!snapshot)
    return (
      <main className="standalone-page">
        <p>正在加载命盘…</p>
      </main>
    )
  return (
    <main className="standalone-page">
      <BaziResult snapshot={snapshot} reading={reading} />
      <button
        className="primary-button"
        onClick={() => api.createReadingStream(snapshot.id).then(setReading)}
      >
        生成 AI 报告
      </button>
    </main>
  )
}
