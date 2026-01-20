// next/app/[locale]/(marketing)/[slug]/page.tsx
import { Metadata } from "next";
import PageContent from "@/lib/shared/PageContent";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { generateMetadataObject } from "@/lib/shared/metadata";

// CSAK a privacy-ágban használjuk a ClientSlugHandler-t (a products listában bent van saját maga)
import ClientSlugHandler from "../ClientSlugHandler";

// PRIVACY
import PrivacyPage, { generateMetadata as privacyMeta } from "../../privacy/page";
const PRIVACY_UID = "privacy-policy";

// PRODUCTS LISTA (DELEGÁLÁS a listaoldalhoz)
import ProductsIndex, { generateMetadata as productsMeta } from "../products/page";
const PRODUCTS_PAGE_UID = "product-page";

// ✅ PRACTICES LISTA (DELEGÁLÁS a listaoldalhoz)
import PracticesIndex, { generateMetadata as practicesMeta } from "../practices/page";
const PRACTICES_PAGE_UID_CANDIDATES = ["practices-page", "practice-page", "practices", "practice"] as const;

const norm = (s?: string) => (s ?? "").replace(/^\/|\/$/g, "");

// ---------- PRIVACY helpers (NINCS fields=, csak populate ha kell) ----------
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

// ---------- PRODUCTS LISTA helpers (NINCS fields=, csak populate ha kell) ----------
async function getProductsBase(locale: string) {
  const rec: any = await fetchContentType(PRODUCTS_PAGE_UID, { locale }, true);
  return norm(rec?.slug || rec?.Slug || "products"); // HU: szolgaltatasok, EN: products
}
async function getProductsBaseLocalized(locale: string) {
  const rec: any = await fetchContentType(PRODUCTS_PAGE_UID, { locale, populate: { localizations: true } }, true);
  const map: Record<string, string> = {
    [rec?.locale || locale]: norm(rec?.slug || rec?.Slug || "products"),
  };
  for (const l of rec?.localizations ?? []) {
    const s = norm(l?.slug || l?.Slug);
    if (s) map[l.locale] = s;
  }
  return map;
}

// ✅ ---------- PRACTICES LISTA helpers (candidates + lokalizációk) ----------
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
    const rec: any = await fetchContentType(
      uid,
      { locale, populate: { localizations: true } },
      true,
      { silent: true }
    );

    const base = norm(rec?.slug || rec?.Slug || "");
    if (!rec || !base) continue;

    const map: Record<string, string> = { [rec?.locale || locale]: base };
    for (const l of rec?.localizations ?? []) {
      const s = norm(l?.slug || l?.Slug);
      if (s) map[l.locale] = s;
    }
    return map;
  }
  return { [locale]: "practices" };
}


// ---------- SEO ----------
export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const privacySlug = await getPrivacySlug(params.locale);
  if (params.slug === privacySlug) {
    return await privacyMeta();
  }

  const productsBase = await getProductsBase(params.locale);
  if (params.slug === productsBase) {
    return await productsMeta({ params: { locale: params.locale } } as any);
  }

  // ✅ PRACTICES SEO delegálás
  const practicesBase = await getPracticesBase(params.locale);
  if (params.slug === practicesBase) {
    return await practicesMeta({ params: { locale: params.locale } } as any);
  }

  // fallback: sima pages
  const pageData = await fetchContentType(
    "pages",
    { filters: { slug: params.slug, locale: params.locale }, populate: "seo.metaImage" },
    true
  );

  return generateMetadataObject(pageData?.seo, {
    locale: params.locale as "hu" | "en" | "de",
    pathname: `/${params.locale}/${params.slug}`,
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
    // FIGYELEM: a ProductsIndex SAJÁT MAGA kirakja a ClientSlugHandler-t
    return await (ProductsIndex as any)({ params: { locale: params.locale } });
  }

  // ✅ PRACTICES delegálás + slug map a nyelvváltóhoz
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

  // fallback: sima pages
  const pageData = await fetchContentType(
    "pages",
    { filters: { slug: params.slug, locale: params.locale } },
    true
  );

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
