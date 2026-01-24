// next/lib/strapi/strapiImage.ts
import { unstable_noStore as noStore } from "next/cache";

function normalizeBase(base?: string) {
  if (!base) return "";
  // ha /api a vége, vágjuk le (uploads NEM az /api alatt van)
  return base.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

export function strapiImage(url: string): string {
  noStore();
  if (!url) return "";

  // már abszolút
  if (/^https?:\/\//i.test(url)) return url;

  // relatív /uploads/...
  if (url.startsWith("/")) {
    const base = normalizeBase(process.env.NEXT_PUBLIC_API_URL);

    // csak kliensen próbálkozz strapidemo fallbackkel
    if (!base && typeof window !== "undefined" && window.location.host.endsWith(".strapidemo.com")) {
      return `https://${window.location.host.replace("client-", "api-")}${url}`;
    }

    // ha van base: base + /uploads/...
    if (base) return `${base}${url}`;

    // ha nincs base, hagyjuk relatívként (legalább nem törünk)
    return url;
  }

  // nem /-al kezdődik, de nem is http → hagyjuk
  return url;
}
