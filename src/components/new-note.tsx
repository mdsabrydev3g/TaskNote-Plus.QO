"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, newClientRequestId } from "@/lib/client";

export function NewNote() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const res = await apiFetch<{ note: { id: string } }>("/api/notes", {
      method: "POST",
      json: { title: "", content: "", clientRequestId: newClientRequestId() },
    });
    setBusy(false);
    if (res.ok && res.data) router.push(`/notes/${res.data.note.id}`);
  }

  return (
    <button className="btn-primary w-full" onClick={create} disabled={busy}>
      ＋ {busy ? "…" : "ملاحظة جديدة / New note"}
    </button>
  );
}
