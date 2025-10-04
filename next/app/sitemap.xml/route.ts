// app/sitemap.xml/route.ts
import qs from "qs";

export const revalidate = 600;

const SITE = (process.env.WEBSITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://csontkovacsbence.hu").replace(/\/$/, "");
const STRAPI_BASE = (
  process.env.STRAPI_URL ??
  process.env.NEXT_PUBLIC_STRAPI_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  SITE
).replace(/\/$/, "");

type L = "hu" | "de" | "en";
const LOCALES: L[] = ["hu", "de", "en"];

type StrapiLoc = { id: number; attributes: { slug?: string; locale?: string } };
type StrapiItem = {
  id: number;
  attributes: {
    slug?: string;
    locale?: L | string;
    updatedAt?: string;
    publishedAt?: string;
    localizations?: { data: StrapiLoc[] };
  };
};

const xml = (literals: TemplateStringsArray, ...values: any[]) =>
  literals.reduce((acc, lit, i) => acc + lit + (values[i] ?? ""), "");

function lastmodOf(item?: StrapiItem) {
  const d = item?.attributes?.updatedAt || item?.attributes?.publishedAt || new Date().toISOString();
  return new Date(d).toISOString();
}

function urlNode(
  loc: string,
  opts?: {
    lastmod?: string;
    changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    priority?: number;
    alternates?: { hreflang: string; href: string }[];
  }
) {
  const alt = (opts?.alternates ?? [])
    .map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`)
    .join("");
  return xml`<url>
<loc>${loc}</loc>
${alt}
${opts?.lastmod ? `<lastmod>${opts.lastmod}</lastmod>` : ""}
${opts?.changefreq ? `<changefreq>${opts.changefreq}</changefreq>` : ""}
${typeof opts?.priority === "number" ? `<priority>${opts.priority}</priority>` : ""}
</url>`;
}

// ---- TOKEN-LOGIKA: csak valódi tokennel, és 401-re retry token nélkül ----
function validToken(): string | null {
  const t = process.env.STRAPI_TOKEN ?? "";
  if (!t) return null;
  if (/PASTE_YOUR_API_TOKEN/i.test(t)) return null; // placeholder ne menjen ki
  if (t.length < 20) return null; // nagyon rövid „tokenek” se
  return t;
}

async function sFetch(path: string, params: Record<string, any>) {
  const url = `${STRAPI_BASE}${path}?${qs.stringify(
    { publicationState: "live", ...params },
    { encodeValuesOnly: true }
  )}`;

  const token = validToken();

  // 1. próba: ha van érvényes token, küldjük
  if (token) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) return res.json();
    if (res.status !== 401) throw new Error(`Strapi ${res.status} → ${url}`);
    // ha 401, esünk vissza publikusra
  }

  // 2. próba: publikus (Public role)
  const res2 = await fetch(url);
  if (!res2.ok) throw new Error(`Strapi ${res2.status} → ${url}`);
  return res2.json();
}

function altsFromLocalizations(
  baseSlug: string,
  localizations?: { data: StrapiLoc[] },
  kind: "page" | "article" | "product" = "page"
) {
  const list: { hreflang: string; href: string }[] = [];
  for (const l of localizations?.data ?? []) {
    const lng = l.attributes.locale;
    const slug = l.attributes.slug;
    if (!lng || !slug) continue;
    const href =
      kind === "article"
        ? `${SITE}/${lng}/blog/${slug}`
        : kind === "product"
        ? `${SITE}/${lng}/products/${slug}`
        : `${SITE}/${lng}/${slug}`;
    list.push({ hreflang: String(lng), href });
  }
  list.push({ hreflang: "x-default", href: `${SITE}/hu/${baseSlug}` });
  return list;
}

export async function GET() {
  const nodes: string[] = [];
  const seen = new Set<string>();

  const homeAlternates = [
    ...LOCALES.map((lng) => ({ hreflang: lng, href: `${SITE}/${lng}` })),
    { hreflang: "x-default", href: `${SITE}/hu` },
  ];
  for (const lng of LOCALES) {
    const loc = `${SITE}/${lng}`;
    nodes.push(
      urlNode(loc, {
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: 1,
        alternates: homeAlternates,
      })
    );
  }

  // Statikus index oldalak
  for (const lng of LOCALES) {
    for (const p of ["blog", "products"] as const) {
      const loc = `${SITE}/${lng}/${p}`;
      if (seen.has(loc)) continue;
      seen.add(loc);
      nodes.push(
        urlNode(loc, {
          changefreq: "weekly",
          priority: 0.8,
          lastmod: new Date().toISOString(),
          alternates: LOCALES.map((l) => ({ hreflang: l, href: `${SITE}/${l}/${p}` })),
        })
      );
    }
  }

  // PAGES
  try {
    const pagesJson = await sFetch("/api/pages", {
      fields: ["slug", "updatedAt", "publishedAt", "locale"],
      populate: { localizations: { fields: ["slug", "locale"] } },
      locale: "all",
      "pagination[pageSize]": 1000,
      sort: ["updatedAt:desc"],
    });
    const pages: StrapiItem[] = pagesJson?.data ?? [];
    for (const item of pages) {
      const slug = item.attributes.slug;
      const locale = item.attributes.locale as L | undefined;
      if (!slug || !locale) continue;
      if (["home", "homepage", "kezdooldal"].includes(slug.toLowerCase())) continue;

      const loc = `${SITE}/${locale}/${slug}`;
      if (seen.has(loc)) continue;
      seen.add(loc);

      const isKey = ["contact", "kapcsolat", "pricing", "arak"].includes(slug.toLowerCase());
      nodes.push(
        urlNode(loc, {
          lastmod: lastmodOf(item),
          changefreq: isKey ? "monthly" : "weekly",
          priority: isKey ? 0.7 : 0.6,
          alternates: altsFromLocalizations(slug, item.attributes.localizations, "page"),
        })
      );
    }
  } catch (e) {
    console.error("[sitemap] pages fetch failed:", e);
  }

  // ARTICLES
  try {
    const articlesJson = await sFetch("/api/articles", {
      fields: ["slug", "updatedAt", "publishedAt", "locale"],
      populate: { localizations: { fields: ["slug", "locale"] } },
      locale: "all",
      "pagination[pageSize]": 1000,
      sort: ["updatedAt:desc"],
    });
    const articles: StrapiItem[] = articlesJson?.data ?? [];
    for (const a of articles) {
      const slug = a.attributes.slug;
      const locale = a.attributes.locale as L | undefined;
      if (!slug || !locale) continue;

      const loc = `${SITE}/${locale}/blog/${slug}`;
      if (seen.has(loc)) continue;
      seen.add(loc);

      nodes.push(
        urlNode(loc, {
          lastmod: lastmodOf(a),
          changefreq: "weekly",
          priority: 0.6,
          alternates: altsFromLocalizations(slug, a.attributes.localizations, "article"),
        })
      );
    }
  } catch (e) {
    console.error("[sitemap] articles fetch failed:", e);
  }

  // PRODUCTS
  try {
    const productsJson = await sFetch("/api/products", {
      fields: ["slug", "updatedAt", "publishedAt", "locale"],
      populate: { localizations: { fields: ["slug", "locale"] } },
      locale: "all",
      "pagination[pageSize]": 1000,
      sort: ["updatedAt:desc"],
    });
    const products: StrapiItem[] = productsJson?.data ?? [];
    for (const p of products) {
      const slug = p.attributes.slug;
      const locale = p.attributes.locale as L | undefined;
      if (!slug || !locale) continue;

      const loc = `${SITE}/${locale}/products/${slug}`;
      if (seen.has(loc)) continue;
      seen.add(loc);

      nodes.push(
        urlNode(loc, {
          lastmod: lastmodOf(p),
          changefreq: "weekly",
          priority: 0.6,
          alternates: altsFromLocalizations(slug, p.attributes.localizations, "product"),
        })
      );
    }
  } catch (e) {
    console.error("[sitemap] products fetch failed:", e);
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${nodes.join("\n")}
</urlset>`.trim();

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
