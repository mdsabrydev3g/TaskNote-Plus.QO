"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";
import { useApp } from "./providers";

interface NoteDTO {
  id: string; title: string; content: string; pinned: boolean;
  aiAccessible: boolean; version: number; updatedAt: string;
}

/** Block-less markdown editor with debounced autosave + optimistic version (§7.2).
 *  On version conflict the server copy is fetched and surfaced for the user to
 *  decide — never silent overwrite (§6.3 "last-writer-wins + surfaced diff"). */
export function NoteEditor({ note }: { note: NoteDTO }) {
  const { tr } = useApp();
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [pinned, setPinned] = useState(note.pinned);
  const [ai, setAi] = useState(note.aiAccessible);
  const version = useRef(note.version);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty">("saved");
  const [serverCopy, setServerCopy] = useState<NoteDTO | null>(null);

  useEffect(() => {
    if (saveState !== "dirty" || serverCopy) return; // paused while a conflict is open
    const h = setTimeout(async () => {
      setSaveState("saving");
      const res = await apiFetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        json: { title, content, pinned, aiAccessible: ai, version: version.current },
      });
      if (res.ok) { version.current = res.data.note.version; setSaveState("saved"); }
      else if (res.status === 409) {
        // Surface the conflict: pull the server copy for review.
        const fresh = await apiFetch<{ note: NoteDTO }>(`/api/notes/${note.id}`);
        if (fresh.ok) setServerCopy(fresh.data!.note);
        setSaveState("saved");
      } else setSaveState("saved");
    }, 800);
    return () => clearTimeout(h);
  }, [saveState, title, content, pinned, ai, note.id, serverCopy]);

  function loadTheirs() {
    if (!serverCopy) return;
    setTitle(serverCopy.title); setContent(serverCopy.content);
    setPinned(serverCopy.pinned); setAi(serverCopy.aiAccessible);
    version.current = serverCopy.version;
    setServerCopy(null);
    setSaveState("saved");
  }

  async function keepMine() {
    // Force last-writer-wins: PATCH without version after user explicitly chose it.
    const res = await apiFetch(`/api/notes/${note.id}`, { method: "PATCH", json: { title, content, pinned, aiAccessible: ai } });
    if (res.ok) version.current = res.data.note.version;
    setServerCopy(null);
    setSaveState("saved");
    router.refresh();
  }

  async function remove() {
    await apiFetch(`/api/notes/${note.id}`, { method: "DELETE" });
    router.push("/notes");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {serverCopy && (
        <div className="card border border-amber-300 bg-amber-50 space-y-2 dark:bg-amber-950">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{tr("sync_conflict")}</p>
          <p dir="auto" className="rounded-lg bg-white p-2 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            {serverCopy.title || tr("note_title")} · {serverCopy.content.slice(0, 120) || "…"} · {new Date(serverCopy.updatedAt).toLocaleString()}
          </p>
          <div className="flex gap-2">
            <button className="btn-ghost px-3! py-1! text-xs" onClick={loadTheirs}>{tr("load_theirs")}</button>
            <button className="btn-primary px-3! py-1! text-xs" onClick={keepMine}>{tr("keep_mine")}</button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input dir="auto" className="input border-transparent! bg-transparent! text-lg font-bold" placeholder={tr("note_title")}
          value={title} onChange={(e) => { setTitle(e.target.value); setSaveState("dirty"); }} />
        <button aria-label="pin" className={`btn-ghost px-2! ${pinned ? "text-amber-500" : "text-slate-400"}`}
          onClick={() => { setPinned(!pinned); setSaveState("dirty"); }}>{pinned ? "📌" : "○"}</button>
        <button className="btn-ghost px-2! text-rose-500" onClick={remove} aria-label={tr("delete")}>🗑</button>
      </div>
      <textarea dir="auto" rows={18} className="input font-mono text-sm leading-7" placeholder={tr("note_content")}
        value={content} onChange={(e) => { setContent(e.target.value); setSaveState("dirty"); }} />
      <div className="flex items-center justify-between text-xs text-slate-400">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={ai} onChange={(e) => { setAi(e.target.checked); setSaveState("dirty"); }} />
          {tr("last_edited")}: {saveState === "saving" ? "…" : new Date(note.updatedAt).toLocaleString()} · AI-access {ai ? "✓" : "✗"}
        </label>
      </div>
    </div>
  );
}
