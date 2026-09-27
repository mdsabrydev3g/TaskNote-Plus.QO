import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, passwordIssues } from "@/lib/auth";
import { api, ApiError, json } from "@/lib/api";
import { audit } from "@/lib/audit";

const bodySchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(1).max(200),
});

// POST /api/auth/change-password (§10.2) — verify the old password, enforce the
// strength policy on the new one, then revoke every OTHER session family while
// keeping the caller's current device signed in (sid claim = refresh familyId).
export const POST = api({
  limit: { limit: 5, windowMs: 60_000 },
  body: bodySchema,
  handler: async (_req, _ctx, s, body: z.infer<typeof bodySchema>) => {
    const user = await db.user.findUnique({ where: { id: s.userId } });
    if (!user) throw new ApiError(401, "unauthorized");

    if (!(await verifyPassword(body.currentPassword, user.passwordHash))) {
      await db.securityEvent
        .create({ data: { userId: user.id, type: "wrong_current_password" } })
        .catch(() => {});
      throw new ApiError(403, "wrong_password");
    }
    const issues = passwordIssues(body.newPassword);
    if (issues.length) throw new ApiError(422, "weak_password", issues.join(","));
    if (body.newPassword === body.currentPassword) throw new ApiError(422, "same_password");

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(body.newPassword) },
    });
    const revoked = await db.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null, familyId: { not: s.sid } },
      data: { revokedAt: new Date() },
    });
    await db.securityEvent
      .create({ data: { userId: user.id, type: "suspicious_activity", detail: { passwordChanged: true, sessionsRevoked: revoked.count } } })
      .catch(() => {});
    audit("password_changed", { userId: user.id, detail: { sessionsRevoked: revoked.count } });
    return json({ ok: true, sessionsRevoked: revoked.count });
  },
});
