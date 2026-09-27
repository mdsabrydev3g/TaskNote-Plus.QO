"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, newClientRequestId } from "@/lib/client";
import { useApp } from "./providers";

/** Inbox triage (§4 Organize): captured note → task / open as note / discard. */
export function NoteConvert({ id, content }: { id: string; content: string }) {
  const { tr } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function convert() {
    setBusy(true);
    const res = await apiFetch("/api/quickadd", { method: "POST", json: { text: content } });
    if (res.ok) {
      const p = res.data.parsed;
      await apiFetch("/api/tasks", {
        method: "POST",
        json: { title: p.title, dueAt: p.dueAt, priority: p.priority, tags: p.tags, status: "TODO", clientRequestId: newClientRequestId() },
      });
      await apiFetch(`/api/notes/${id}`, { method: "DELETE" });
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="card flex items-start gap-3 py-3!">
      <span className="chip mt-1 shrink-0 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">📥</span>
      <div className="min-w-0 flex-1">
        <p dir="auto" className="line-clamp-2 text-sm">{content}</p>
        <div className="mt-2 flex gap-2 text-xs">
          <button className="btn-primary px-3! py-1! text-xs" onClick={convert} disabled={busy}>{tr("convert_to_task")}</button>
          <Link className="btn-ghost px-3! py-1! text-xs" href={`/notes/${id}`}>{tr("convert_to_note")}</Link>
        </div>
      </div>
    </div>
  );
}
