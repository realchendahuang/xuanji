import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { streamSSE } from 'hono/streaming'
import { calculateBazi } from '../lib/bazi'
import {
  getProfile,
  getReading,
  getSnapshot,
  getUniversalReport,
  getUniversalSnapshot,
  insertProfile,
  insertReading,
  insertSnapshot,
  insertUniversalReport,
  insertUniversalSnapshot,
  listUniversalReports,
  listUniversalSnapshots,
  listProfiles,
  listReadings,
  updateProfile,
} from '../lib/db'
import {
  calculateCompatibility,
  calculateDaily,
  calculateTransit,
  calculateWestern,
  calculateZiwei,
  castIChing,
  drawTarot,
} from '../lib/divination'
import { evaluateSnapshot } from '../lib/rules'
import { DeepSeekGatewayAdapter } from '../lib/model'
import type {
  BirthProfile,
  DivinationMode,
  Evidence,
  Reading,
  UniversalReport,
  UniversalSnapshot,
  WesternFacts,
} from '../lib/types'

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
const profileIdSchema = z.object({ profileId: z.string().uuid() })
const universalReadingSchema = z.object({ snapshotIds: z.array(z.string().uuid()).min(1).max(8) })

const MODE_LABELS: Record<DivinationMode, string> = {
  bazi: '八字', western: '西方本命盘', transit: '当前行运', ziwei: '紫微斗数',
  tarot: '塔罗', iching: '易经', compatibility: '合盘', comprehensive: '综合报告', daily: '每日运势',
}

function deterministicReport(snapshot: UniversalSnapshot) {
  const entries = Object.entries(snapshot.facts as Record<string, unknown>)
  const evidence: Evidence[] = entries.slice(0, 8).map(([key, value], index) => ({
    id: `${snapshot.id}:evidence:${index}`,
    factRefs: [`facts.${key}`],
    ruleId: `${snapshot.mode}-fact-${index + 1}`,
    ruleVersion: '1.0.0',
    title: key,
    summary: typeof value === 'string' || typeof value === 'number' ? String(value) : JSON.stringify(value).slice(0, 240),
  }))
  return {
    evidence,
    sections: [
      { id: 'structure', title: '核心结构', body: `${MODE_LABELS[snapshot.mode]}的确定性结果已生成，以下解读仅引用本次 Snapshot。`, evidenceIds: evidence.slice(0, 3).map((item) => item.id) },
      { id: 'focus', title: '当前重点', body: '优先观察重复出现、彼此呼应的信号，再结合现实处境判断行动顺序。', evidenceIds: evidence.slice(3, 6).map((item) => item.id) },
      { id: 'practice', title: '使用建议', body: '把结果作为复盘与提问工具，不替代医疗、法律、财务或其他专业判断。', evidenceIds: evidence.slice(6).map((item) => item.id) },
    ],
  }
}

