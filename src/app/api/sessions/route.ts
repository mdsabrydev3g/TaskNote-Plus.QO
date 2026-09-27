import { db } from "@/lib/db";
import { api, json } from "@/lib/api";

// GET /api/sessions — active refresh-token sessions (§10.2 session management UI)
export const GET = api({
  handler: async (_req, _c, s) => {
    const sessions = await db.refreshToken.findMany({
      where: { userId: s.userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, deviceName: true, platform: true, createdAt: true, expiresAt: true, familyId: true },
    });
    return json({ sessions });
  },
});
