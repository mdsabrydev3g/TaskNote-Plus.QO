"use client";
import { useRef, useState, type ReactNode } from "react";
import { useApp } from "./providers";

/** Mobile-friendly pull-down gesture that triggers a manual resync
 *  (§6.3 MUST: manual resync trigger always available). */
export function PullToRefresh({ children }: { children: ReactNode }) {
  const { tr, syncing, syncNow } = useApp();
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const THRESHOLD = 56;

  function onTouchStart(e: React.TouchEvent) {
    if (window.scrollY <= 0 && !syncing) startY.current = e.touches[0].clientY;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0 && window.scrollY <= 0) setPull(Math.min(dy * 0.5, 80));
    else if (dy < 0) { startY.current = null; setPull(0); }
  }
  async function onTouchEnd() {
    startY.current = null;
    const shouldSync = pull > THRESHOLD;
    setPull(0);
    if (shouldSync) await syncNow();
  }

  const show = pull > 0 || syncing;
  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="flex justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: show ? Math.max(pull, syncing ? 40 : 0) : 0 }}
        aria-hidden={!show}
      >
        <span className="chip my-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          {syncing ? `⟳ ${tr("updating")}` : pull > THRESHOLD ? `⬆ ${tr("releasing")}` : `⬇ ${tr("pull_to_refresh")}`}
        </span>
      </div>
      {children}
    </div>
  );
}
