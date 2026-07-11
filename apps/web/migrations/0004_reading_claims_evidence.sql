CREATE TABLE IF NOT EXISTS reading_claims (
  id TEXT PRIMARY KEY,
  reading_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  evidence_ids_json TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (reading_id) REFERENCES readings(id)
);

CREATE TABLE IF NOT EXISTS reading_evidence (
  id TEXT NOT NULL,
  reading_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  fact_refs_json TEXT NOT NULL,
  PRIMARY KEY (reading_id, id),
  FOREIGN KEY (reading_id) REFERENCES readings(id)
);

CREATE INDEX IF NOT EXISTS idx_reading_claims_reading ON reading_claims(reading_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_reading_evidence_reading ON reading_evidence(reading_id);
