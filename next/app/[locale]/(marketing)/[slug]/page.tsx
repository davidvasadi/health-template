// next/app/[locale]/(marketing)/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";

import PageContent from "@/lib/shared/PageContent";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { generateMetadataObject } from "@/lib/shared/metadata";

import { Container } from "@/components/container";
import { AmbientColor } from "@/components/decorations/ambient-color";

import ClientSlugHandler from "../ClientSlugHandler";

import PrivacyPage, { generateMetadata as privacyMeta } from "../../privacy/page";
const PRIVACY_UID = "privacy-policy";

import ProductsIndex, { generateMetadata as productsMeta } from "../products/page";
const PRODUCTS_PAGE_UID = "product-page";

import PracticesIndex, { generateMetadata as practicesMeta } from "../practices/page";
const PRACTICES_PAGE_UID_CANDIDATES = ["practices-page", "practice-page", "practices", "practice"] as const;

import { VouchersFlow } from "@/components/vouchers/vouchers-flow";
const VOUCHER_PAGE_UID = "voucher-page";
const VOUCHERS_UID = "vouchers";

const norm = (s?: string) => (s ?? "").replace(/^\/|\/$/g, "");

const SITE =
  (
    process.env.WEBSITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://csontkovacsbence.hu")
  )?.replace(/\/$/, "") || "http://localhost:3000";

const SITE_URL = (() => {
  try { return new URL(SITE); }
  catch { return new URL("http://localhost:3000"); }
})();

const getSingle = (x: any) => x?.attributes ?? x;
const getItem = (x: any) => (x?.attributes ? { id: x.id, documentId: x.documentId, ...x.attributes } : x);

function relArray(rel: any) {
  const d = rel?.data ?? rel;
  return Array.isArray(d) ? d : [];
}

const HOST_ALLOWLIST = new Set(["localhost:3000", "csontkovacsbence.hu", "www.csontkovacsbence.hu"]);

