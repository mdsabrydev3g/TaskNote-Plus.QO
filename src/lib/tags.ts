import type { Prisma } from "@prisma/client";

type Tx = Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/** Upsert tags by name within a workspace and return connect rows. */
export async function resolveTags(tx: Tx, workspaceId: string, names?: string[]) {
  if (!names || names.length === 0) return [];
  const ids: string[] = [];
  for (const raw of names) {
    const name = raw.trim().toLowerCase();
    if (!name) continue;
    const tag = await tx.tag.upsert({
      where: { workspaceId_name: { workspaceId, name } },
      create: { workspaceId, name },
      update: {},
    });
    ids.push(tag.id);
  }
  return ids.map((tagId) => ({ tag: { connect: { id: tagId } } }));
}
