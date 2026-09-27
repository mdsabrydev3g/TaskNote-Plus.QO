import { z } from "zod";
import { db } from "@/lib/db";
import { api, json } from "@/lib/api";
import { eventCreate } from "@/lib/validation";

// GET /api/events?from=&to= — calendar month/week window
export const GET = api({
  handler: async (req, _c, s) => {
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const events = await db.event.findMany({
      where: {
        workspaceId: s.workspaceId,
        ...(from || to ? { startAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
      },
      orderBy: { startAt: "asc" },
      take: 500,
    });
    return json({ events });
  },
});

// POST /api/events
export const POST = api({
  body: eventCreate,
  handler: async (_req, _c, s, body: z.infer<typeof eventCreate>) => {
    const event = await db.event.create({
      data: {
        workspaceId: s.workspaceId,
        title: body.title,
        startAt: new Date(body.startAt as any),
        endAt: body.endAt ? new Date(body.endAt as any) : null,
        tz: body.tz,
        rrule: body.rrule,
        noteId: body.noteId,
      },
    });
    return json({ event }, 201);
  },
});
