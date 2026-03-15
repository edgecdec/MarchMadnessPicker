import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "marchmadness.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require("fs");
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initDb(db);
  }
  return db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      year INTEGER NOT NULL,
      bracket_data TEXT NOT NULL DEFAULT '{}',
      results_data TEXT NOT NULL DEFAULT '{}',
      lock_time TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS picks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tournament_id TEXT NOT NULL,
      bracket_name TEXT NOT NULL DEFAULT 'My Bracket',
      picks_data TEXT NOT NULL DEFAULT '{}',
      submitted_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
      UNIQUE(user_id, tournament_id, bracket_name)
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      created_by TEXT NOT NULL,
      scoring_settings TEXT NOT NULL DEFAULT '{}',
      max_brackets INTEGER DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bracket_group_assignments (
      pick_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      assigned_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (pick_id, group_id),
      FOREIGN KEY (pick_id) REFERENCES picks(id),
      FOREIGN KEY (group_id) REFERENCES groups(id)
    );
  `);

  // Migrations for existing DBs
  try { db.exec("ALTER TABLE groups ADD COLUMN scoring_settings TEXT NOT NULL DEFAULT '{}'"); } catch {}
  try { db.exec("ALTER TABLE groups ADD COLUMN max_brackets INTEGER DEFAULT NULL"); } catch {}
  try { db.exec("ALTER TABLE picks ADD COLUMN bracket_name TEXT NOT NULL DEFAULT 'My Bracket'"); } catch {}

  // Migrate unique constraint: recreate picks table if old constraint exists
  try {
    const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='picks'").get() as any;
    if (tableInfo?.sql && tableInfo.sql.includes("UNIQUE(user_id, tournament_id)") && !tableInfo.sql.includes("bracket_name")) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS picks_new (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          tournament_id TEXT NOT NULL,
          bracket_name TEXT NOT NULL DEFAULT 'My Bracket',
          picks_data TEXT NOT NULL DEFAULT '{}',
          submitted_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
          UNIQUE(user_id, tournament_id, bracket_name)
        );
        INSERT OR IGNORE INTO picks_new (id, user_id, tournament_id, bracket_name, picks_data, submitted_at)
          SELECT id, user_id, tournament_id, 'My Bracket', picks_data, submitted_at FROM picks;
        DROP TABLE picks;
        ALTER TABLE picks_new RENAME TO picks;
      `);
    }
  } catch {}

  // Ensure "Everyone" group exists
  ensureEveryoneGroup(db);

  // Migrate: auto-assign all existing picks to "Everyone" group if not already assigned
  try {
    const unassigned = db.prepare(`
      SELECT p.id FROM picks p
      WHERE NOT EXISTS (SELECT 1 FROM bracket_group_assignments bga WHERE bga.pick_id = p.id AND bga.group_id = 'everyone')
    `).all() as any[];
    const ins = db.prepare("INSERT OR IGNORE INTO bracket_group_assignments (pick_id, group_id) VALUES (?, 'everyone')");
    for (const row of unassigned) ins.run(row.id);
  } catch {}
}

export function ensureEveryoneGroup(db: Database.Database): string {
  let group = db.prepare("SELECT id FROM groups WHERE invite_code = 'everyone'").get() as any;
  if (!group) {
    const id = "everyone";
    // Use the admin user as creator, or first user
    const admin = db.prepare("SELECT id FROM users WHERE is_admin = 1 LIMIT 1").get() as any;
    const creator = admin?.id || "system";
    db.prepare("INSERT OR IGNORE INTO groups (id, name, invite_code, created_by, scoring_settings) VALUES (?, ?, ?, ?, ?)")
      .run(id, "Everyone", "everyone", creator, JSON.stringify({ pointsPerRound: [1,2,4,8,16,32], upsetBonusPerRound: [0,0,0,0,0,0] }));
    group = { id };
  }
  return group.id;
}

export function joinEveryoneGroup(db: Database.Database, userId: string) {
  const groupId = ensureEveryoneGroup(db);
  db.prepare("INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)").run(groupId, userId);
}

export function autoAssignBracketToEveryone(db: Database.Database, pickId: string) {
  db.prepare("INSERT OR IGNORE INTO bracket_group_assignments (pick_id, group_id) VALUES (?, 'everyone')").run(pickId);
}
