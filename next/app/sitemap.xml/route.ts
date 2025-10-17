// app/sitemap.xml/route.ts
import qs from "qs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 600;

const SITE = (process.env.WEBSITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://csontkovacsbence.hu").replace(/\/$/, "");
const STRAPI_BASE = (
  process.env.NEXT_PUBLIC_STRAPI_API_URL ??
  process.env.STRAPI_URL ??
  process.env.NEXT_PUBLIC_STRAPI_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:1337"
).replace(/\/$/, "");

type L = "hu" | "de" | "en";
const LOCALES: L[] = ["hu", "de", "en"];
const isProd = process.env.NODE_ENV === "production";
const publicationState = isProd ? "live" : "preview";

const EP = { pages: "/api/pages", articles: "/api/articles", products: "/api/products" };
const PRODUCTS_PAGE_UID = "product-page";
const BLOG_BASE: Record<L, string> = { hu: "blog", de: "blog", en: "blog" };

type StrapiLoc = { id: number; attributes: { slug?: string; path?: string; locale?: string; updatedAt?: string } };
type StrapiItem = {
  id: number;
  attributes: {
    slug?: string;
    path?: string;
    Slug?: string;
    locale?: string;
    updatedAt?: string;
    publishedAt?: string;
    localizations?: { data: StrapiLoc[] } | StrapiLoc[];
  };
};

const trim = (s?: string) => (s ?? "").replace(/^\/|\/$/g, "");
const normLocale = (v?: string) => (v ?? "").slice(0, 2) as L;
const lastmod = (d?: string) => new Date(d ?? new Date().toISOString()).toISOString();

function authHeader(): Record<string, string> {
  const t =
    process.env.STRAPI_TOKEN ??
    process.env.NEXT_PUBLIC_STRAPI_API_TOKEN ??
    process.env.NEXT_PUBLIC_STRAPI_TOKEN ??
    "";
  if (!t || /PASTE_YOUR_API_TOKEN/i.test(t) || t.length < 20) return {};
  return { Authorization: `Bearer ${t}` };
}

async function sFetch(path: string, params: Record<string, any>) {
  const url = `${STRAPI_BASE}${path}?${qs.stringify(params, { encodeValuesOnly: true })}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  Object.assign(headers, authHeader());
  const res = await fetch(url, { headers, next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Strapi ${res.status} → ${url}`);
  return res.json();
}

async function sFetchAllPaged(path: string, baseParams: Record<string, any>, pageSize = 200) {
  const out: any[] = [];
  let page = 1, pageCount = 1;
  do {
    const rsp = await sFetch(path, { ...baseParams, "pagination[page]": page, "pagination[pageSize]": pageSize });
    out.push(...(Array.isArray(rsp?.data) ? rsp.data : []));
    pageCount = rsp?.meta?.pagination?.pageCount || 1;
    page++;
  } while (page <= pageCount);
  return out;
}

async function sFetchAllLocales(path: string, baseParams: Record<string, any>) {
  const all: any[] = [];
  for (const locale of LOCALES) {
    try {
      const list = await sFetchAllPaged(path, { ...baseParams, locale, publicationState });
      all.push(...list);
    } catch { /* devben lenyeljük */ }
  }
  return all;
}

async function getProductsBaseMap(fallback = "products"): Promise<Record<L, string>> {
  const map: Record<L, string> = { hu: fallback, en: fallback, de: fallback };
  for (const locale of LOCALES) {
    try {
      const r = await sFetch(`/api/${PRODUCTS_PAGE_UID}`, { locale, publicationState });
      const a = r?.data?.attributes ?? r?.data ?? {};
      const p = trim(a.path || a.slug || a.Slug || fallback);
      if (p) map[locale] = p;
    } catch {}
  }
  return map;
}

