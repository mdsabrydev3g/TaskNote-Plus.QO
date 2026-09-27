import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { COOKIES } from "@/lib/auth";

// POST /api/prefs/lang — persist UI language choice (§15.3)
export async function POST(req: Request) {
  const body = z.object({ lang: z.enum(["ar", "en"]) }).parse(await req.json());
  const jar = await cookies();
  jar.set(COOKIES.lang, body.lang, {
    httpOnly: false, sameSite: "lax", path: "/", maxAge: 31536000,
    secure: process.env.NODE_ENV === "production",
  });
  return NextResponse.json({ ok: true });
}
