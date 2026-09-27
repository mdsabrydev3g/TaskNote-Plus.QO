"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { capture, newClientRequestId } from "@/lib/client";
import { useApp } from "./providers";

/** Universal Capture (§7.1) — <2s to first keystroke, offline-tolerant, idempotent. */
export function QuickCapture({ autoFocus = false }: { autoFocus?: boolean }) {
  const { tr } = useApp();
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function submit() {
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    const res = await capture(value, newClientRequestId());
    if (res.queued) setNote(tr("offline_queued"));
    else if (res.error) setNote(tr("error"));
    else {
      const understood: string[] = res.data?.understood ?? [];
      setNote(`${tr("capture_ok")}${understood.length ? ` · ${tr("understood")} ${understood.join(" ")}` : ""}`);
    }
    setText("");
    setBusy(false);
    router.refresh();
    setTimeout(() => setNote(null), 4000);
  }

  return (
    <div className="card space-y-2">
      <div className="flex gap-2">
        <input
          dir="auto"
          className="input"
          placeholder={tr("capture_placeholder")}
          value={text}
          autoFocus={autoFocus}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          enterKeyHint="send"
        />
        <button className="btn-primary shrink-0" onClick={submit} disabled={busy || !text.trim()}>
          {busy ? tr("capturing") : `⚡ ${tr("capture_btn")}`}
        </button>
      </div>
      {note && <p className="text-xs text-slate-500">{note}</p>}
    </div>
  );
}
