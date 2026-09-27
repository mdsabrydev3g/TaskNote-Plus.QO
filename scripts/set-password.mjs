// One-off: reset password for the user's account.
// Run:  node --env-file=.env scripts/set-password.mjs "<new-password>"
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const EMAIL = "mohameddesabry@gmail.com";
const NEW_PW = process.argv[2];
if (!NEW_PW) { console.error("usage: set-password.mjs <password>"); process.exit(2); }

// Mirror the app's own policy (src/lib/auth.ts passwordIssues).
const issues = [];
if (NEW_PW.length < 10) issues.push("too_short_min_10");
if (!/[a-zA-Z]/.test(NEW_PW)) issues.push("needs_letters");
if (!/[0-9]/.test(NEW_PW)) issues.push("needs_digits");
if (!/[^a-zA-Z0-9]/.test(NEW_PW)) issues.push("needs_symbols");
if (/^[A-Z][a-z]+$/.test(NEW_PW)) issues.push("too_predictable");
if (issues.length) { console.error("weak_password:", issues.join(",")); process.exit(3); }

const user = await prisma.user.findUnique({ where: { email: EMAIL } });
if (!user) { console.error("account not found"); process.exit(4); }
await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(NEW_PW, 10) } });
// Invalidate old sessions so the previous password stops working everywhere.
const revoked = await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
console.log(JSON.stringify({ ok: true, email: EMAIL, sessionsRevoked: revoked.count }));
await prisma.$disconnect();