async function generateUniversalReport(env: Env, snapshots: UniversalSnapshot[]) {
  const primary = snapshots[0]
  const deterministic = deterministicReport(primary)
  let summary = `${MODE_LABELS[primary.mode]}结果已完成，共记录 ${deterministic.evidence.length} 条可追溯依据。`
  try {
    const generated = await new DeepSeekGatewayAdapter(env as Env & { DEEPSEEK_API_KEY: string }).generate({
      system: '你是玄机的解读助手。只解释传入的确定性 Facts，不补算、不夸大、不做绝对预测。使用自然、具体的中文，给出一段不超过220字的摘要。',
      prompt: JSON.stringify(snapshots.map((item) => ({ mode: item.mode, facts: item.facts }))),
      maxTokens: 420,
    })
    if (generated) summary = generated
  } catch (error) {
    console.error(JSON.stringify({ event: 'universal_report_ai_fallback', error: error instanceof Error ? error.message : String(error) }))
  }
  return {
    id: crypto.randomUUID(),
    mode: snapshots.length > 1 ? 'comprehensive' : primary.mode,
    snapshotIds: snapshots.map((item) => item.id),
    title: snapshots.length > 1 ? '玄机综合报告' : `${MODE_LABELS[primary.mode]} · 玄机解读`,
    summary,
    ...deterministic,
    model: env.AI_MODEL,
    gatewayId: env.AI_GATEWAY_ID,
    createdAt: new Date().toISOString(),
  } satisfies UniversalReport
}

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
  .use('*', async (c, next) => {
    await next()
    c.header('Cache-Control', 'private, no-store')
    c.header('X-Content-Type-Options', 'nosniff')
  })
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
  .get('/locations/search', async (c) => {
    const query = c.req.query('q')?.trim()
    if (!query) return c.json({ ok: true, data: [] })
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=zh&format=json`)
    if (!response.ok) return c.json({ ok: false, error: { code: 'GEOCODING_FAILED', message: '地点搜索暂时不可用' } }, 502)
    const payload = await response.json() as { results?: Array<{ id: number; name: string; admin1?: string; country?: string; latitude: number; longitude: number; timezone: string }> }
    return c.json({ ok: true, data: (payload.results ?? []).map((item) => ({ id: item.id, label: [item.name, item.admin1, item.country].filter(Boolean).join('，'), latitude: item.latitude, longitude: item.longitude, timeZone: item.timezone })) })
  })
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
    await insertUniversalSnapshot(c.env.DB, {
      ...snapshot,
      secondaryProfileId: null,
    })
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
  .post('/divinations/western', zValidator('json', profileIdSchema.extend({ zodiac: z.enum(['tropical', 'sidereal']).default('tropical'), houseSystem: z.enum(['whole-sign', 'placidus']).default('whole-sign') })), async (c) => {
    const input = c.req.valid('json')
    const profile = await getProfile(c.env.DB, input.profileId)
    if (!profile) return c.json({ ok: false, error: { code: 'PROFILE_NOT_FOUND', message: '出生资料不存在' } }, 404)
    const snapshot = await insertUniversalSnapshot(c.env.DB, await calculateWestern(profile, input))
    return c.json({ ok: true, data: snapshot }, 201)
  })
  .post('/divinations/transit', zValidator('json', profileIdSchema.extend({ natalSnapshotId: z.string().uuid(), date: z.string().date().optional() })), async (c) => {
    const input = c.req.valid('json')
    const profile = await getProfile(c.env.DB, input.profileId)
    const natal = await getUniversalSnapshot(c.env.DB, input.natalSnapshotId) as UniversalSnapshot<WesternFacts> | null
    if (!profile || !natal || natal.mode !== 'western') return c.json({ ok: false, error: { code: 'NATAL_NOT_FOUND', message: '本命盘不存在' } }, 404)
    const snapshot = await insertUniversalSnapshot(c.env.DB, await calculateTransit(profile, natal, input.date ? new Date(`${input.date}T12:00:00Z`) : new Date()))
    return c.json({ ok: true, data: snapshot }, 201)
  })
  .post('/divinations/ziwei', zValidator('json', profileIdSchema), async (c) => {
    const { profileId } = c.req.valid('json')
    const profile = await getProfile(c.env.DB, profileId)
    if (!profile) return c.json({ ok: false, error: { code: 'PROFILE_NOT_FOUND', message: '出生资料不存在' } }, 404)
    const snapshot = await insertUniversalSnapshot(c.env.DB, await calculateZiwei(profile))
    return c.json({ ok: true, data: snapshot }, 201)
  })
  .post('/divinations/tarot', zValidator('json', z.object({ question: z.string().trim().min(1).max(500), spread: z.enum(['single', 'three', 'celtic-cross']).default('three') })), async (c) => {
    const { question, spread } = c.req.valid('json')
    const snapshot = await insertUniversalSnapshot(c.env.DB, await drawTarot(question, spread))
    return c.json({ ok: true, data: snapshot }, 201)
  })
  .post('/divinations/iching', zValidator('json', z.object({ question: z.string().trim().min(1).max(500), method: z.enum(['numbers', 'random']).default('random'), numbers: z.array(z.number().int().min(6).max(9)).length(6).optional() })), async (c) => {
    const { question, method, numbers } = c.req.valid('json')
    const snapshot = await insertUniversalSnapshot(c.env.DB, await castIChing(question, method, numbers))
    return c.json({ ok: true, data: snapshot }, 201)
  })
  .post('/divinations/compatibility', zValidator('json', z.object({ primaryProfileId: z.string().uuid(), secondaryProfileId: z.string().uuid() })), async (c) => {
    const { primaryProfileId, secondaryProfileId } = c.req.valid('json')
    const [primary, secondary] = await Promise.all([getProfile(c.env.DB, primaryProfileId), getProfile(c.env.DB, secondaryProfileId)])
    if (!primary || !secondary) return c.json({ ok: false, error: { code: 'PROFILE_NOT_FOUND', message: '请选择两份有效出生资料' } }, 404)
    const snapshot = await insertUniversalSnapshot(c.env.DB, await calculateCompatibility(primary, secondary))
    return c.json({ ok: true, data: snapshot }, 201)
  })
  .post('/divinations/daily', zValidator('json', profileIdSchema.extend({ date: z.string().date().default(() => new Date().toISOString().slice(0, 10)) })), async (c) => {
    const { profileId, date } = c.req.valid('json')
    const profile = await getProfile(c.env.DB, profileId)
    if (!profile) return c.json({ ok: false, error: { code: 'PROFILE_NOT_FOUND', message: '出生资料不存在' } }, 404)
    const snapshot = await insertUniversalSnapshot(c.env.DB, await calculateDaily(profile, date))
    await c.env.PUBLIC_CACHE.put(`daily:${profileId}:${date}`, JSON.stringify(snapshot), { expirationTtl: 60 * 60 * 48 })
    return c.json({ ok: true, data: snapshot }, 201)
  })
  .get('/divinations', async (c) => c.json({ ok: true, data: await listUniversalSnapshots(c.env.DB) }))
  .get('/divinations/:snapshotId', async (c) => {
    const snapshot = await getUniversalSnapshot(c.env.DB, c.req.param('snapshotId'))
    return snapshot ? c.json({ ok: true, data: snapshot }) : c.json({ ok: false, error: { code: 'SNAPSHOT_NOT_FOUND', message: '结果不存在' } }, 404)
  })
  .post('/reports', zValidator('json', universalReadingSchema), async (c) => {
    const { snapshotIds } = c.req.valid('json')
    const loaded = await Promise.all(snapshotIds.map((id) => getUniversalSnapshot(c.env.DB, id)))
    const snapshots = loaded.filter(Boolean) as UniversalSnapshot[]
    if (snapshots.length !== snapshotIds.length) return c.json({ ok: false, error: { code: 'SNAPSHOT_NOT_FOUND', message: '部分计算结果不存在' } }, 404)
    const report = await generateUniversalReport(c.env, snapshots)
    await insertUniversalReport(c.env.DB, report)
    return c.json({ ok: true, data: report }, 201)
  })
  .get('/reports', async (c) => c.json({ ok: true, data: await listUniversalReports(c.env.DB) }))
  .get('/reports/:reportId', async (c) => {
    const report = await getUniversalReport(c.env.DB, c.req.param('reportId'))
    return report ? c.json({ ok: true, data: report }) : c.json({ ok: false, error: { code: 'REPORT_NOT_FOUND', message: '报告不存在' } }, 404)
  })

export type AppType = typeof apiApp
