import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { v4 as uuid } from "uuid";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: groupId } = await params;
  const db = getDb();

  // Verify membership
  const member = db.prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?").get(groupId, user.id);
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const before = req.nextUrl.searchParams.get("before");
  const limit = 50;

  const messages = before
    ? db.prepare(`SELECT gm.id, gm.group_id, gm.user_id, u.username, gm.message, gm.created_at
        FROM group_messages gm JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ? AND gm.created_at < ? ORDER BY gm.created_at DESC LIMIT ?`).all(groupId, before, limit)
    : db.prepare(`SELECT gm.id, gm.group_id, gm.user_id, u.username, gm.message, gm.created_at
        FROM group_messages gm JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ? ORDER BY gm.created_at DESC LIMIT ?`).all(groupId, limit);

  return NextResponse.json({ messages: (messages as any[]).reverse() });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: groupId } = await params;
  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const db = getDb();
  const member = db.prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?").get(groupId, user.id);
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const id = uuid();
  const text = message.trim().slice(0, 500);
  db.prepare("INSERT INTO group_messages (id, group_id, user_id, message) VALUES (?, ?, ?, ?)").run(id, groupId, user.id, text);

  return NextResponse.json({ id, username: user.username, message: text });
}
