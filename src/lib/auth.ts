import { SignJWT, jwtVerify } from "jose";
import { randomBytes, createHash, randomUUID } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16 || s === "change-me-to-a-32-byte-random-secret")
    throw new Error("AUTH_SECRET missing or too weak — set a 32-byte random secret");
  return new TextEncoder().encode(s);
};

export const ACCESS_TTL = "15m"; // §10.2 short-lived access tokens
export const REFRESH_TTL_DAYS = 90;

export const COOKIES = {
  access: "tnp_access",
  refresh: "tnp_refresh",
  csrf: "tnp_csrf",
  lang: "tnp_lang",
} as const;

export interface AccessTokenClaims {
  sub: string; // userId
  ws: string; // workspaceId (workspace-scoped token, §10.4)
  sid: string; // refresh-token family (session id)
}

export async function signAccessToken(claims: AccessTokenClaims): Promise<string> {
  return new SignJWT({ ws: claims.ws })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(secret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub || !payload.ws) return null;
    return { sub: payload.sub, ws: String(payload.ws), sid: String(payload.jti ?? "") };
  } catch {
    return null;
  }
}

// ── Passwords ────────────────────────────────────────────────
export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

/** Basic strength policy; zxcvbn-grade ≥3 approximation (§10.2). */
export function passwordIssues(pw: string): string[] {
  const issues: string[] = [];
  if (pw.length < 10) issues.push("too_short_min_10");
  if (!/[a-zA-Z]/.test(pw)) issues.push("needs_letters");
  if (!/[0-9]/.test(pw)) issues.push("needs_digits");
  if (!/[^a-zA-Z0-9]/.test(pw)) issues.push("needs_symbols");
  if (/^[A-Z][a-z]+$/.test(pw)) issues.push("too_predictable");
  return issues;
}

// ── Refresh tokens (rotating, reuse-detectable) ──────────────
export function newRawRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}
export function hashRefreshToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// ── CSRF double-submit ───────────────────────────────────────
export function newCsrfToken(): string {
  return randomBytes(24).toString("base64url");
}

// ── Cookie helpers (server components / route handlers) ──────
export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(COOKIES.access, accessToken, {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 15 * 60,
  });
  jar.set(COOKIES.refresh, refreshToken, {
    httpOnly: true, secure, sameSite: "lax", path: "/api/auth", maxAge: 60 * 60 * 24 * REFRESH_TTL_DAYS,
  });
  const csrf = newCsrfToken();
  jar.set(COOKIES.csrf, csrf, {
    httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return csrf;
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(COOKIES.access);
  jar.delete(COOKIES.refresh);
  jar.delete(COOKIES.csrf);
}

/** Read + verify the access token from either cookies (browser) or Bearer header (API client). */
export async function readSession(req: NextRequest | null): Promise<AccessTokenClaims | null> {
  let token: string | undefined;
  if (req) token = req.cookies.get(COOKIES.access)?.value ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token && req === null) token = (await cookies()).get(COOKIES.access)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}
