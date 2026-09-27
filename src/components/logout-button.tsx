"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";
import { useApp } from "./providers";

export function LogoutButton(_props: { lang: string }) {
  const { tr } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await apiFetch("/api/auth/logout", { method: "POST", json: {} });
    router.push("/login");
    router.refresh();
  }

  return (
    <button className="btn w-full bg-rose-600 text-white hover:bg-rose-700" onClick={logout} disabled={busy}>
      {tr("logout")}
    </button>
  );
}
