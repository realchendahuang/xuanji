import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { api } from '../lib/api-client'
import { UniversalResult } from '../components/UniversalResult'
import type { BirthProfile, UniversalSnapshot } from '../lib/types'

export const Route = createFileRoute('/divination/$mode')({
  validateSearch: (search: Record<string, unknown>) => ({ profile: typeof search.profile === 'string' ? search.profile : '' }),
  ssr: false,
  component: DivinationPage,
})

const LABELS: Record<string, string> = { bazi: '八字', western: '西方占星', ziwei: '紫微斗数', daily: '每日运势', compatibility: '关系合盘', tarot: '塔罗占问', iching: '易经占问', comprehensive: '综合报告' }

function DivinationPage() {
  const { mode } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<BirthProfile[]>([])
  const [profileId, setProfileId] = useState(search.profile)
  const [secondaryId, setSecondaryId] = useState('')
  const [question, setQuestion] = useState('')
  const [spread, setSpread] = useState<'single' | 'three' | 'celtic-cross'>('three')
  const [snapshot, setSnapshot] = useState<UniversalSnapshot | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { void api.listProfiles().then((items) => { setProfiles(items); if (!profileId && items[0]) setProfileId(items[0].id) }) }, [profileId])

  async function generate(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      let result: UniversalSnapshot
      if (mode === 'tarot') result = await api.drawTarot(question, spread)
      else if (mode === 'iching') result = await api.castIChing(question, 'random')
      else if (mode === 'compatibility') result = await api.createCompatibility(profileId, secondaryId)
      else if (mode === 'bazi') { await navigate({ to: '/profiles/new' }); return }
      else if (mode === 'comprehensive') {
        const items = await api.listDivinations(); const selected = items.filter((item) => item.profileId === profileId).slice(0, 8)
        if (!selected.length) throw new Error('请先为这份资料生成至少一种结果')
        const report = await api.createUniversalReport(selected.map((item) => item.id)); await navigate({ to: '/report/$reportId', params: { reportId: report.id } }); return
      } else result = await api.createDivination(mode as 'western' | 'ziwei' | 'daily', profileId, mode === 'daily' ? { date: new Date().toISOString().slice(0, 10) } : {})
      setSnapshot(result)
    } catch (cause) { setError(cause instanceof Error ? cause.message : '生成失败') } finally { setBusy(false) }
  }

  async function createReport() { if (!snapshot) return; const report = await api.createUniversalReport([snapshot.id]); await navigate({ to: '/report/$reportId', params: { reportId: report.id } }) }
  async function createTransit() { if (!snapshot || snapshot.mode !== 'western' || !profileId) return; setBusy(true); try { setSnapshot(await api.createTransit(profileId, snapshot.id)) } finally { setBusy(false) } }

  return <div className="tool-page"><aside className="tool-panel"><span className="section-number">DIVINATION</span><h1>{LABELS[mode] ?? mode}</h1><form className="profile-form" onSubmit={generate}>
    {!['tarot', 'iching'].includes(mode) ? <label>出生资料<select value={profileId} onChange={(event) => setProfileId(event.target.value)}>{profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.name}</option>)}</select></label> : null}
    {mode === 'compatibility' ? <label>另一份资料<select value={secondaryId} onChange={(event) => setSecondaryId(event.target.value)}><option value="">请选择</option>{profiles.filter((profile) => profile.id !== profileId).map((profile) => <option value={profile.id} key={profile.id}>{profile.name}</option>)}</select></label> : null}
    {['tarot', 'iching'].includes(mode) ? <label>你的问题<textarea value={question} onChange={(event) => setQuestion(event.target.value)} required rows={5}/></label> : null}
    {mode === 'tarot' ? <label>牌阵<select value={spread} onChange={(event) => setSpread(event.target.value as typeof spread)}><option value="single">单牌</option><option value="three">三牌</option><option value="celtic-cross">凯尔特十字</option></select></label> : null}
    <button className="primary-button" disabled={busy}>{busy ? '正在生成…' : '生成结果'}</button>{error ? <p className="form-error">{error}</p> : null}
  </form></aside><div className="tool-result">{snapshot ? <><UniversalResult snapshot={snapshot}/><div className="hero-actions">{snapshot.mode === 'western' ? <button className="secondary-button" onClick={createTransit}>生成当前行运</button> : null}<button className="primary-button" onClick={createReport}>生成 AI 解读</button></div></> : <div className="empty-canvas"><h2>选择参数，生成可追溯结果</h2><p>AI 只负责解释，不参与确定性计算。</p></div>}</div></div>
}
