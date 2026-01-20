// app/sitemap.xml/route.ts
import qs from "qs";

export const revalidate = 600;

// --- URLs (dev-ben legyen stabil) ---
const SITE = (
  process.env.WEBSITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://csontkovacsbence.hu")
).replace(/\/$/, "");

const STRAPI_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  process.env.STRAPI_URL ||
  "http://localhost:1337"
).replace(/\/$/, "");

// --- i18n ---
type L = "hu" | "de" | "en";
const LOCALES: L[] = ["hu", "de", "en"];

// --- helpers ---
const xml = (literals: TemplateStringsArray, ...values: any[]) =>
  literals.reduce((acc, lit, i) => acc + lit + (values[i] ?? ""), "");

const norm = (s?: string) => (s ?? "").replace(/^\/|\/$/g, "").toLowerCase();

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

// token – opcionális; 401 esetén fallback public-ra
function validToken(): string | null {
  const t = process.env.STRAPI_TOKEN ?? "";
  if (!t) return null;
  if (/PASTE_YOUR_API_TOKEN/i.test(t)) return null;
  if (t.length < 20) return null;
  return t;
}

async function sFetch(path: string, params: Record<string, any>) {
  const url = `${STRAPI_BASE}${path}?${qs.stringify(
    {
      publicationState: "live",
      ...params,
    },
    { encodeValuesOnly: true }
  )}`;

  const token = validToken();

  if (token) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate },
    });
    if (res.ok) return res.json();
    if (res.status !== 401) throw new Error(`Strapi ${res.status} → ${url}`);
  }

  const res2 = await fetch(url, { next: { revalidate } });
  if (!res2.ok) throw new Error(`Strapi ${res2.status} → ${url}`);
  return res2.json();
}

/**
 * Normalize Strapi v4/v5:
 * - v4: { id, attributes: {..., localizations: { data: [...] } } }
 * - v5: { id, ...fieldsAtTop, localizations: [...] }
 */
function attrs(x: any) {
  return x?.attributes ?? x ?? {};
}
function getLocale(x: any): L | string | undefined {
  const a = attrs(x);
  return a?.locale ?? x?.locale;
}
function getSlug(x: any): string | undefined {
  const a = attrs(x);
  return a?.slug ?? x?.slug;
}
function getUpdatedAt(x: any): string | undefined {
  const a = attrs(x);
  return a?.updatedAt ?? x?.updatedAt;
}
function getPublishedAt(x: any): string | undefined {
  const a = attrs(x);
  return a?.publishedAt ?? x?.publishedAt;
}
function getLocalizations(x: any): any[] {
  const a = attrs(x);
  const locs =
    a?.localizations?.data ??
    a?.localizations ??
    x?.localizations?.data ??
    x?.localizations ??
    [];
  return Array.isArray(locs) ? locs : [];
}

function lastmodOf(item?: any) {
  const d = getUpdatedAt(item) || getPublishedAt(item) || new Date().toISOString();
  return new Date(d).toISOString();
}

// --- base slugs (single types) ---
async function getProductsBaseLocalized(): Promise<Record<L, string>> {
  const map: Record<L, string> = { hu: "szolgaltatasok", en: "products", de: "leistungen" };

  try {
    const json = await sFetch("/api/product-page", {
      fields: ["slug", "locale"],
      populate: { localizations: { fields: ["slug", "locale"] } },
      locale: "hu",
    });

    const root = Array.isArray(json?.data) ? json.data[0] : json?.data;
    const rootAttrs = attrs(root);

    const rootLoc = (rootAttrs?.locale ?? root?.locale) as L | undefined;
    const rootSlug = norm(rootAttrs?.slug ?? root?.slug);
    if (rootLoc && rootSlug) map[rootLoc] = rootSlug;

    for (const l of getLocalizations(root).map(attrs)) {
      const lng = l?.locale as L | undefined;
      const slug = norm(l?.slug);
      if (lng && slug) map[lng] = slug;
    }
  } catch {
    // fallback marad
  }

  return map;
}

async function getPracticesBaseLocalized(): Promise<Record<L, string>> {
  const map: Record<L, string> = { hu: "gyakorlatok", en: "practices", de: "practices" };

  const candidates = ["practice-page", "practices-page"] as const;

  for (const uid of candidates) {
    try {
      for (const lng of LOCALES) {
        const json = await sFetch(`/api/${uid}`, {
          fields: ["slug", "locale"],
          populate: { localizations: { fields: ["slug", "locale"] } },
          locale: lng,
        });

        const root = Array.isArray(json?.data) ? json.data[0] : json?.data;
        if (!root) continue;

        const rootAttrs = attrs(root);
        const rootLoc = (rootAttrs?.locale ?? root?.locale) as L | undefined;
        const rootSlug = norm(rootAttrs?.slug ?? root?.slug);
        if (rootLoc && rootSlug) map[rootLoc] = rootSlug;

        for (const l of getLocalizations(root).map(attrs)) {
          const loc = l?.locale as L | undefined;
          const slug = norm(l?.slug);
          if (loc && slug) map[loc] = slug;
        }
      }

      if (map.hu) return map;
    } catch {
      // next candidate
    }
  }

  return map;
}

