//app/[locale]/(marketing)/page.tsx

import { Metadata } from 'next';
import PageContent from '@/lib/shared/PageContent';
import fetchContentType from '@/lib/strapi/fetchContentType';
import { generateMetadataObject } from '@/lib/shared/metadata';
import ClientSlugHandler from './ClientSlugHandler';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {

  const pageData = await fetchContentType(
    'pages',
    {
      filters: {
        slug: "homepage",
        locale: params.locale,
      },
      populate: "seo.metaImage",
    },
    true
  );

  const seo = pageData?.seo;
  return generateMetadataObject(seo, {
    locale: params.locale as "hu" | "en" | "de",
    pathname: `/${params.locale}/`,
  });
}

export default async function HomePage({ params }: { params: { locale: string } }) {

  // ✅ eredeti fetch – deepPopulate middleware kezeli a képeket
  const pageData = await fetchContentType(
    'pages',
    {
      filters: {
        slug: "homepage",
        locale: params.locale,
      },
    },
    true
  );

  // ✅ külön fetch csak a structuredData-hoz
  const seoData = await fetchContentType(
    'pages',
    {
      filters: {
        slug: "homepage",
        locale: params.locale,
      },
      populate: "seo",
    },
    true
  );

  // ✅ seo belerakjuk a pageData-ba
  if (seoData?.seo) pageData.seo = seoData.seo;

  const localizedSlugs = pageData.localizations?.reduce(
    (acc: Record<string, string>, localization: any) => {
      acc[localization.locale] = "";
      return acc;
    },
    { [params.locale]: "" }
  );

  return <>
    <ClientSlugHandler localizedSlugs={localizedSlugs} />
    <PageContent pageData={pageData} />
  </>;
}