import { z } from "zod";
import { db, scoped } from "@/lib/db";
import { api, json } from "@/lib/api";
import { taskUpdate } from "@/lib/validation";
import { resolveTags } from "@/lib/tags";
import { toDate } from "../route";
import { audit } from "@/lib/audit";

const paramsSchema = z.object({ id: z.string().uuid() });

// PATCH /api/tasks/[id] — status, scheduling, version-conflict aware
export const PATCH = api({
  handler: async (req, ctx: { params: Promise<{ id: string }> }, s) => {
    const { id } = paramsSchema.parse(await ctx.params);
    const body = taskUpdate.parse(await req.json());
    const result = await scoped(s.workspaceId, async (tx) => {
      const existing = await tx.task.findFirst({ where: { id, workspaceId: s.workspaceId, deletedAt: null } });
      if (!existing) return { kind: "not_found" } as const;
      if (body.version !== undefined && existing.version !== body.version) return { kind: "conflict", task: existing } as const;

      const { version, dueAt, deferAt, tags, status, ...rest } = body as any;
      const data: any = { ...rest, version: existing.version + 1 };
      if (dueAt !== undefined) data.dueAt = toDate(dueAt);
      if (deferAt !== undefined) data.deferAt = toDate(deferAt);
      if (status !== undefined) {
        data.status = status;
        data.completedAt = status === "DONE" ? (existing.completedAt ?? new Date()) : null;
      }
      if (tags) {
        await tx.taskTag.deleteMany({ where: { taskId: id } });
        const resolved = await resolveTags(tx, s.workspaceId, tags);
        for (const t of resolved) await tx.taskTag.create({ data: { taskId: id, tagId: t.tag.connect.id as string } });
      }
      const task = await tx.task.update({ where: { id }, data, include: { tags: { include: { tag: true } } } });
      return { kind: "ok", task } as const;
    });
    if (result.kind === "not_found") return json({ error: "not_found" }, 404);
    if (result.kind === "conflict") return json({ error: "version_conflict", task: result.task }, 409);
    return json({ task: result.task });
  },
});

// DELETE /api/tasks/[id]
export const DELETE = api({
  handler: async (_req, ctx: { params: Promise<{ id: string }> }, s) => {
    const { id } = paramsSchema.parse(await ctx.params);
    const found = await db.task.findFirst({ where: { id, workspaceId: s.workspaceId, deletedAt: null }, select: { id: true } });
    if (!found) return json({ error: "not_found" }, 404);
    await db.task.update({ where: { id }, data: { deletedAt: new Date() } });
    audit("delete", { userId: s.userId, workspaceId: s.workspaceId, detail: { entity: "task", id } });
    return json({ ok: true });
  },
});
