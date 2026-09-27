import { NextResponse } from "next/server";

// GET /api/health — liveness probe (public; used by Vercel checks + client online badge)
export async function GET() {
  return NextResponse.json({ ok: true, app: "TaskNote Plus", ts: new Date().toISOString() });
}
