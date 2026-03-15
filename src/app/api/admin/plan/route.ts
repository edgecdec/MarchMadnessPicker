import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

const PLAN_PATH = path.join(process.cwd(), "PLAN.md");

export interface PlanTask {
  text: string;
  done: boolean;
}

function parsePlan(content: string): PlanTask[] {
  return content.split("\n")
    .filter((line) => /^- \[[ x]\] /.test(line))
    .map((line) => ({
      done: line.startsWith("- [x] "),
      text: line.replace(/^- \[[ x]\] /, ""),
    }));
}

function writePlan(tasks: PlanTask[]): string {
  const header = `# March Madness Picker — Development Plan

## How This Works
An agent reads this file each loop iteration, picks the most important incomplete task, implements it, builds, commits, and pushes. Tasks are ordered by priority (top = most important).

## Tasks
`;
  const lines = tasks.map((t) => `- [${t.done ? "x" : " "}] ${t.text}`).join("\n");
  return header + lines + "\n";
}

export async function GET() {
  const user = await getUser();
  if (!user?.is_admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  try {
    const content = fs.readFileSync(PLAN_PATH, "utf-8");
    return NextResponse.json({ tasks: parsePlan(content) });
  } catch {
    return NextResponse.json({ tasks: [] });
  }
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user?.is_admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { tasks } = await req.json() as { tasks: PlanTask[] };
  fs.writeFileSync(PLAN_PATH, writePlan(tasks));
  return NextResponse.json({ ok: true });
}
