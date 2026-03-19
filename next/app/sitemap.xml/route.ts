// app/sitemap.xml/route.ts
import qs from "qs";

export const revalidate = 600;

const SITE = (
  process.env.WEBSITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://theplacestudio.hu")
).replace(/\/+$/, "");

const STRAPI_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  process.env.STRAPI_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:1337" : SITE)
).replace(/\/+$/, "").replace(/\/api\/?$/, "");

type L = "hu" | "de" | "en";
const LOCALES: L[] = ["hu", "de", "en"];

const siteUrl = (path: string) =>
  `${SITE}/${path}`.replace(/([^:])\/\/+/g, "$1/").replace(/\/$/, "");

function validToken(): string | null {
  const t = process.env.STRAPI_TOKEN ?? "";
  return t && !/PASTE_YOUR_API_TOKEN/i.test(t) && t.length >= 20 ? t : null;
}

async function sFetch(path: string, params: Record<string, unknown>) {
  const endpoint = `${STRAPI_ORIGIN}/api/${path.replace(/^\/+|^api\/+/, "")}?${qs.stringify(
    { publicationState: "live", ...params },
    { encodeValuesOnly: true }
  )}`;

  const token = validToken();

  if (token) {
    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
      ...({ next: { revalidate } } as object),
    });
    if (res.ok) return res.json();
    if (res.status !== 401) throw new Error(`Strapi ${res.status} → ${endpoint}`);
  }

  const res = await fetch(endpoint, {
    ...({ next: { revalidate } } as object),
  });
  if (!res.ok) throw new Error(`Strapi ${res.status} → ${endpoint}`);
  return res.json();
}

const getAttrs = (x: unknown) => (x as any)?.attributes ?? (x as any) ?? {};
const getSlug = (x: unknown): string | undefined => {
  const a = getAttrs(x);
  return (a?.slug ?? a?.Slug)?.replace(/^\/|\/$/g, "");
};
const getLocale = (x: unknown): L | undefined => getAttrs(x)?.locale;
const getUpdatedAt = (x: unknown): string | undefined =>
  getAttrs(x)?.updatedAt ?? getAttrs(x)?.publishedAt;
const getLocalizations = (x: unknown): unknown[] => {
  const l = getAttrs(x)?.localizations;
  const arr = l?.data ?? l;
  return Array.isArray(arr) ? arr : [];
};
function lastmod(item: unknown) {
  return new Date(getUpdatedAt(item) ?? Date.now()).toISOString();
}

// product-page: mezőnév "Slug" (nagy S) – ez a Strapi sémában így van definiálva
async function fetchProductPageSlugs(): Promise<Partial<Record<L, string>>> {
  const map: Partial<Record<L, string>> = {};
  try {
    const json = await sFetch("product-page", {
      fields: ["Slug", "locale"],
      populate: { localizations: { fields: ["Slug", "locale"] } },
      locale: "hu",
    });
    const root = Array.isArray(json?.data) ? json.data[0] : json?.data;
    if (!root) return map;
    const rootLocale = getLocale(root);
    const rootSlug = getSlug(root);
    if (rootLocale && rootSlug) map[rootLocale] = rootSlug;
    for (const l of getLocalizations(root).map(getAttrs)) {
      const lng = l?.locale as L | undefined;
      const s = (l?.Slug ?? l?.slug)?.replace(/^\/|\/$/g, "") as string | undefined;
      if (lng && s) map[lng] = s;
    }
  } catch {
    // ha Strapi nem válaszol, üres map
  }
  return map;
}

// practice-page és voucher-page: mezőnév "slug" (kis s)
async function fetchSingletonSlugs(apiPath: string): Promise<Partial<Record<L, string>>> {
  const map: Partial<Record<L, string>> = {};
  try {
    const json = await sFetch(apiPath, {
      fields: ["slug", "locale"],
      populate: { localizations: { fields: ["slug", "locale"] } },
      locale: "hu",
    });
    const root = Array.isArray(json?.data) ? json.data[0] : json?.data;
    if (!root) return map;
    const rootLocale = getLocale(root);
    const rootSlug = getSlug(root);
    if (rootLocale && rootSlug) map[rootLocale] = rootSlug;
    for (const l of getLocalizations(root).map(getAttrs)) {
      const lng = l?.locale as L | undefined;
      const s = l?.slug?.replace(/^\/|\/$/g, "") as string | undefined;
      if (lng && s) map[lng] = s;
    }
  } catch {
    // ha Strapi nem válaszol, üres map
  }
  return map;
}

async function fetchCollection(apiPath: string, lng: L) {
  return sFetch(apiPath, {
    locale: lng,
    "pagination[pageSize]": 1000,
    sort: ["updatedAt:desc"],
    fields: ["slug", "locale", "updatedAt", "publishedAt"],
    populate: { localizations: { fields: ["slug", "locale"] } },
  });
}

