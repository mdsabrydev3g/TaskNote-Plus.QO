"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, localTimeContext, newClientRequestId } from "@/lib/client";
import { useApp } from "./providers";

interface Parsed {
  title: string; dueAt?: string; priority: string; tags: string[]; matched: string[];
}

/** Natural-language quick-add with visible confirmation before commit (§7.3 MUST). */
export function TaskQuickAdd() {
  const { tr, lang } = useApp();
  const router = useRouter();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [busy, setBusy] = useState(false);

  async function analyze() {
    const value = text.trim();
    if (!value) return;
    setBusy(true);
    const res = await apiFetch<{ parsed: Parsed }>("/api/quickadd", { method: "POST", json: { text: value, ...localTimeContext() } });
    setBusy(false);
    if (res.ok) {
      const p = res.data!.parsed;
      if (!p.matched.length) { commit(p); return; }
      setParsed(p);
    }
  }

  async function commit(p: Parsed) {
    setBusy(true);
    await apiFetch("/api/tasks", {
      method: "POST",
      json: {
        title: p.title,
        dueAt: p.dueAt,
        priority: p.priority,
        tags: p.tags,
        clientRequestId: newClientRequestId(),
        deviceOrigin: "web",
      },
    });
    setBusy(false);
    setParsed(null);
    setText("");
    router.refresh();
  }

  return (
    <div className="card space-y-3">
      <div className="flex gap-2">
        <input dir="auto" className="input" placeholder={lang === "ar" ? "مهمة: راجع العقد بكرة 3pm #قانوني عاجل" : "Task: review contract tomorrow 3pm #legal urgent"}
          value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (parsed ? commit(parsed) : analyze())} />
        <button className="btn-primary shrink-0" onClick={() => (parsed ? commit(parsed) : analyze())} disabled={busy || !text.trim()}>
          {parsed ? tr("confirm_add") : tr("save")}
        </button>
      </div>
      {parsed && (
        <div className="rounded-xl bg-indigo-50 p-3 text-sm dark:bg-indigo-950">
          <p className="mb-1 font-semibold text-indigo-700 dark:text-indigo-300">{tr("quickadd_preview")}</p>
          <p dir="auto" className="font-medium">{parsed.title}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {parsed.dueAt && <span className="chip bg-white dark:bg-slate-900">📅 {new Date(parsed.dueAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}</span>}
            {parsed.priority !== "NONE" && <span className="chip bg-rose-100 text-rose-700">🔥 {tr(("priority_" + parsed.priority) as any)}</span>}
            {parsed.tags.map((t) => <span key={t} className="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">#{t}</span>)}
            <button className="btn-ghost px-2 py-0.5 text-xs" onClick={() => { setParsed(null); }}>{tr("cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
