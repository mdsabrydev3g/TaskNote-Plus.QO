import type { Metadata } from "next";

export const metadata: Metadata = { title: "سياسة الخصوصية — TaskNote Plus" };

export default function PrivacyPage() {
  return (
    <main dir="rtl" className="mx-auto max-w-2xl px-5 py-10 leading-8 text-slate-800 dark:text-slate-200">
      <h1 className="mb-2 text-2xl font-extrabold text-indigo-600">✦ سياسة الخصوصية — TaskNote Plus</h1>
      <p className="mb-6 text-sm text-slate-500">آخر تحديث: 28 سبتمبر 2026</p>

      <h2 className="mt-6 text-lg font-bold">ما نجمعه</h2>
      <ul className="list-disc ps-6">
        <li>بريدك الإلكتروني واسمك (اختياري) وكلمة مرور مشفّرة (bcrypt) — لعمل الحساب فقط.</li>
        <li>المحتوى اللي بتسجله (ملاحظات، مهام، مشاريع، مواعيد) — بيُخزّن في قاعدة بيانات Neon Postgres على خادم سحابي لإتزامنة أجهزة بيك انت.</li>
        <li>سجل أمني محدود: توقيت تسجيلات الدخول والأجهزة المرتبطة — لأمان حسابك.</li>
      </ul>

      <h2 className="mt-6 text-lg font-bold">ما نجمعهوش</h2>
      <p>مفيش إعلانات، مفيش تتبّع، مفيش بيع بيانات. مفيش analytics تالتة طرف. مسحتش أي حاجة بتتبّع سلوكك بين المواقع.</p>

      <h2 className="mt-6 text-lg font-bold">الأمان</h2>
      <ul className="list-disc ps-6">
        <li>كل الطلبات فوق HTTPS، وكلمات المرور مشفرة، وجلسات بـ HttpOnly cookies.</li>
        <li>عزل بيانات كل مستخدم (Row-Level Security) — حتى admins الخادم مايقدروش يقرأوا محتواك من غير مفتاح قاعدة البيانات.</li>
        <li>تقدر تمسّح أي جهاز عن بُعد من صفحة الإعدادات، وتصدّر كل بياناتك (JSON) في أي وقت.</li>
      </ul>

      <h2 className="mt-6 text-lg font-bold">الذكاء الاصطناعي</h2>
      <p>في النسخة الحالية، التحليل الآلي (تحويل كلامك لمهام وتواريخ ووسوم) بيتم بقواعد ثابتة على السيرفر <b>من غير</b> إرسال محتواك لأي نموذج ذكاء اصطناعي خارجي. أي ميزة AI مستقبلية هتحتاج موافقة صريحة منك الأول وهتتوثّق هنا.</p>

      <h2 className="mt-6 text-lg font-bold">حقك</h2>
      <p>تصدير بياناتك كاملة أو حذف حسابك وكل محتواه نهائيًا بالطلب على: privacy@tasknote.plus (أو عبر تصدير/حذف من الإعدادات). بنرد خلال 30 يوم.</p>

      <div className="card mt-10 border border-indigo-200 p-4 text-sm dark:border-indigo-900">
        <h2 className="text-base font-bold text-indigo-700 dark:text-indigo-300">Privacy Policy (English)</h2>
        <p className="mt-2" dir="ltr">
          TaskNote Plus collects only: your email, optional display name, a bcrypt-hashed password, the content you
          create (notes, tasks, projects, events) stored in Neon Postgres to sync across your devices, and minimal
          login/security logs. We do not run ads, trackers, or third-party analytics, and we never sell or share
          your data. All traffic is HTTPS with HttpOnly session cookies and per-user row-level isolation. You can
          revoke devices and export all your data anytime. Current automatic parsing (dates/tags/priorities) runs on
          fixed server-side rules — your content is <b>not</b> sent to any external AI model; future AI features
          require explicit opt-in and will be documented here. Contact: privacy@tasknote.plus
        </p>
      </div>

      <p className="mt-8 text-sm text-slate-500">
        <Linkish />
      </p>
    </main>
  );
}

function Linkish() {
  return (
    <>
      رجوع للتسجيل: <a className="text-indigo-600 underline" href="/signup">/signup</a> · الشروط:{" "}
      <a className="text-indigo-600 underline" href="/terms">/terms</a>
    </>
  );
}
