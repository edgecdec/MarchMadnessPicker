import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db";
import { hashPassword, verifyPassword, createToken, setTokenCookie, clearTokenCookie, getUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { action, username, password } = await req.json();
  const db = getDb();

  if (action === "register") {
    if (!username || !password || password.length < 4) {
      return NextResponse.json({ error: "Username and password (4+ chars) required" }, { status: 400 });
    }
    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (existing) {
      return NextResponse.json({ error: "Username taken" }, { status: 409 });
    }
    const id = uuid();
    const isFirstUser = !db.prepare("SELECT id FROM users LIMIT 1").get();
    db.prepare("INSERT INTO users (id, username, password_hash, is_admin) VALUES (?, ?, ?, ?)").run(
      id, username, hashPassword(password), isFirstUser ? 1 : 0
    );
    const token = createToken({ id, username, is_admin: !!isFirstUser });
    const res = NextResponse.json({ id, username, is_admin: !!isFirstUser });
    res.headers.set("Set-Cookie", setTokenCookie(token));
    return res;
  }

  if (action === "login") {
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const token = createToken({ id: user.id, username: user.username, is_admin: !!user.is_admin });
    const res = NextResponse.json({ id: user.id, username: user.username, is_admin: !!user.is_admin });
    res.headers.set("Set-Cookie", setTokenCookie(token));
    return res;
  }

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.headers.set("Set-Cookie", clearTokenCookie());
    return res;
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user });
}