function urlNode(
  loc: string,
  opts?: {
    lastmod?: string;
    changefreq?: "always"|"hourly"|"daily"|"weekly"|"monthly"|"yearly"|"never";
    priority?: number;
    alternates?: { hreflang: string; href: string }[];
  }
) {
  const alt = (opts?.alternates ?? [])
    .map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`)
    .join("");
  return `<url>
<loc>${loc}</loc>
${alt}
${opts?.lastmod ? `<lastmod>${opts.lastmod}</lastmod>` : ""}
${opts?.changefreq ? `<changefreq>${opts.changefreq}</changefreq>` : ""}
${typeof opts?.priority === "number" ? `<priority>${opts.priority}</priority>` : ""}
</url>`;
}

function alternates(
  kind: "page"|"article"|"product",
  srcSlugOrPath: string,
  localizations: any[],
  productsBase: Record<L, string>
) {
  const src = trim(srcSlugOrPath);
  const list: { hreflang: string; href: string }[] = [];
  const locs: any[] = Array.isArray((localizations as any)?.data)
    ? (localizations as any).data
    : (Array.isArray(localizations) ? localizations : []);

  for (const loc of locs) {
    const lng = normLocale(loc?.attributes?.locale ?? (loc as any)?.locale);
    if (!lng || !LOCALES.includes(lng)) continue;
    const p = trim(loc?.attributes?.path ?? loc?.attributes?.slug ?? (loc as any)?.slug);
    if (!p) continue;

    let href: string;
    if (kind === "article") {
      href = `${SITE}/${lng}/${BLOG_BASE[lng]}/${p}`;
    } else if (kind === "product") {
      href = `${SITE}/${lng}/${trim(productsBase[lng] || "products")}/${p}`;
    } else {
      href = `${SITE}/${lng}/${p}`;
    }
    list.push({ hreflang: String(lng), href });
  }

  const xdef =
    kind === "article"
      ? `${SITE}/hu/${BLOG_BASE.hu}/${src}`
      : kind === "product"
      ? `${SITE}/hu/${trim(productsBase.hu || "products")}/${src}`
      : `${SITE}/hu/${src}`;
  list.push({ hreflang: "x-default", href: xdef });
  return list;
}

export async function GET() {
  const nodes: string[] = [];
  const seen = new Set<string>();
  let countPages = 0, countArticles = 0, countProducts = 0;

  const productsBase = await getProductsBaseMap("products");

  // nyelvi gyökerek
  const homeAlts = [
    ...LOCALES.map((l) => ({ hreflang: l, href: `${SITE}/${l}` })),
    { hreflang: "x-default", href: `${SITE}/hu` },
  ];
  for (const lng of LOCALES) {
    nodes.push(urlNode(`${SITE}/${lng}`, {
      lastmod: new Date().toISOString(),
      changefreq: "weekly",
      priority: 1,
      alternates: homeAlts,
    }));
  }

  // blog / products indexek
  for (const lng of LOCALES) {
    const blogLoc = `${SITE}/${lng}/${BLOG_BASE[lng]}`;
    if (!seen.has(blogLoc)) {
      seen.add(blogLoc);
      nodes.push(urlNode(blogLoc, {
        changefreq: "weekly",
        priority: 0.8,
        lastmod: new Date().toISOString(),
        alternates: [
          ...LOCALES.map((l) => ({ hreflang: l, href: `${SITE}/${l}/${BLOG_BASE[l]}` })),
          { hreflang: "x-default", href: `${SITE}/hu/${BLOG_BASE.hu}` },
        ],
      }));
    }
    const prodBase = trim(productsBase[lng] || "products");
    const prodLoc = `${SITE}/${lng}/${prodBase}`;
    if (!seen.has(prodLoc)) {
      seen.add(prodLoc);
      nodes.push(urlNode(prodLoc, {
        changefreq: "weekly",
        priority: 0.8,
        lastmod: new Date().toISOString(),
        alternates: [
          ...LOCALES.map((l) => ({ hreflang: l, href: `${SITE}/${l}/${trim(productsBase[l] || "products")}` })),
          { hreflang: "x-default", href: `${SITE}/hu/${trim(productsBase.hu || "products")}` },
        ],
      }));
    }
  }

  // PAGES
  try {
    const pages = await sFetchAllLocales(EP.pages, {
      populate: { localizations: true },
      sort: ["updatedAt:desc"],
      // prod: csak élő; dev: minden
      filters: isProd ? { publishedAt: { $notNull: true } } : {},
      publicationState,
    });

    for (const it of pages as StrapiItem[]) {
      const a = it?.attributes ?? {};
      const locale = normLocale(a.locale);
      if (!locale || !LOCALES.includes(locale)) continue;

      // 👇 legyen rugalmas: path || slug || Slug
      const slugOrPath = trim(a.path ?? a.slug ?? (a as any).Slug);
      if (!slugOrPath) continue;

      // kerüljük a kezdőoldal-aliasokat
      if (["home", "homepage", "kezdooldal", "kezdőoldal"].includes(slugOrPath.toLowerCase())) continue;

      const loc = `${SITE}/${locale}/${slugOrPath}`;
      if (seen.has(loc)) continue;
      seen.add(loc);

      const isKey = ["contact","kapcsolat","pricing","arak","árak","faq","gyik","gyík"].includes(slugOrPath.toLowerCase());

      nodes.push(urlNode(loc, {
        lastmod: lastmod(a.updatedAt ?? a.publishedAt),
        changefreq: isKey ? "monthly" : "weekly",
        priority: isKey ? 0.7 : 0.6,
        alternates: alternates("page", slugOrPath, (a.localizations as any), productsBase),
      }));
      countPages++;
    }
  } catch (e) { console.error("[sitemap] pages:", e); }

  // ARTICLES
  try {
    const arts = await sFetchAllLocales(EP.articles, {
      populate: { localizations: true },
      sort: ["updatedAt:desc"],
      filters: isProd ? { publishedAt: { $notNull: true }, slug: { $notNull: true } } : { slug: { $notNull: true } },
      publicationState,
    });
    for (const it of arts as StrapiItem[]) {
      const a = it?.attributes ?? {};
      const locale = normLocale(a.locale);
      if (!locale || !LOCALES.includes(locale)) continue;
      const slug = trim(a.slug ?? (a as any).Slug);
      if (!slug) continue;

      const loc = `${SITE}/${locale}/${BLOG_BASE[locale]}/${slug}`;
      if (seen.has(loc)) continue;
      seen.add(loc);

      nodes.push(urlNode(loc, {
        lastmod: lastmod(a.updatedAt ?? a.publishedAt),
        changefreq: "weekly",
        priority: 0.6,
        alternates: alternates("article", slug, (a.localizations as any), productsBase),
      }));
      countArticles++;
    }
  } catch (e) { console.error("[sitemap] articles:", e); }

  // PRODUCTS
  try {
    const prods = await sFetchAllLocales(EP.products, {
      populate: { localizations: true },
      sort: ["updatedAt:desc"],
      filters: isProd ? { publishedAt: { $notNull: true }, slug: { $notNull: true } } : { slug: { $notNull: true } },
      publicationState,
    });
    for (const it of prods as StrapiItem[]) {
      const a = it?.attributes ?? {};
      const locale = normLocale(a.locale);
      if (!locale || !LOCALES.includes(locale)) continue;
      const slug = trim(a.slug ?? (a as any).Slug);
      if (!slug) continue;

      const base = trim((await getProductsBaseMap("products"))[locale] || "products");
      const loc = `${SITE}/${locale}/${base}/${slug}`;
      if (seen.has(loc)) continue;
      seen.add(loc);

      nodes.push(urlNode(loc, {
        lastmod: lastmod(a.updatedAt ?? a.publishedAt),
        changefreq: "weekly",
        priority: 0.6,
        alternates: alternates("product", slug, (a.localizations as any), await getProductsBaseMap("products")),
      }));
      countProducts++;
    }
  } catch (e) { console.error("[sitemap] products:", e); }

  const body =
`<?xml version="1.0" encoding="UTF-8"?>
<!-- counts: pages=${countPages} articles=${countArticles} products=${countProducts} -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${nodes.join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=600",
    },
  });
}
