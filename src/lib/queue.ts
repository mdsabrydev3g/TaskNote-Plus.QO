"use client";
// Offline mutation queue (IndexedDB) — §6.3 offline-first + pending-sync indicator.
// Captures made offline are stored here and flushed when connectivity returns.

export interface QueuedOp {
  id: string;
  path: string;
  body: unknown;
  ts: number;
}

const DB_NAME = "tnp-queue";
const STORE = "ops";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueue(op: Omit<QueuedOp, "ts">): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ ...op, ts: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  notify();
}

export async function listQueue(): Promise<QueuedOp[]> {
  const db = await openDb();
  const ops = await new Promise<QueuedOp[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const r = tx.objectStore(STORE).getAll();
    r.onsuccess = () => resolve(r.result as QueuedOp[]);
    r.onerror = () => reject(r.error);
  });
  db.close();
  return ops;
}

async function remove(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/** Flush all queued ops in order. Dedup is guaranteed server-side by clientRequestId. */
export async function flushQueue(getCsrf: () => string | null): Promise<{ sent: number; failed: number }> {
  const ops = (await listQueue()).sort((a, b) => a.ts - b.ts);
  let sent = 0, failed = 0;
  for (const op of ops) {
    try {
      const res = await fetch(op.path, {
        method: "POST",
        headers: { "content-type": "application/json", ...(getCsrf() ? { "x-csrf-token": getCsrf()! } : {}) },
        body: JSON.stringify(op.body),
      });
      if (res.ok || res.status === 401) { await remove(op.id); if (res.ok) sent++; else failed++; }
      else if (res.status < 500) { await remove(op.id); failed++; } // permanent rejection: drop
      else failed++;
    } catch {
      failed++; // still offline → stop flushing
      break;
    }
  }
  notify();
  return { sent, failed };
}

// ── subscribers (SyncBadge) ─────────────────────────────────
type Listener = (count: number) => void;
const listeners = new Set<Listener>();

export function onQueueCount(fn: Listener): () => void {
  listeners.add(fn);
  listQueue().then((q) => fn(q.length)).catch(() => {});
  return () => listeners.delete(fn);
}
function notify() {
  listQueue().then((q) => listeners.forEach((fn) => fn(q.length))).catch(() => {});
}
