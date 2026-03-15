import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const row = db.prepare("SELECT results_updated_at FROM tournaments ORDER BY year DESC LIMIT 1").get() as any;
  return NextResponse.json({ results_updated_at: row?.results_updated_at || null });
}