// --- hreflang alternates ---
function dedupeHreflang(list: { hreflang: string; href: string }[]) {
  const seen = new Set<string>();
  return list.filter((a) => (seen.has(a.hreflang) ? false : (seen.add(a.hreflang), true)));
}

function altsForIndex(
  kind: "blog" | "products" | "practices",
  bases: { products: Record<L, string>; practices: Record<L, string> }
) {
  const hrefFor = (lng: L) => {
    if (kind === "blog") return `${SITE}/${lng}/blog`;
    if (kind === "products") return `${SITE}/${lng}/${bases.products[lng] || "products"}`;
    return `${SITE}/${lng}/${bases.practices[lng] || "practices"}`;
  };

  const list = [
    ...LOCALES.map((lng) => ({ hreflang: lng, href: hrefFor(lng) })),
    { hreflang: "x-default", href: hrefFor("hu") },
  ];

  return dedupeHreflang(list);
}

function altsFromLocalizations(
  kind: "article" | "product" | "practice",
  bases: { products: Record<L, string>; practices: Record<L, string> },
  current: { locale: L; slug: string },
  localizations: any[]
) {
  const hrefFor = (lng: L, slug: string) => {
    if (kind === "article") return `${SITE}/${lng}/blog/${slug}`;

    if (kind === "product") {
      const base = bases.products[lng] || "products";
      return `${SITE}/${lng}/${base}/${slug}`;
    }

    const base = bases.practices[lng] || "practices";
    return `${SITE}/${lng}/${base}/${slug}`;
  };

  const list: { hreflang: string; href: string }[] = [];

  list.push({ hreflang: current.locale, href: hrefFor(current.locale, current.slug) });

  for (const l of localizations.map(attrs)) {
    const lng = l?.locale as L | undefined;
    const slug = l?.slug as string | undefined;
    if (!lng || !slug) continue;
    list.push({ hreflang: lng, href: hrefFor(lng, slug) });
  }

  const huAlt = list.find((x) => x.hreflang === "hu")?.href ?? hrefFor(current.locale, current.slug);
  list.push({ hreflang: "x-default", href: huAlt });

  return dedupeHreflang(list);
}

// --- fetch collection per-locale (NINCS locale=all) ---
async function fetchCollection(path: string, locale: L, pageSize = 1000) {
  return sFetch(path, {
    locale,
    "pagination[pageSize]": pageSize,
    sort: ["updatedAt:desc"],
    fields: ["slug", "locale", "updatedAt", "publishedAt"],
    populate: { localizations: { fields: ["slug", "locale"] } },
  });
}

