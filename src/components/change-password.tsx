"use client";
import { useState, FormEvent } from "react";
import { apiFetch } from "@/lib/client";
import { useApp } from "./providers";
import { TKey } from "@/lib/i18n";

const ERR_KEYS: Record<string, TKey> = {
  wrong_password: "wrong_current_password",
  weak_password: "weak_password",
  same_password: "same_password",
};

/** Self-service password change (§10.2): old-password check + strength policy + other sessions revoked. */
export function ChangePasswordCard() {
  const { tr } = useApp();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<TKey | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setDone(false);
    if (next !== confirm) { setErr("passwords_mismatch"); return; }
    setBusy(true);
    const res = await apiFetch<{ sessionsRevoked: number }>("/api/auth/change-password", {
      method: "POST",
      json: { currentPassword: current, newPassword: next },
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      setCurrent(""); setNext(""); setConfirm("");
    } else {
      setErr(ERR_KEYS[res.error ?? ""] ?? "error");
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="text-sm font-bold">{tr("change_password")}</h2>
      <input dir="ltr" type="password" autoComplete="current-password" required className="input w-full"
        placeholder={tr("current_password")} value={current} onChange={(e) => setCurrent(e.target.value)} />
      <input dir="ltr" type="password" autoComplete="new-password" required className="input w-full"
        placeholder={tr("new_password")} value={next} onChange={(e) => setNext(e.target.value)} />
      <input dir="ltr" type="password" autoComplete="new-password" required className="input w-full"
        placeholder={tr("confirm_password")} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {err && <p className="text-xs font-medium text-rose-600">{tr(err)}</p>}
      {done && <p className="text-xs font-medium text-emerald-600">{tr("password_changed")}</p>}
      <button className="btn-primary w-full" disabled={busy || !current || !next || !confirm}>
        {busy ? "…" : tr("change_password")}
      </button>
    </form>
  );
}
