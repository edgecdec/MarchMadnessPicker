import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { getUser } from "@/lib/auth";

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex"); // 8 char hex code
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const db = getDb();
  const inviteCode = req.nextUrl.searchParams.get("invite_code");

  // Lookup group by invite code
  if (inviteCode) {
    const group = db.prepare("SELECT g.*, u.username as creator_name FROM groups g JOIN users u ON g.created_by = u.id WHERE g.invite_code = ?").get(inviteCode) as any;
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    const memberCount = (db.prepare("SELECT COUNT(*) as count FROM group_members WHERE group_id = ?").get(group.id) as any).count;
    const isMember = !!db.prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?").get(group.id, user.id);
    return NextResponse.json({ group: { ...group, member_count: memberCount, is_member: isMember } });
  }

  // List user's groups
  const groups = db.prepare(`
    SELECT g.*, u.username as creator_name,
      (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count
    FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    JOIN users u ON g.created_by = u.id
    WHERE gm.user_id = ?
    ORDER BY g.created_at DESC
  `).all(user.id);

  return NextResponse.json({ groups });
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
    db.prepare("INSERT INTO groups (id, name, invite_code, created_by) VALUES (?, ?, ?, ?)").run(id, data.name.trim(), inviteCode, user.id);
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

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
