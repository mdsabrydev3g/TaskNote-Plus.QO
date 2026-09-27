import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/server";
import { NewNote } from "@/components/new-note";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const { workspaceId } = await requireSession();
  const notes = await db.note.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    take: 100,
    include: { tags: { include: { tag: true } } },
  });

  return (
    <div className="space-y-4">
      <NewNote />
      <div className="grid gap-3 sm:grid-cols-2">
        {notes.map((n) => (
          <Link key={n.id} href={`/notes/${n.id}`} className="card hover:border-indigo-300">
            <div className="flex items-center justify-between gap-2">
              <p dir="auto" className="truncate font-semibold">{n.title || "—"}</p>
              {n.pinned && <span aria-label="pinned">📌</span>}
            </div>
            <p dir="auto" className="mt-1 line-clamp-3 text-sm text-slate-500">{n.content}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-400">
              {n.tags.map((t) => <span key={t.tag.id} className="chip bg-slate-100 dark:bg-slate-800">#{t.tag.name}</span>)}
              <span>{new Date(n.updatedAt).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>
      {notes.length === 0 && <p className="card text-center text-sm text-slate-400">مفيش ملاحظات بعد</p>}
    </div>
  );
}
