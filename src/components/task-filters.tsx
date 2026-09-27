"use client";
import Link from "next/link";
import { useApp } from "./providers";

const VIEWS = [
  { id: "open", ar: "المفتوحة", en: "Open" },
  { id: "week", ar: "الأسبوع", en: "This week" },
  { id: "inbox", ar: "الوارد", en: "Inbox" },
  { id: "done", ar: "المنتهية", en: "Done" },
];

export function TaskFilters({ active, lang: _lang }: { active: string; lang: string }) {
  const { lang } = useApp();
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {VIEWS.map((v) => (
        <Link key={v.id} href={`/tasks?view=${v.id}`}
          className={`chip whitespace-nowrap px-3 py-1.5 text-sm ${active === v.id ? "bg-indigo-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"}`}>
          {lang === "ar" ? v.ar : v.en}
        </Link>
      ))}
    </div>
  );
}
