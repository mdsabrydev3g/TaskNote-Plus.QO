import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { api, ApiError, createLoginSession, json } from "@/lib/api";
import { audit } from "@/lib/audit";
import { emailSchema } from "@/lib/validation";
import { detectPlatform } from "@/lib/platform";

const bodySchema = z.object({ email: emailSchema, password: z.string().min(1).max(200) });

// POST /api/auth/login — rate-limited + failed attempts logged to SecurityEvent (§10.2, §10.12)
export const POST = api({
  auth: false,
  csrf: false,
  limit: { limit: 8, windowMs: 60_000 },
  body: bodySchema,
  handler: async (req, _ctx, _s, body: z.infer<typeof bodySchema>) => {
    const ip = req.headers.get("x-forwarded-for") ?? "";
    const user = await db.user.findUnique({
      where: { email: body.email },
      include: { workspaces: { where: { isDefault: true }, take: 1 } },
    });
    // Constant-ish compare: verify against dummy hash when user not found
    const dummyHash = "$2a$10$772oX3m0c0H0uP0dQ6vQWuO7y1S0S2G6X9hJ0aG9sGx0D0eJ9F1oK";
    const ok = user ? await verifyPassword(body.password, user.passwordHash) : await verifyPassword(body.password, dummyHash);

    if (!user || !ok) {
      if (user) {
        await db.securityEvent.create({ data: { userId: user.id, type: "failed_login", ip } }).catch(() => {});
        audit("login_failed", { userId: user.id, ip });
      }
      throw new ApiError(401, "invalid_credentials");
    }
    const ws = user.workspaces[0];
    if (!ws) throw new ApiError(500, "no_workspace");
    audit("login", { userId: user.id, workspaceId: ws.id, ip });
    const ua = req.headers.get("user-agent") ?? "web";
    await createLoginSession(user.id, ws.id, { name: ua.slice(0, 80), platform: detectPlatform(ua) });
    return json({ ok: true });
  },
});
