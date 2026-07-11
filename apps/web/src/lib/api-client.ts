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
  getProfile(profileId: string) {
    return request<BirthProfile>(`/profiles/${profileId}`)
  },
  updateProfile(
    profileId: string,
    input: Partial<Omit<BirthProfile, 'id' | 'createdAt' | 'updatedAt'>>,
  ) {
    return request<BirthProfile>(`/profiles/${profileId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  },
  createBazi(profileId: string, methodology?: BaziMethodology) {
    return request<ChartSnapshot>('/charts/bazi', {
      method: 'POST',
      body: JSON.stringify({ profileId, methodology }),
    })
  },
  getSnapshot(snapshotId: string) {
    return request<ChartSnapshot>(`/charts/${snapshotId}`)
  },
  createReading(snapshotId: string) {
    return request<Reading>('/readings', {
      method: 'POST',
      body: JSON.stringify({ snapshotId }),
    })
  },
  async createReadingStream(
    snapshotId: string,
    onPhase?: (phase: string) => void,
  ) {
    const response = await fetch('/api/v1/readings/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshotId }),
    })
    if (!response.ok || !response.body) throw new Error('无法生成流式报告')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let streamDone = false
    while (!streamDone) {
      const { done, value } = await reader.read()
      streamDone = done
      buffer += decoder.decode(value, { stream: !streamDone })
      buffer = buffer.replaceAll('\r\n', '\n')
      if (streamDone && buffer.trim()) buffer += '\n\n'
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''
      for (const event of events) {
        const type = event.match(/^event: (.+)$/m)?.[1]
        const raw = event.match(/^data: (.+)$/m)?.[1]
        if (!raw) continue
        const payload = JSON.parse(raw) as {
          phase?: string
          ok?: boolean
          data?: Reading
        }
        if (type === 'status' && payload.phase) onPhase?.(payload.phase)
        if (type === 'reading' && payload.ok && payload.data)
          return payload.data
      }
    }
    throw new Error('报告流提前结束')
  },
  listReadings() {
    return request<Array<Reading & { profileName: string }>>('/readings')
  },
  getReading(readingId: string) {
    return request<Reading>(`/readings/${readingId}`)
  },
}
