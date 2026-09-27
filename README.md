# TaskNote Plus

**نظام التشغيل الشخصي للإنتاجية — Tasks + Notes + Projects + Calendar في مكان واحد.**
Next.js 15 · TypeScript · Tailwind v4 · Prisma + Neon Postgres · Vercel · PWA + Capacitor (Android/iOS)

> مبني على MASTER PROMPT v5.0 (MindFlow) — الاسم الرسمي للمنتج: **TaskNote Plus**.
> المرحلة الحالية = MVP (§23): Capture → Inbox → Notes → Tasks → Projects → Calendar،
> أمان Zero-Trust أساسه (§10)، عربي RTL كلاسة أولى (§15.3)، Offline-first (§6.3).

---

## 1) تشغيل محلي

```bash
npm install
cp .env.example .env       # ضع DATABASE_URL من Neon و AUTH_SECRET عشوائي
npx prisma db push         # أو: psql "$DATABASE_URL" -f prisma/sql/schema.sql
npm run dev                # http://localhost:3000
```

توليد سر: `openssl rand -base64 32`

## 2) قاعدة بيانات Neon (مجانية)

1. أنشئ Project على https://console.neon.tech → تحصل على `DATABASE_URL` (نسخة **pooled** `-pooler` لـ Vercel).
2. شغّل الـ schema: `npx prisma db push` من جهازك، أو نفّذ `prisma/sql/schema.sql` عبر Neon SQL Editor.
3. (اختياري/توصية أمان §10.4) فعّل RLS: `prisma/sql/rls.sql` — التفاصيل ودور `tnp_app` موضّحة داخل الملف.

## 3) النشر على Vercel

1. ارفع هذا المجلد على GitHub ثم Import من Vercel (Framework: Next.js يكتشف تلقائيًا).
2. Environment Variables في Vercel:
   - `DATABASE_URL` → pooled Neon string
   - `AUTH_SECRET` → 32-byte random
   - `NEXT_PUBLIC_APP_URL` → رابط الموقع النهائي
3. Deploy. الـ postinstall يشغّل `prisma generate` تلقائيًا.

## 4) موبايل

- **PWA الآن**: افتح الرابط على الهاتف → Add to Home Screen (يعمل offline كامل: Service Worker + طابور IndexedDB للالتقاط بدون نت).
- **APK أندرويد** (Capacitor — نفس كود الويب في WebView آمن) — ✅ **تم بناؤه فعليًا**:
  ```bash
  npm install @capacitor/android@8
  npm run cap:add:android
  npm run cap:sync
  npm run android:build     # android/app/build/outputs/apk/debug/app-debug.apk
  ```
  `android/local.properties` = `sdk.dir=C:/android-sdk` (إملاء بمائل مائل forward slash — المائل الخلفي يكسر ملف properties). JDK 21 + SDK 36 عندك. الـ APK debug (لم يُحدّد keystore للتوقيع بعد).
- **iOS**: يحتاج macOS + Xcode (لاحقًا: `npx cap add ios`).

## 5) بنى أساسية جاهزة

| المجال | الملفات |
|---|---|
| Auth أمني | HttpOnly JWT 15m + Refresh rotating بعائلة + كشف إعادة استخدام + CSRF double-submit + Rate limiting |
| Tenancy | كل استعلام workspace-scoped + RLS SQL جاهز |
| Capture | `/api/capture` idempotent بـ clientRequestId، يشتغل offline |
| Quick-add | محلل عربي/إنجليزي (`src/lib/quick-add.ts`) + اختباراته — تاريخ/أولوية/وسوم، تأكيد قبل الحفظ |
| Sync | `/api/changes?since=` (pull MVP) — real-time/CRDT في مرحلة V1 |
| Export | `/api/export` JSON كامل مع manifest sha256 |
| Sessions | `/api/sessions` عرض + إنهاء جهاز عن بُعد |

## 6) حالة الصراحة (§21.3 DoD مختصر)

- ✅ Build + type-check + 20/20 unit tests pass (يشمل timezone/DST).
- ✅ Runtime مقابل Neon فعليًا: `prisma db push` → 15 جدول، RLS على 10، اختبار end-to-end حيّ على Vercel (signup→capture→inbox محفوظ فعلًا).
- ✅ APK أندرويد debug مبنيّ (Capacitor remote-WebView → رابط Vercel الحيّ).
- ✅ التقاط الوقت صار timezone-aware: العميل يبعت IANA zone + الآن، والمحليل يحسب مقابلها ويعيد حساب الـ offset عند التاريخ (DST-safe).
- [!] OAuth/Passkeys + 2FA: مخطط في §10.2 — غير منفّذ بعد؛ email/password جاهز الآن.
- [!] APK موقّع بـ debug keystore فقط؛ للإنتاج يلزم keystore خاص + `assembleRelease`.
- [!] Rate limiting على Vercel serverless = لكل instance (Redis لاحقًا).
- [!] AI Gateway/memories/RAG: مرحلة V2 حسب §23 — البنية (AIActionLog, aiAccessible) محجوزة.
- [!] iOS + Desktop (Tauri): خارج MVP الحالي.
