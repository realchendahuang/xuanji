CREATE TABLE IF NOT EXISTS birth_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  local_date TEXT NOT NULL,
  local_time TEXT NOT NULL,
  time_precision TEXT NOT NULL DEFAULT 'exact',
  location_label TEXT NOT NULL,
  latitude REAL NOT NULL DEFAULT 0,
  longitude REAL NOT NULL DEFAULT 0,
  time_zone TEXT NOT NULL DEFAULT 'Asia/Shanghai',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chart_snapshots (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  engine_id TEXT NOT NULL,
  engine_version TEXT NOT NULL,
  methodology_json TEXT NOT NULL,
  facts_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES birth_profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_chart_snapshots_profile
  ON chart_snapshots(profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS readings (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content_json TEXT NOT NULL,
  model TEXT NOT NULL,
  gateway_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (snapshot_id) REFERENCES chart_snapshots(id)
);

CREATE INDEX IF NOT EXISTS idx_readings_snapshot
  ON readings(snapshot_id, created_at DESC);
