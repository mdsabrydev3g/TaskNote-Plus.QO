import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "./db";
import { readSession, verifyAccessToken, newRawRefreshToken, hashRefreshToken, setAuthCookies, COOKIES, REFRESH_TTL_DAYS, AccessTokenClaims } from "./auth";
import { rateLimit, LIMITS } from "./rate-limit";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string, public headers?: Record<string, string>) {
    super(message ?? code);
  }
}

export interface Session { userId: string; workspaceId: string; sid: string }

/** Standard route wrapper: auth + CSRF + rate limit + zod body + typed errors. */
export function api<Ctx>(
  opts: {
    auth?: boolean;              // default true
    csrf?: boolean;              // default true for mutations
    limit?: { limit: number; windowMs: number };
    body?: z.ZodTypeAny;         // parsed JSON body schema
    handler: (req: NextRequest, ctx: Ctx, s: Session, body: any) => Promise<NextResponse | Response>;
  }
) {
  return async (req: NextRequest, ctx: Ctx): Promise<Response> => {
    try {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
      const lim = opts.limit ?? (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) ? LIMITS.write : LIMITS.read);
      const rl = rateLimit(`${ip}:${new URL(req.url).pathname}`, lim.limit, lim.windowMs);
      if (!rl.ok)
        throw new ApiError(429, "rate_limited", "Too many requests", { "Retry-After": String(rl.retryAfterSec) });

      let session: Session = { userId: "", workspaceId: "", sid: "" };
      if (opts.auth !== false) {
        const claims = await readSession(req);
        if (!claims) throw new ApiError(401, "unauthorized");
        session = { userId: claims.sub, workspaceId: claims.ws, sid: claims.sid };
        if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && opts.csrf !== false) {
          const cookieToken = req.cookies.get(COOKIES.csrf)?.value;
          const headerToken = req.headers.get("x-csrf-token");
          if (!cookieToken || !headerToken || cookieToken !== headerToken)
            throw new ApiError(403, "csrf_failed");
        }
      }

      let body: any = undefined;
      if (opts.body) {
        const raw = await req.json().catch(() => undefined);
        const parsed = opts.body.safeParse(raw);
        if (!parsed.success)
          throw new ApiError(422, "validation_error", JSON.stringify(parsed.error.issues.map((i) => ({ path: i.path.join("."), msg: i.message }))));
        body = parsed.data;
      }
      return await opts.handler(req, ctx, session, body);
    } catch (e) {
      if (e instanceof ApiError)
        return NextResponse.json({ error: e.code, message: e.message }, { status: e.status, headers: e.headers });
      console.error("api_error", e);
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
  };
}

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

// ── Session lifecycle (§10.2 refresh rotation + reuse detection) ──

export async function createLoginSession(userId: string, workspaceId: string, device: { name?: string; platform?: string }) {
  const raw = newRawRefreshToken();
  const familyId = crypto.randomUUID();
  await db.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(raw),
      familyId,
      deviceName: device.name ?? "unknown",
      platform: device.platform ?? "web",
      expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 86400_000),
    },
  });
  await db.device.create({
    data: { workspaceId, name: device.name ?? "unknown", platform: device.platform ?? "web" },
  });
  const access = await (await import("./auth")).signAccessToken({ sub: userId, ws: workspaceId, sid: familyId });
  const csrf = await setAuthCookies(access, raw);
  return { access, csrf };
}

export async function rotateRefreshToken(oldRaw: string): Promise<{ access: string; csrf: string } | null> {
  const oldHash = hashRefreshToken(oldRaw);
  const old = await db.refreshToken.findUnique({ where: { tokenHash: oldHash }, include: { user: { include: { workspaces: { where: { isDefault: true }, take: 1 } } } } });
  if (!old) return null;

  if (old.revokedAt || old.replacedById) {
    // Reuse detected → kill the whole family (§10.2 MUST)
    await db.$transaction([
      db.refreshToken.updateMany({ where: { familyId: old.familyId, revokedAt: null }, data: { revokedAt: new Date() } }),
      db.securityEvent.create({ data: { userId: old.userId, type: "token_reuse_detected" } }),
    ]);
    return null;
  }
  if (old.expiresAt < new Date()) return null;

  const workspace = old.user.workspaces[0];
  if (!workspace) return null;

  const raw = newRawRefreshToken();
  const newRec = await db.refreshToken.create({
    data: {
      userId: old.userId,
      tokenHash: hashRefreshToken(raw),
      familyId: old.familyId,
      deviceName: old.deviceName,
      platform: old.platform,
      expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 86400_000),
    },
  });
  await db.refreshToken.update({ where: { id: old.id }, data: { revokedAt: new Date(), replacedById: newRec.id } });
  const access = await (await import("./auth")).signAccessToken({ sub: old.userId, ws: workspace.id, sid: old.familyId });
  const csrf = await setAuthCookies(access, raw);
  return { access, csrf };
}

export async function revokeCurrentSession(req: NextRequest) {
  const raw = req.cookies.get(COOKIES.refresh)?.value;
  if (raw) await db.refreshToken.updateMany({ where: { tokenHash: hashRefreshToken(raw), revokedAt: null }, data: { revokedAt: new Date() } });
}

export { verifyAccessToken };
