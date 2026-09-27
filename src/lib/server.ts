import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIES, verifyAccessToken } from "./auth";

/** Server-component session check (defense-in-depth behind middleware). */
export async function requireSession(): Promise<{ userId: string; workspaceId: string }> {
  const jar = await cookies();
  const token = jar.get(COOKIES.access)?.value;
  if (!token) redirect("/login");
  const claims = await verifyAccessToken(token);
  if (!claims) redirect("/login");
  return { userId: claims.sub, workspaceId: claims.ws };
}
