"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/client";
import { useApp } from "@/components/providers";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { tr, lang, setLang } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await apiFetch(mode === "signup" ? "/api/auth/signup" : "/api/auth/login", {
      method: "POST",
      json: { email, password, displayName: mode === "signup" ? displayName || undefined : undefined, locale: lang },
    });
    setBusy(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
      return;
    }
    const code = res.error ?? "error";
    setError(
      code === "weak_password" ? tr("weak_password")
      : code === "email_taken" ? tr("email_taken")
      : code === "invalid_credentials" ? tr("invalid_credentials")
      : code === "rate_limited" ? "Too many attempts — wait a minute"
      : tr("error")
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <div className="mb-8 text-center">
        <div className="text-3xl font-extrabold text-indigo-600">✦ TaskNote Plus</div>
        <p className="mt-2 text-sm text-slate-500">{tr("tagline")}</p>
      </div>
      <form onSubmit={submit} className="card space-y-4">
        <h1 className="text-lg font-bold">{mode === "signup" ? tr("signup") : tr("login")}</h1>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-600 dark:text-slate-300">{tr("email")}</span>
          <input className="input" type="email" required dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {mode === "signup" && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600 dark:text-slate-300">{tr("displayName")}</span>
            <input className="input" dir="auto" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>
        )}
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-600 dark:text-slate-300">{tr("password")}</span>
          <input className="input" type="password" required dir="ltr" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="rounded-lg bg-rose-50 p-2.5 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "…" : mode === "signup" ? tr("signup") : tr("login")}</button>
        <p className="text-center text-sm text-slate-500">
          {mode === "signup" ? tr("have_account") : tr("no_account")}{" "}
          <Link className="font-semibold text-indigo-600" href={mode === "signup" ? "/login" : "/signup"}>
            {mode === "signup" ? tr("login") : tr("signup")}
          </Link>
        </p>
      </form>
      <button className="btn-ghost mx-auto mt-4 text-xs" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
        {lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      </button>
    </div>
  );
}
