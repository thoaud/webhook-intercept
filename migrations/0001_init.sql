CREATE TABLE captures (
  id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL,
  received_at_ms INTEGER NOT NULL,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  query TEXT,
  query_json TEXT,
  client_ip TEXT,
  country TEXT,
  colo TEXT,
  http_protocol TEXT,
  content_type TEXT,
  content_length INTEGER,
  body_sha256 TEXT,
  body_r2_key TEXT,
  headers_json TEXT NOT NULL,
  cf_json TEXT,
  body_preview TEXT,
  parsed_json TEXT,
  body_is_binary INTEGER NOT NULL DEFAULT 0,
  body_truncated INTEGER NOT NULL DEFAULT 0,
  body_is_empty INTEGER NOT NULL DEFAULT 0,
  user_agent TEXT
);

CREATE INDEX idx_captures_received_at ON captures(received_at_ms DESC);
CREATE INDEX idx_captures_path ON captures(path);
