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
      tiebreaker INTEGER DEFAULT NULL,
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

    CREATE TABLE IF NOT EXISTS group_messages (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
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
  try { db.exec("ALTER TABLE picks ADD COLUMN tiebreaker INTEGER DEFAULT NULL"); } catch {}
  try { db.exec("ALTER TABLE tournaments ADD COLUMN results_updated_at TEXT DEFAULT NULL"); } catch {}
  try { db.exec("ALTER TABLE groups ADD COLUMN submissions_locked INTEGER DEFAULT 0"); } catch {}
  try { db.exec("ALTER TABLE picks ADD COLUMN version INTEGER NOT NULL DEFAULT 1"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0"); } catch {}

  // Migrate unique constraint: recreate picks table if old constraint exists
  try {
    const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='picks'").get() as any;
    if (tableInfo?.sql && tableInfo.sql.includes("UNIQUE(user_id, tournament_id)") && !tableInfo.sql.includes("UNIQUE(user_id, tournament_id, bracket_name)")) {
      db.pragma("foreign_keys = OFF");
      db.exec(`
        CREATE TABLE IF NOT EXISTS picks_new (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          tournament_id TEXT NOT NULL,
          bracket_name TEXT NOT NULL DEFAULT 'My Bracket',
          picks_data TEXT NOT NULL DEFAULT '{}',
          tiebreaker INTEGER DEFAULT NULL,
          submitted_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
          UNIQUE(user_id, tournament_id, bracket_name)
        );
        INSERT OR IGNORE INTO picks_new (id, user_id, tournament_id, bracket_name, picks_data, tiebreaker, submitted_at)
          SELECT id, user_id, tournament_id, bracket_name, picks_data, tiebreaker, submitted_at FROM picks;
        DROP TABLE picks;
        ALTER TABLE picks_new RENAME TO picks;
      `);
      db.pragma("foreign_keys = ON");
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

  // Migrate picks and results from team names to region-seed identifiers
  migrateToRegionSeed(db);
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

// Migrate picks and results from team-name values to region-seed identifiers
function migrateToRegionSeed(db: Database.Database) {
  try {
    const tournaments = db.prepare("SELECT id, bracket_data, results_data FROM tournaments").all() as any[];
    for (const t of tournaments) {
      const bracket = JSON.parse(t.bracket_data || "{}");
      if (!bracket.regions?.length) continue;

      // Build name -> region-seed map
      const nameToRS: Record<string, string> = {};
      for (const r of bracket.regions) {
        for (const team of r.teams) {
          nameToRS[team.name] = `${r.name}-${team.seed}`;
        }
      }
      if (bracket.first_four) {
        for (const ff of bracket.first_four) {
          nameToRS[ff.teamA] = `${ff.region}-${ff.seed}`;
          nameToRS[ff.teamB] = `${ff.region}-${ff.seed}`;
        }
      }

      // Migrate results
      const results = JSON.parse(t.results_data || "{}");
      let resultsChanged = false;
      for (const [gid, val] of Object.entries(results)) {
        if (gid.startsWith("ff-play-")) continue; // FF play-in results stay as team names
        const v = val as string;
        if (nameToRS[v]) {
          results[gid] = nameToRS[v];
          resultsChanged = true;
        }
      }
      if (resultsChanged) {
        db.prepare("UPDATE tournaments SET results_data = ? WHERE id = ?").run(JSON.stringify(results), t.id);
      }

      // Migrate picks
      const allPicks = db.prepare("SELECT id, picks_data FROM picks WHERE tournament_id = ?").all(t.id) as any[];
      const updatePick = db.prepare("UPDATE picks SET picks_data = ? WHERE id = ?");
      for (const p of allPicks) {
        const picks = JSON.parse(p.picks_data || "{}");
        let changed = false;
        for (const [gid, val] of Object.entries(picks)) {
          if (gid.startsWith("ff-play-")) continue; // FF play-in picks stay as team names
          const v = val as string;
          if (nameToRS[v]) {
            picks[gid] = nameToRS[v];
            changed = true;
          }
          // Handle combined FF names like "NC State/Texas"
          if (v.includes("/") && !nameToRS[v]) {
            const parts = v.split("/");
            if (nameToRS[parts[0]]) {
              picks[gid] = nameToRS[parts[0]]; // Both map to same region-seed
              changed = true;
            }
          }
        }
        if (changed) updatePick.run(JSON.stringify(picks), p.id);
      }
    }
  } catch (e) {
    console.error("migrateToRegionSeed error:", e);
  }
}
