"use client";
import { useApp } from "./providers";

export function LanguageSwitch() {
  const { lang, setLang } = useApp();
  return (
    <div className="flex gap-2">
      <button onClick={() => setLang("ar")} className={`chip px-4 py-2 ${lang === "ar" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>العربية (RTL)</button>
      <button onClick={() => setLang("en")} className={`chip px-4 py-2 ${lang === "en" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>English (LTR)</button>
    </div>
  );
}
