import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const DB_PATH = process.env.DB_PATH || './data/paris2026.db';
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS participants (
    id          TEXT PRIMARY KEY,
    token       TEXT NOT NULL UNIQUE,
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    phone       TEXT NOT NULL,
    country     TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'participant',
    created_at  TEXT NOT NULL,
    last_seen   TEXT
  );

  CREATE TABLE IF NOT EXISTS questions (
    id             TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    text           TEXT NOT NULL,
    consent_at     TEXT,
    status         TEXT NOT NULL DEFAULT 'pending',
    pastor_name    TEXT,
    place          TEXT,
    time           TEXT,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token       TEXT PRIMARY KEY,
    created_at  TEXT NOT NULL,
    expires_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS checkins (
    participant_id TEXT PRIMARY KEY REFERENCES participants(id) ON DELETE CASCADE,
    created_at     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS content (
    section     TEXT PRIMARY KEY,
    data        TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id          TEXT PRIMARY KEY,
    text_fr     TEXT NOT NULL,
    text_en     TEXT NOT NULL,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS housing (
    id             TEXT PRIMARY KEY,
    first_name     TEXT NOT NULL,
    last_name      TEXT NOT NULL,
    phone          TEXT NOT NULL DEFAULT '',
    country        TEXT NOT NULL DEFAULT '',
    address        TEXT NOT NULL DEFAULT '',
    notes          TEXT NOT NULL DEFAULT '',
    participant_id TEXT REFERENCES participants(id) ON DELETE SET NULL,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    endpoint       TEXT PRIMARY KEY,
    p256dh         TEXT NOT NULL,
    auth           TEXT NOT NULL,
    participant_id TEXT REFERENCES participants(id) ON DELETE CASCADE,
    lang           TEXT NOT NULL DEFAULT 'fr',
    created_at     TEXT NOT NULL,
    last_error     TEXT
  );

  CREATE TABLE IF NOT EXISTS photos (
    id             TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    file           TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'pending',
    consent_at     TEXT,
    created_at     TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_housing_participant
    ON housing(participant_id) WHERE participant_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_photos_created ON photos(created_at);
  CREATE INDEX IF NOT EXISTS idx_questions_participant ON questions(participant_id);
  CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
`);

// Migration non destructive pour les bases créées avant l'ajout de la modération.
// Les anciennes photos restent visibles ; toutes les nouvelles sont explicitement
// insérées avec le statut "pending" par l'API.
const photoColumns = db.prepare('PRAGMA table_info(photos)').all();
if (!photoColumns.some(column => column.name === 'status')) {
  db.exec("ALTER TABLE photos ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'");
}
if (!photoColumns.some(column => column.name === 'consent_at')) {
  db.exec('ALTER TABLE photos ADD COLUMN consent_at TEXT');
}
const questionColumns = db.prepare('PRAGMA table_info(questions)').all();
if (!questionColumns.some(column => column.name === 'consent_at')) {
  db.exec('ALTER TABLE questions ADD COLUMN consent_at TEXT');
}
db.exec('CREATE INDEX IF NOT EXISTS idx_photos_status_created ON photos(status, created_at)');

export default db;
