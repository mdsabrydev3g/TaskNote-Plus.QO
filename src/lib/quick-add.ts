// Natural-language quick-add parser — Arabic + English mixed (§7.3).
// Deterministic & testable (no external LLM for MVP); logged as an
// AIActionLog(kind="quickadd_parse") so a future model can replace it 1:1.

export type ParsedPriority = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface ParsedQuickAdd {
  title: string;
  dueAt?: string; // ISO
  priority: ParsedPriority;
  tags: string[];
  matched: string[]; // what the parser understood — shown for confirm-before-commit (§7.3)
}

const AR_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/g;
function normalize(s: string): string {
  return s.replace(AR_DIGITS, (d) => {
    const c = d.charCodeAt(0);
    return String(c >= 0x0660 && c <= 0x0669 ? c - 0x0660 : c - 0x06f0);
  });
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
  "الأحد": 0, "الاحد": 0, "أحد": 0, "احد": 0,
  "الاثنين": 1, "الأثنين": 1, "اثنين": 1, "إثنين": 1,
  "الثلاثاء": 2, "ثلاثاء": 2,
  "الاربعاء": 3, "الأربعاء": 3, "اربعاء": 3, "أربعاء": 3,
  "الخميس": 4, "خميس": 4,
  "الجمعة": 5, "جمعة": 5,
  "السبت": 6, "سبت": 6,
};

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  january: 1, february: 2, march: 3, april: 4, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  "يناير": 1, "فبراير": 2, "مارس": 3, "أبريل": 4, "ابريل": 4, "مايو": 5, "يونيو": 6, "يوليو": 7, "أغسطس": 8, "اغسطس": 8, "سبتمبر": 9, "أكتوبر": 10, "اكتوبر": 10, "نوفمبر": 11, "ديسمبر": 12,
};

const WORDNUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  "واحد": 1, "اثنين": 2, "إثنين": 2, "ثلاثة": 3, "تلاتة": 3, "اربعة": 4, "أربعة": 4,
  "خمسة": 5, "ستة": 6, "سبعة": 7, "اسبوعين": 2, "أسبوعين": 2,
};

const WORDNUM_KEYS = Object.keys(WORDNUM).join("|");

// JS \b is ASCII-only → useless around Arabic. Unicode-aware word boundaries:
const LB = String.raw`(?<![\p{L}\p{N}])`;
const RB = String.raw`(?![\p{L}\p{N}])`;

function startOfDay(now: Date): Date {
  const d = new Date(now); d.setHours(0, 0, 0, 0); return d;
}
function addDays(now: Date, n: number): Date {
  const d = startOfDay(now); d.setDate(d.getDate() + n); return d;
}
function nextWeekday(now: Date, dow: number): Date {
  const d = startOfDay(now);
  let delta = (dow - d.getDay() + 7) % 7;
  if (delta === 0) delta = 7;
  d.setDate(d.getDate() + delta);
  return d;
}

