import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '../lib/api-client'
import type { BirthProfile } from '../lib/types'

export const Route = createFileRoute('/profiles')({ ssr: false, component: ProfilesPage })

function ProfilesPage() {
  const [profiles, setProfiles] = useState<BirthProfile[]>([])
  useEffect(() => { void api.listProfiles().then(setProfiles) }, [])
  return (
    <div className="content-page">
      <header><span className="section-number">出生资料</span><h1>我的档案</h1><p>一份准确资料可以用于八字、西占、紫微、日运和合盘。</p></header>
      <div className="page-actions"><Link className="primary-button" to="/profiles/new">新建资料</Link></div>
      <div className="profile-card-grid">
        {profiles.map((profile) => (
          <article className="profile-card" key={profile.id}>
            <span>{profile.location.label}</span><h2>{profile.name}</h2>
            <p>{profile.localDate} · {profile.localTime} · {profile.location.timeZone}</p>
            <div><Link to="/divination/$mode" params={{ mode: 'bazi' }} search={{ profile: profile.id }}>开始解读</Link><Link to="/profiles/$profileId/edit" params={{ profileId: profile.id }}>编辑</Link></div>
          </article>
        ))}
      </div>
    </div>
  )
}
