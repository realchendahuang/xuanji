CREATE TABLE IF NOT EXISTS divination_snapshots (
  id TEXT PRIMARY KEY,
  profile_id TEXT,
  secondary_profile_id TEXT,
  mode TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  engine_id TEXT NOT NULL,
  engine_version TEXT NOT NULL,
  methodology_json TEXT NOT NULL,
  facts_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES birth_profiles(id),
  FOREIGN KEY (secondary_profile_id) REFERENCES birth_profiles(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_divination_input
  ON divination_snapshots(mode, input_hash);
CREATE INDEX IF NOT EXISTS idx_divination_profile
  ON divination_snapshots(profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS universal_reports (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  snapshot_ids_json TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content_json TEXT NOT NULL,
  model TEXT NOT NULL,
  gateway_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_universal_reports_created
  ON universal_reports(created_at DESC);

CREATE TABLE IF NOT EXISTS daily_readings (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  reading_date TEXT NOT NULL,
  snapshot_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(profile_id, reading_date),
  FOREIGN KEY (profile_id) REFERENCES birth_profiles(id),
  FOREIGN KEY (snapshot_id) REFERENCES divination_snapshots(id)
);

CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  format TEXT NOT NULL,
  object_key TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(report_id, format)
);
