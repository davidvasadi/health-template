// app/robots.ts
import type { MetadataRoute } from "next";

// A domain forrása: először WEBSITE_URL (SSR), majd NEXT_PUBLIC_SITE_URL (client)
const SITE_URL = (process.env.WEBSITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://csontkovacsbence.hu").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/_next",
          "/next",
          "/private",
        ],
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`],
    host: SITE_URL, // (nem minden bot használja, de nem árt)
  };
}
