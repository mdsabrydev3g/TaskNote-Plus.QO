import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { api } from "@/lib/api";
import { createHash } from "crypto";

// GET /api/export — full self-service JSON export + verifiable manifest (§11 portability)
export const GET = api({
  handler: async (_req, _c, s) => {
    const [notes, tasks, projects, events, tags] = await Promise.all([
      db.note.findMany({ where: { workspaceId: s.workspaceId }, include: { tags: { include: { tag: true } } } }),
      db.task.findMany({ where: { workspaceId: s.workspaceId }, include: { tags: { include: { tag: true } } } }),
      db.project.findMany({ where: { workspaceId: s.workspaceId } }),
      db.event.findMany({ where: { workspaceId: s.workspaceId } }),
      db.tag.findMany({ where: { workspaceId: s.workspaceId } }),
    ]);
    const payload = { app: "TaskNote Plus", exportedAt: new Date().toISOString(), workspaceId: s.workspaceId, notes, tasks, projects, events, tags };
    const raw = JSON.stringify(payload, null, 2);
    const sha256 = createHash("sha256").update(raw).digest("hex");
    return new NextResponse(raw, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="tasknote-plus-export-${Date.now()}.json"`,
        "x-export-manifest-sha256": sha256,
      },
    });
  },
});
