import { db } from "./db";

export type AuditAction =
  | "signup" | "login" | "logout" | "login_failed"
  | "delete" | "export" | "permission_change" | "device_revoked" | "password_changed";

/** Non-AI sensitive-action trail (§6.5 AuditLog). Fire-and-forget safe. */
export function audit(action: AuditAction, opts: { userId?: string; workspaceId?: string; ip?: string; detail?: object }) {
  db.auditLog
    .create({ data: { action, userId: opts.userId, workspaceId: opts.workspaceId, ip: opts.ip, detail: (opts.detail as object) ?? undefined } })
    .catch((e) => console.error("audit_write_failed", action, e?.message));
}
