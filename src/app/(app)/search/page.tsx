import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const HREF: Record<string, (id: string) => string> = {
  note: (id) => `/notes/${id}`,
  task: () => `/tasks`,
  project: () => `/projects`,
  event: () => `/calendar`,
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { workspaceId } = await requireSession();
  const sp = await searchParams;
  const jar = await cookies();
  const lang = jar.get("tnp_lang")?.value === "en" ? "en" : "ar";
  const q = (sp.q ?? "").trim();

  let results: { type: string; id: string; title: string }[] = [];
  if (q) {
    const like = { contains: q, mode: "insensitive" as const };
    const [notes, tasks, projects] = await Promise.all([
      db.note.findMany({ where: { workspaceId, deletedAt: null, OR: [{ title: like }, { content: like }] }, take: 15, orderBy: { updatedAt: "desc" } }),
      db.task.findMany({ where: { workspaceId, deletedAt: null, OR: [{ title: like }, { description: like }] }, take: 15, orderBy: { updatedAt: "desc" } }),
      db.project.findMany({ where: { workspaceId, name: like }, take: 10 }),
    ]);
    results = [
      ...notes.map((n) => ({ type: "note", id: n.id, title: n.title || n.content.slice(0, 70) })),
      ...tasks.map((t) => ({ type: "task", id: t.id, title: t.title })),
      ...projects.map((p) => ({ type: "project", id: p.id, title: p.name })),
    ];
  }

  const ICON: Record<string, string> = { note: "📝", task: "✅", project: "🗂️", event: "📅" };

  return (
    <div className="space-y-4">
      <form action="/search" method="get" className="flex gap-2">
        <input name="q" defaultValue={q} dir="auto" autoFocus className="input" placeholder={lang === "ar" ? "دوّر في كل حاجة…" : "Search everything…"} />
        <button className="btn-primary shrink-0">{lang === "ar" ? "بحث" : "Search"}</button>
      </form>
      {q && results.length === 0 && <p className="card text-center text-sm text-slate-400">{lang === "ar" ? "مفيش نتائج" : "No results"}</p>}
      <div className="space-y-2">
        {results.map((r) => (
          <Link key={`${r.type}-${r.id}`} href={HREF[r.type](r.id)} className="card flex items-center gap-3 py-3! hover:border-indigo-300">
            <span>{ICON[r.type]}</span>
            <div className="min-w-0">
              <p dir="auto" className="truncate font-medium">{r.title || "—"}</p>
              <p className="text-xs text-slate-400">{r.type}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
