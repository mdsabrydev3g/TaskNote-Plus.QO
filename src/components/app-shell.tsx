"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useApp } from "./providers";
import { TKey } from "@/lib/i18n";

const NAV: { href: string; key: TKey; icon: string }[] = [
  { href: "/", key: "nav_today", icon: "☀️" },
  { href: "/inbox", key: "nav_inbox", icon: "📥" },
  { href: "/notes", key: "nav_notes", icon: "📝" },
  { href: "/tasks", key: "nav_tasks", icon: "✅" },
  { href: "/calendar", key: "nav_calendar", icon: "📅" },
  { href: "/projects", key: "nav_projects", icon: "🗂️" },
  { href: "/settings", key: "nav_settings", icon: "⚙️" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { tr, online, pending } = useApp();
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl md:flex-row">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-1 border-e border-slate-200 bg-white/70 p-4 backdrop-blur md:flex dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mb-4 text-lg font-extrabold text-indigo-600">✦ TaskNote Plus</div>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href}
            className={`rounded-xl px-3 py-2.5 text-sm font-medium ${pathname === n.href ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
            <span className="me-2">{n.icon}</span>{tr(n.key)}
          </Link>
        ))}
        <div className="mt-auto text-xs text-slate-400">
          {online ? tr("online") : tr("offline")} {pending > 0 && `· ${pending} ${tr("pending" as TKey)}`}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 pb-24 md:pb-8">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/80">
          <span className="font-bold text-indigo-600">✦ TaskNote Plus</span>
          <div className="flex items-center gap-1">
            <Link href="/search" aria-label="search" className="btn-ghost px-2!">🔍</Link>
            <SyncBadge />
          </div>
        </header>
        <div className="px-4 py-4 md:px-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95">
        {NAV.filter((n) => n.href !== "/settings").map((n) => (
          <Link key={n.href} href={n.href} aria-label={tr(n.key)}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-2 text-[11px] font-medium ${pathname === n.href ? "text-indigo-600" : "text-slate-500"}`}>
            <span className="text-lg leading-none">{n.icon}</span>
            {tr(n.key)}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function SyncBadge() {
  const { online, pending } = useApp();
  return (
    <span className={`chip ${!online ? "bg-amber-100 text-amber-800" : pending > 0 ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"}`}>
      {!online ? `⚡ ${pending > 0 ? `${pending} ⏳` : "Offline"}` : pending > 0 ? `⏳ ${pending}` : "✓ Synced"}
    </span>
  );
}
