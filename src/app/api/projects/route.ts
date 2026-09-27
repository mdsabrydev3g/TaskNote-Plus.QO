import { z } from "zod";
import { db } from "@/lib/db";
import { api, json } from "@/lib/api";
import { projectCreate } from "@/lib/validation";

// GET /api/projects
export const GET = api({
  handler: async (_req, _c, s) => {
    const projects = await db.project.findMany({
      where: { workspaceId: s.workspaceId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { tasks: true } } },
    });
    return json({ projects });
  },
});

// POST /api/projects
export const POST = api({
  body: projectCreate,
  handler: async (_req, _c, s, body: z.infer<typeof projectCreate>) => {
    const project = await db.project.create({ data: { workspaceId: s.workspaceId, ...body } });
    return json({ project }, 201);
  },
});
