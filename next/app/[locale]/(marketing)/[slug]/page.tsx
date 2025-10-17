export const dynamic = 'force-dynamic'; // dinamikus Strapi fetch
export const revalidate = 0;

import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import fetchContentType from '@/lib/strapi/fetchContentType';
import PageContent from '@/lib/shared/PageContent';
import { generateMetadataObject } from '@/lib/shared/metadata';

// CSAK a privacy-ágban használjuk a ClientSlugHandler-t (a products listában saját maga van)
import ClientSlugHandler from '../ClientSlugHandler';

// ------- PRIVACY -------
import PrivacyPage, { generateMetadata as privacyMeta } from '../../privacy/page';
const PRIVACY_UID = 'privacy-policy';

// ------- PRODUCTS LISTA -------
import ProductsIndex, { generateMetadata as productsMeta } from '../products/page';
const PRODUCTS_PAGE_UID = 'product-page';

// Kisegítő: vágd le az elejéről/végéről a perjeleket
const norm = (s?: string) => (s ?? '').replace(/^\/|\/$/g, '');

// ---------- PRIVACY helpers ----------
async function getPrivacySlug(locale: string) {
  const rec: any = await fetchContentType(PRIVACY_UID, { locale }, true);
  return norm(rec?.slug || rec?.Slug || 'privacy');
}
async function getPrivacyLocalizedSlugs(locale: string) {
  const rec: any = await fetchContentType(
    PRIVACY_UID,
    { locale, populate: { localizations: true } },
    true
  );
  const map: Record<string, string> = {
    [rec?.locale || locale]: norm(rec?.slug || rec?.Slug || 'privacy'),
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
  return norm(rec?.slug || rec?.Slug || 'products'); // HU: szolgaltatasok, EN: products, DE: leistungen ...
}
async function getProductsBaseLocalized(locale: string) {
  const rec: any = await fetchContentType(
    PRODUCTS_PAGE_UID,
    { locale, populate: { localizations: true } },
    true
  );
  const map: Record<string, string> = {
    [rec?.locale || locale]: norm(rec?.slug || rec?.Slug || 'products'),
  };
  for (const l of rec?.localizations ?? []) {
    const s = norm(l?.slug || l?.Slug);
    if (s) map[l.locale] = s;
  }
  return map;
}

// ─────────────────────────────────────────────
// SEO – speciális ágak (privacy/products) + fallback "pages"
// ─────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const { locale, slug } = params;
  const s = norm(slug);

  try {
    // 1) PRIVACY – bármely nyelvi slugra reagáljon
    const privacyMap = await getPrivacyLocalizedSlugs(locale).catch(() => null);
    if (privacyMap) {
      const allPrivacySlugs = new Set(Object.values(privacyMap).map(norm));
      if (allPrivacySlugs.has(s)) {
        return await privacyMeta({ params: { locale } } as any);
      }
    }

    // 2) PRODUCTS – bármely nyelvi slugra reagáljon
    const productsMap = await getProductsBaseLocalized(locale).catch(() => null);
    if (productsMap) {
      const allProductsSlugs = new Set(Object.values(productsMap).map(norm));
      if (allProductsSlugs.has(s)) {
        return await productsMeta({ params: { locale } } as any);
      }
    }

    // 3) Fallback: sima Strapi "pages"
    const pageData = await fetchContentType(
      'pages',
      { filters: { slug: s, locale }, populate: 'seo.metaImage' },
      true
    );

    if (!pageData) return {}; // üres meta – a 404-et az oldal adja
    return generateMetadataObject(pageData?.seo);
  } catch {
    return {};
  }
}

// ─────────────────────────────────────────────
// OLDAL – speciális ágak (privacy/products) + fallback "pages"
// ─────────────────────────────────────────────
export default async function Page({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const { locale, slug } = params;
  const s = norm(slug);

  // 1) PRIVACY – bármely nyelvi slugnál működjön, és tegyünk ki locale-mapet
  const privacyMap = await getPrivacyLocalizedSlugs(locale).catch(() => null);
  if (privacyMap) {
    const allPrivacySlugs = new Set(Object.values(privacyMap).map(norm));
    if (allPrivacySlugs.has(s)) {
      return (
        <>
          <ClientSlugHandler localizedSlugs={privacyMap} />
          {await (PrivacyPage as any)({ params: { locale } })}
        </>
      );
    }
  }

  // 2) PRODUCTS – bármely nyelvi slugnál működjön
  //    A ProductsIndex komponens SAJÁT MAGA kirakja a ClientSlugHandler-t,
  //    ezért itt nem tesszük ki még egyszer.
  const productsMap = await getProductsBaseLocalized(locale).catch(() => null);
  if (productsMap) {
    const allProductsSlugs = new Set(Object.values(productsMap).map(norm));
    if (allProductsSlugs.has(s)) {
      return await (ProductsIndex as any)({ params: { locale } });
    }
  }

  // 3) Fallback: sima Strapi "pages" (ha nincs ilyen oldal → 404)
  let pageData: any = null;
  try {
    pageData = await fetchContentType(
      'pages',
      { filters: { slug: s, locale } },
      true
    );
  } catch {
    pageData = null;
  }

  if (!pageData) {
    notFound();
  }

  // localized slug map a ClientSlugHandler-hez (oldalváltás nyelvek közt)
  const localizedSlugs =
    pageData?.localizations?.reduce?.(
      (acc: Record<string, string>, l: any) => {
        if (l?.locale) acc[l.locale] = norm(l?.slug || l?.Slug || '');
        return acc;
      },
      { [locale]: s }
    ) ?? { [locale]: s };

  return (
    <>
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <PageContent pageData={pageData} />
    </>
  );
}
