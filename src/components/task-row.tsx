"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";
import { useApp } from "./providers";

export interface TaskDTO {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt?: string | null;
  tags?: { tag: { name: string } }[];
  project?: { name: string; color?: string | null } | null;
  version: number;
}

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

export function TaskRow({ task }: { task: TaskDTO }) {
  const { tr, lang } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const done = task.status === "DONE";

  async function toggle() {
    if (busy) return;
    setBusy(true);
    await apiFetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      json: { status: done ? "TODO" : "DONE", version: task.version },
    });
    setBusy(false);
    router.refresh();
  }

  const overdue = !done && task.dueAt && new Date(task.dueAt) < new Date(new Date().toDateString());

  return (
    <div className="card flex items-start gap-3 py-3!">
      <button onClick={toggle} aria-label={tr("task_done")}
        className={`mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 ${done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-indigo-500 dark:border-slate-600"}`}>
        {done && "✓"}
      </button>
      <div className="min-w-0 flex-1">
        <p dir="auto" className={`font-medium ${done ? "text-slate-400 line-through" : ""}`}>{task.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {task.priority !== "NONE" && (
            <span className={`chip ${PRIORITY_COLOR[task.priority] ?? "bg-slate-100 dark:bg-slate-800"}`}>{tr(("priority_" + task.priority) as never)}</span>
          )}
          {task.dueAt && (
            <span className={`chip ${overdue ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
              📅 {new Date(task.dueAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              {overdue ? ` · ${tr("overdue")}` : ""}
            </span>
          )}
          {task.project && <span className="chip bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">🗂 {task.project.name}</span>}
          {task.tags?.map((t) => <span key={t.tag.name} className="chip bg-slate-100 text-slate-500 dark:bg-slate-800">#{t.tag.name}</span>)}
        </div>
      </div>
      {task.status === "INBOX" && !done && (
        <span className="chip shrink-0 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">{tr("status_INBOX")}</span>
      )}
    </div>
  );
}
