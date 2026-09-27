"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";
import { useApp } from "./providers";

export function NewProject({ lang: _l }: { lang: string }) {
  const { tr, lang } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    await apiFetch("/api/projects", { method: "POST", json: { name: name.trim() } });
    setBusy(false);
    setOpen(false); setName("");
    router.refresh();
  }

  if (!open) return <button className="btn-primary w-full" onClick={() => setOpen(true)}>＋ {tr("new_project")}</button>;
  return (
    <form onSubmit={create} className="card flex gap-2">
      <input dir="auto" className="input" placeholder={lang === "ar" ? "اسم المشروع" : "Project name"} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <button className="btn-primary shrink-0" disabled={busy}>{tr("save")}</button>
      <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{tr("cancel")}</button>
    </form>
  );
}
