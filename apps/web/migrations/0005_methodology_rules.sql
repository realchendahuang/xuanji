CREATE TABLE IF NOT EXISTS methodology_profiles (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  version TEXT NOT NULL,
  config_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rule_pack_versions (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  version TEXT NOT NULL,
  rule_count INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

INSERT OR IGNORE INTO rule_pack_versions (id, mode, version, rule_count, created_at)
VALUES ('bazi-core-1.0.0', 'bazi', '1.0.0', 35, datetime('now'));
