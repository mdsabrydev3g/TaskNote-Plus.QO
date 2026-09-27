import { db } from "@/lib/db";
import { requireSession } from "@/lib/server";
import { TaskRow, TaskDTO } from "@/components/task-row";
import { TaskQuickAdd } from "@/components/task-quick-add";
import { TaskFilters } from "@/components/task-filters";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { workspaceId } = await requireSession();
  const sp = await searchParams;
  const jar = await cookies();
  const lang = jar.get("tnp_lang")?.value === "en" ? "en" : "ar";
  const view = sp.view ?? "open";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const where: any = { workspaceId, deletedAt: null };
  if (view === "open") where.status = { notIn: ["DONE", "CANCELED"] };
  else if (view === "done") where.status = "DONE";
  else if (view === "inbox") where.status = "INBOX";
  else if (view === "week") { where.status = { notIn: ["DONE", "CANCELED"] }; where.dueAt = { lt: new Date(startOfToday.getTime() + 7 * 86400000) }; }

  const tasks = await db.task.findMany({
    where,
    orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { priority: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: { tags: { include: { tag: true } }, project: { select: { name: true, color: true } } },
  });

  return (
    <div className="space-y-4">
      <TaskQuickAdd />
      <TaskFilters active={view} lang={lang} />
      <div className="space-y-2">
        {tasks.map((t) => <TaskRow key={t.id} task={t as unknown as TaskDTO} />)}
        {tasks.length === 0 && <p className="card text-center text-sm text-slate-400">{lang === "ar" ? "مفيش مهام هنا" : "No tasks here"}</p>}
      </div>
    </div>
  );
}