export async function GET() {
  const nodes: string[] = [];
  const seen = new Set<string>();

  // base slugs
  const productsBase = await getProductsBaseLocalized();
  const practicesBase = await getPracticesBaseLocalized();

  // HOME
  const homeAlternates = [
    ...LOCALES.map((lng) => ({ hreflang: lng, href: `${SITE}/${lng}` })),
    { hreflang: "x-default", href: `${SITE}/hu` },
  ];
  for (const lng of LOCALES) {
    const loc = `${SITE}/${lng}`;
    if (!seen.has(loc)) {
      seen.add(loc);
      nodes.push(
        urlNode(loc, {
          lastmod: new Date().toISOString(),
          changefreq: "weekly",
          priority: 1,
          alternates: homeAlternates,
        })
      );
    }
  }

  // INDEX OLDALAK
  for (const lng of LOCALES) {
    // blog index
    {
      const loc = `${SITE}/${lng}/blog`;
      if (!seen.has(loc)) {
        seen.add(loc);
        nodes.push(
          urlNode(loc, {
            lastmod: new Date().toISOString(),
            changefreq: "weekly",
            priority: 0.8,
            alternates: altsForIndex("blog", { products: productsBase, practices: practicesBase }),
          })
        );
      }
    }

    // products index
    {
      const base = productsBase[lng] || "products";
      const loc = `${SITE}/${lng}/${base}`;
      if (!seen.has(loc)) {
        seen.add(loc);
        nodes.push(
          urlNode(loc, {
            lastmod: new Date().toISOString(),
            changefreq: "weekly",
            priority: 0.8,
            alternates: altsForIndex("products", { products: productsBase, practices: practicesBase }),
          })
        );
      }
    }

    // practices index
    {
      const base = practicesBase[lng] || "practices";
      const loc = `${SITE}/${lng}/${base}`;
      if (!seen.has(loc)) {
        seen.add(loc);
        nodes.push(
          urlNode(loc, {
            lastmod: new Date().toISOString(),
            changefreq: "weekly",
            priority: 0.8,
            alternates: altsForIndex("practices", { products: productsBase, practices: practicesBase }),
          })
        );
      }
    }
  }

  // PAGES
  try {
    for (const lng of LOCALES) {
      const pagesJson = await fetchCollection("/api/pages", lng);
      const pages: any[] = pagesJson?.data ?? [];
      for (const item of pages) {
        const slug = getSlug(item);
        const locale = getLocale(item) as L | undefined;
        if (!slug || !locale) continue;
        if (["home", "homepage", "kezdooldal"].includes(slug.toLowerCase())) continue;

        const loc = `${SITE}/${locale}/${slug}`;
        if (seen.has(loc)) continue;
        seen.add(loc);

        const isKey = ["contact", "kapcsolat", "pricing", "arak", "gyik", "faq"].includes(slug.toLowerCase());

        nodes.push(
          urlNode(loc, {
            lastmod: lastmodOf(item),
            changefreq: isKey ? "monthly" : "weekly",
            priority: isKey ? 0.7 : 0.6,
            alternates: dedupeHreflang([
              { hreflang: locale, href: `${SITE}/${locale}/${slug}` },
              ...getLocalizations(item)
                .map(attrs)
                .filter((l) => l?.locale && l?.slug)
                .map((l) => ({ hreflang: l.locale, href: `${SITE}/${l.locale}/${l.slug}` })),
              { hreflang: "x-default", href: `${SITE}/hu/${slug}` },
            ]),
          })
        );
      }
    }
  } catch (e) {
    console.error("[sitemap] pages fetch failed:", e);
  }

  // ARTICLES (blog detail)
  try {
    for (const lng of LOCALES) {
      const articlesJson = await fetchCollection("/api/articles", lng);
      const items: any[] = articlesJson?.data ?? [];

      for (const a of items) {
        const slug = getSlug(a);
        const locale = getLocale(a) as L | undefined;
        if (!slug || !locale) continue;

        const loc = `${SITE}/${locale}/blog/${slug}`;
        if (seen.has(loc)) continue;
        seen.add(loc);

        nodes.push(
          urlNode(loc, {
            lastmod: lastmodOf(a),
            changefreq: "weekly",
            priority: 0.6,
            alternates: altsFromLocalizations(
              "article",
              { products: productsBase, practices: practicesBase },
              { locale, slug },
              getLocalizations(a)
            ),
          })
        );
      }
    }
  } catch (e) {
    console.error("[sitemap] articles fetch failed:", e);
  }

  // PRODUCTS (product detail) — ✅ base slug-gal!
  try {
    for (const lng of LOCALES) {
      const productsJson = await fetchCollection("/api/products", lng);
      const items: any[] = productsJson?.data ?? [];

      for (const p of items) {
        const slug = getSlug(p);
        const locale = getLocale(p) as L | undefined;
        if (!slug || !locale) continue;

        const base = productsBase[locale] || "products";
        const loc = `${SITE}/${locale}/${base}/${slug}`;
        if (seen.has(loc)) continue;
        seen.add(loc);

        nodes.push(
          urlNode(loc, {
            lastmod: lastmodOf(p),
            changefreq: "weekly",
            priority: 0.6,
            alternates: altsFromLocalizations(
              "product",
              { products: productsBase, practices: practicesBase },
              { locale, slug },
              getLocalizations(p)
            ),
          })
        );
      }
    }
  } catch (e) {
    console.error("[sitemap] products fetch failed:", e);
  }

  // PRACTICES (practice detail)
  try {
    for (const lng of LOCALES) {
      const practicesJson = await fetchCollection("/api/practices", lng);
      const items: any[] = practicesJson?.data ?? [];

      for (const pr of items) {
        const slug = getSlug(pr);
        const locale = getLocale(pr) as L | undefined;
        if (!slug || !locale) continue;

        const base = practicesBase[locale] || "practices";
        const loc = `${SITE}/${locale}/${base}/${slug}`;
        if (seen.has(loc)) continue;
        seen.add(loc);

        nodes.push(
          urlNode(loc, {
            lastmod: lastmodOf(pr),
            changefreq: "weekly",
            priority: 0.6,
            alternates: altsFromLocalizations(
              "practice",
              { products: productsBase, practices: practicesBase },
              { locale, slug },
              getLocalizations(pr)
            ),
          })
        );
      }
    }
  } catch (e) {
    console.error("[sitemap] practices fetch failed:", e);
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
