import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, passwordIssues } from "@/lib/auth";
import { api, ApiError, createLoginSession, json } from "@/lib/api";
import { audit } from "@/lib/audit";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { detectPlatform } from "@/lib/platform";

const bodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(1).max(80).optional(),
  locale: z.enum(["ar", "en"]).optional(),
});

// POST /api/auth/signup — §7.12 account creation, first workspace auto-provisioned
export const POST = api({
  auth: false,
  csrf: false,
  limit: { limit: 5, windowMs: 60_000 },
  body: bodySchema,
  handler: async (req, _ctx, _s, body: z.infer<typeof bodySchema>) => {
    const ip = req.headers.get("x-forwarded-for") ?? "";
    const issues = passwordIssues(body.password);
    if (issues.length) throw new ApiError(422, "weak_password", issues.join(","));

    const existing = await db.user.findUnique({ where: { email: body.email } });
    if (existing) throw new ApiError(409, "email_taken");

    const user = await db.user.create({
      data: {
        email: body.email,
        passwordHash: await hashPassword(body.password),
        displayName: body.displayName,
        locale: body.locale ?? "ar",
        workspaces: { create: { name: "My Workspace", isDefault: true } },
      },
      include: { workspaces: { where: { isDefault: true }, take: 1 } },
    });
    const ws = user.workspaces[0];
    audit("signup", { userId: user.id, workspaceId: ws.id, ip });
    const ua = req.headers.get("user-agent") ?? "web";
    await createLoginSession(user.id, ws.id, { name: ua.slice(0, 80), platform: detectPlatform(ua) });
    return json({ ok: true, userId: user.id, workspaceId: ws.id }, 201);
  },
});
