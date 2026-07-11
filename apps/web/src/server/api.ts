import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { streamSSE } from 'hono/streaming'
import { calculateBazi } from '../lib/bazi'
import {
  getProfile,
  getReading,
  getSnapshot,
  insertProfile,
  insertReading,
  insertSnapshot,
  listProfiles,
  listReadings,
  updateProfile,
} from '../lib/db'
import { evaluateSnapshot } from '../lib/rules'
import { DeepSeekGatewayAdapter } from '../lib/model'
import type { BirthProfile, Reading } from '../lib/types'

const profileSchema = z.object({
  name: z.string().trim().min(1).max(40),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  localTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default('12:00'),
  timePrecision: z.enum(['exact', 'approximate', 'unknown']).default('exact'),
  gender: z.enum(['male', 'female', 'unspecified']).default('unspecified'),
  location: z.object({
    label: z.string().trim().min(1).max(80),
    latitude: z.number().min(-90).max(90).default(31.2304),
    longitude: z.number().min(-180).max(180).default(121.4737),
    timeZone: z.string().default('Asia/Shanghai'),
  }),
})

const chartSchema = z.object({ profileId: z.string().uuid() }).extend({
  methodology: z
    .object({
      yearBoundary: z.enum(['lichun', 'lunar-new-year']).default('lichun'),
      dayBoundary: z.enum(['23:00', '00:00']).default('00:00'),
      timeBasis: z.enum(['civil', 'true-solar']).default('civil'),
      luckCycleVersion: z.string().default('dayun-v1'),
      engine: z.literal('tyme4ts').default('tyme4ts'),
    })
    .optional(),
})
const readingSchema = z.object({ snapshotId: z.string().uuid() })

async function generateReading(
  env: Env,
  snapshot: NonNullable<Awaited<ReturnType<typeof getSnapshot>>>,
) {
  const evaluated = evaluateSnapshot(snapshot)
  const deterministicSummary = `日主${snapshot.facts.dayMaster}，${evaluated.dominant}元素最集中，${evaluated.weakest}元素相对少。`
  let summary = deterministicSummary
  try {
    const text = await new DeepSeekGatewayAdapter(
      env as Env & { DEEPSEEK_API_KEY: string },
    ).generate({
      system:
        '你是玄机的命理解读助手。只根据给定命盘事实、规则依据和 Claim 写一段克制、具体、现代的中文摘要，不重新计算命盘，不使用列表，控制在180字以内。',
      prompt: JSON.stringify({
        facts: snapshot.facts,
        evidence: evaluated.evidence,
        claims: evaluated.sections,
      }),
      maxTokens: 300,
    })
    if (text) summary = text
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'reading_ai_fallback',
        error: error instanceof Error ? error.message : String(error),
      }),
    )
  }
  return {
    id: crypto.randomUUID(),
    snapshotId: snapshot.id,
    title: `${snapshot.facts.dayMaster}日主 · 玄机解读`,
    summary,
    sections: evaluated.sections,
    evidence: evaluated.evidence,
    model: env.AI_MODEL,
    gatewayId: env.AI_GATEWAY_ID,
    createdAt: new Date().toISOString(),
  } satisfies Reading
}

