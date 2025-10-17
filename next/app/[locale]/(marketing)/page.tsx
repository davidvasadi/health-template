// app/[locale]/(marketing)/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import PageContent from '@/lib/shared/PageContent';
import fetchContentType from '@/lib/strapi/fetchContentType';
import { generateMetadataObject } from '@/lib/shared/metadata';
import ClientSlugHandler from './ClientSlugHandler';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  try {
    const pageData = await fetchContentType(
      'pages',
      { filters: { slug: 'homepage', locale: params.locale }, populate: 'seo.metaImage' },
      true
    );
    return generateMetadataObject(pageData?.seo);
  } catch {
    return {};
  }
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  let pageData: any = null;
  try {
    pageData = await fetchContentType(
      'pages',
      { filters: { slug: 'homepage', locale: params.locale } },
      true
    );
  } catch {
    pageData = null;
  }

  if (!pageData) {
    notFound();
  }

  const localizedSlugs =
    pageData?.localizations?.reduce?.(
      (acc: Record<string, string>, localization: any) => {
        acc[localization.locale] = '';
        return acc;
      },
      { [params.locale]: '' }
    ) ?? { [params.locale]: '' };

  return (
    <>
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <PageContent pageData={pageData} />
    </>
  );
}