function dedupeAlts(list: { hreflang: string; href: string }[]) {
  const seen = new Set<string>();
  return list.filter(({ hreflang }) =>
    seen.has(hreflang) ? false : (seen.add(hreflang), true)
  );
}

function urlNode(loc: string, opts: {
  lastmod?: string;
  changefreq?: string;
  priority?: number;
  alternates?: { hreflang: string; href: string }[];
}) {
  const alts = (opts.alternates ?? [])
    .map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`)
    .join("");
  return `<url>
<loc>${loc}</loc>
${alts}
${opts.lastmod ? `<lastmod>${opts.lastmod}</lastmod>` : ""}
${opts.changefreq ? `<changefreq>${opts.changefreq}</changefreq>` : ""}
${typeof opts.priority === "number" ? `<priority>${opts.priority}</priority>` : ""}
</url>`;
}

export async function GET() {
  const nodes: string[] = [];
  const seen = new Set<string>();

  const add = (loc: string, opts: Parameters<typeof urlNode>[1]) => {
    if (seen.has(loc)) return;
    seen.add(loc);
    nodes.push(urlNode(loc, opts));
  };

  const [productsBase, practicesBase, vouchersBase] = await Promise.all([
    fetchProductPageSlugs(),
    fetchSingletonSlugs("practice-page"),
    fetchSingletonSlugs("voucher-page"),
  ]);

  // ── HOME ──────────────────────────────────────────────────────────────
  const homeAlts = dedupeAlts([
    ...LOCALES.map((lng) => ({ hreflang: lng, href: siteUrl(lng) })),
    { hreflang: "x-default", href: siteUrl("hu") },
  ]);
  for (const lng of LOCALES) {
    add(siteUrl(lng), { lastmod: new Date().toISOString(), changefreq: "weekly", priority: 1, alternates: homeAlts });
  }

  // ── INDEX OLDALAK ─────────────────────────────────────────────────────
  for (const lng of LOCALES) {
    // Blog
    add(siteUrl(`${lng}/blog`), {
      lastmod: new Date().toISOString(), changefreq: "weekly", priority: 0.8,
      alternates: dedupeAlts([
        ...LOCALES.map((l) => ({ hreflang: l, href: siteUrl(`${l}/blog`) })),
        { hreflang: "x-default", href: siteUrl("hu/blog") },
      ]),
    });

    // Szolgáltatások
    const productSlug = productsBase[lng];
    if (productSlug) {
      add(siteUrl(`${lng}/${productSlug}`), {
        lastmod: new Date().toISOString(), changefreq: "weekly", priority: 0.8,
        alternates: dedupeAlts([
          ...LOCALES.filter((l) => productsBase[l]).map((l) => ({ hreflang: l, href: siteUrl(`${l}/${productsBase[l]}`) })),
          { hreflang: "x-default", href: siteUrl(`hu/${productsBase.hu}`) },
        ]),
      });
    }

    // Gyakorlatok
    const practiceSlug = practicesBase[lng];
    if (practiceSlug) {
      add(siteUrl(`${lng}/${practiceSlug}`), {
        lastmod: new Date().toISOString(), changefreq: "weekly", priority: 0.8,
        alternates: dedupeAlts([
          ...LOCALES.filter((l) => practicesBase[l]).map((l) => ({ hreflang: l, href: siteUrl(`${l}/${practicesBase[l]}`) })),
          { hreflang: "x-default", href: siteUrl(`hu/${practicesBase.hu}`) },
        ]),
      });
    }

    // Vouchers
    const voucherSlug = vouchersBase[lng];
    if (voucherSlug) {
      add(siteUrl(`${lng}/${voucherSlug}`), {
        lastmod: new Date().toISOString(), changefreq: "monthly", priority: 0.7,
        alternates: dedupeAlts([
          ...LOCALES.filter((l) => vouchersBase[l]).map((l) => ({ hreflang: l, href: siteUrl(`${l}/${vouchersBase[l]}`) })),
          { hreflang: "x-default", href: siteUrl(`hu/${vouchersBase.hu}`) },
        ]),
      });
    }
  }

  // ── PAGES ─────────────────────────────────────────────────────────────
  const singletonSlugs = new Set([
    ...Object.values(productsBase),
    ...Object.values(practicesBase),
    ...Object.values(vouchersBase),
  ]);

  try {
    for (const lng of LOCALES) {
      const items: unknown[] = (await fetchCollection("pages", lng))?.data ?? [];
      for (const item of items) {
        const s = getSlug(item);
        const l = getLocale(item);
        if (!s || !l) continue;
        if (["home", "homepage", "kezdooldal"].includes(s.toLowerCase())) continue;
        if (singletonSlugs.has(s)) continue;

        const loc = siteUrl(`${l}/${s}`);
        const isKey = ["contact", "kapcsolat", "pricing", "arak", "gyik", "faq",
                       "kontakt", "preise", "contact-us", "team", "csapat"].includes(s.toLowerCase());
        const locs = getLocalizations(item).map(getAttrs).filter((x) => x?.locale && x?.slug);
        const huSlug = locs.find((x) => x.locale === "hu")?.slug ?? s;

        add(loc, {
          lastmod: lastmod(item),
          changefreq: isKey ? "monthly" : "weekly",
          priority: isKey ? 0.7 : 0.6,
          alternates: dedupeAlts([
            { hreflang: l, href: siteUrl(`${l}/${s}`) },
            ...locs.map((x) => ({ hreflang: x.locale, href: siteUrl(`${x.locale}/${x.slug}`) })),
            { hreflang: "x-default", href: siteUrl(`hu/${huSlug}`) },
          ]),
        });
      }
    }
  } catch (e) {
    console.error("[sitemap] pages:", e);
  }

  // ── ARTICLES ──────────────────────────────────────────────────────────
  try {
    for (const lng of LOCALES) {
      const items: unknown[] = (await fetchCollection("articles", lng))?.data ?? [];
      for (const item of items) {
        const s = getSlug(item);
        const l = getLocale(item);
        if (!s || !l) continue;
        const loc = siteUrl(`${l}/blog/${s}`);
        const locs = getLocalizations(item).map(getAttrs).filter((x) => x?.locale && x?.slug);
        const huSlug = locs.find((x) => x.locale === "hu")?.slug ?? s;
        add(loc, {
          lastmod: lastmod(item), changefreq: "weekly", priority: 0.6,
          alternates: dedupeAlts([
            { hreflang: l, href: siteUrl(`${l}/blog/${s}`) },
            ...locs.map((x) => ({ hreflang: x.locale, href: siteUrl(`${x.locale}/blog/${x.slug}`) })),
            { hreflang: "x-default", href: siteUrl(`hu/blog/${huSlug}`) },
          ]),
        });
      }
    }
  } catch (e) {
    console.error("[sitemap] articles:", e);
  }

  // ── PRODUCTS ──────────────────────────────────────────────────────────
  try {
    for (const lng of LOCALES) {
      const base = productsBase[lng];
      if (!base) continue;
      const items: unknown[] = (await fetchCollection("products", lng))?.data ?? [];
      for (const item of items) {
        const s = getSlug(item);
        const l = getLocale(item);
        if (!s || !l) continue;
        const loc = siteUrl(`${l}/${base}/${s}`);
        const locs = getLocalizations(item).map(getAttrs).filter((x) => x?.locale && x?.slug);
        const huSlug = locs.find((x) => x.locale === "hu")?.slug ?? s;
        add(loc, {
          lastmod: lastmod(item), changefreq: "weekly", priority: 0.6,
          alternates: dedupeAlts([
            { hreflang: l, href: siteUrl(`${l}/${base}/${s}`) },
            ...locs.map((x) => ({
              hreflang: x.locale,
              href: siteUrl(`${x.locale}/${productsBase[x.locale as L] ?? base}/${x.slug}`),
            })),
            { hreflang: "x-default", href: siteUrl(`hu/${productsBase.hu}/${huSlug}`) },
          ]),
        });
      }
    }
  } catch (e) {
    console.error("[sitemap] products:", e);
  }

  // ── PRACTICES ─────────────────────────────────────────────────────────
  try {
    for (const lng of LOCALES) {
      const base = practicesBase[lng];
      if (!base) continue;
      const items: unknown[] = (await fetchCollection("practices", lng))?.data ?? [];
      for (const item of items) {
        const s = getSlug(item);
        const l = getLocale(item);
        if (!s || !l) continue;
        const loc = siteUrl(`${l}/${base}/${s}`);
        const locs = getLocalizations(item).map(getAttrs).filter((x) => x?.locale && x?.slug);
        const huSlug = locs.find((x) => x.locale === "hu")?.slug ?? s;
        add(loc, {
          lastmod: lastmod(item), changefreq: "weekly", priority: 0.6,
          alternates: dedupeAlts([
            { hreflang: l, href: siteUrl(`${l}/${base}/${s}`) },
            ...locs.map((x) => ({
              hreflang: x.locale,
              href: siteUrl(`${x.locale}/${practicesBase[x.locale as L] ?? base}/${x.slug}`),
            })),
            { hreflang: "x-default", href: siteUrl(`hu/${practicesBase.hu}/${huSlug}`) },
          ]),
        });
      }
    }
  } catch (e) {
    console.error("[sitemap] practices:", e);
  }

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${nodes.join("\n")}\n</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    }
  );
}
