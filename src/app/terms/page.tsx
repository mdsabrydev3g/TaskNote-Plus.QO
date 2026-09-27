import type { Metadata } from "next";

export const metadata: Metadata = { title: "الشروط — TaskNote Plus" };

export default function TermsPage() {
  return (
    <main dir="rtl" className="mx-auto max-w-2xl px-5 py-10 leading-8 text-slate-800 dark:text-slate-200">
      <h1 className="mb-2 text-2xl font-extrabold text-indigo-600">✦ شروط الاستخدام — TaskNote Plus</h1>
      <p className="mb-6 text-sm text-slate-500">آخر تحديث: 28 سبتمبر 2026</p>
      <ul className="list-disc ps-6 space-y-2">
        <li>الخدمة تُقدَّم «كما هي» لاستخدامك الشخصي. تحتفظ بملكيتك الكاملة لكل محتواك.</li>
        <li>لا تستخدم الحساب لنشاط غير قانوني أو لإساءة استخدام البنية التحتية (هجمات، تحميل متعمّد). بنوقف الحسابات المسيئة.</li>
        <li>مسؤوليتك: حفظ كلمات المرور. المسؤولية محدودة قدر الإمكان سمح بيه القانون.</li>
        <li>ممكن نغيّر الخدمة/الشروط — بنبلّغ بتحديث الصفحة دي؛ استمرارك = موافقتك.</li>
        <li>إنهاء الحساب: احذف بياناتك من الإعدادات أو راسلنا — هننفّذ الحذف النهائي.</li>
      </ul>
      <div className="card mt-8 border border-indigo-200 p-4 text-sm dark:border-indigo-900">
        <h2 className="text-base font-bold text-indigo-700 dark:text-indigo-300">Terms of Service (English)</h2>
        <p className="mt-2" dir="ltr">
          The service is provided &quot;as is&quot; for your personal use; you own all of your content. Do not use the account for
          unlawful activity or infrastructure abuse. Keep your credentials safe. We may change the service/terms with notice on
          this page; continued use means acceptance. You may delete your account and data at any time.
        </p>
      </div>
      <p className="mt-8 text-sm text-slate-500">
        السياسة: <a className="text-indigo-600 underline" href="/privacy">/privacy</a> · تسجيل:{" "}
        <a className="text-indigo-600 underline" href="/signup">/signup</a>
      </p>
    </main>
  );
}
