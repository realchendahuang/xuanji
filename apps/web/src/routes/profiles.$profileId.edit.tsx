import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '../lib/api-client'
import type { BirthProfile } from '../lib/types'

export const Route = createFileRoute('/profiles/$profileId/edit')({
  ssr: false,
  component: EditProfile,
})

function EditProfile() {
  const { profileId } = Route.useParams()
  const [profile, setProfile] = useState<BirthProfile | null>(null)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    api.getProfile(profileId).then(setProfile)
  }, [profileId])
  if (!profile)
    return (
      <main className="standalone-page">
        <p>正在加载出生资料…</p>
      </main>
    )
  return (
    <main className="standalone-page">
      <span className="section-number">出生资料</span>
      <h1>编辑资料</h1>
      <form
        className="profile-form"
        onSubmit={(event) => {
          event.preventDefault()
          api
            .updateProfile(profileId, {
              name: profile.name,
              localDate: profile.localDate,
              localTime: profile.localTime,
              timePrecision: profile.timePrecision,
              gender: profile.gender,
              location: profile.location,
            })
            .then((item) => {
              setProfile(item)
              setSaved(true)
            })
        }}
      >
        <label>
          姓名
          <input
            value={profile.name}
            onChange={(event) =>
              setProfile({ ...profile, name: event.target.value })
            }
          />
        </label>
        <label>
          出生日期
          <input
            type="date"
            value={profile.localDate}
            onChange={(event) =>
              setProfile({ ...profile, localDate: event.target.value })
            }
          />
        </label>
        <label>
          出生时间
          <input
            type="time"
            value={profile.localTime}
            onChange={(event) =>
              setProfile({ ...profile, localTime: event.target.value })
            }
          />
        </label>
        <button className="primary-button" type="submit">
          保存
        </button>
        {saved ? <p>已保存并写入新版本。</p> : null}
      </form>
    </main>
  )
}
