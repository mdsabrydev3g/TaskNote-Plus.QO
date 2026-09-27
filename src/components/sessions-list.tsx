"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";
import { useApp } from "./providers";

interface SessionItem {
  id: string;
  deviceName: string | null;
  platform: string | null;
  createdAt: string;
}

export function SessionsList(_props: { lang: string }) {
  const { tr } = useApp();
  const [items, setItems] = useState<SessionItem[]>([]);

  async function load() {
    const res = await apiFetch<{ sessions: SessionItem[] }>("/api/sessions");
    if (res.ok) setItems(res.data!.sessions);
  }
  useEffect(() => { load(); }, []);

  async function revoke(id: string) {
    await apiFetch(`/api/sessions/${id}`, { method: "DELETE" });
    load();
  }

  if (!items.length) return <p className="text-sm text-slate-400">—</p>;
  return (
    <ul className="space-y-2">
      {items.map((s) => (
        <li key={s.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
          <div className="min-w-0">
            <p dir="ltr" className="truncate font-medium">{s.platform === "android" ? "📱" : s.platform === "ios" ? "🍎" : "💻"} {s.deviceName ?? "unknown"}</p>
            <p className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</p>
          </div>
          <button className="btn-ghost px-2! py-1! text-xs text-rose-500" onClick={() => revoke(s.id)}>{tr("revoke")}</button>
        </li>
      ))}
    </ul>
  );
}
