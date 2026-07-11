CREATE TABLE IF NOT EXISTS birth_profile_versions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  profile_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(profile_id, version),
  FOREIGN KEY (profile_id) REFERENCES birth_profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_birth_profile_versions
  ON birth_profile_versions(profile_id, version DESC);

INSERT OR IGNORE INTO birth_profile_versions (id, profile_id, version, profile_json, created_at)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id,
  1,
  json_object(
    'id', id,
    'name', name,
    'localDate', local_date,
    'localTime', local_time,
    'timePrecision', time_precision,
    'location', json_object('label', location_label, 'latitude', latitude, 'longitude', longitude, 'timeZone', time_zone),
    'createdAt', created_at,
    'updatedAt', updated_at
  ),
  created_at
FROM birth_profiles;
