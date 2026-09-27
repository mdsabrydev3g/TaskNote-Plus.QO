"use client";
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Lang, TKey, t } from "@/lib/i18n";
import { flushQueue, onQueueCount } from "@/lib/queue";
import { apiFetch, getCsrf } from "@/lib/client";

interface ChangesDTO {
  now: string;
  changes: { notes: unknown[]; tasks: unknown[]; projects: unknown[]; events: unknown[] };
}

interface AppCtx {
  lang: Lang;
  tr: (k: TKey) => string;
  online: boolean;
  pending: number;
  syncing: boolean;
  setLang: (l: Lang) => void;
  syncNow: () => Promise<void>;
}
const Ctx = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}

export function Providers({ lang: initialLang, children }: { lang: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();
  const lastPulledAt = useRef<string>(new Date().toISOString());

  // Live sync (§6.4, serverless-adapted): Vercel can't hold WebSockets, so we
  // incrementally poll /api/changes while the tab is visible. Single edit lands
  // on other devices within one tick; manual resync via syncNow().
  async function pullChanges() {
    if (!navigator.onLine) return;
    const res = await apiFetch<ChangesDTO>(`/api/changes?since=${encodeURIComponent(lastPulledAt.current)}`);
    if (!res.ok || !res.data) return;
    const c = res.data.changes;
    const touched = c.notes.length + c.tasks.length + c.projects.length + c.events.length;
    // Small overlap so clock skew / same-millisecond writes are never missed.
    lastPulledAt.current = new Date(Date.parse(res.data.now) - 2_000).toISOString();
    if (touched > 0) router.refresh();
  }

  async function syncNow() {
    setSyncing(true);
    try {
      await flushQueue(getCsrf);
      await pullChanges();
      router.refresh();
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      // Opportunistic push (queued offline mutations) then incremental pull.
      void flushQueue(getCsrf).finally(() => void pullChanges());
    }, 6_000);
    const onVis = () => { if (document.visibilityState === "visible") void pullChanges(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Service worker + PWA registration
  useEffect(() => {
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Online/offline + queue flush (§6.3 pending-sync)
  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => { setOnline(true); void syncNow(); };
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    const un = onQueueCount(setPending);
    if (navigator.onLine) flushQueue(getCsrf).then(() => onQueueCount(setPending));
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); un(); };
  }, [router]);

  const setLang = (l: Lang) => {
    setLangState(l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    fetch("/api/prefs/lang", {
      method: "POST",
      headers: { "content-type": "application/json", ...(getCsrf() ? { "x-csrf-token": getCsrf()! } : {}) },
      body: JSON.stringify({ lang: l }),
    }).finally(() => router.refresh());
  };

  return (
    <Ctx.Provider value={{ lang, tr: (k) => t(lang, k), online, pending, syncing, setLang, syncNow }}>
      {children}
    </Ctx.Provider>
  );
}
