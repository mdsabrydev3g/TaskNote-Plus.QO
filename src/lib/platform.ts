export function detectPlatform(ua: string): string {
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/electron|tauri/i.test(ua)) return "desktop";
  return "web";
}