export const apiApp = new Hono<{ Bindings: Env }>()
  .basePath('/api/v1')
  .get('/health', async (c) => {
    const row = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>()
    return c.json({
      ok: row?.ok === 1,
      service: 'xuanji',
      gatewayId: c.env.AI_GATEWAY_ID,
      provider: c.env.AI_PROVIDER,
      model: c.env.AI_MODEL,
    })
  })
  .get('/profiles', async (c) =>
    c.json({ ok: true, data: await listProfiles(c.env.DB) }),
  )
  .get('/profiles/:profileId', async (c) => {
    const profile = await getProfile(c.env.DB, c.req.param('profileId'))
    if (!profile)
      return c.json(
        {
          ok: false,
          error: { code: 'PROFILE_NOT_FOUND', message: '出生资料不存在' },
        },
        404,
      )
    return c.json({ ok: true, data: profile })
  })
  .post('/profiles', zValidator('json', profileSchema), async (c) => {
    const input = c.req.valid('json')
    const now = new Date().toISOString()
    const profile: BirthProfile = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    }
    await insertProfile(c.env.DB, profile)
    return c.json({ ok: true, data: profile }, 201)
  })
  .patch(
    '/profiles/:profileId',
    zValidator('json', profileSchema.partial()),
    async (c) => {
      const existing = await getProfile(c.env.DB, c.req.param('profileId'))
      if (!existing)
        return c.json(
          {
            ok: false,
            error: { code: 'PROFILE_NOT_FOUND', message: '出生资料不存在' },
          },
          404,
        )
      const input = c.req.valid('json')
      const profile: BirthProfile = {
        ...existing,
        ...input,
        location: { ...existing.location, ...input.location },
        updatedAt: new Date().toISOString(),
      }
      await updateProfile(c.env.DB, profile)
      return c.json({ ok: true, data: profile })
    },
  )
  .post('/charts/bazi', zValidator('json', chartSchema), async (c) => {
    const { profileId, methodology } = c.req.valid('json')
    const profile = await getProfile(c.env.DB, profileId)
    if (!profile)
      return c.json(
        {
          ok: false,
          error: { code: 'PROFILE_NOT_FOUND', message: '出生资料不存在' },
        },
        404,
      )
    const snapshot = await calculateBazi(profile, methodology)
    await insertSnapshot(c.env.DB, snapshot)
    return c.json({ ok: true, data: snapshot }, 201)
  })
  .get('/charts/:snapshotId', async (c) => {
    const snapshot = await getSnapshot(c.env.DB, c.req.param('snapshotId'))
    if (!snapshot)
      return c.json(
        {
          ok: false,
          error: { code: 'CHART_NOT_FOUND', message: '命盘不存在' },
        },
        404,
      )
    return c.json({ ok: true, data: snapshot })
  })
  .get('/readings', async (c) =>
    c.json({ ok: true, data: await listReadings(c.env.DB) }),
  )
  .post('/readings', zValidator('json', readingSchema), async (c) => {
    const { snapshotId } = c.req.valid('json')
    const snapshot = await getSnapshot(c.env.DB, snapshotId)
    if (!snapshot)
      return c.json(
        {
          ok: false,
          error: { code: 'CHART_NOT_FOUND', message: '命盘不存在' },
        },
        404,
      )
    const reading = await generateReading(c.env, snapshot)
    await insertReading(c.env.DB, reading)
    return c.json({ ok: true, data: reading }, 201)
  })
  .post('/readings/stream', zValidator('json', readingSchema), async (c) => {
    const { snapshotId } = c.req.valid('json')
    const snapshot = await getSnapshot(c.env.DB, snapshotId)
    if (!snapshot)
      return c.json(
        {
          ok: false,
          error: { code: 'CHART_NOT_FOUND', message: '命盘不存在' },
        },
        404,
      )
    return streamSSE(c, async (stream) => {
      const reading = await generateReading(c.env, snapshot)
      await insertReading(c.env.DB, reading)
      await stream.writeSSE({
        event: 'status',
        data: JSON.stringify({ phase: 'interpreting' }),
      })
      await stream.writeSSE({
        event: 'reading',
        data: JSON.stringify({ ok: true, data: reading }),
      })
    })
  })
  .get('/readings/:readingId', async (c) => {
    const reading = await getReading(c.env.DB, c.req.param('readingId'))
    if (!reading)
      return c.json(
        {
          ok: false,
          error: { code: 'READING_NOT_FOUND', message: '报告不存在' },
        },
        404,
      )
    return c.json({ ok: true, data: reading })
  })

export type AppType = typeof apiApp
