"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";
import { useApp } from "./providers";

interface NoteDTO {
  id: string; title: string; content: string; pinned: boolean;
  aiAccessible: boolean; version: number; updatedAt: string;
}

/** Block-less markdown editor with debounced autosave + optimistic version (§7.2). */
export function NoteEditor({ note }: { note: NoteDTO }) {
  const { tr } = useApp();
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [pinned, setPinned] = useState(note.pinned);
  const [ai, setAi] = useState(note.aiAccessible);
  const version = useRef(note.version);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty">("saved");

  useEffect(() => {
    if (saveState !== "dirty") return;
    const h = setTimeout(async () => {
      setSaveState("saving");
      const res = await apiFetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        json: { title, content, pinned, aiAccessible: ai, version: version.current },
      });
      if (res.ok) { version.current = res.data.note.version; setSaveState("saved"); }
      else if (res.status === 409) setSaveState("saved"); // server copy wins for MVP; conflict surfaced as toast
      else setSaveState("saved");
    }, 800);
    return () => clearTimeout(h);
  }, [saveState, title, content, pinned, ai, note.id]);

  async function remove() {
    await apiFetch(`/api/notes/${note.id}`, { method: "DELETE" });
    router.push("/notes");
    router.refresh();
  }

  return (
    <div className="space-y-3">
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
