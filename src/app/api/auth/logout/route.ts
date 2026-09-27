import { api, revokeCurrentSession, json } from "@/lib/api";
import { clearAuthCookies } from "@/lib/auth";
import { audit } from "@/lib/audit";

// POST /api/auth/logout — revoke current refresh family + clear cookies
export const POST = api({
  auth: false,
  csrf: false,
  handler: async (req) => {
    await revokeCurrentSession(req);
    await clearAuthCookies();
    audit("logout", { ip: req.headers.get("x-forwarded-for") ?? "" });
    return json({ ok: true });
  },
});
