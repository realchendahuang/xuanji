import type {
  BaziMethodology,
  BirthProfile,
  ChartSnapshot,
  Reading,
} from './types'

type ApiSuccess<T> = { ok: true; data: T }
type ApiFailure = { ok: false; error: { code: string; message: string } }

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const payload: ApiSuccess<T> | ApiFailure = await response.json()
  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? '请求失败' : payload.error.message)
  }
  return payload.data
}

export const api = {
  createProfile(input: Omit<BirthProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    return request<BirthProfile>('/profiles', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  createBazi(profileId: string, methodology?: BaziMethodology) {
    return request<ChartSnapshot>('/charts/bazi', {
      method: 'POST',
      body: JSON.stringify({ profileId, methodology }),
    })
  },
  createReading(snapshotId: string) {
    return request<Reading>('/readings', {
      method: 'POST',
      body: JSON.stringify({ snapshotId }),
    })
  },
  listReadings() {
    return request<Array<Reading & { profileName: string }>>('/readings')
  },
  getReading(readingId: string) {
    return request<Reading>(`/readings/${readingId}`)
  },
}
