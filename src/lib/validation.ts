import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(10).max(200);

export const noteCreate = z.object({
  title: z.string().trim().max(300).default(""),
  content: z.string().max(200_000).default(""),
  pinned: z.boolean().optional(),
  aiAccessible: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  clientRequestId: z.string().max(64).optional(),
});
export const noteUpdate = noteCreate.partial().extend({ version: z.number().int().positive().optional() });

export const taskCreate = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().max(20_000).optional(),
  status: z.enum(["INBOX", "TODO", "IN_PROGRESS", "DONE", "CANCELED"]).optional(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  energy: z.enum(["DEEP", "LIGHT", "ADMIN"]).nullish(),
  dueAt: z.string().datetime({ offset: true }).or(z.coerce.date()).nullish(),
  deferAt: z.string().datetime({ offset: true }).or(z.coerce.date()).nullish(),
  projectId: z.string().uuid().nullish(),
  parentId: z.string().uuid().nullish(),
  recurringRule: z.string().max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  clientRequestId: z.string().max(64).optional(),
  deviceOrigin: z.string().max(64).optional(),
});
export const taskUpdate = taskCreate.partial().extend({ version: z.number().int().positive().optional() });

export const projectCreate = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});
export const projectUpdate = projectCreate.partial().extend({ archived: z.boolean().optional() });

export const eventCreate = z.object({
  title: z.string().trim().min(1).max(300),
  startAt: z.string().datetime({ offset: true }).or(z.coerce.date()),
  endAt: z.string().datetime({ offset: true }).or(z.coerce.date()).nullish(),
  tz: z.string().max(64).default("UTC"),
  rrule: z.string().max(500).optional(),
  noteId: z.string().uuid().optional(),
});
export const eventUpdate = eventCreate.partial();

export const captureSchema = z.object({
  text: z.string().trim().min(1).max(10_000),
  kind: z.enum(["auto", "note", "task"]).default("auto"),
  clientRequestId: z.string().max(64),
  deviceOrigin: z.string().max(64).optional(),
  tz: z.string().max(64).optional(),          // IANA zone from client (§7.7 time-aware)
  now: z.string().datetime({ offset: true }).optional(), // client wall-clock instant
});

export const quickAddSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  now: z.string().datetime({ offset: true }).optional(),
  tz: z.string().max(64).optional(),
});

export const searchSchema = z.object({
  q: z.string().trim().max(200),
  type: z.enum(["all", "note", "task", "project", "event"]).default("all"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
