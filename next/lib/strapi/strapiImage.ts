// strapiImage:
// next/lib/strapi/strapiImage.ts
import { unstable_noStore as noStore } from "next/cache";

const ASSET_EXT = "(?:png|jpe?g|webp|gif|svg|avif)";

function stripTrailingSlashAfterAsset(s: string) {
  return s.replace(new RegExp(`(\\.${ASSET_EXT})\\/+(?=\\?|$)`, "i"), "$1");
}

function normalizeSiteOrigin(): string {
  const raw =
    (process.env.WEBSITE_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "https://theplacestudio.hu"
    ).trim();

  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}`.replace(/\/$/, "");
  } catch {
    return "https://theplacestudio.hu";
  }
}

function normalizeApiOrigin(): string {
  const raw =
    (process.env.NEXT_PUBLIC_API_URL ??
      process.env.NEXT_PUBLIC_STRAPI_URL ??
      process.env.STRAPI_URL ??
      ""
    ).trim();

  if (!raw) return "";
  // ha /api a vége, vágjuk le – az ORIGIN kell
  return raw.replace(/\/api\/?$/i, "").replace(/\/$/, "");
}

const SITE_ORIGIN = normalizeSiteOrigin();
const API_ORIGIN = normalizeApiOrigin();

export function strapiImage(input: unknown): string {
  noStore();
  if (!input) return "";

  let url = String(input).trim();
  if (!url) return "";

  // JSON escape: https:\/\/...
  url = url.replace(/\\\//g, "/");
  url = stripTrailingSlashAfterAsset(url);

  // --- abszolút URL ---
  if (/^https?:\/\//i.test(url)) {
    try {
      const u = new URL(url);

      // ha valaha /api/uploads jönne: alakítsuk /uploads-ra
      if (u.pathname.startsWith("/api/uploads/")) {
        const fixedPath = u.pathname.replace(/^\/api\/uploads\//, "/uploads/");
        return `${SITE_ORIGIN}${stripTrailingSlashAfterAsset(fixedPath)}${u.search || ""}`;
      }

      // uploads mindig a SITE_ORIGIN alól menjen (stabil)
      if (u.pathname.startsWith("/uploads/")) {
        return `${SITE_ORIGIN}${stripTrailingSlashAfterAsset(u.pathname)}${u.search || ""}`;
      }

      return url;
    } catch {
      return url;
    }
  }

  // --- relatív ---
  if (url.startsWith("uploads/")) url = `/${url}`;

  // /api/uploads -> /uploads
  if (url.startsWith("/api/uploads/")) {
    url = url.replace(/^\/api\/uploads\//, "/uploads/");
  }

  // uploads: ABSZOLÚT!
  if (url.startsWith("/uploads/")) {
    return `${SITE_ORIGIN}${stripTrailingSlashAfterAsset(url)}`;
  }

  // egyéb relatív: ha kell, API originre fűzzük
  if (url.startsWith("/")) {
    if (API_ORIGIN) return `${API_ORIGIN}${url}`;
    return url;
  }

  return url;
}
