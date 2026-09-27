import { z } from "zod";
import { db, scoped } from "@/lib/db";
import { api, ApiError, json } from "@/lib/api";
import { taskCreate } from "@/lib/validation";
import { resolveTags } from "@/lib/tags";
import type { TaskStatus } from "@prisma/client";

export const toDate = (v: unknown): Date | null => (v ? new Date(v as string | number | Date) : null);

// GET /api/tasks — filters: status, due=today|overdue|week, projectId, q
export const GET = api({
  handler: async (req, _c, s) => {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") as TaskStatus | null;
    const due = url.searchParams.get("due");
    const projectId = url.searchParams.get("projectId");
    const q = url.searchParams.get("q")?.trim();
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 500);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 86400000);

    const tasks = await db.task.findMany({
      where: {
        workspaceId: s.workspaceId,
        deletedAt: null,
        ...(status ? { status } : {}),
        ...(projectId ? { projectId } : {}),
        ...(due === "today" ? { dueAt: { gte: startOfToday, lt: endOfToday } } : {}),
        ...(due === "overdue" ? { dueAt: { lt: startOfToday }, status: { notIn: ["DONE", "CANCELED"] } } : {}),
        ...(due === "week" ? { dueAt: { gte: startOfToday, lt: new Date(startOfToday.getTime() + 7 * 86400000) }, status: { notIn: ["DONE", "CANCELED"] } } : {}),
        ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
      },
      orderBy: [{ priority: "desc" }, { dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      take: limit,
      include: {
        tags: { include: { tag: true } },
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { children: true } },
      },
    });
    return json({ tasks });
  },
});

// POST /api/tasks
export const POST = api({
  body: taskCreate,
  handler: async (_req, _c, s, body: z.infer<typeof taskCreate>) => {
    const task = await scoped(s.workspaceId, async (tx) => {
      if (body.projectId) {
        const p = await tx.project.findFirst({ where: { id: body.projectId, workspaceId: s.workspaceId } });
        if (!p) throw new ApiError(422, "unknown_project");
      }
      return tx.task.create({
        data: {
          workspaceId: s.workspaceId,
          title: body.title,
          description: body.description,
          status: body.status ?? "TODO",
          priority: body.priority ?? "NONE",
          energy: body.energy ?? null,
          dueAt: toDate(body.dueAt),
          deferAt: toDate(body.deferAt),
          projectId: body.projectId ?? null,
          parentId: body.parentId ?? null,
          recurringRule: body.recurringRule,
          clientRequestId: body.clientRequestId,
          deviceOrigin: body.deviceOrigin,
          tags: { create: await resolveTags(tx, s.workspaceId, body.tags) },
        },
        include: { tags: { include: { tag: true } } },
      });
    });
    return json({ task }, 201);
  },
});
