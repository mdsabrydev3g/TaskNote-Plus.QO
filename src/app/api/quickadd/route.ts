import { z } from "zod";
import { api, json } from "@/lib/api";
import { quickAddSchema } from "@/lib/validation";
import { parseQuickAdd } from "@/lib/quick-add";

// POST /api/quickadd — parse only; client shows preview for confirm-before-commit (§7.3)
export const POST = api({
  body: quickAddSchema,
  limit: { limit: 30, windowMs: 60_000 },
  handler: async (_req, _c, _s, body: z.infer<typeof quickAddSchema>) => {
    const nowIso = body.now ?? new Date().toISOString();
    const parsed = parseQuickAdd(body.text, nowIso, body.tz);
    return json({ parsed });
  },
});
