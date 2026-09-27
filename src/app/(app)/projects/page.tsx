import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/server";
import { NewProject } from "@/components/new-project";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { workspaceId } = await requireSession();
  const jar = await cookies();
  const lang = jar.get("tnp_lang")?.value === "en" ? "en" : "ar";

  const projects = await db.project.findMany({
    where: { workspaceId, archived: false },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { tasks: true } },
      tasks: { select: { status: true }, take: 1000 },
    },
  });

  return (
    <div className="space-y-4">
      <NewProject lang={lang} />
      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((p) => {
          const done = p.tasks.filter((t) => t.status === "DONE").length;
          const total = p._count.tasks;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <div key={p.id} className="card space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: p.color ?? "#6366f1" }} />
                <p dir="auto" className="font-semibold">{p.name}</p>
              </div>
              {p.description && <p dir="auto" className="line-clamp-2 text-sm text-slate-500">{p.description}</p>}
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>{done}/{total} {lang === "ar" ? "مهمة" : "tasks"}</span>
                <Link href={`/tasks`} className="font-semibold text-indigo-600">{lang === "ar" ? "المهام" : "Tasks"} →</Link>
              </div>
            </div>
          );
        })}
      </div>
      {projects.length === 0 && <p className="card text-center text-sm text-slate-400">{lang === "ar" ? "مفيش مشاريع بعد" : "No projects yet"}</p>}
    </div>
  );
}
