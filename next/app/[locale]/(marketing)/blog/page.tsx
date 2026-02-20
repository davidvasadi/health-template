// next/app/[locale]/(marketing)/blog/page.tsx
import { type Metadata } from "next";

import { Container } from "@/components/container";
import { Heading } from "@/components/elements/heading";
import { Subheading } from "@/components/elements/subheading";
import { BlogCard } from "@/components/blog-card";
import { FeatureIconContainer } from "@/components/dynamic-zone/features/feature-icon-container";
import { IconClipboardText } from "@tabler/icons-react";
import { BlogPostRows } from "@/components/blog-post-rows";
import { AmbientColor } from "@/components/decorations/ambient-color";
import DynamicZoneManager from "@/components/dynamic-zone/manager";

import fetchContentType from "@/lib/strapi/fetchContentType";
import { Article } from "@/types/types";
import { generateMetadataObject } from "@/lib/shared/metadata";

import ClientSlugHandler from "../ClientSlugHandler";

const norm = (s?: string) => (s ?? "").replace(/^\/|\/$/g, "");

// v4/v5 normalize helper
const get = (x: any) => x?.attributes ?? x;

/** relation normalize: { data: [...] } or [...] */
function relArray(rel: any) {
  const d = rel?.data ?? rel;
  return Array.isArray(d) ? d : [];
}

async function getBlogPageSingle(locale: string) {
  const raw = await fetchContentType(
    "blog-page",
    {
      locale,
      populate: {
        localizations: true,
        seo: { populate: "metaImage" },
        dynamic_zone: { populate: "*" },
      },
    },
    true
  );

  return get(raw);
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const blogPage = await getBlogPageSingle(params.locale);
  const seo = blogPage?.seo;

  return generateMetadataObject(seo, {
    locale: params.locale as "hu" | "en" | "de",
    pathname: `/${params.locale}/blog`,
  });
}

export default async function Blog({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const blogPageRaw = await getBlogPageSingle(params.locale);
  const blogPage = get(blogPageRaw);

  const articlesRes = await fetchContentType(
    "articles",
    {
      locale: params.locale,
    },
    false
  );

  const articles = relArray(articlesRes?.data).map(get) as Article[];

  const baseSlug = norm(blogPage?.slug || blogPage?.Slug || "blog");

  const localizedSlugs: Record<string, string> = {
    [blogPage?.locale || params.locale]: baseSlug,
  };

  for (const loc of relArray(blogPage?.localizations).map(get)) {
    const s = norm(loc?.slug || loc?.Slug || "blog");
    localizedSlugs[loc.locale] = s;
  }

  // ✅ Blog page DZ mező: dynamic_zone
  const dynamicZone = Array.isArray(blogPage?.dynamic_zone)
    ? blogPage.dynamic_zone
    : [];

  return (
    // ✅ csak X-en rejtsünk (ne legyen jobbra-balra húzható), de ne vágjuk le a CTA háttereket
    <div className="relative overflow-x-hidden py-20 md:py-0">
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <AmbientColor />

      {/* ✅ A BLOG LISTA MARAD Container-ben */}
      <Container className="pb-20">
        <div className="flex flex-col items-center">
          <div className="relative z-20 py-10 md:pt-40">
            <FeatureIconContainer className="flex justify-center items-center overflow-hidden">
              <IconClipboardText className="h-6 w-6 text-breaker-bay-700" />
            </FeatureIconContainer>

            <Heading as="h1" className="mt-4 text-breaker-bay-950">
              {blogPage?.heading}
            </Heading>

            <Subheading className="max-w-3xl mx-auto text-breaker-bay-950">
              {blogPage?.sub_heading}
            </Subheading>
          </div>

          {articles.slice(0, 1).map((article: Article) => (
            <BlogCard
              article={article}
              locale={params.locale}
              key={(article as any)?.title}
            />
          ))}

          <BlogPostRows articles={articles} />
        </div>
      </Container>

      {/* ✅ DZ KINT VAN A Container-ből, full-bleed, de viewport szélességre clampelve */}
      <div className="relative w-full overflow-x-hidden">
        <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-visible">
          <DynamicZoneManager dynamicZone={dynamicZone} locale={params.locale} />
        </div>
      </div>
    </div>
  );
}
