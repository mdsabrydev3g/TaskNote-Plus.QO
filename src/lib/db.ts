import { PrismaClient } from "@prisma/client";

// Singleton across dev hot-reload & serverless warm instances
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/**
 * Run `fn` inside a transaction with the Postgres session variable
 * app.workspace_id set, so RLS policies (prisma/sql/rls.sql) apply.
 * Defense-in-depth: application-layer scoping is still required on every query.
 */
export async function scoped<T>(
  workspaceId: string,
  fn: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>
): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.workspace_id', ${workspaceId}, true)`;
    return fn(tx);
  });
}
