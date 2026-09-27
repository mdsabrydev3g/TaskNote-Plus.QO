import { describe, it, expect } from "vitest";
import { parseQuickAdd } from "@/lib/quick-add";

// Fixed "now": Sunday 2026-09-27 10:00 local
const NOW = new Date(2026, 8, 27, 10, 0, 0).toISOString();
const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }) : undefined);

describe("quick-add parser — English", () => {
  it("parses tomorrow + time + tag + priority", () => {
    const r = parseQuickAdd("review contract tomorrow 3pm #legal urgent", NOW);
    expect(r.title.toLowerCase()).toContain("review contract");
    expect(day(r.dueAt)).toBe("2026-09-28");
    expect(new Date(r.dueAt!).getHours()).toBe(15);
    expect(r.tags).toContain("legal");
    expect(r.priority).toBe("URGENT");
  });

  it("parses today", () => {
    const r = parseQuickAdd("pay electricity bill today", NOW);
    expect(day(r.dueAt)).toBe("2026-09-27");
    expect(r.title).toBe("pay electricity bill");
  });

  it("parses in 3 days", () => {
    const r = parseQuickAdd("submit report in 3 days", NOW);
    expect(day(r.dueAt)).toBe("2026-09-30");
  });

  it("parses next friday", () => {
    const r = parseQuickAdd("gym session next friday", NOW);
    expect(new Date(r.dueAt!).getDay()).toBe(5);
    expect(r.title).toBe("gym session");
  });

  it("parses ISO date", () => {
    const r = parseQuickAdd("flight to Dubai 2026-12-20", NOW);
    expect(day(r.dueAt)).toBe("2026-12-20");
  });

  it("keeps plain text as title with no false matches", () => {
    const r = parseQuickAdd("buy milk", NOW);
    expect(r.title).toBe("buy milk");
    expect(r.dueAt).toBeUndefined();
    expect(r.priority).toBe("NONE");
    expect(r.matched).toEqual([]);
  });
});

describe("quick-add parser — Arabic", () => {
  it("parses بكرة + الساعة + عاجل + وسم", () => {
    const r = parseQuickAdd("راجع العقد بكرة الساعة 3 العصر #قانوني عاجل", NOW);
    expect(day(r.dueAt)).toBe("2026-09-28");
    expect(r.tags).toContain("قانوني");
    expect(r.priority).toBe("URGENT");
    expect(r.title).toContain("راجع العقد");
  });

  it("parses بعد 3 أيام", () => {
    const r = parseQuickAdd("دفع الإيجار بعد 3 أيام", NOW);
    expect(day(r.dueAt)).toBe("2026-09-30");
  });

  it("parses النهاردة", () => {
    const r = parseQuickAdd("اتصال بالدكتور النهاردة", NOW);
    expect(day(r.dueAt)).toBe("2026-09-27");
  });

  it("parses Arabic-Indic digits: بعد ٣ أيام", () => {
    const r = parseQuickAdd("تسليم البحث بعد ٣ أيام", NOW);
    expect(day(r.dueAt)).toBe("2026-09-30");
  });

  it("parses weekday الخميس", () => {
    const r = parseQuickAdd("اجتماع الفريق الخميس", NOW);
    expect(new Date(r.dueAt!).getDay()).toBe(4);
  });

  it("mixed Arabic + English", () => {
    const r = parseQuickAdd("تحضير عرض تقديمي tomorrow 5pm مهم", NOW);
    expect(day(r.dueAt)).toBe("2026-09-28");
    expect(new Date(r.dueAt!).getHours()).toBe(17);
    expect(r.priority).toBe("HIGH");
  });
});
