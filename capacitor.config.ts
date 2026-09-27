import type { CapacitorConfig } from "@capacitor/cli";

/**
 * TaskNote Plus native shell (Android now, iOS on a Mac later).
 * The app is the deployed PWA (Vercel) loaded in a hardened WebView:
 * one codebase, offline via service worker + IndexedDB queue (§6.3).
 *
 * Set TNP_SERVER_URL before `cap sync` to point at preview/staging builds.
 */
const config: CapacitorConfig = {
  appId: "plus.tasknote.app",
  appName: "TaskNote Plus",
  webDir: "public",
  android: {
    allowMixedContent: false,
  },
  server: {
    url: process.env.TNP_SERVER_URL ?? "https://tasknote-plus.vercel.app",
    androidScheme: "https",
  },
};

export default config;
