# TaskNote Plus — قائمة التحقق لنشر Android على Google Play

الملف الجاهز للرفع: `TaskNote-Plus-release.aab` (على سطح المكتب) — AAB وليس APK لأن Play يطلب `.aab` للتطبيقات الجديدة.

## 1) حساب المطوّر (مرة واحدة)
- [ ] حساب Google Play Console — $25 لمرة واحدة. يلزم حساب **شخصي/组织** باسمك.
- [ ] أكمل "Developer profile" + identity verification (Play يطلبها منذ 2023-2024).
- [ ] سياسات البيانات (Data safety form) — انظر §4.

## 2) إنشاء التطبيق
- [ ] Play Console → Create app → **App** (ليس Game) → Name: "TaskNote Plus" → Default language: العربية.
- [ ] **App signing**: Play App Signing مفعّل — ارفع الـ AAB موقّع بمفتاحك (`plus.tasknote.app`)؛ Play يدير مفتاح التوقيع النهائي. احتفظ بـ `upload key` (نفس keystoretنا) آمنًا.

## 3) متطلبات المتجر (Store listing)
- [ ] أيقونة عالية الدقة 512×512 PNG (عندنا `public/icons/icon-512.png`).
- [ ] Feature graphic 1024×500 PNG (يلزم تصميم — لم يُنشأ بعد).
- [ ] لقطات شاشة ≥2 للموبايل (7 فيمة عمودية) — خُذها من التطبيق بعد النشر.
- [ ] وصف قصير ≤80 حرف + وصف كامل ≤4000 (عربي + إنجليزي).
- [ ] تصنيف المحتوى (Questionnaire) + فئة التطبيق: Productivity.

## 4) خصوصية وأمان (§10 من MASTER PROMPT)
- [ ] **Privacy Policy URL** عام — إلزامي. يوضح: لا نشارك بياناتك، التشفير في النقل، صلاحيات الوصول.
- [ ] Data safety form: إجابة "لا نجمع/نشارك" للبيانات الشخصية إلا ما يلزم (المصادقة فقط). صرّح إن المحتوى (ملاحظات/مهام) لا يُرسل لأطراف ثالثة.
- [ ] لا إعلانات → لا يطلب Google AdsID.
- [ ] إن استخدمت AI Gateway مستقبلًا يرفع بيانات للخادم: حدّث Data safety + أضف موافقة مستخدم.

## 5) الأذونات (Permissions)
- [ ] حاليًا التطبيق WebView لا يطلب أذونات حساسة. `android.permission.INTERNET` فقط (ضمني).
- [ ] لو أضفت Camera/Microphone (capture) مستقبلًا → صرّح + برر في Play.

## 6) البناء والنشر
- [ ] **Internal testing** أولًا: ارفع AAB → Internal track → أضف بريدك كانخرط → ثبّت من رابط الاختبار (بعد 5–30 دقيقة).
- [ ] اختبر: تسجيل/دخول، التقاط عربي، offline→online sync، pull-to-refresh، RTL.
- [ ] **Closed/Open testing** (اختياري) ثم **Production**: ارفع للـ release track.
- [ ] مراجعة Play تستغرق عادةً ساعات إلى ~7 أيام للأول.

## 7) ما قبل الرفع (قائمة صدق — لم يُتحقق/ناقص)
- [ ] [!] Feature graphic + لقطات الشاشة غير مُعدّة (تحتاج تصاميم فعلية).
- [ ] [!] Privacy Policy المستضافة غير موجودة — يجب رفع صفحة (يمكن على نفس Vercel: `/privacy`).
- [ ] Target SDK: ✅ `targetSdkVersion = 36` (Capacitor 8) — يستوفي شرط API 35+ لـ 2026.
- [ ] [!] R8/minify معطّل (minifyEnabled false) — لا يمنع النشر، لكن يفضّل تفعيله لاحقًا.
- [ ] [!] Debug releases لا تُرفع — فقط `TaskNote-Plus-release.aab` موقّع بمفتاح الإطلاق.

## أوامر مفيدة
```bash
# إعادة بناء الـ AAB بعد أي تعديل
cd android && ./gradlew.bat bundleRelease
# الناتج: android/app/build/outputs/bundle/release/app-release.aab

# فحص/توقيع يدوي
"C:/android-sdk/build-tools/36.0.0/apksigner.bat" verify --print-certs app/build/outputs/apk/release/app-release.apk
```
