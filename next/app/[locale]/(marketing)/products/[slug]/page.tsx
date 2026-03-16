// next/app/[locale]/(marketing)/products/[slug]/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/container";
import { AmbientColor } from "@/components/decorations/ambient-color";
import { SingleProduct } from "@/components/products/single-product";
import DynamicZoneManager from "@/components/dynamic-zone/manager";
import { generateMetadataObject } from "@/lib/shared/metadata";
import fetchContentType from "@/lib/strapi/fetchContentType";
import ClientSlugHandler from "../../ClientSlugHandler";

const norm = (s?: string) => (s ?? "").replace(/^\/|\/$/g, "").toLowerCase();
const get = (x: any) => x?.attributes ?? x;

function relArray(rel: any) {
  const d = rel?.data ?? rel;
  return Array.isArray(d) ? d : [];
}

const PRODUCTS_UID = "products";
const PRODUCTS_PAGE_UID_CANDIDATES = ["product-page", "products-page"] as const;

async function getProductsBaseLocalized(locale: string) {
  for (const uid of PRODUCTS_PAGE_UID_CANDIDATES) {
    const recRaw: any = await fetchContentType(
      uid,
      { locale, populate: { localizations: true } },
      true,
      { silent: true }
    );

    const rec = get(recRaw);
    const base = norm(rec?.slug || rec?.Slug || "");
    if (!rec || !base) continue;

    const map: Record<string, string> = { [rec?.locale || locale]: base };

    for (const lraw of relArray(rec?.localizations).map(get)) {
      const s = norm(lraw?.slug || lraw?.Slug || "");
      if (s && lraw?.locale) map[lraw.locale] = s;
    }

    return map;
  }

  return { [locale]: "products" };
}

async function getProductsBase(locale: string) {
  const map = await getProductsBaseLocalized(locale);
  return norm(map[locale] || "products") || "products";
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const baseMap = await getProductsBaseLocalized(params.locale);
  const base = norm(baseMap[params.locale] || "products") || "products";

  const pageData = await fetchContentType(
    PRODUCTS_UID,
    { filters: { slug: params.slug, locale: params.locale }, populate: "seo.metaImage" },
    true
  );

  // ✅ product detail: csak az aktuális locale (nincs keresztfordítás)
  const localizedPathnames: Partial<Record<"hu" | "en" | "de", string>> = {
    [params.locale]: `/${params.locale}/${base}/${params.slug}/`,
  };

  return generateMetadataObject(pageData?.seo, {
    locale: params.locale as "hu" | "en" | "de",
    pathname: `/${params.locale}/${base}/${params.slug}/`,
    localizedPathnames, // ✅
  });
}

export default async function SingleProductPage({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const baseMap = await getProductsBaseLocalized(params.locale);
  const base = norm(baseMap[params.locale] || "products") || "products";

  const product = await fetchContentType(
    PRODUCTS_UID,
    {
      filters: { slug: params.slug, locale: params.locale },
      populate: {
        images: { populate: "*" },
        seo: { populate: "metaImage" },
        dynamic_zone: { populate: "*" },
        button: true,
      },
    },
    true
  );

  if (!product) {
    redirect(`/${params.locale}/${base}`);
  }

  return (
    <div className="relative overflow-hidden w-full">
      {/* ✅ nyelvváltáskor a LISTA oldalra visz az adott nyelven */}
      <ClientSlugHandler localizedSlugs={{ [params.locale]: base }} />
      <AmbientColor />
      <Container className="py-20 md:py-40">
        <SingleProduct product={product} />
        {product?.dynamic_zone && (
          <DynamicZoneManager dynamicZone={product.dynamic_zone} locale={params.locale} />
        )}
      </Container>
    </div>
  );
}