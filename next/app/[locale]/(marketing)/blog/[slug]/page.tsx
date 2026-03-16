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

  return generateMetadataObject(article?.seo, {
    locale: params.locale as "hu" | "en" | "de",
    pathname: `/${params.locale}/blog/${params.slug}`,
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

  return (
    <BlogLayout article={article} locale={params.locale}>
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <BlocksRenderer content={article.content} />
    </BlogLayout>
  );
}