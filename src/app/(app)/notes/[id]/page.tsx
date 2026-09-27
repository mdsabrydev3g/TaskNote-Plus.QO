import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/server";
import { NoteEditor } from "@/components/note-editor";
import { z } from "zod";

export const dynamic = "force-dynamic";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { workspaceId } = await requireSession();
  const id = z.string().uuid().parse((await params).id);
  const note = await db.note.findFirst({ where: { id, workspaceId, deletedAt: null } });
  if (!note) notFound();
  return <NoteEditor note={{ ...note, updatedAt: note.updatedAt.toISOString() }} />;
}
