import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { BaziResult } from '../components/BaziResult'
import { api } from '../lib/api-client'
import type { ChartSnapshot, Reading } from '../lib/types'

export const Route = createFileRoute('/reading/$readingId')({
  ssr: false,
  component: ReadingPage,
})

function ReadingPage() {
  const { readingId } = Route.useParams()
  const [reading, setReading] = useState<Reading | null>(null)
  const [snapshot, setSnapshot] = useState<ChartSnapshot | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api
      .getReading(readingId)
      .then(async (item) => {
        setReading(item)
        setSnapshot(await api.getSnapshot(item.snapshotId))
      })
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : '报告加载失败'),
      )
  }, [readingId])
  if (error)
    return (
      <main className="standalone-page">
        <p>{error}</p>
      </main>
    )
  if (!reading || !snapshot)
    return (
      <main className="standalone-page">
        <p>正在加载报告…</p>
      </main>
    )
  return (
    <main className="standalone-page">
      <BaziResult snapshot={snapshot} reading={reading} />
    </main>
  )
}
