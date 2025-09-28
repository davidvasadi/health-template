// app/sitemap.xml/route.ts
import qs from "qs";

// A route handler revalidálása (helyettesíti a fetch next:revalidate-et)
export const revalidate = 600; // 10 perc

// Alap URL-ek
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://csontkovacsbence.hu").replace(/\/$/, "");

// Strapi: szerveroldalon inkább a belső elérés (STRAPI_URL), különben fallback a publikus /api proxyra
const STRAPI_BASE = (
  process.env.STRAPI_URL // pl. http://127.0.0.1:1337
  ?? (process.env.NEXT_PUBLIC_API_URL ?? `${SITE}/api`)
).replace(/\/$/, "");

type StrapiItem = {
  id: number;
  attributes: {
    slug?: string;
    locale?: string;
    updatedAt?: string;
    publishedAt?: string;
    localizations?: { data: { id: number; attributes: { slug?: string; locale?: string } }[] };
  };
};

async function sFetch(path: string, params: Record<string, any>) {
  const url = `${STRAPI_BASE}${path}?${qs.stringify(params, { encodeValuesOnly: true })}`;
  const res = await fetch(url, {
    // NINCS cache/next itt – a file-szintű `export const revalidate` intézi
    // Ha privát az API, használj PAT-et:
    // headers: { Authorization: `Bearer ${process.env.STRAPI_TOKEN!}` },
  });
  if (!res.ok) throw new Error(`Strapi ${res.status} → ${url}`);
  return res.json();
}

const LOCALES = ["hu", "de", "en"] as const;
type L = typeof LOCALES[number];

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

export async function GET() {
  const nodes: string[] = [];
  const seen = new Set<string>();

  // Nyelvi gyökerek + hreflang alternates (+ x-default)
  const homeAlternates = [
    ...LOCALES.map((lng) => ({ hreflang: lng, href: `${SITE}/${lng}` })),
    { hreflang: "x-default", href: `${SITE}/hu` }, // ha HU a default
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

  // Statikus index oldalak (blog, products)
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

  // PAGES (pl. contact, pricing stb.)
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
    if (["home", "homepage", "kezdooldal"].includes(slug)) continue;

    const loc = `${SITE}/${locale}/${slug}`;
    if (seen.has(loc)) continue;
    seen.add(loc);

    const alts: { hreflang: string; href: string }[] = [
      ...(item.attributes.localizations?.data ?? [])
        .filter((l) => l.attributes.slug && l.attributes.locale)
        .map((l) => ({
          hreflang: l.attributes.locale as string,
          href: `${SITE}/${l.attributes.locale}/${l.attributes.slug}`,
        })),
    ];
    // x-default az alapnyelvre
    alts.push({ hreflang: "x-default", href: `${SITE}/hu/${slug}` });

    const isKey = ["contact", "kapcsolat", "pricing", "arak"].includes(slug.toLowerCase());
    nodes.push(
      urlNode(loc, {
        lastmod: lastmodOf(item),
        changefreq: isKey ? "monthly" : "weekly",
        priority: isKey ? 0.7 : 0.6,
        alternates: alts,
      })
    );
  }

  // ARTICLES
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

    const alts: { hreflang: string; href: string }[] = [
      ...(a.attributes.localizations?.data ?? [])
        .filter((l) => l.attributes.slug && l.attributes.locale)
        .map((l) => ({
          hreflang: l.attributes.locale as string,
          href: `${SITE}/${l.attributes.locale}/blog/${l.attributes.slug}`,
        })),
    ];
    alts.push({ hreflang: "x-default", href: `${SITE}/hu/blog/${slug}` });

    nodes.push(
      urlNode(loc, {
        lastmod: lastmodOf(a),
        changefreq: "weekly",
        priority: 0.6,
        alternates: alts,
      })
    );
  }

  // PRODUCTS (ha használod)
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

    const alts: { hreflang: string; href: string }[] = [
      ...(p.attributes.localizations?.data ?? [])
        .filter((l) => l.attributes.slug && l.attributes.locale)
        .map((l) => ({
          hreflang: l.attributes.locale as string,
          href: `${SITE}/${l.attributes.locale}/products/${l.attributes.slug}`,
        })),
    ];
    alts.push({ hreflang: "x-default", href: `${SITE}/hu/products/${slug}` });

    nodes.push(
      urlNode(loc, {
        lastmod: lastmodOf(p),
        changefreq: "weekly",
        priority: 0.6,
        alternates: alts,
      })
    );
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
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
