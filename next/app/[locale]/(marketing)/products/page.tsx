// next/app/[locale]/(marketing)/products/page.tsx
import { Metadata } from "next";

import { AmbientColor } from "@/components/decorations/ambient-color";
import { Container } from "@/components/container";
import { Featured } from "@/components/products/featured";
import { ProductItems } from "@/components/products/product-items";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { generateMetadataObject } from "@/lib/shared/metadata";
import ClientSlugHandler from "../ClientSlugHandler";

const norm = (s?: string) => (s ?? "").replace(/^\/|\/$/g, "").toLowerCase();
const get = (x: any) => x?.attributes ?? x;
function relArray(rel: any) {
  const d = rel?.data ?? rel;
  return Array.isArray(d) ? d : [];
}

const PRODUCTS_UID = "products";
const PRODUCTS_PAGE_UID_CANDIDATES = ["product-page", "products-page"] as const;

// ugyanaz a minta, mint practices-nél: candidates + v4/v5 localizations normalize
async function getProductsPageSingle(locale: string) {
  for (const uid of PRODUCTS_PAGE_UID_CANDIDATES) {
    const raw = await fetchContentType(
      uid,
      {
        locale,
        populate: {
          localizations: true,
          seo: { populate: "metaImage" },
        },
      },
      true,
      { silent: true }
    );

    const rec = get(raw);
    if (rec && (rec.slug || rec.seo || rec.localizations)) return { uid, rec };
  }
  return { uid: null as any, rec: null as any };
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { rec } = await getProductsPageSingle(params.locale);

  const baseSlug = norm(rec?.slug || rec?.Slug || "products");

  return generateMetadataObject(rec?.seo, {
    locale: params.locale as "hu" | "en" | "de",
    pathname: `/${params.locale}/${baseSlug}`,
  });
}

export default async function Products({ params }: { params: { locale: string } }) {
  const { rec } = await getProductsPageSingle(params.locale);
  const productPage = get(rec);

  const baseSlug = norm(productPage?.slug || productPage?.Slug || "products");

  // termékek listája
  const productsRes = await fetchContentType(
    PRODUCTS_UID,
    { locale: params.locale, populate: { images: { populate: "*" } } },
    false
  );
  const products = (productsRes?.data ?? []).map(get);

  // localized base slugs a nyelvváltóhoz – STRAPI v4/v5 kompatibilis
  const localizedSlugs: Record<string, string> = {
    [productPage?.locale || params.locale]: baseSlug,
  };

  for (const loc of relArray(productPage?.localizations).map(get)) {
    const s = norm(loc?.slug || loc?.Slug);
    if (s && loc?.locale) localizedSlugs[loc.locale] = s;
  }

  const featured = products.filter((p: any) => !!p?.featured);

  return (
    <div className="relative overflow-hidden w-full">
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <AmbientColor />
      <Container className="pt-40 pb-40">
<Featured products={featured} locale={params.locale} baseSlug={baseSlug} />
<ProductItems products={productsRes?.data} locale={params.locale} baseSlug={baseSlug} />

      </Container>
    </div>
  );
}
