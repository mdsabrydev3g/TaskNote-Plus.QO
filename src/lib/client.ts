"use client";
import { enqueue } from "./queue";

export function getCsrf(): string | null {
  const m = document.cookie.match(/(?:^|;\s*)tnp_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export async function apiFetch<T = any>(path: string, init?: RequestInit & { json?: unknown }): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const headers: Record<string, string> = { ...(init?.headers as any) };
  let body = init?.body;
  if (init?.json !== undefined) {
    body = JSON.stringify(init.json);
    headers["content-type"] = "application/json";
  }
  if (["POST", "PATCH", "PUT", "DELETE"].includes((init?.method ?? "GET").toUpperCase())) {
    const csrf = getCsrf();
    if (csrf) headers["x-csrf-token"] = csrf;
  }
  try {
    const res = await fetch(path, { ...init, body, headers, credentials: "same-origin" });
    const data = await res.json().catch(() => undefined);
    return { ok: res.ok, status: res.status, data, error: data?.error };
  } catch (e) {
    return { ok: false, status: 0, error: "network" };
  }
}

/** Offline-tolerant capture: POST /api/capture, queue on network failure (§7.1 MUST offline). */
export async function capture(text: string, clientRequestId: string): Promise<{ queued: boolean; data?: any; error?: string }> {
  const payload = { text, clientRequestId, kind: "auto", deviceOrigin: navigator.platform?.slice(0, 30) ?? "web" };
  const res = await apiFetch("/api/capture", { method: "POST", json: payload });
  if (res.status === 0) {
    await enqueue({ id: clientRequestId, path: "/api/capture", body: payload });
    return { queued: true };
  }
  if (!res.ok) return { queued: false, error: res.error ?? "failed" };
  return { queued: false, data: res.data };
}

export function newClientRequestId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
