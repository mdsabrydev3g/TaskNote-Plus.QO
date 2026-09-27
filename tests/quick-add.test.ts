import { describe, it, expect } from "vitest";
import { parseQuickAdd, zoneOffsetMin } from "@/lib/quick-add";

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

describe("quick-add parser — timezone (server in UTC, user elsewhere)", () => {
  // A Cairo user (UTC+3 in Sept, +2 in Dec — Egypt observes DST) captures "بكرة 5pm".
  // "now" is a UTC instant. Stored dueAt, rendered back in Africa/Cairo, must read 5pm.
  const nowUtc = "2026-09-27T10:00:00.000Z";

  it("stores the correct UTC instant so local display is 5pm (regression: 8pm bug)", () => {
    const r = parseQuickAdd("راجع العقد بكرة 5pm", nowUtc, "Africa/Cairo");
    expect(r.dueAt).toBe("2026-09-28T14:00:00.000Z"); // 17:00 Cairo = 14:00Z
    const hr = parseInt(new Date(r.dueAt!).toLocaleString("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", hour12: false }), 10);
    expect(hr).toBe(17);
    expect(new Date(r.dueAt!).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" })).toBe("2026-09-28");
  });

  it("date crossing a DST boundary stays on the correct local calendar day", () => {
    // 2026-09-27 (summer +3) parsing a 2026-12-20 date (winter +2): must stay Dec-20 local.
    const r = parseQuickAdd("flight 2026-12-20", nowUtc, "Africa/Cairo");
    expect(new Date(r.dueAt!).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" })).toBe("2026-12-20");
  });

  it("zoneOffsetMin reflects real IANA offsets", () => {
    expect(zoneOffsetMin("Africa/Cairo", Date.parse("2026-09-27T10:00:00Z"))).toBe(180); // summer
    expect(zoneOffsetMin("Africa/Cairo", Date.parse("2026-12-20T10:00:00Z"))).toBe(120);  // winter (DST)
    expect(zoneOffsetMin("UTC", Date.parse("2026-09-27T10:00:00Z"))).toBe(0);
    expect(zoneOffsetMin("America/New_York", Date.parse("2026-09-27T10:00:00Z"))).toBe(-240); // EDT
  });

  it("unknown zone falls back safely (never throws)", () => {
    const r = parseQuickAdd("بكرة 5pm", nowUtc, "Mars/Olympus");
    expect(r.dueAt).toBe("2026-09-28T17:00:00.000Z"); // UTC fallback
  });
});
