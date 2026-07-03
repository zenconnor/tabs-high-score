-- Tabs High Score — Cloudflare D1 (SQLite) schema. Apply with:
--   npx wrangler d1 execute tabs-high-score --local --file=schema.sql   (local dev)
--   npx wrangler d1 execute tabs-high-score --remote --file=schema.sql  (production)

CREATE TABLE IF NOT EXISTS scores (
  unique_key TEXT PRIMARY KEY,                          -- UUID per submission
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 24),
  tabs INTEGER NOT NULL CHECK (tabs BETWEEN 1 AND 99999),
  cookie_id TEXT NOT NULL,                              -- per-browser UUID (decision-1)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),   -- UTC timestamp
  created_date TEXT NOT NULL DEFAULT (date('now'))      -- day bucket
);

-- 1h / 24h window scans
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores (created_at);
-- all-time board sort
CREATE INDEX IF NOT EXISTS idx_scores_tabs ON scores (tabs DESC);
