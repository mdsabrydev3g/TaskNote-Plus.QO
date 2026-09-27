import { z } from "zod";
import { db, scoped } from "@/lib/db";
import { api, json } from "@/lib/api";
import { noteUpdate } from "@/lib/validation";
import { resolveTags } from "@/lib/tags";
import { audit } from "@/lib/audit";
import type { NextRequest } from "next/server";

const paramsSchema = z.object({ id: z.string().uuid() });

// GET /api/notes/[id] — fresh server copy (conflict review §6.3 surfaced diff)
export const GET = api({
  handler: async (_req, ctx: { params: Promise<{ id: string }> }, s) => {
    const { id } = paramsSchema.parse(await ctx.params);
    const note = await db.note.findFirst({
      where: { id, workspaceId: s.workspaceId, deletedAt: null },
      select: { id: true, title: true, content: true, pinned: true, aiAccessible: true, version: true, updatedAt: true },
    });
    if (!note) return json({ error: "not_found" }, 404);
    return json({ note });
  },
});

// PATCH /api/notes/[id] — optimistic version check (§6.5)
export const PATCH = api({
  handler: async (req: NextRequest, ctx: { params: Promise<{ id: string }> }, s) => {
    const { id } = paramsSchema.parse(await ctx.params);
    const body = noteUpdate.parse(await req.json());
    const { version: expectedVersion, tags, ...rest } = body as Record<string, unknown> & { version?: number; tags?: string[] };
    const result = await scoped(s.workspaceId, async (tx) => {
      const existing = await tx.note.findFirst({ where: { id, workspaceId: s.workspaceId, deletedAt: null } });
      if (!existing) return { kind: "not_found" } as const;
      if (expectedVersion !== undefined && existing.version !== expectedVersion) return { kind: "conflict" } as const;
      if (tags) {
        await tx.noteTag.deleteMany({ where: { noteId: id } });
        const resolved = await resolveTags(tx, s.workspaceId, tags);
        for (const t of resolved) await tx.noteTag.create({ data: { noteId: id, tagId: t.tag.connect.id as string } });
      }
      const note = await tx.note.update({
        where: { id },
        data: { ...rest, version: existing.version + 1 },
        include: { tags: { include: { tag: true } } },
      });
      return { kind: "ok", note } as const;
    });
    if (result.kind === "not_found") return json({ error: "not_found" }, 404);
    if (result.kind === "conflict") return json({ error: "version_conflict" }, 409);
    return json({ note: result.note });
  },
});

// DELETE /api/notes/[id] — soft delete (§15.4 no silent loss)
export const DELETE = api({
  handler: async (_req, ctx: { params: Promise<{ id: string }> }, s) => {
    const { id } = paramsSchema.parse(await ctx.params);
    const found = await db.note.findFirst({ where: { id, workspaceId: s.workspaceId, deletedAt: null }, select: { id: true } });
    if (!found) return json({ error: "not_found" }, 404);
    await db.note.update({ where: { id }, data: { deletedAt: new Date() } });
    audit("delete", { userId: s.userId, workspaceId: s.workspaceId, detail: { entity: "note", id } });
    return json({ ok: true });
  },
});
