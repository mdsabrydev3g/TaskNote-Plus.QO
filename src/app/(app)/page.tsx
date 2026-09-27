import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/server";
import { QuickCapture } from "@/components/quick-capture";
import { TaskQuickAdd } from "@/components/task-quick-add";
import { TaskRow, TaskDTO } from "@/components/task-row";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const { workspaceId } = await requireSession();
  const jar = await cookies();
  const lang = jar.get("tnp_lang")?.value === "en" ? "en" : "ar";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000);

  const [openTasks, recentNotes] = await Promise.all([
    db.task.findMany({
      where: {
        workspaceId, deletedAt: null, status: { notIn: ["DONE", "CANCELED"] },
        OR: [{ dueAt: { lt: endOfToday } }, { dueAt: null, status: "IN_PROGRESS" }, { status: "INBOX" }],
      },
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { priority: "desc" }],
      take: 15,
      include: { tags: { include: { tag: true } }, project: { select: { name: true, color: true } } },
    }),
    db.note.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      take: 6,
    }),
  ]);

  const overdue = openTasks.filter((t) => t.dueAt && t.dueAt < startOfToday);

  return (
    <div className="space-y-5">
      <QuickCapture autoFocus />
      <TaskQuickAdd />

      {overdue.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold text-rose-600">⚠ {lang === "ar" ? "متأخرة" : "Overdue"}</h2>
          <div className="space-y-2">{overdue.map((t) => <TaskRow key={t.id} task={t as unknown as TaskDTO} />)}</div>
        </section>
      )}
      <section>
        <h2 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">☀ {lang === "ar" ? "تركيز النهاردة" : "Today's focus"}</h2>
        {openTasks.length === 0
          ? <p className="card text-center text-sm text-slate-400">{lang === "ar" ? "مفيش حاجة معلّقة — التقط فكرة جديدة ⬆" : "Nothing pending — capture an idea above ⬆"}</p>
          : <div className="space-y-2">{openTasks.map((t) => <TaskRow key={t.id} task={t as unknown as TaskDTO} />)}</div>}
      </section>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">📝 {lang === "ar" ? "أحدث الملاحظات" : "Recent notes"}</h2>
          <Link className="text-xs font-semibold text-indigo-600" href="/notes">{lang === "ar" ? "الكل" : "All"} →</Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {recentNotes.map((n) => (
            <Link key={n.id} href={`/notes/${n.id}`} className="card hover:border-indigo-300">
              <p dir="auto" className="truncate font-semibold">{n.title || (n.content.slice(0, 60) || "—")}</p>
              <p dir="auto" className="mt-1 line-clamp-2 text-xs text-slate-500">{n.content}</p>
            </Link>
          ))}
          {recentNotes.length === 0 && <p className="card text-center text-sm text-slate-400 sm:col-span-2">{lang === "ar" ? "مفيش ملاحظات بعد" : "No notes yet"}</p>}
        </div>
      </section>
    </div>
  );
}
