import { useState } from 'react'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { BaziResult } from '../components/BaziResult'
import { api } from '../lib/api-client'
import type { ChartSnapshot, Reading, TimePrecision } from '../lib/types'

export const Route = createFileRoute('/')({ ssr: false, component: Home })

function Home() {
  const [name, setName] = useState('')
  const [localDate, setLocalDate] = useState('1990-01-01')
  const [localTime, setLocalTime] = useState('12:00')
  const [location, setLocation] = useState('上海')
  const [timePrecision, setTimePrecision] = useState<TimePrecision>('exact')
  const [snapshot, setSnapshot] = useState<ChartSnapshot | null>(null)
  const [reading, setReading] = useState<Reading | null>(null)
  const [status, setStatus] = useState<'idle' | 'chart' | 'reading'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSnapshot(null)
    setReading(null)
    setStatus('chart')
    try {
      const profile = await api.createProfile({
        name: name.trim() || '未命名命盘',
        localDate,
        localTime: timePrecision === 'unknown' ? '12:00' : localTime,
        timePrecision,
        location: {
          label: location,
          latitude: 31.2304,
          longitude: 121.4737,
          timeZone: 'Asia/Shanghai',
        },
      })
      const chart = await api.createBazi(profile.id)
      setSnapshot(chart)
      setStatus('reading')
      const generated = await api.createReading(chart.id)
      setReading(generated)
      setStatus('idle')
    } catch (cause) {
      setStatus('idle')
      setError(cause instanceof Error ? cause.message : '生成失败，请重试')
    }
  }

  return (
    <div className="workspace-shell">
      <aside className="profile-rail">
        <div className="rail-intro">
          <span className="section-number">01</span>
          <h1>建立你的命盘</h1>
          <p>输入出生信息，确定性计算四柱，再由 AI 解释结构与重点。</p>
        </div>
        <form className="profile-form" onSubmit={handleSubmit}>
          <label>
            姓名
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="如何称呼你"
            />
          </label>
          <label>
            出生日期
            <input
              type="date"
              required
              value={localDate}
              onChange={(event) => setLocalDate(event.target.value)}
            />
          </label>
          <label>
            出生时间
            <input
              type="time"
              disabled={timePrecision === 'unknown'}
              required
              value={localTime}
              onChange={(event) => setLocalTime(event.target.value)}
            />
          </label>
          <label>
            出生地点
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="城市"
            />
          </label>
          <fieldset>
            <legend>时间精度</legend>
            <div className="precision-options">
              {(
                [
                  ['exact', '准确'],
                  ['approximate', '大约'],
                  ['unknown', '未知'],
                ] as const
              ).map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="precision"
                    value={value}
                    checked={timePrecision === value}
                    onChange={() => setTimePrecision(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <button
            className="primary-button"
            type="submit"
            disabled={status !== 'idle'}
          >
            {status === 'chart'
              ? '正在排盘'
              : status === 'reading'
                ? '正在解读'
                : '开始排盘'}
            {status === 'idle' ? (
              <ArrowRight size={18} />
            ) : (
              <LoaderCircle className="spin" size={18} />
            )}
          </button>
          {error ? <p className="form-error">{error}</p> : null}
        </form>
        <div className="rail-footnote">
          <span>Engine</span>
          <b>tyme4ts 1.5.2</b>
          <span>AI Gateway</span>
          <b>xuanji</b>
        </div>
      </aside>
      <div className="result-canvas">
        {snapshot ? (
          <BaziResult snapshot={snapshot} reading={reading} />
        ) : (
          <div className="empty-canvas">
            <div className="orbital-mark">
              <i />
              <i />
              <strong>玄</strong>
            </div>
            <h2>从确定的时间，读出结构</h2>
            <p>四柱、五行与解读会在这里展开。</p>
          </div>
        )}
      </div>
    </div>
  )
}
