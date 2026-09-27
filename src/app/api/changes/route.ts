import { db } from "@/lib/db";
import { api, json } from "@/lib/api";

// GET /api/changes?since=ISO — pull-based sync for clients (PWA + mobile).
// Includes soft-deleted rows so clients can remove stale copies (§15.4).
// Full push/CRDT real-time layer is V1 per roadmap §23; this is the MVP contract.
export const GET = api({
  handler: async (req, _c, s) => {
    const sinceRaw = new URL(req.url).searchParams.get("since");
    const since = sinceRaw ? new Date(sinceRaw) : new Date(0);
    if (Number.isNaN(+since)) return json({ error: "bad_since" }, 400);

    const [notes, tasks, projects, events] = await Promise.all([
      db.note.findMany({ where: { workspaceId: s.workspaceId, updatedAt: { gt: since } }, include: { tags: { include: { tag: true } } } }),
      db.task.findMany({ where: { workspaceId: s.workspaceId, updatedAt: { gt: since } }, include: { tags: { include: { tag: true } } } }),
      db.project.findMany({ where: { workspaceId: s.workspaceId, updatedAt: { gt: since } } }),
      db.event.findMany({ where: { workspaceId: s.workspaceId, updatedAt: { gt: since } } }),
    ]);
    return json({
      now: new Date().toISOString(),
      changes: { notes, tasks, projects, events },
      deleted: {
        notes: notes.filter((n) => n.deletedAt).map((n) => n.id),
        tasks: tasks.filter((t) => t.deletedAt).map((t) => t.id),
      },
    });
  },
});
