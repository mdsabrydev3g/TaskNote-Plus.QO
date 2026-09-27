import { z } from "zod";
import { db, scoped } from "@/lib/db";
import { api, json } from "@/lib/api";
import { captureSchema } from "@/lib/validation";
import { parseQuickAdd } from "@/lib/quick-add";
import { resolveTags } from "@/lib/tags";

// POST /api/capture — §7.1 frictionless, idempotent, lands in Inbox.
// kind=auto → task when quick-add parser found structure (date/priority/tag), else note.
export const POST = api({
  body: captureSchema,
  handler: async (_req, _c, s, body: z.infer<typeof captureSchema>) => {
    const parsed = parseQuickAdd(body.text);
    const wantsTask =
      body.kind === "task" ||
      (body.kind === "auto" && (parsed.dueAt !== undefined || parsed.priority !== "NONE" || parsed.tags.length > 0));

    const result = await scoped(s.workspaceId, async (tx) => {
      if (wantsTask) {
        const existing = body.clientRequestId
          ? await tx.task.findUnique({ where: { workspaceId_clientRequestId: { workspaceId: s.workspaceId, clientRequestId: body.clientRequestId } } })
          : null;
        if (existing) return { kind: "task" as const, entity: existing, deduped: true };
        const task = await tx.task.create({
          data: {
            workspaceId: s.workspaceId,
            title: parsed.title || body.text,
            status: "INBOX",
            priority: parsed.priority,
            dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null,
            clientRequestId: body.clientRequestId,
            deviceOrigin: body.deviceOrigin,
            source: "capture",
            tags: { create: await resolveTags(tx, s.workspaceId, parsed.tags) },
          },
          include: { tags: { include: { tag: true } } },
        });
        return { kind: "task" as const, entity: task, deduped: false, parsed };
      }
      const existing = body.clientRequestId
        ? await tx.note.findUnique({ where: { workspaceId_clientRequestId: { workspaceId: s.workspaceId, clientRequestId: body.clientRequestId } } })
        : null;
      if (existing) return { kind: "note" as const, entity: existing, deduped: true };
      const note = await tx.note.create({
        data: {
          workspaceId: s.workspaceId,
          title: "",
          content: body.text,
          source: "capture",
          clientRequestId: body.clientRequestId,
        },
      });
      return { kind: "note" as const, entity: note, deduped: false };
    });

    return json({ created: result.kind, deduped: result.deduped, entity: result.entity, understood: "parsed" in result ? result.parsed?.matched : undefined });
  },
});
