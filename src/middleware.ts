import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { COOKIES } from "@/lib/auth";

const PUBLIC_API = [/^\/api\/auth\/(login|signup|refresh)/, /^\/api\/health/];
const PUBLIC_PAGES = [/^\/(login|signup|privacy|terms)/, /^\/_next/, /^\/(manifest\.webmanifest|sw\.js|icons|favicon\.ico)/];

const APP_PAGES = [/^\/(inbox|notes|tasks|calendar|projects|settings|today)/, /^\//];

async function hasValidAccess(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIES.access)?.value;
  if (!token) return false;
  const s = process.env.AUTH_SECRET;
  if (!s) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(s), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // CSP (§10.7). script-src needs 'unsafe-inline' for Next.js bootstrap scripts;
  // browsers ignore 'unsafe-inline' once nonce-based CSP is added (hardening TODO).
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "no-referrer");

  const isPublic = PUBLIC_API.some((r) => r.test(pathname)) || PUBLIC_PAGES.some((r) => r.test(pathname) && pathname !== "/");
  if (isPublic) return res;

  const valid = await hasValidAccess(req);

  // Logged out → API gets 401, pages get redirected
  if (!valid) {
    if (pathname.startsWith("/api/"))
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (APP_PAGES.some((r) => r.test(pathname))) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      return NextResponse.redirect(url);
    }
    return res;
  }

  // Logged in but visiting auth pages → to home
  if (/^\/(login|signup)/.test(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
