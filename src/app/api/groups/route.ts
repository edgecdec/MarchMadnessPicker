import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { DEFAULT_SCORING } from "@/types";

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex");
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const db = getDb();
  const inviteCode = req.nextUrl.searchParams.get("invite_code");

  if (inviteCode) {
    const group = db.prepare("SELECT g.*, u.username as creator_name FROM groups g JOIN users u ON g.created_by = u.id WHERE g.invite_code = ?").get(inviteCode) as any;
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    const memberCount = (db.prepare("SELECT COUNT(*) as count FROM group_members WHERE group_id = ?").get(group.id) as any).count;
    const isMember = !!db.prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?").get(group.id, user.id);
    return NextResponse.json({ group: { ...group, scoring_settings: JSON.parse(group.scoring_settings || "{}"), member_count: memberCount, is_member: isMember } });
  }

  const groups = db.prepare(`
    SELECT g.*, u.username as creator_name,
      (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count
    FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    JOIN users u ON g.created_by = u.id
    WHERE gm.user_id = ?
    ORDER BY g.created_at DESC
  `).all(user.id) as any[];

  // Get user's bracket assignments
  const assignments = db.prepare(`
    SELECT bga.pick_id, bga.group_id
    FROM bracket_group_assignments bga
    JOIN picks p ON p.id = bga.pick_id
    WHERE p.user_id = ?
  `).all(user.id) as any[];

  return NextResponse.json({
    groups: groups.map((g) => ({ ...g, scoring_settings: JSON.parse(g.scoring_settings || "{}") })),
    assignments,
  });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { action, ...data } = await req.json();
  const db = getDb();

  if (action === "create") {
    if (!data.name?.trim()) return NextResponse.json({ error: "Group name required" }, { status: 400 });
    const id = uuid();
    const inviteCode = generateInviteCode();
    const settings = data.scoring_settings || DEFAULT_SCORING;
    const maxBrackets = data.max_brackets != null ? Number(data.max_brackets) : null;
    db.prepare("INSERT INTO groups (id, name, invite_code, created_by, scoring_settings, max_brackets) VALUES (?, ?, ?, ?, ?, ?)").run(
      id, data.name.trim(), inviteCode, user.id, JSON.stringify(settings), maxBrackets
    );
    db.prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)").run(id, user.id);
    return NextResponse.json({ id, invite_code: inviteCode });
  }

  if (action === "join") {
    const group = db.prepare("SELECT id FROM groups WHERE invite_code = ?").get(data.invite_code) as any;
    if (!group) return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    const existing = db.prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?").get(group.id, user.id);
    if (!existing) {
      db.prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)").run(group.id, user.id);
    }
    return NextResponse.json({ group_id: group.id });
  }

  if (action === "update_scoring") {
    const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(data.group_id) as any;
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    const isEveryone = group.id === "everyone";
    if (isEveryone && !user.is_admin) return NextResponse.json({ error: "Only admin can change global scoring" }, { status: 403 });
    if (!isEveryone && group.created_by !== user.id) return NextResponse.json({ error: "Only the group creator can change scoring" }, { status: 403 });
    db.prepare("UPDATE groups SET scoring_settings = ? WHERE id = ?").run(JSON.stringify(data.scoring_settings), data.group_id);
    return NextResponse.json({ ok: true });
  }

  if (action === "update_max_brackets") {
    const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(data.group_id) as any;
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    const isEveryone = group.id === "everyone";
    if (isEveryone && !user.is_admin) return NextResponse.json({ error: "Only admin can change this setting" }, { status: 403 });
    if (!isEveryone && group.created_by !== user.id) return NextResponse.json({ error: "Only the group creator can change this setting" }, { status: 403 });
    const val = data.max_brackets != null && data.max_brackets !== "" ? Number(data.max_brackets) : null;
    db.prepare("UPDATE groups SET max_brackets = ? WHERE id = ?").run(val, data.group_id);
    return NextResponse.json({ ok: true });
  }

  if (action === "toggle_submissions_lock") {
    const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(data.group_id) as any;
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    const isEveryone = group.id === "everyone";
    if (isEveryone && !user.is_admin) return NextResponse.json({ error: "Only admin can change this setting" }, { status: 403 });
    if (!isEveryone && group.created_by !== user.id) return NextResponse.json({ error: "Only the group creator can change this setting" }, { status: 403 });
    const newVal = group.submissions_locked ? 0 : 1;
    db.prepare("UPDATE groups SET submissions_locked = ? WHERE id = ?").run(newVal, data.group_id);
    return NextResponse.json({ ok: true, submissions_locked: !!newVal });
  }

  if (action === "assign_bracket") {
    const { pick_id, group_id } = data;
    if (!pick_id || !group_id) return NextResponse.json({ error: "pick_id and group_id required" }, { status: 400 });
    // Verify user owns the bracket
    const pick = db.prepare("SELECT id FROM picks WHERE id = ? AND user_id = ?").get(pick_id, user.id) as any;
    if (!pick) return NextResponse.json({ error: "Bracket not found" }, { status: 404 });
    // Verify user is a member of the group
    const member = db.prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?").get(group_id, user.id);
    if (!member) return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    // Enforce max_brackets limit
    const group = db.prepare("SELECT max_brackets FROM groups WHERE id = ?").get(group_id) as any;
    if (group?.max_brackets != null) {
      const count = (db.prepare(
        "SELECT COUNT(*) as c FROM bracket_group_assignments bga JOIN picks p ON p.id = bga.pick_id WHERE bga.group_id = ? AND p.user_id = ?"
      ).get(group_id, user.id) as any).c;
      if (count >= group.max_brackets) {
        return NextResponse.json({ error: `This group allows a maximum of ${group.max_brackets} bracket(s) per member` }, { status: 400 });
      }
    }
    db.prepare("INSERT OR IGNORE INTO bracket_group_assignments (pick_id, group_id) VALUES (?, ?)").run(pick_id, group_id);
    return NextResponse.json({ ok: true });
  }

  if (action === "unassign_bracket") {
    const { pick_id, group_id } = data;
    if (!pick_id || !group_id) return NextResponse.json({ error: "pick_id and group_id required" }, { status: 400 });
    // Verify user owns the bracket
    const pick = db.prepare("SELECT id FROM picks WHERE id = ? AND user_id = ?").get(pick_id, user.id) as any;
    if (!pick) return NextResponse.json({ error: "Bracket not found" }, { status: 404 });
    db.prepare("DELETE FROM bracket_group_assignments WHERE pick_id = ? AND group_id = ?").run(pick_id, group_id);
    return NextResponse.json({ ok: true });
  }

  if (action === "remove_member") {
    const { user_id: targetUserId, group_id } = data;
    if (!targetUserId || !group_id) return NextResponse.json({ error: "user_id and group_id required" }, { status: 400 });
    const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(group_id) as any;
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    if (group.created_by === targetUserId) return NextResponse.json({ error: "Cannot remove the group creator" }, { status: 400 });
    const isEveryone = group.id === "everyone";
    if (isEveryone && !user.is_admin) return NextResponse.json({ error: "Only admin can remove members from this group" }, { status: 403 });
    if (!isEveryone && group.created_by !== user.id) return NextResponse.json({ error: "Only the group creator can remove members" }, { status: 403 });
    db.prepare("DELETE FROM bracket_group_assignments WHERE group_id = ? AND pick_id IN (SELECT id FROM picks WHERE user_id = ?)").run(group_id, targetUserId);
    db.prepare("DELETE FROM group_members WHERE group_id = ? AND user_id = ?").run(group_id, targetUserId);
    return NextResponse.json({ ok: true });
  }

  if (action === "remove_bracket") {
    const { pick_id, group_id } = data;
    if (!pick_id || !group_id) return NextResponse.json({ error: "pick_id and group_id required" }, { status: 400 });
    const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(group_id) as any;
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    const isEveryone = group.id === "everyone";
    if (isEveryone && !user.is_admin) return NextResponse.json({ error: "Only admin can remove brackets from this group" }, { status: 403 });
    if (!isEveryone && group.created_by !== user.id) return NextResponse.json({ error: "Only the group creator can remove brackets" }, { status: 403 });
    db.prepare("DELETE FROM bracket_group_assignments WHERE pick_id = ? AND group_id = ?").run(pick_id, group_id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
