// app/[locale]/(marketing)/blog/[slug]/page.tsx
import React from "react";
import { Metadata } from "next";

import { BlogLayout } from "@/components/blog-layout";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { generateMetadataObject } from "@/lib/shared/metadata";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";

import ClientSlugHandler from "../../ClientSlugHandler";

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}): Promise<Metadata> {
  const article = await fetchContentType(
    "articles",
    {
      filters: { slug: params.slug, locale: params.locale },
      populate: "seo.metaImage",
    },
    true
  );

  const localizedPathnames: Partial<Record<"hu" | "en" | "de", string>> = {
    [params.locale]: `/${params.locale}/blog/${params.slug}/`,
  };

  for (const loc of article?.localizations ?? []) {
    if (loc.locale && loc.slug) {
      localizedPathnames[loc.locale as "hu" | "en" | "de"] =
        `/${loc.locale}/blog/${loc.slug}/`;
    }
  }

  return generateMetadataObject(article?.seo, {
    locale: params.locale as "hu" | "en" | "de",
    pathname: `/${params.locale}/blog/${params.slug}/`,
    localizedPathnames,
  });
}

export default async function SingleArticlePage({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const article = await fetchContentType(
    "articles",
    {
      filters: {
        slug: params.slug,
        locale: params.locale,
      },
      populate: "seo", // ✅ seo populate hozzáadva
    },
    true,
  );

  if (!article) {
    return <div>Blog not found</div>;
  }

  const localizedSlugs = article.localizations?.reduce(
    (acc: Record<string, string>, localization: any) => {
      acc[localization.locale] = localization.slug;
      return acc;
    },
    { [params.locale]: params.slug }
  );

  // ✅ structured data a cikk seo mezőjéből
  const structuredData = article?.seo?.structuredData ?? null;

  return (
    <BlogLayout article={article} locale={params.locale}>
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      {/* ✅ structured data hozzáadva */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <BlocksRenderer content={article.content} />
    </BlogLayout>
  );
}