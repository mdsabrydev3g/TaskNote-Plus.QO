import { z } from "zod";
import { db } from "@/lib/db";
import { api, json } from "@/lib/api";
import { audit } from "@/lib/audit";

const paramsSchema = z.object({ id: z.string().uuid() });

// DELETE /api/sessions/[id] — remote session revoke (§10.2 "revoke any device remotely")
export const DELETE = api({
  handler: async (_req, ctx: { params: Promise<{ id: string }> }, s) => {
    const { id } = paramsSchema.parse(await ctx.params);
    const sess = await db.refreshToken.findFirst({ where: { id, userId: s.userId } });
    if (!sess) return json({ error: "not_found" }, 404);
    await db.refreshToken.updateMany({ where: { familyId: sess.familyId }, data: { revokedAt: new Date() } });
    audit("device_revoked", { userId: s.userId, workspaceId: s.workspaceId, detail: { session: id } });
    return json({ ok: true });
  },
});
