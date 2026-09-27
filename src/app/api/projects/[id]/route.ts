import { z } from "zod";
import { db } from "@/lib/db";
import { api, json } from "@/lib/api";
import { projectUpdate } from "@/lib/validation";
import { audit } from "@/lib/audit";

const paramsSchema = z.object({ id: z.string().uuid() });

// PATCH /api/projects/[id]
export const PATCH = api({
  handler: async (req, ctx: { params: Promise<{ id: string }> }, s) => {
    const { id } = paramsSchema.parse(await ctx.params);
    const body = projectUpdate.parse(await req.json());
    const found = await db.project.findFirst({ where: { id, workspaceId: s.workspaceId }, select: { id: true } });
    if (!found) return json({ error: "not_found" }, 404);
    const project = await db.project.update({ where: { id }, data: body as any });
    return json({ project });
  },
});

// DELETE /api/projects/[id] — tasks survive, become project-less (onDelete: SetNull)
export const DELETE = api({
  handler: async (_req, ctx: { params: Promise<{ id: string }> }, s) => {
    const { id } = paramsSchema.parse(await ctx.params);
    const found = await db.project.findFirst({ where: { id, workspaceId: s.workspaceId }, select: { id: true } });
    if (!found) return json({ error: "not_found" }, 404);
    await db.project.delete({ where: { id } });
    audit("delete", { userId: s.userId, workspaceId: s.workspaceId, detail: { entity: "project", id } });
    return json({ ok: true });
  },
});
