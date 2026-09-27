"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";
import { useApp } from "./providers";

export function NewEvent({ lang: _l }: { lang: string }) {
  const { tr, lang } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !startAt || busy) return;
    setBusy(true);
    const res = await apiFetch("/api/events", {
      method: "POST",
      json: { title, startAt: new Date(startAt).toISOString(), endAt: endAt ? new Date(endAt).toISOString() : null, tz: Intl.DateTimeFormat().resolvedOptions().timeZone },
    });
    setBusy(false);
    if (res.ok) { setOpen(false); setTitle(""); setStartAt(""); setEndAt(""); router.refresh(); }
  }

  if (!open) return <button className="btn-primary w-full" onClick={() => setOpen(true)}>＋ {tr("new_event")}</button>;
  return (
    <form onSubmit={create} className="card space-y-3">
      <input dir="auto" className="input" placeholder={tr("event_title")} value={title} onChange={(e) => setTitle(e.target.value)} required />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-500">{tr("start")}<input type="datetime-local" className="input" value={startAt} onChange={(e) => setStartAt(e.target.value)} required /></label>
        <label className="text-xs text-slate-500">{tr("end")}<input type="datetime-local" className="input" value={endAt} onChange={(e) => setEndAt(e.target.value)} /></label>
      </div>
      <div className="flex gap-2">
        <button className="btn-primary flex-1" disabled={busy}>{tr("save")}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{tr("cancel")}</button>
      </div>
      <p className="text-[11px] text-slate-400">{lang === "ar" ? "التوقيت المحلي بتاعك هيتبعت مع الحدث" : "Your local timezone is stored with the event (§6.7)"}</p>
    </form>
  );
}
