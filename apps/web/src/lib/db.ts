import type {
  BirthProfile,
  ChartSnapshot,
  Reading,
  UniversalReport,
  UniversalSnapshot,
} from './types'

type ProfileRow = {
  id: string
  name: string
  local_date: string
  local_time: string
  time_precision: BirthProfile['timePrecision']
  gender: BirthProfile['gender']
  location_label: string
  latitude: number
  longitude: number
  time_zone: string
  created_at: string
  updated_at: string
}

function profileFromRow(row: ProfileRow): BirthProfile {
  return {
    id: row.id,
    name: row.name,
    localDate: row.local_date,
    localTime: row.local_time,
    timePrecision: row.time_precision,
    gender: row.gender,
    location: {
      label: row.location_label,
      latitude: row.latitude,
      longitude: row.longitude,
      timeZone: row.time_zone,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function insertProfile(db: D1Database, profile: BirthProfile) {
  await db.batch([
    db
      .prepare(
        `INSERT INTO birth_profiles
      (id, name, local_date, local_time, time_precision, gender, location_label, latitude, longitude, time_zone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        profile.id,
        profile.name,
        profile.localDate,
        profile.localTime,
        profile.timePrecision,
        profile.gender,
        profile.location.label,
        profile.location.latitude,
        profile.location.longitude,
        profile.location.timeZone,
        profile.createdAt,
        profile.updatedAt,
      ),
    db
      .prepare(
        `INSERT INTO birth_profile_versions
       (id, profile_id, version, profile_json, created_at) VALUES (?, ?, 1, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        profile.id,
        JSON.stringify(profile),
        profile.createdAt,
      ),
  ])
}

export async function updateProfile(db: D1Database, profile: BirthProfile) {
  const versionRow = await db
    .prepare(
      'SELECT COALESCE(MAX(version), 0) + 1 AS version FROM birth_profile_versions WHERE profile_id = ?',
    )
    .bind(profile.id)
    .first<{ version: number }>()
  await db.batch([
    db
      .prepare(
        `UPDATE birth_profiles SET name = ?, local_date = ?, local_time = ?, time_precision = ?, gender = ?,
       location_label = ?, latitude = ?, longitude = ?, time_zone = ?, updated_at = ? WHERE id = ?`,
      )
      .bind(
        profile.name,
        profile.localDate,
        profile.localTime,
        profile.timePrecision,
        profile.gender,
        profile.location.label,
        profile.location.latitude,
        profile.location.longitude,
        profile.location.timeZone,
        profile.updatedAt,
        profile.id,
      ),
    db
      .prepare(
        `INSERT INTO birth_profile_versions
       (id, profile_id, version, profile_json, created_at) VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        profile.id,
        versionRow?.version ?? 1,
        JSON.stringify(profile),
        profile.updatedAt,
      ),
  ])
}

export async function listProfiles(db: D1Database) {
  const result = await db
    .prepare('SELECT * FROM birth_profiles ORDER BY created_at DESC')
    .all<ProfileRow>()
  return result.results.map(profileFromRow)
}

export async function getProfile(db: D1Database, id: string) {
  const row = await db
    .prepare('SELECT * FROM birth_profiles WHERE id = ?')
    .bind(id)
    .first<ProfileRow>()
  return row ? profileFromRow(row) : null
}

export async function insertSnapshot(db: D1Database, snapshot: ChartSnapshot) {
  await db.batch([
    db
      .prepare(
        `INSERT INTO chart_snapshots
      (id, profile_id, mode, input_hash, engine_id, engine_version, methodology_json, facts_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        snapshot.id,
        snapshot.profileId,
        snapshot.mode,
        snapshot.inputHash,
        snapshot.engineId,
        snapshot.engineVersion,
        JSON.stringify(snapshot.methodology),
        JSON.stringify(snapshot.facts),
        snapshot.createdAt,
      ),
    db
      .prepare(
        `INSERT OR IGNORE INTO methodology_profiles (id, mode, version, config_json, created_at)
       VALUES (?, 'bazi', ?, ?, ?)`,
      )
      .bind(
        `bazi-${snapshot.inputHash.slice(0, 16)}`,
        snapshot.methodology.luckCycleVersion,
        JSON.stringify(snapshot.methodology),
        snapshot.createdAt,
      ),
  ])
}

export async function getSnapshot(db: D1Database, id: string) {
  const row = await db
    .prepare('SELECT * FROM chart_snapshots WHERE id = ?')
    .bind(id)
    .first<{
      id: string
      profile_id: string
      input_hash: string
      engine_id: 'tyme4ts'
      engine_version: '1.5.2'
      methodology_json: string
      facts_json: string
      created_at: string
    }>()
  if (!row) return null
  return {
    id: row.id,
    profileId: row.profile_id,
    mode: 'bazi' as const,
    inputHash: row.input_hash,
    engineId: row.engine_id,
    engineVersion: row.engine_version,
    methodology: JSON.parse(row.methodology_json),
    facts: JSON.parse(row.facts_json),
    createdAt: row.created_at,
  } satisfies ChartSnapshot
}

export async function insertReading(db: D1Database, reading: Reading) {
  await db.batch([
    db
      .prepare(
        `INSERT INTO readings
      (id, snapshot_id, title, summary, content_json, model, gateway_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        reading.id,
        reading.snapshotId,
        reading.title,
        reading.summary,
        JSON.stringify({
          sections: reading.sections,
          evidence: reading.evidence,
        }),
        reading.model,
        reading.gatewayId,
        reading.createdAt,
      ),
    ...reading.sections.map((claim, index) =>
      db
        .prepare(
          `INSERT INTO reading_claims (id, reading_id, title, body, evidence_ids_json, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          `${reading.id}:${claim.id}`,
          reading.id,
          claim.title,
          claim.body,
          JSON.stringify(claim.evidenceIds),
          index,
        ),
    ),
    ...reading.evidence.map((item) =>
      db
        .prepare(
          `INSERT INTO reading_evidence
         (id, reading_id, rule_id, rule_version, title, summary, fact_refs_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          item.id,
          reading.id,
          item.ruleId,
          item.ruleVersion,
          item.title,
          item.summary,
          JSON.stringify(item.factRefs),
        ),
    ),
  ])
}

export async function listReadings(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT readings.*, birth_profiles.name AS profile_name
       FROM readings
       JOIN chart_snapshots ON chart_snapshots.id = readings.snapshot_id
       JOIN birth_profiles ON birth_profiles.id = chart_snapshots.profile_id
       ORDER BY readings.created_at DESC`,
    )
    .all<{
      id: string
      snapshot_id: string
      title: string
      summary: string
      content_json: string
      model: string
      gateway_id: string
      created_at: string
      profile_name: string
    }>()
  return result.results.map((row) => {
    const content = JSON.parse(row.content_json) as Pick<
      Reading,
      'sections' | 'evidence'
    >
    return {
      id: row.id,
      snapshotId: row.snapshot_id,
      title: row.title,
      summary: row.summary,
      ...content,
      model: row.model,
      gatewayId: row.gateway_id,
      createdAt: row.created_at,
      profileName: row.profile_name,
    }
  })
}

export async function getReading(db: D1Database, id: string) {
  const row = await db
    .prepare('SELECT * FROM readings WHERE id = ?')
    .bind(id)
    .first<{
      id: string
      snapshot_id: string
      title: string
      summary: string
      content_json: string
      model: string
      gateway_id: string
      created_at: string
    }>()
  if (!row) return null
  const content = JSON.parse(row.content_json) as Pick<
    Reading,
    'sections' | 'evidence'
  >
  return {
    id: row.id,
    snapshotId: row.snapshot_id,
    title: row.title,
    summary: row.summary,
    ...content,
    model: row.model,
    gatewayId: row.gateway_id,
    createdAt: row.created_at,
  } satisfies Reading
}

export async function insertUniversalSnapshot(
  db: D1Database,
  snapshot: UniversalSnapshot,
) {
  await db
    .prepare(
      `INSERT OR IGNORE INTO divination_snapshots
       (id, profile_id, secondary_profile_id, mode, input_hash, engine_id, engine_version, methodology_json, facts_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      snapshot.id,
      snapshot.profileId,
      snapshot.secondaryProfileId ?? null,
      snapshot.mode,
      snapshot.inputHash,
      snapshot.engineId,
      snapshot.engineVersion,
      JSON.stringify(snapshot.methodology),
      JSON.stringify(snapshot.facts),
      snapshot.createdAt,
    )
    .run()
  return (
    (await getUniversalSnapshotByHash(db, snapshot.mode, snapshot.inputHash)) ??
    snapshot
  )
}

function universalSnapshotFromRow(row: {
  id: string
  profile_id: string | null
  secondary_profile_id: string | null
  mode: UniversalSnapshot['mode']
  input_hash: string
  engine_id: string
  engine_version: string
  methodology_json: string
  facts_json: string
  created_at: string
}) {
  return {
    id: row.id,
    profileId: row.profile_id,
    secondaryProfileId: row.secondary_profile_id,
    mode: row.mode,
    inputHash: row.input_hash,
    engineId: row.engine_id,
    engineVersion: row.engine_version,
    methodology: JSON.parse(row.methodology_json),
    facts: JSON.parse(row.facts_json),
    createdAt: row.created_at,
  } satisfies UniversalSnapshot
}

export async function getUniversalSnapshot(db: D1Database, id: string) {
  const row = await db
    .prepare('SELECT * FROM divination_snapshots WHERE id = ?')
    .bind(id)
    .first<Parameters<typeof universalSnapshotFromRow>[0]>()
  return row ? universalSnapshotFromRow(row) : null
}

export async function getUniversalSnapshotByHash(
  db: D1Database,
  mode: UniversalSnapshot['mode'],
  inputHash: string,
) {
  const row = await db
    .prepare(
      'SELECT * FROM divination_snapshots WHERE mode = ? AND input_hash = ?',
    )
    .bind(mode, inputHash)
    .first<Parameters<typeof universalSnapshotFromRow>[0]>()
  return row ? universalSnapshotFromRow(row) : null
}

export async function listUniversalSnapshots(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT divination_snapshots.*, birth_profiles.name AS profile_name,
       secondary.name AS secondary_profile_name
       FROM divination_snapshots
       LEFT JOIN birth_profiles ON birth_profiles.id = divination_snapshots.profile_id
       LEFT JOIN birth_profiles secondary ON secondary.id = divination_snapshots.secondary_profile_id
       ORDER BY divination_snapshots.created_at DESC`,
    )
    .all<Parameters<typeof universalSnapshotFromRow>[0] & {
      profile_name: string | null
      secondary_profile_name: string | null
    }>()
  return result.results.map((row) => ({
    ...universalSnapshotFromRow(row),
    profileName: row.profile_name,
    secondaryProfileName: row.secondary_profile_name,
  }))
}

export async function insertUniversalReport(
  db: D1Database,
  report: UniversalReport,
) {
  await db
    .prepare(
      `INSERT INTO universal_reports
       (id, mode, snapshot_ids_json, title, summary, content_json, model, gateway_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      report.id,
      report.mode,
      JSON.stringify(report.snapshotIds),
      report.title,
      report.summary,
      JSON.stringify({ sections: report.sections, evidence: report.evidence }),
      report.model,
      report.gatewayId,
      report.createdAt,
    )
    .run()
}

export async function getUniversalReport(db: D1Database, id: string) {
  const row = await db
    .prepare('SELECT * FROM universal_reports WHERE id = ?')
    .bind(id)
    .first<{
      id: string
      mode: UniversalReport['mode']
      snapshot_ids_json: string
      title: string
      summary: string
      content_json: string
      model: string
      gateway_id: string
      created_at: string
    }>()
  if (!row) return null
  const content = JSON.parse(row.content_json) as Pick<
    UniversalReport,
    'sections' | 'evidence'
  >
  return {
    id: row.id,
    mode: row.mode,
    snapshotIds: JSON.parse(row.snapshot_ids_json),
    title: row.title,
    summary: row.summary,
    ...content,
    model: row.model,
    gatewayId: row.gateway_id,
    createdAt: row.created_at,
  } satisfies UniversalReport
}

export async function listUniversalReports(db: D1Database) {
  const rows = await db
    .prepare('SELECT id FROM universal_reports ORDER BY created_at DESC')
    .all<{ id: string }>()
  return (
    await Promise.all(rows.results.map((row) => getUniversalReport(db, row.id)))
  ).filter(Boolean)
}
