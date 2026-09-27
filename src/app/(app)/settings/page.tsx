import { db } from "@/lib/db";
import { requireSession } from "@/lib/server";
import { LanguageSwitch } from "@/components/language-switch";
import { SessionsList } from "@/components/sessions-list";
import { LogoutButton } from "@/components/logout-button";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { userId, workspaceId } = await requireSession();
  const jar = await cookies();
  const lang = jar.get("tnp_lang")?.value === "en" ? "en" : "ar";
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, displayName: true } });
  const counts = await Promise.all([
    db.note.count({ where: { workspaceId, deletedAt: null } }),
    db.task.count({ where: { workspaceId, deletedAt: null } }),
    db.project.count({ where: { workspaceId } }),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="card space-y-1">
        <p className="font-bold">{user?.displayName ?? "👤"}</p>
        <p dir="ltr" className="text-sm text-slate-500">{user?.email}</p>
        <p className="text-xs text-slate-400">
          {lang === "ar" ? `${counts[0]} ملاحظة · ${counts[1]} مهمة · ${counts[2]} مشروع` : `${counts[0]} notes · ${counts[1]} tasks · ${counts[2]} projects`}
        </p>
      </div>
      <div className="card">
        <h2 className="mb-3 text-sm font-bold">{lang === "ar" ? "اللغة" : "Language"}</h2>
        <LanguageSwitch />
      </div>
      <div className="card">
        <h2 className="mb-3 text-sm font-bold">{lang === "ar" ? "الأجهزة والجلسات" : "Devices & sessions"}</h2>
        <SessionsList lang={lang} />
      </div>
      <div className="card">
        <p className="mb-2 text-xs text-slate-400">{lang === "ar" ? "تصدير بياناتك كامل (JSON) — §17.11 portability" : "Full self-service export (JSON) — §11.11 portability"}</p>
        <a className="btn-ghost w-full" href="/api/export">{lang === "ar" ? "تصدير البيانات" : "Export my data"}</a>
      </div>
      <div className="flex gap-4 text-xs text-slate-400">
        <a className="underline" href="/privacy">{lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}</a>
        <a className="underline" href="/terms">{lang === "ar" ? "الشروط" : "Terms"}</a>
      </div>
      <LogoutButton lang={lang} />
    </div>
  );
}
