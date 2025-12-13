// next/app/[locale]/(marketing)/products/page.tsx
import { Metadata } from 'next';

import { AmbientColor } from "@/components/decorations/ambient-color";
import { Container } from "@/components/container";
import { Featured } from "@/components/products/featured";
import { ProductItems } from "@/components/products/product-items";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { generateMetadataObject } from '@/lib/shared/metadata';
import ClientSlugHandler from '../ClientSlugHandler';

const norm = (s?: string) => (s ?? '').replace(/^\/|\/$/g, '');

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const pageData = await fetchContentType(
    "product-page",
    { filters: { locale: params.locale }, populate: "seo.metaImage" },
    true
  );
return generateMetadataObject(pageData?.seo, {
  locale: params.locale as "hu" | "en" | "de",
  pathname: `/${params.locale}/${pageData?.slug || "products"}`,
});
}

export default async function Products({ params }: { params: { locale: string } }) {
  // base slug + lokalizációk a NYELVVÁLTÓHOZ (NINCS fields=)
  const productPage = await fetchContentType(
    'product-page',
    { filters: { locale: params.locale }, populate: { localizations: true } },
    true
  );

  // termékek listája
  const products = await fetchContentType(
    'products',
    { filters: { locale: params.locale }, populate: { images: { populate: '*' } } },
    false
  );

  // lokalizált base slugs
  const localizedSlugs: Record<string, string> = {
    [productPage?.locale || params.locale]: norm(productPage?.slug || productPage?.Slug || 'products'),
  };
  for (const loc of productPage?.localizations ?? []) {
    const s = norm(loc?.slug || loc?.Slug);
    if (s) localizedSlugs[loc.locale] = s;
  }

  const featured = products?.data?.filter((p: { featured: boolean }) => p.featured);

  return (
    <div className="relative overflow-hidden w-full">
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <AmbientColor />
      <Container className="pt-40 pb-40">
        <Featured products={featured} locale={params.locale} />
        <ProductItems products={products?.data} locale={params.locale} />
      </Container>
    </div>
  );
}
