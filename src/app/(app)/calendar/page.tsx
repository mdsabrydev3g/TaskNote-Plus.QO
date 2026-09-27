import { db } from "@/lib/db";
import { requireSession } from "@/lib/server";
import { cookies } from "next/headers";
import { NewEvent } from "@/components/new-event";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { workspaceId } = await requireSession();
  const sp = await searchParams;
  const jar = await cookies();
  const lang = jar.get("tnp_lang")?.value === "en" ? "en" : "ar";

  const now = new Date();
  const [yRaw, mRaw] = (sp.m ?? `${now.getFullYear()}-${now.getMonth() + 1}`).split("-");
  const year = parseInt(yRaw, 10) || now.getFullYear();
  const month = Math.min(Math.max(parseInt(mRaw, 10) || now.getMonth() + 1, 1), 12);

  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0, 23, 59, 59);
  const [events, tasks] = await Promise.all([
    db.event.findMany({ where: { workspaceId, startAt: { gte: first, lte: last } }, orderBy: { startAt: "asc" } }),
    db.task.findMany({ where: { workspaceId, deletedAt: null, dueAt: { gte: first, lte: last } }, orderBy: { dueAt: "asc" } }),
  ]);

  const byDay = new Map<number, string[]>();
  const push = (day: number, s: string) => byDay.set(day, [...(byDay.get(day) ?? []), s]);
  for (const e of events) push(e.startAt.getDate(), `🟣 ${lang === "ar" ? e.title : e.title}`);
  for (const t of tasks) push(t.dueAt!.getDate(), `${t.status === "DONE" ? "✅" : "⬜"} ${t.title}`);

  const weeks: { day: number | null }[][] = [];
  let week: { day: number | null }[] = [];
  for (let i = 0; i < first.getDay(); i++) week.push({ day: null });
  for (let d = 1; d <= last.getDate(); d++) {
    week.push({ day: d });
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) { while (week.length < 7) week.push({ day: null }); weeks.push(week); }

  const days = (lang === "ar" ? "أحد,اثنين,ثلاثاء,أربعاء,خميس,جمعة,سبت" : "Sun,Mon,Tue,Wed,Thu,Fri,Sat").split(",");
  const months = (lang === "ar" ? "يناير,فبراير,مارس,أبريل,مايو,يونيو,يوليو,أغسطس,سبتمبر,أكتوبر,نوفمبر,ديسمبر" : "January,February,March,April,May,June,July,August,September,October,November,December").split(",");
  const prev = month === 1 ? `${year - 1}-12` : `${year}-${month - 1}`;
  const next = month === 12 ? `${year + 1}-1` : `${year}-${month + 1}`;
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <a href={`/calendar?m=${prev}`} className="btn-ghost px-3!">←</a>
        <h1 className="text-lg font-bold">{months[month - 1]} {year}</h1>
        <a href={`/calendar?m=${next}`} className="btn-ghost px-3!">→</a>
      </div>
      {!isCurrent && <a href={`/calendar`} className="text-xs font-semibold text-indigo-600">→ {lang === "ar" ? "الشهر الحالي" : "This month"}</a>}

      <div className="card p-2!">
        <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400">
          {days.map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        {weeks.map((w, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {w.map((c, ci) => {
              const items = c.day ? byDay.get(c.day) ?? [] : [];
              const isToday = isCurrent && c.day === now.getDate();
              return (
                <div key={ci} className={`min-h-20 border-t border-slate-100 p-1 text-[11px] dark:border-slate-800 ${c.day ? "" : "opacity-30"}`}>
                  <div className={`mb-1 font-semibold ${isToday ? "text-indigo-600" : "text-slate-400"}`}>{c.day ?? ""}</div>
                  {items.slice(0, 3).map((s, i) => <div key={i} dir="auto" className="truncate rounded bg-slate-50 px-1 dark:bg-slate-800">{s}</div>)}
                  {items.length > 3 && <div className="text-slate-400">+{items.length - 3}</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <NewEvent lang={lang} />
    </div>
  );
}
