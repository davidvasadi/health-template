// lib/analytics/gtag.ts
export function consentUpdate(granted: boolean) {
  if (typeof window === "undefined") return;
  const mode = granted ? "granted" : "denied";
  (window as any).gtag?.("consent", "update", {
    ad_storage: mode,
    analytics_storage: mode,
    ad_user_data: mode,
    ad_personalization: mode,
  });
}
