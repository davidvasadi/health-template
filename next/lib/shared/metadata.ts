// next/lib/shared/metadata.ts
import { strapiImage } from "../strapi/strapiImage";

type Locale = "hu" | "en" | "de";

const SITE = "https://csontkovacsbence.hu";

const normalize = (url?: string) => {
  if (!url) return undefined;
  let u = url.trim();
  u = u.replace("https://www.", "https://");     // www -> non-www
  if (!u.endsWith("/")) u += "/";               // trailing slash
  return u;
};

const joinUrl = (base: string, path: string) =>
  `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

export function generateMetadataObject(
  seo: any,
  opts: { locale: Locale; pathname?: string } // pathname: pl. "/hu/blog/valami"
) {
  const { locale, pathname } = opts;

  // Ha van Strapi canonicalURL és helyes, azt preferáljuk:
  const canonicalFromStrapi = normalize(seo?.canonicalURL);

  // Fallback canonical a route alapján:
  // - ha pathname van, abból csinálunk teljes URL-t
  // - ha nincs, akkor a locale root: /hu/
  const canonical =
    canonicalFromStrapi ||
    normalize(joinUrl(SITE, pathname ?? `/${locale}/`)) ||
    `${SITE}/${locale}/`;

  return {
    title: seo?.metaTitle || "Csontkovács Kezelés Budapest",
    description: seo?.metaDescription || "Default Description",

    alternates: {
      canonical,
      languages: {
        hu: `${SITE}/hu/`,
        en: `${SITE}/en/`,
        de: `${SITE}/de/`,
      },
    },

    openGraph: {
      title: seo?.ogTitle || seo?.metaTitle || "Default OG Title",
      description: seo?.ogDescription || seo?.metaDescription || "Default OG Description",
      url: canonical,
      images: seo?.metaImage ? [{ url: strapiImage(seo?.metaImage.url) }] : [],
    },

    twitter: {
      card: seo?.twitterCard || "summary_large_image",
      title: seo?.twitterTitle || seo?.metaTitle || "Default Twitter Title",
      description: seo?.twitterDescription || seo?.metaDescription || "Default Twitter Description",
      images: seo?.twitterImage ? [{ url: seo.twitterImage }] : [],
    },
  };
}
