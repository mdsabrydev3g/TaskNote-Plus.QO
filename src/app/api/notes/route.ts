import { db } from "@/lib/db";
import { scoped } from "@/lib/db";
import { api, json } from "@/lib/api";
import { noteCreate } from "@/lib/validation";
import { resolveTags } from "@/lib/tags";
import { z } from "zod";
import type { NextRequest } from "next/server";

// GET /api/notes — list (recent first, pinned top); optional ?q= & ?limit=
export const GET = api({
  handler: async (req: NextRequest, _c, s) => {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
    const notes = await db.note.findMany({
      where: {
        workspaceId: s.workspaceId,
        deletedAt: null,
        ...(q ? { OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { content: { contains: q, mode: "insensitive" as const } },
        ] } : {}),
      },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      take: limit,
      include: { tags: { include: { tag: true } } },
    });
    return json({ notes });
  },
});

// POST /api/notes
export const POST = api({
  body: noteCreate,
  handler: async (_req, _c, s, body: z.infer<typeof noteCreate>) => {
    const note = await scoped(s.workspaceId, async (tx) =>
      tx.note.create({
        data: {
          workspaceId: s.workspaceId,
          title: body.title,
          content: body.content,
          pinned: body.pinned,
          aiAccessible: body.aiAccessible ?? true,
          tags: { create: await resolveTags(tx, s.workspaceId, body.tags) },
        },
        include: { tags: { include: { tag: true } } },
      })
    );
    return json({ note }, 201);
  },
});
