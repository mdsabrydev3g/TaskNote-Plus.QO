"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Lang, TKey, t } from "@/lib/i18n";
import { flushQueue, onQueueCount } from "@/lib/queue";
import { getCsrf } from "@/lib/client";

interface AppCtx {
  lang: Lang;
  tr: (k: TKey) => string;
  online: boolean;
  pending: number;
  setLang: (l: Lang) => void;
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
  const router = useRouter();

  // Service worker + PWA registration
  useEffect(() => {
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Online/offline + queue flush (§6.3 pending-sync)
  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => { setOnline(true); flushQueue(getCsrf).finally(() => router.refresh()); };
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
    <Ctx.Provider value={{ lang, tr: (k) => t(lang, k), online, pending, setLang }}>
      {children}
    </Ctx.Provider>
  );
}
