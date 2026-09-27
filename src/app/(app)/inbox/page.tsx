import { db } from "@/lib/db";
import { requireSession } from "@/lib/server";
import { TaskRow, TaskDTO } from "@/components/task-row";
import { NoteConvert } from "@/components/note-convert";
import { QuickCapture } from "@/components/quick-capture";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const { workspaceId } = await requireSession();
  const [inboxTasks, capturedNotes] = await Promise.all([
    db.task.findMany({
      where: { workspaceId, deletedAt: null, status: "INBOX" },
      orderBy: { createdAt: "desc" }, take: 50,
      include: { tags: { include: { tag: true } } },
    }),
    db.note.findMany({
      where: { workspaceId, deletedAt: null, source: "capture" },
      orderBy: { createdAt: "desc" }, take: 20,
    }),
  ]);

  return (
    <div className="space-y-5">
      <QuickCapture />
      <section className="space-y-2">
        {inboxTasks.map((t) => <TaskRow key={t.id} task={t as unknown as TaskDTO} />)}
        {capturedNotes.map((n) => <NoteConvert key={n.id} id={n.id} content={n.content} />)}
        {inboxTasks.length === 0 && capturedNotes.length === 0 && (
          <p className="card text-center text-sm text-slate-400">📥 Inbox zero — التقط أول حاجة</p>
        )}
      </section>
    </div>
  );
}
