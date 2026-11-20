// app/[locale]/(marketing)/blog/[slug]/page.tsx
import React from "react";
// kódkiemelés a cikkekben lévő kódrészletekhez — csak itt kell (korábban a globals.css minden oldalra betöltötte)
import "@/app/prism.css";
import { cleanStructuredData } from "@/lib/shared/structured-data";
import { Metadata } from "next";
import { notFound } from "next/navigation";

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
      populate: {
  seo: {
    populate: ["metaImage"],
  },
  image: true,
  dynamic_zone: {
    on: {
      "dynamic-zone.related-articles": {
        populate: {
          articles: {
            populate: ["image", "categories"],
          },
        },
      },
    },
  },
},
    },
    true,
  );
  // nem létező cikk → valódi 404 (korábban 200-as „Blog not found” szöveg ment ki — a Google ezt soft 404-nek veszi)
  if (!article) notFound();

  const localizedSlugs = article.localizations?.reduce(
    (acc: Record<string, string>, localization: any) => {
      acc[localization.locale] = localization.slug;
      return acc;
    },
    { [params.locale]: params.slug }
  );

  // ✅ structured data a cikk seo mezőjéből
  // a cég-blokkot a layout adja (központi, részletes), a Strapi-s változatot kiszűrjük
  const structuredData = cleanStructuredData(article?.seo?.structuredData);

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