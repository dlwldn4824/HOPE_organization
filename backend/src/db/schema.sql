PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  uid           TEXT PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nickname      TEXT NOT NULL,
  level         INTEGER NOT NULL DEFAULT 1,
  exp           INTEGER NOT NULL DEFAULT 0,
  max_exp       INTEGER NOT NULL DEFAULT 100,
  star          INTEGER NOT NULL DEFAULT 0,
  gender        TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  uid         TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS learning_results (
  id                TEXT PRIMARY KEY,
  uid               TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  game_id           TEXT NOT NULL,
  target_word       TEXT,
  accuracy          INTEGER NOT NULL DEFAULT 0,
  earned_stars      INTEGER NOT NULL DEFAULT 1,
  duration_seconds  INTEGER NOT NULL DEFAULT 0,
  analysis_json     TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_results_uid_created ON learning_results(uid, created_at);

CREATE TABLE IF NOT EXISTS wallets (
  uid          TEXT PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,
  spent_coins  INTEGER NOT NULL DEFAULT 0,
  spent_gems   INTEGER NOT NULL DEFAULT 0,
  bonus_coins  INTEGER NOT NULL DEFAULT 0,
  bonus_gems   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  uid          TEXT PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shop_purchases (
  uid           TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  item_id       TEXT NOT NULL,
  purchased_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (uid, item_id)
);

CREATE TABLE IF NOT EXISTS claimed_missions (
  uid          TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  mission_id   TEXT NOT NULL,
  claimed_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (uid, mission_id)
);

CREATE TABLE IF NOT EXISTS read_notifications (
  uid              TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  notification_id  TEXT NOT NULL,
  read_at          TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (uid, notification_id)
);

CREATE TABLE IF NOT EXISTS event_claims (
  uid         TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  event_id    TEXT NOT NULL,
  claimed_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (uid, event_id)
);

CREATE TABLE IF NOT EXISTS attendance_claims (
  uid         TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  day         INTEGER NOT NULL,
  claimed_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (uid, day)
);

CREATE TABLE IF NOT EXISTS charge_log (
  uid       TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  log_date  TEXT NOT NULL,
  count     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (uid, log_date)
);
