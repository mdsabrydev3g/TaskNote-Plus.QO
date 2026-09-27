import { db } from "@/lib/db";
import { api, json } from "@/lib/api";
import { searchSchema } from "@/lib/validation";

// GET /api/search?q=&type=&limit= — unified surface across modules (§7.10)
// MVP: lexical search; semantic/pgvector is V2 per roadmap §23.
export const GET = api({
  limit: { limit: 60, windowMs: 60_000 },
  handler: async (req, _c, s) => {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const q = searchSchema.parse({ q: params.q ?? "", type: params.type ?? "all", limit: params.limit ?? "20" });
    if (!q.q) return json({ results: [] });

    const like = { contains: q.q, mode: "insensitive" as const };
    const want = (t: string) => q.type === "all" || q.type === t;

    const [notes, tasks, projects, events] = await Promise.all([
      want("note") ? db.note.findMany({ where: { workspaceId: s.workspaceId, deletedAt: null, OR: [{ title: like }, { content: like }] }, orderBy: { updatedAt: "desc" }, take: q.limit }) : [],
      want("task") ? db.task.findMany({ where: { workspaceId: s.workspaceId, deletedAt: null, OR: [{ title: like }, { description: like }] }, orderBy: { updatedAt: "desc" }, take: q.limit }) : [],
      want("project") ? db.project.findMany({ where: { workspaceId: s.workspaceId, name: like }, take: q.limit }) : [],
      want("event") ? db.event.findMany({ where: { workspaceId: s.workspaceId, title: like }, orderBy: { startAt: "desc" }, take: q.limit }) : [],
    ]);

    const results = [
      ...notes.map((n) => ({ type: "note", id: n.id, title: n.title || n.content.slice(0, 80), updatedAt: n.updatedAt })),
      ...tasks.map((t) => ({ type: "task", id: t.id, title: t.title, updatedAt: t.updatedAt })),
      ...projects.map((p) => ({ type: "project", id: p.id, title: p.name, updatedAt: p.updatedAt })),
      ...events.map((e) => ({ type: "event", id: e.id, title: e.title, updatedAt: e.updatedAt })),
    ].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, q.limit);

    return json({ results });
  },
});