export function parseQuickAdd(input: string, nowIso?: string): ParsedQuickAdd {
  const now = nowIso ? new Date(nowIso) : new Date();
  let text = normalize(input.trim());
  const matched: string[] = [];

  // Tags: #word (survives both languages — unicode property escapes)
  const tags: string[] = [];
  text = text.replace(/#([\p{L}\p{N}_-]{1,50})/gu, (_m, t) => { tags.push(String(t)); matched.push(`tag:${t}`); return " "; });

  // Priority
  let priority: ParsedPriority = "NONE";
  const urgentRe = /(?:\burgent\b|\basap\b|عاجل|مهم\s*جدا|!!)/i;
  if (urgentRe.test(text)) { priority = "URGENT"; text = text.replace(urgentRe, " "); matched.push("priority:URGENT"); }
  else if (/\bhigh\b|مهم/i.test(text)) { priority = "HIGH"; text = text.replace(/(?:\bhigh\b|مهم)/i, " "); matched.push("priority:HIGH"); }
  else if (/\blow\b|أقل\s*أولوية|اقل\s*اولوية|لاحقاً?|later\b/i.test(text)) { priority = "LOW"; text = text.replace(/(?:\blow\b|أقل\s*أولوية|اقل\s*اولوية|لاحقاً?|later\b)/i, " "); matched.push("priority:LOW"); }

  // Time: "at 5pm", "5:30 pm", "الساعة 5:30", "الساعه 7 م"
  let hour: number | undefined; let minute = 0;
  const timeRe = /(?:\bat\s+|الساعة\s+|الساعه\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|ص|م)(?![\w])/i;
  const mTime = text.match(timeRe);
  if (mTime) {
    let h = parseInt(mTime[1], 10);
    const s = mTime[3].toLowerCase();
    if (s === "pm" || s === "م") { if (h < 12) h += 12; } else if (h === 12) h = 0;
    if (h <= 23) {
      hour = h; minute = mTime[2] ? parseInt(mTime[2], 10) : 0;
      text = text.replace(timeRe, " "); matched.push(`time:${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }

  // Date rules — sequential, first match wins
  let due: Date | undefined;
  const tryConsume = (re: RegExp, make: (m: RegExpMatchArray) => Date | undefined, label: string) => {
    if (due) return;
    const m = text.match(re);
    if (!m) return;
    const d = make(m);
    if (!d) return;
    due = d; text = text.replace(re, " "); matched.push(label);
  };

  tryConsume(new RegExp(`${LB}(?:today|tonight|النهاردة|النهارده|اليوم)${RB}`, "iu"), () => addDays(now, 0), "date:today");
  tryConsume(new RegExp(`${LB}(?:tomorrow|tmrw|bakra|بكراً?|بكرة|غداً?|غدًا)${RB}`, "iu"), () => addDays(now, 1), "date:tomorrow");
  tryConsume(new RegExp(`${LB}(?:next\\s+week|الأسبوع\\s*الجاي|الاسبوع\\s*الجاي|الأسبوع\\s*القادم|الاسبوع\\s*القادم)${RB}`, "iu"), () => addDays(now, 7), "date:next-week");
  tryConsume(
    new RegExp(`${LB}(?:بعد|in)\\s+(\\d{1,3}|${WORDNUM_KEYS})\\s*(أيام|days?|يوم|أسابيع|اسابيع|weeks?|أسبوع|اسبوع)${RB}`, "iu"),
    (m) => {
      const nRaw = m[1].toLowerCase();
      const n = WORDNUM[nRaw] ?? parseInt(nRaw, 10);
      if (Number.isNaN(n)) return undefined;
      const isWeek = /week|أسبوع|اسبوع|أسابيع|اسابيع/i.test(m[2]);
      return addDays(now, n * (isWeek ? 7 : 1));
    },
    "date:relative"
  );
  tryConsume(
    new RegExp(`${LB}(?:next\\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat|الأحد|الاحد|أحد|احد|الاثنين|الأثنين|اثنين|إثنين|الثلاثاء|ثلاثاء|الاربعاء|الأربعاء|اربعاء|أربعاء|الخميس|خميس|الجمعة|جمعة|السبت|سبت)(?:\\s+(?:next|الجاي|القادم|جاي))?${RB}`, "iu"),
    (m) => {
      const dow = WEEKDAYS[m[1].toLowerCase()] ?? WEEKDAYS[m[1]];
      if (dow === undefined) return undefined;
      return nextWeekday(now, dow);
    },
    "date:weekday"
  );
  tryConsume(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/, (m) => {
    const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    d.setHours(0, 0, 0, 0); return d;
  }, "date:iso");
  tryConsume(/\b(?:on\s+)?(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/, (m) => {
    const day = parseInt(m[1], 10), mon = parseInt(m[2], 10);
    if (day < 1 || day > 31 || mon < 1 || mon > 12) return undefined;
    const yr = m[3] ? parseInt(m[3].length === 2 ? "20" + m[3] : m[3], 10) : now.getFullYear();
    let d = new Date(yr, mon - 1, day); d.setHours(0, 0, 0, 0);
    if (!m[3] && d < startOfDay(now)) d = new Date(yr + 1, mon - 1, day);
    return d;
  }, "date:numeric");
  tryConsume(
    new RegExp(`${LB}(?:on\\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december|يناير|فبراير|مارس|أبريل|ابريل|مايو|يونيو|يوليو|أغسطس|اغسطس|سبتمبر|أكتوبر|اكتوبر|نوفمبر|ديسمبر)\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?${RB}`, "iu"),
    (m) => {
      const mon = MONTHS[m[1].toLowerCase()] ?? MONTHS[m[1]];
      const day = parseInt(m[2], 10);
      if (!mon || day < 1 || day > 31) return undefined;
      let d = new Date(now.getFullYear(), mon - 1, day); d.setHours(0, 0, 0, 0);
      if (d < startOfDay(now)) d = new Date(now.getFullYear() + 1, mon - 1, day);
      return d;
    },
    "date:month-day"
  );

  if (due) {
    const d = new Date(due);
    if (hour !== undefined) d.setHours(hour, minute, 0, 0);
    due = d;
  }

  const title = text.replace(/\s+/g, " ").replace(/^[\s,:-]+|[\s,:-]+$/g, "").trim();
  return {
    title: title || input.trim(),
    dueAt: due ? due.toISOString() : undefined,
    priority,
    tags,
    matched,
  };
}
