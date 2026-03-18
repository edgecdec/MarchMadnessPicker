import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { syncEspnResults } from "@/lib/espnSync";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user?.is_admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  // Admin sync fetches 21 days back for full coverage
  const result = await syncEspnResults(21);
  return NextResponse.json({ ok: true, ...result });
}
