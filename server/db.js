import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
fs.mkdirSync(DATA_DIR, { recursive: true })

export const db = new Database(path.join(DATA_DIR, 'moonhunt.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    DEFAULT '',
    name_locked INTEGER DEFAULT 0,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    UNIQUE NOT NULL,
    team_id       INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    password_hash TEXT    NOT NULL,
    is_admin      INTEGER DEFAULT 0,
    created_at    TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS clues (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    text           TEXT    NOT NULL,
    pin            TEXT    NOT NULL,
    location       TEXT    DEFAULT '',
    solved         INTEGER DEFAULT 0,
    solved_by_team TEXT,
    solved_at      TEXT,
    created_at     TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS moon_finds (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    clue_id   INTEGER NOT NULL REFERENCES clues(id)  ON DELETE CASCADE,
    user_id   INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    team_id   INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    team_name TEXT    NOT NULL DEFAULT '',
    found_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS active_clues (
    team_id INTEGER NOT NULL REFERENCES teams(id)  ON DELETE CASCADE,
    clue_id INTEGER NOT NULL REFERENCES clues(id)  ON DELETE CASCADE,
    PRIMARY KEY (team_id, clue_id)
  );
`)

// Seed clues on first run
const { n: clueCount } = db.prepare('SELECT COUNT(*) as n FROM clues').get()
if (clueCount === 0) {
  const ins = db.prepare('INSERT INTO clues (text, pin, location) VALUES (?, ?, ?)')
  const seed = [
    ["Where morning light meets the old iron gate, and pigeons gather for their breakfast debate.", "3847", "Main park entrance gate"],
    ["Beside the sleeping giant of stone and oak, where children's laughter and summer rain spoke.", "9152", "Statue in Riverside Park"],
    ["Find where the red door watches the cobblestones pass, and a window box blooms with sweet-smelling grass.", "6073", "Red door on Maple St"],
    ["The old clock tower holds its breath at noon — search its shadow for a crescent moon.", "4419", "Clock tower base, north shadow"],
    ["Under the bridge where the sparrows nest, tucked behind the stone that faces west.", "2281", "Mill Bridge, west pillar"],
  ]
  seed.forEach(([text, pin, location]) => ins.run(text, pin, location))
}

// Seed admin user on first run
const { n: adminCount } = db.prepare("SELECT COUNT(*) as n FROM users WHERE is_admin = 1").get()
if (adminCount === 0) {
  db.prepare("INSERT INTO users (username, password_hash, is_admin) VALUES ('admin', ?, 1)")
    .run(bcrypt.hashSync('admin123', 10))
}
