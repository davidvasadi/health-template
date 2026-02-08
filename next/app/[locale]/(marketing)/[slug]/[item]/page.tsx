// app/[locale]/(marketing)/[slug]/[item]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import fetchContentType from "@/lib/strapi/fetchContentType";

// CANONICAL detail oldalak (már létezőek)
import ProductDetail, { generateMetadata as productDetailMeta } from "../../products/[slug]/page";
import PracticeDetail, { generateMetadata as practiceDetailMeta } from "../../practices/[slug]/page";

const norm = (s?: string) => (s ?? "").replace(/^\/|\/$/g, "").toLowerCase();
const get = (x: any) => x?.attributes ?? x;

const PRODUCTS_PAGE_UID_CANDIDATES = ["product-page", "products-page"] as const;
const PRACTICES_PAGE_UID_CANDIDATES = ["practice-page", "practices-page"] as const;

async function getProductsBase(locale: string) {
  for (const uid of PRODUCTS_PAGE_UID_CANDIDATES) {
    const raw: any = await fetchContentType(uid, { locale }, true, { silent: true });
    const rec = get(raw);
    const base = norm(rec?.slug || rec?.Slug || "");
    if (base) return base;
  }
  return "products";
}

async function getPracticesBase(locale: string) {
  for (const uid of PRACTICES_PAGE_UID_CANDIDATES) {
    const raw: any = await fetchContentType(uid, { locale }, true, { silent: true });
    const rec = get(raw);
    const base = norm(rec?.slug || rec?.Slug || "");
    if (base) return base;
  }
  return "practices";
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string; item: string };
}): Promise<Metadata> {
  const productsBase = await getProductsBase(params.locale);
  const practicesBase = await getPracticesBase(params.locale);

  if (norm(params.slug) === productsBase) {
    return await productDetailMeta({
      params: { locale: params.locale, slug: params.item },
    } as any);
  }

  if (norm(params.slug) === practicesBase) {
    return await practiceDetailMeta({
      params: { locale: params.locale, slug: params.item },
    } as any);
  }

  return {};
}

export default async function DispatcherPage({
  params,
}: {
  params: { locale: string; slug: string; item: string };
}) {
  const productsBase = await getProductsBase(params.locale);
  const practicesBase = await getPracticesBase(params.locale);

  if (norm(params.slug) === productsBase) {
    return await (ProductDetail as any)({
      params: { locale: params.locale, slug: params.item },
    });
  }

  if (norm(params.slug) === practicesBase) {
    return await (PracticeDetail as any)({
      params: { locale: params.locale, slug: params.item },
    });
  }

  notFound();
}
