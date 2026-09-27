import { NextRequest, NextResponse } from "next/server";
import { rotateRefreshToken } from "@/lib/api";
import { COOKIES } from "@/lib/auth";

// POST /api/auth/refresh — rotate refresh token; reuse detection kills family (§10.2)
export async function POST(req: NextRequest) {
  const raw = req.cookies.get(COOKIES.refresh)?.value;
  if (!raw) return NextResponse.json({ error: "no_refresh_token" }, { status: 401 });
  const result = await rotateRefreshToken(raw);
  if (!result) {
    return NextResponse.json({ error: "session_revoked" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, csrf: result.csrf });
}
