const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'clubz.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS timesheet_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    tutor_name TEXT NOT NULL,
    month TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'draft'
  );

  CREATE TABLE IF NOT EXISTS timesheet_students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    student_name TEXT NOT NULL,
    in_person_hours REAL NOT NULL,
    online_hours REAL NOT NULL,
    FOREIGN KEY (session_id) REFERENCES timesheet_sessions(id)
  );

  CREATE TABLE IF NOT EXISTS attendance_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    student_name TEXT NOT NULL,
    tutor_name TEXT NOT NULL,
    month TEXT NOT NULL,
    subjects TEXT NOT NULL,
    grade TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'draft'
  );

  CREATE TABLE IF NOT EXISTS attendance_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    comments TEXT,
    is_online INTEGER DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id)
  );

  CREATE TABLE IF NOT EXISTS attendance_extra (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL UNIQUE,
    progress_notes TEXT,
    review_date TEXT,
    online_count INTEGER DEFAULT 0,
    in_person_count INTEGER DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id)
  );
`);

// The login account comes only from environment variables. No credentials are
// stored in the repo, and the password itself never reaches the server: only
// its bcrypt hash (create one with `npm run hash-password`).
const adminUsername = (process.env.ADMIN_USERNAME || '').trim();
const adminHash = (process.env.ADMIN_PASSWORD_HASH || '').trim();

if (adminUsername && /^\$2[aby]\$\d{2}\$.{53}$/.test(adminHash)) {
  db.transaction(() => {
    db.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?) ' +
      'ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash'
    ).run(adminUsername, adminHash);
    // Remove any other account (for example ones seeded from the old users.json)
    // so only the configured login works, even on a persistent disk.
    db.prepare('DELETE FROM users WHERE username <> ?').run(adminUsername);
  })();
} else {
  db.prepare('DELETE FROM users').run();
  console.warn(
    'No valid ADMIN_USERNAME / ADMIN_PASSWORD_HASH set: login is disabled. ' +
    'Run `npm run hash-password` and set both environment variables.'
  );
}

module.exports = db;
