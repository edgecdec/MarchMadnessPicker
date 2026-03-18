import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { syncEspnResults } from "@/lib/espnSync";

const DEBOUNCE_SECONDS = 60;

export async function POST() {
  const db = getDb();
  const row = db.prepare("SELECT results_updated_at FROM tournaments ORDER BY year DESC LIMIT 1").get() as any;

  if (row?.results_updated_at) {
    const age = (Date.now() - new Date(row.results_updated_at + "Z").getTime()) / 1000;
    if (age < DEBOUNCE_SECONDS) {
      return NextResponse.json({ ok: true, updated: 0, skipped: true, age: Math.round(age) });
    }
  }

  const result = await syncEspnResults(2);
  return NextResponse.json({ ok: true, ...result });
}
