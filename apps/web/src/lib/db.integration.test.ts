import { readFile } from 'node:fs/promises'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Miniflare } from 'miniflare'
import { z } from 'zod'
import { getProfile, insertProfile, updateProfile } from './db'
import type { BirthProfile } from './types'
import { apiApp } from '../server/api'

let mf: Miniflare
let db: D1Database

beforeAll(async () => {
  mf = new Miniflare({
    modules: true,
    script: `export default { fetch() { return new Response('ok') } }`,
    d1Databases: ['DB'],
    d1Persist: false,
  })
  db = await mf.getD1Database('DB')
  for (const file of [
    '0001_initial.sql',
    '0002_profile_versions.sql',
    '0003_profile_gender.sql',
    '0004_reading_claims_evidence.sql',
    '0005_methodology_rules.sql',
  ]) {
    const sql = await readFile(
      new URL(`../../migrations/${file}`, import.meta.url),
      'utf8',
    )
    for (const statement of sql
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)) {
      await db.prepare(statement).run()
    }
  }
})

afterAll(async () => mf.dispose())

describe('D1 profile repository', () => {
  it('creates, reads and versions profile updates', async () => {
    const profile: BirthProfile = {
      id: crypto.randomUUID(),
      name: '仓储测试',
      localDate: '1990-01-01',
      localTime: '12:00',
      timePrecision: 'exact',
      gender: 'female',
      location: {
        label: '上海',
        latitude: 31.2304,
        longitude: 121.4737,
        timeZone: 'Asia/Shanghai',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await insertProfile(db, profile)
    expect(await getProfile(db, profile.id)).toMatchObject({
      name: '仓储测试',
      gender: 'female',
    })
    await updateProfile(db, {
      ...profile,
      name: '仓储测试二版',
      updatedAt: new Date().toISOString(),
    })
    expect(await getProfile(db, profile.id)).toMatchObject({
      name: '仓储测试二版',
    })
    const versions = await db
      .prepare(
        'SELECT COUNT(*) count FROM birth_profile_versions WHERE profile_id = ?',
      )
      .bind(profile.id)
      .first<{ count: number }>()
    expect(versions?.count).toBe(2)
  })
})

describe('Hono API integration', () => {
  it('validates and persists a profile through the HTTP contract', async () => {
    const response = await apiApp.request(
      '/api/v1/profiles',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'API 测试',
          localDate: '1990-01-01',
          localTime: '12:00',
          timePrecision: 'exact',
          gender: 'unspecified',
          location: {
            label: '上海',
            latitude: 31.2304,
            longitude: 121.4737,
            timeZone: 'Asia/Shanghai',
          },
        }),
      },
      { DB: db },
    )
    const payload = z
      .object({ ok: z.literal(true), data: z.object({ id: z.string() }) })
      .parse(await response.json())
    expect(response.status).toBe(201)
    expect(payload.ok).toBe(true)
    expect(await getProfile(db, payload.data.id)).toMatchObject({
      name: 'API 测试',
    })
  })

  it('returns the unified error shape for a missing profile', async () => {
    const response = await apiApp.request(
      '/api/v1/profiles/00000000-0000-4000-8000-000000000099',
      {},
      { DB: db },
    )
    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: 'PROFILE_NOT_FOUND' },
    })
  })
})
