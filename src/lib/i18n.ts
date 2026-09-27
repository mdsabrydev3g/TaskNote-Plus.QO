// i18n dictionaries — Arabic is first-class (§15.3). All UI strings externalized.
export type Lang = "ar" | "en";

const dict = {
  ar: {
    appName: "تاسك نوت بلس",
    tagline: "نظام تشغيل عقلك وعملك — التقط، نظّم، نفّذ",
    // nav
    nav_today: "اليوم", nav_inbox: "الوارد", nav_notes: "الملاحظات", nav_tasks: "المهام",
    nav_calendar: "المواعيد", nav_projects: "المشاريع", nav_settings: "الإعدادات",
    // auth
    login: "تسجيل الدخول", signup: "إنشاء حساب", logout: "خروج",
    email: "البريد الإلكتروني", password: "كلمة المرور", displayName: "الاسم (اختياري)",
    no_account: "م عندك حساب؟", have_account: "عندك حساب؟",
    weak_password: "كلمة المرور ضعيفة: 10 أحرف على الأقل مع أرقام ورموز",
    invalid_credentials: "بيانات غير صحيحة", email_taken: "البريد ده مسجل بالفعل",
    // capture
    capture_placeholder: "اكتب أي حاجة… #وسم بكرة 5pm عاجل",
    capture_btn: "التقاط", capturing: "بروح…",
    understood: "فهمت:", capture_ok: "اتسجل في الوارد", offline_queued: "محفوظ عندك — هيتبعت أول ما النت يرجع",
    // quick add
    quickadd_preview: "المهمة هتكون كده — أكّد قبل الإضافة",
    confirm_add: "أضف", cancel: "إلغاء", save: "حفظ", delete: "حذف", edit: "تعديل",
    // tasks
    task_done: "خلصت", task_title: "المهمة", status: "الحالة",
    status_INBOX: "وارد", status_TODO: "معلّقة", status_IN_PROGRESS: "جارية", status_DONE: "تم", status_CANCELED: "ملغاة",
    priority_URGENT: "عاجلة", priority_HIGH: "مهمة", priority_MEDIUM: "متوسطة", priority_LOW: "خفيفة", priority_NONE: "بدون",
    due: "موعد", overdue: "متأخرة", today: "النهاردة", tomorrow: "بكرة", no_due: "بدون موعد",
    today_focus: "تركيز النهاردة", all_done: "خلصت كل مهام النهاردة 💪",
    // notes
    new_note: "ملاحظة جديدة", note_title: "العنوان", note_content: "اكتب هنا…",
    pinned: "مثبّتة", pin: "تثبيت", unpin: "فك التثبيت", last_edited: "آخر تعديل",
    // inbox
    inbox_empty: "الوارد فاضي — التقط أول حاجة", convert_to_task: "حوّل لمهمة", convert_to_note: "حوّل لملاحظة",
    // projects
    new_project: "مشروع جديد", project_name: "اسم المشروع", tasks_count: "مهمة", archive: "أرشفة",
    // calendar
    new_event: "موعد جديد", event_title: "العنوان", start: "البداية", end: "النهاية", all_day: "طوال اليوم",
    // search
    search_placeholder: "دوّر في كل حاجة…", search_btn: "بحث", no_results: "مفيش نتائج",
    // settings
    language: "اللغة", arabic: "العربية", english: "English",
    devices: "الأجهزة والجلسات", revoke: "إنهاء الجلسة", theme: "الثيم",
    dark: "ليلي", light: "نهاري", system: "زي الجهاز",
    // status
    online: "متصل", offline: "أوفلاين", pending: "في الانتظار", synced: "متزامن",
    // misc
    loading: "تحميل…", error: "حصل خطأ", retry: "حاول تاني",
    empty_notes: "مفيش ملاحظات بعد", empty_tasks: "مفيش مهام بعد",
    first_capture_hint: "التقط فكرة النهاردة — أول التقاطة في أقل من ٣٠ ثانية",
    week_days: "أحد,اثنين,ثلاثاء,أربعاء,خميس,جمعة,سبت",
    months: "يناير,فبراير,مارس,أبريل,مايو,يونيو,يوليو,أغسطس,سبتمبر,أكتوبر,نوفمبر,ديسمبر",
  },
  en: {
    appName: "TaskNote Plus",
    tagline: "The operating system for your mind and your work",
    nav_today: "Today", nav_inbox: "Inbox", nav_notes: "Notes", nav_tasks: "Tasks",
    nav_calendar: "Calendar", nav_projects: "Projects", nav_settings: "Settings",
    login: "Sign in", signup: "Create account", logout: "Sign out",
    email: "Email", password: "Password", displayName: "Name (optional)",
    no_account: "No account?", have_account: "Have an account?",
    weak_password: "Weak password: min 10 chars with digits and symbols",
    invalid_credentials: "Invalid credentials", email_taken: "Email already registered",
    capture_placeholder: "Capture anything… #tag tomorrow 5pm urgent",
    capture_btn: "Capture", capturing: "Saving…",
    understood: "Understood:", capture_ok: "Filed to Inbox", offline_queued: "Saved locally — will sync when you're back online",
    quickadd_preview: "Here's the task — confirm before adding",
    confirm_add: "Add", cancel: "Cancel", save: "Save", delete: "Delete", edit: "Edit",
    task_done: "Done", task_title: "Task", status: "Status",
    status_INBOX: "Inbox", status_TODO: "To-do", status_IN_PROGRESS: "In progress", status_DONE: "Done", status_CANCELED: "Canceled",
    priority_URGENT: "Urgent", priority_HIGH: "High", priority_MEDIUM: "Medium", priority_LOW: "Low", priority_NONE: "None",
    due: "Due", overdue: "Overdue", today: "Today", tomorrow: "Tomorrow", no_due: "No date",
    today_focus: "Today's focus", all_done: "All done for today 🎉",
    new_note: "New note", note_title: "Title", note_content: "Write here…",
    pinned: "Pinned", pin: "Pin", unpin: "Unpin", last_edited: "Last edited",
    inbox_empty: "Inbox is empty — capture something", convert_to_task: "To task", convert_to_note: "To note",
    new_project: "New project", project_name: "Project name", tasks_count: "tasks", archive: "Archive",
    new_event: "New event", event_title: "Title", start: "Start", end: "End", all_day: "All day",
    search_placeholder: "Search everything…", search_btn: "Search", no_results: "No results",
    language: "Language", arabic: "العربية", english: "English",
    devices: "Devices & sessions", revoke: "Revoke", theme: "Theme",
    dark: "Dark", light: "Light", system: "System",
    online: "Online", offline: "Offline", pending: "Pending", synced: "Synced",
    loading: "Loading…", error: "Something went wrong", retry: "Retry",
    empty_notes: "No notes yet", empty_tasks: "No tasks yet",
    first_capture_hint: "Capture an idea now — first capture in under 30 seconds",
    week_days: "Sun,Mon,Tue,Wed,Thu,Fri,Sat",
    months: "January,February,March,April,May,June,July,August,September,October,November,December",
  },
} as const;

export type TKey = keyof (typeof dict)["en"];

export function t(lang: Lang, key: TKey): string {
  return (dict[lang] as Record<string, string>)[key] ?? key;
}

export function dictFor(lang: Lang) {
  return dict[lang];
}
