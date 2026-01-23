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

/**
 * Base slug map a nyelvváltóhoz (mint practices-nél):
 * { hu: "szolgaltatasok", en: "products", de: "leistungen" }
 */
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
  const base = await getProductsBase(params.locale);

  const pageData = await fetchContentType(
    PRODUCTS_UID,
    { filters: { slug: params.slug, locale: params.locale }, populate: "seo.metaImage" },
    true
  );

  return generateMetadataObject(pageData?.seo, {
    locale: params.locale as "hu" | "en" | "de",
    pathname: `/${params.locale}/${base}/${params.slug}`,
  });
}

export default async function SingleProductPage({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  // ✅ Mint practices detail: a detail oldalon is beállítjuk a base map-et
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
    // ha nincs ilyen termék ezen a nyelven -> listaoldal
    redirect(`/${params.locale}/${base}`);
  }

  return (
    <div className="relative overflow-hidden w-full">
      {/* ✅ nyelvváltáskor innen a LISTA oldalra fog menni az adott nyelven */}
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