function safeAbsFromPath(pathname: string) {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE}${p}`;
}

function normalizeUrlToSite(urlStr: string) {
  try {
    const u = new URL(urlStr);
    if (!HOST_ALLOWLIST.has(u.host)) return urlStr;
    u.protocol = SITE_URL.protocol;
    u.host = SITE_URL.host;
    return u.toString();
  } catch { return urlStr; }
}

function sanitizeStructuredData(sd: any): any | null {
  if (!sd) return null;
  const walk = (v: any): any => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const out: any = {};
      for (const k of Object.keys(v)) out[k] = walk(v[k]);
      return out;
    }
    if (typeof v === "string" && /^https?:\/\//i.test(v)) return normalizeUrlToSite(v);
    return v;
  };
  try { return walk(sd); }
  catch { return sd; }
}

function sanitizeSeo(seo: any, pathname: string) {
  if (!seo) return seo;
  let out: any;
  try { out = JSON.parse(JSON.stringify(seo)); }
  catch { out = { ...seo }; }

  const key =
    "canonicalURL" in out ? "canonicalURL" :
    "canonicalUrl" in out ? "canonicalUrl" :
    "canonical" in out ? "canonical" : null;

  const computed = safeAbsFromPath(pathname);
  if (key) {
    const raw = out[key];
    out[key] = (typeof raw === "string" && raw.trim())
      ? normalizeUrlToSite(raw.trim())
      : computed;
  }
  if (out.structuredData) out.structuredData = sanitizeStructuredData(out.structuredData);
  return out;
}

// ---------- PRIVACY helpers ----------
async function getPrivacySlug(locale: string) {
  const rec: any = await fetchContentType(PRIVACY_UID, { locale }, true);
  return norm(rec?.slug || rec?.Slug || "privacy");
}
async function getPrivacyLocalizedSlugs(locale: string) {
  const rec: any = await fetchContentType(PRIVACY_UID, { locale, populate: { localizations: true } }, true);
  const map: Record<string, string> = {
    [rec?.locale || locale]: norm(rec?.slug || rec?.Slug || "privacy"),
  };
  for (const l of rec?.localizations ?? []) {
    const s = norm(l?.slug || l?.Slug);
    if (s) map[l.locale] = s;
  }
  return map;
}

// ---------- PRODUCTS helpers ----------
async function getProductsBase(locale: string) {
  const rec: any = await fetchContentType(PRODUCTS_PAGE_UID, { locale }, true);
  return norm(rec?.slug || rec?.Slug || "products");
}
async function getProductsBaseLocalized(locale: string) {
  const rec: any = await fetchContentType(PRODUCTS_PAGE_UID, { locale, populate: { localizations: true } }, true);
  const map: Record<string, string> = {
    [rec?.locale || locale]: norm(rec?.slug || rec?.Slug || "products"),
  };
  const locs = Array.isArray(rec?.localizations) ? rec.localizations : rec?.localizations?.data ?? [];
  for (const l of locs) {
    const s = norm(l?.slug || l?.Slug);
    if (s && l?.locale) map[l.locale] = s;
  }
  return map;
}

// ---------- PRACTICES helpers ----------
async function getPracticesBase(locale: string) {
  for (const uid of PRACTICES_PAGE_UID_CANDIDATES) {
    const rec: any = await fetchContentType(uid, { locale }, true, { silent: true });
    const slug = norm(rec?.slug || rec?.Slug || "");
    if (slug) return slug;
  }
  return "practices";
}
async function getPracticesBaseLocalized(locale: string) {
  for (const uid of PRACTICES_PAGE_UID_CANDIDATES) {
    const rec: any = await fetchContentType(uid, { locale, populate: { localizations: true } }, true, { silent: true });
    const base = norm(rec?.slug || rec?.Slug || "");
    if (!rec || !base) continue;
    const map: Record<string, string> = { [rec?.locale || locale]: base };
    const locs = Array.isArray(rec?.localizations) ? rec.localizations : rec?.localizations?.data ?? [];
    for (const l of locs) {
      const s = norm(l?.slug || l?.Slug);
      if (s && l?.locale) map[l.locale] = s;
    }
    return map;
  }
  return { [locale]: "practices" };
}

// ---------- VOUCHERS helpers ----------
async function getVouchersBase(locale: string) {
  const rec: any = await fetchContentType(VOUCHER_PAGE_UID, { locale }, true, { silent: true });
  return norm(rec?.slug || rec?.Slug || "vouchers") || "vouchers";
}
async function getVouchersBaseLocalized(locale: string) {
  const rec: any = await fetchContentType(VOUCHER_PAGE_UID, { locale, populate: { localizations: true } }, true, { silent: true });
  const base = norm(rec?.slug || rec?.Slug || "vouchers") || "vouchers";
  const map: Record<string, string> = { [rec?.locale || locale]: base };
  const locs = Array.isArray(rec?.localizations) ? rec.localizations : rec?.localizations?.data ?? [];
  for (const l of locs) {
    const s = norm(l?.slug || l?.Slug || "");
    if (s && l?.locale) map[l.locale] = s;
  }
  return map;
}

// ✅ Helper: Record<locale, slug> → localizedPathnames objektum
function buildLocalizedPathnames(
  slugMap: Record<string, string>,
  segment: string // pl. "" főoldalhoz, vagy az eredeti slug az url-ben
): Partial<Record<"hu" | "en" | "de", string>> {
  const result: Partial<Record<"hu" | "en" | "de", string>> = {};
  for (const [loc, slug] of Object.entries(slugMap)) {
    const path = slug ? `/${loc}/${slug}/` : `/${loc}/`;
    result[loc as "hu" | "en" | "de"] = path;
  }
  return result;
}

// ---------- SEO ----------
export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const privacySlug = await getPrivacySlug(params.locale);
  if (params.slug === privacySlug) {
    // ✅ privacy saját localizedPathnames-szel
    const localizedSlugs = await getPrivacyLocalizedSlugs(params.locale);
    const rec: any = await fetchContentType(PRIVACY_UID, { locale: params.locale, populate: { seo: { populate: "metaImage" } } }, true);
    const pathname = `/${params.locale}/${privacySlug}/`;
    return generateMetadataObject(rec?.seo, {
      locale: params.locale as "hu" | "en" | "de",
      pathname,
      localizedPathnames: buildLocalizedPathnames(localizedSlugs, privacySlug),
    });
  }

  const productsBase = await getProductsBase(params.locale);
  if (params.slug === productsBase) {
    return await productsMeta({ params: { locale: params.locale } } as any);
  }

  const practicesBase = await getPracticesBase(params.locale);
  if (params.slug === practicesBase) {
    return await practicesMeta({ params: { locale: params.locale } } as any);
  }

  // ✅ VOUCHERS – localizedPathnames bekötve
  const vouchersBase = await getVouchersBase(params.locale);
  if (params.slug === vouchersBase) {
    const [rec, localizedSlugs] = await Promise.all([
      fetchContentType(VOUCHER_PAGE_UID, { locale: params.locale, populate: { seo: { populate: "metaImage" } } }, true, { silent: true }),
      getVouchersBaseLocalized(params.locale),
    ]);
    const pathname = `/${params.locale}/${vouchersBase}/`;
    const safeSeo = sanitizeSeo(rec?.seo, pathname);
    return generateMetadataObject(safeSeo, {
      locale: params.locale as "hu" | "en" | "de",
      pathname,
      localizedPathnames: buildLocalizedPathnames(localizedSlugs, vouchersBase), // ✅
    });
  }

  // ✅ FALLBACK: sima pages – localizations populate + localizedPathnames bekötve
  const pageData = await fetchContentType(
    "pages",
    {
      filters: { slug: params.slug, locale: params.locale },
      populate: { seo: { populate: "metaImage" }, localizations: true }, // ✅ localizations hozzáadva
    },
    true
  );

  const pathname = `/${params.locale}/${params.slug}/`;
  const safeSeo = sanitizeSeo(pageData?.seo, pathname);

  // ✅ Localized slugok összegyűjtése (árak → pricing → Preise stb.)
  const localizedSlugs: Record<string, string> = {
    [params.locale]: params.slug,
  };
  for (const loc of pageData?.localizations ?? []) {
    if (loc.locale && loc.slug) localizedSlugs[loc.locale] = loc.slug;
  }

  return generateMetadataObject(safeSeo, {
    locale: params.locale as "hu" | "en" | "de",
    pathname,
    localizedPathnames: buildLocalizedPathnames(localizedSlugs, params.slug), // ✅
  });
}

// ---------- PAGE ----------
export default async function Page({ params }: { params: { locale: string; slug: string } }) {
  const privacySlug = await getPrivacySlug(params.locale);
  if (params.slug === privacySlug) {
    const localizedSlugs = await getPrivacyLocalizedSlugs(params.locale);
    return (
      <>
        <ClientSlugHandler localizedSlugs={localizedSlugs} />
        {await (PrivacyPage as any)({ params: { locale: params.locale } })}
      </>
    );
  }

  const productsBase = await getProductsBase(params.locale);
  if (params.slug === productsBase) {
    return await (ProductsIndex as any)({ params: { locale: params.locale } });
  }

  const practicesBase = await getPracticesBase(params.locale);
  if (params.slug === practicesBase) {
    const localizedSlugs = await getPracticesBaseLocalized(params.locale);
    return (
      <>
        <ClientSlugHandler localizedSlugs={localizedSlugs} />
        {await (PracticesIndex as any)({ params: { locale: params.locale } })}
      </>
    );
  }

  const vouchersBase = await getVouchersBase(params.locale);
  if (params.slug === vouchersBase) {
    const localizedSlugs = await getVouchersBaseLocalized(params.locale);

    const pageRaw: any = await fetchContentType(
      VOUCHER_PAGE_UID,
      {
        locale: params.locale,
        populate: {
          localizations: true,
          seo: { populate: "metaImage" },
          steps: true,
          button: true,
          bank_transfer: true,
          help_button: true,
          vouchers: {
            populate: {
              image: { populate: "*" },
              logo: { populate: { image: { populate: "*" } } },
              button: true,
            },
          },
        },
      },
      true
    );

    const page = getSingle(pageRaw);
    if (!page) return notFound();

    const safeStructuredData = sanitizeStructuredData(page?.seo?.structuredData);

    let vouchers = relArray(page?.vouchers).map(getItem);

    if (!vouchers.length) {
      const vouchersRes: any = await fetchContentType(
        VOUCHERS_UID,
        {
          locale: params.locale,
          populate: {
            image: { populate: "*" },
            logo: { populate: { image: { populate: "*" } } },
            button: true,
          },
        },
        false
      );
      vouchers = (vouchersRes?.data ?? []).map(getItem);
    }

    return (
      <div className="relative overflow-hidden w-full">
        <ClientSlugHandler localizedSlugs={localizedSlugs} />
        {safeStructuredData ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(safeStructuredData) }}
          />
        ) : null}
        <AmbientColor />
        <Container className="pb-16 pt-32 md:pt-40">
          <VouchersFlow page={page} vouchers={vouchers} locale={params.locale} />
        </Container>
      </div>
    );
  }

  // fallback: sima pages
  const pageData = await fetchContentType("pages", { filters: { slug: params.slug, locale: params.locale } }, true);
  if (!pageData) return notFound();

  const localizedSlugs =
    pageData?.localizations?.reduce?.(
      (acc: Record<string, string>, l: any) => {
        acc[l.locale] = l.slug;
        return acc;
      },
      { [params.locale]: params.slug }
    ) ?? { [params.locale]: params.slug };

  return (
    <>
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <PageContent pageData={pageData} />
    </>
  );
}