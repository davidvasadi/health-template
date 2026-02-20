// next/app/[locale]/(marketing)/practices/page.tsx
import { Metadata } from "next";

import { Container } from "@/components/container";
import { AmbientColor } from "@/components/decorations/ambient-color";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { generateMetadataObject } from "@/lib/shared/metadata";
import ClientSlugHandler from "../ClientSlugHandler";
import { PracticeItems } from "@/components/practices/practice-items";

import DynamicZoneManager from "@/components/dynamic-zone/manager";

const norm = (s?: string) => (s ?? "").replace(/^\/|\/$/g, "");

// v4/v5 normalize helper
const get = (x: any) => x?.attributes ?? x;

/** relation normalize: { data: [...] } or [...] */
function relArray(rel: any) {
  const d = rel?.data ?? rel;
  return Array.isArray(d) ? d : [];
}

const PRACTICES_UID = "practices";

const PRACTICES_PAGE_UID_CANDIDATES = [
  "practice-page",
  "practices-page",
] as const;

async function getPracticesPageSingle(locale: string) {
  for (const uid of PRACTICES_PAGE_UID_CANDIDATES) {
    const raw = await fetchContentType(
      uid,
      {
        locale,
        populate: {
          localizations: true,
          seo: { populate: "metaImage" },

          categories: true,
          practices: {
            populate: {
              media: { populate: "*" },
              avatar: { populate: "*" },
              video_poster: { populate: "*" },
              categories: true,
              practice: true,
              practice_card: true,
              button: true,
              seo: { populate: "metaImage" },
            },
          },

          faq: { populate: "*" },
          cta: { populate: "*" },
        },
      },
      true,
      { silent: true }
    );

    const rec = get(raw);
    if (
      rec &&
      (rec.heading ||
        rec.slug ||
        rec.seo ||
        rec.localizations ||
        rec.faq ||
        rec.cta)
    ) {
      return { uid, rec };
    }
  }
  return { uid: null as any, rec: null as any };
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { rec } = await getPracticesPageSingle(params.locale);

  const baseSlug = norm(rec?.slug || rec?.Slug || "practices");

  return generateMetadataObject(rec?.seo, {
    locale: params.locale as "hu" | "en" | "de",
    pathname: `/${params.locale}/${baseSlug}`,
  });
}

export default async function PracticesPage({
  params,
}: {
  params: { locale: string };
}) {
  const { rec } = await getPracticesPageSingle(params.locale);
  const practicesPage = get(rec);

  const baseSlug = norm(
    practicesPage?.slug || practicesPage?.Slug || "practices"
  );

  // 1) single type-ban kiválasztott practices
  const selectedFromSingle = relArray(practicesPage?.practices).map(get);
  let practices = selectedFromSingle;

  // 2) fallback: összes practice
  if (!practices.length) {
    const practicesRes = await fetchContentType(
      PRACTICES_UID,
      {
        locale: params.locale,
        populate: {
          media: { populate: "*" },
          avatar: { populate: "*" },
          categories: true,
          practice: true,
          practice_card: true,
          button: true,
          seo: { populate: "metaImage" },
        },
      },
      false
    );
    practices = (practicesRes?.data ?? []).map(get);
  }

  // localized base slugs a nyelvváltóhoz
  const localizedSlugs: Record<string, string> = {
    [practicesPage?.locale || params.locale]: baseSlug,
  };

  for (const loc of relArray(practicesPage?.localizations).map(get)) {
    const s = norm(loc?.slug || loc?.Slug);
    if (s) localizedSlugs[loc.locale] = s;
  }

  // categories a single type-ból
  const categories = relArray(practicesPage?.categories).map(get);

  // DZ tömbök (ha nincs, üres)
  const faqDZ = Array.isArray(practicesPage?.faq) ? practicesPage.faq : [];
  const ctaDZ = Array.isArray(practicesPage?.cta) ? practicesPage.cta : [];

  return (
    // ✅ csak X-en rejtsünk, így nem lesz jobbra-balra húzható az oldal
    <div className="relative w-full overflow-x-hidden">
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <AmbientColor />

      {/* ✅ A “normál” oldal tartalom marad Container-ben */}
      <Container className="pb-16 pt-40">
        <PracticeItems
          heading={
            practicesPage?.heading || practicesPage?.Heading || "Gyakorlatok"
          }
          sub_heading={
            practicesPage?.sub_heading || practicesPage?.Sub_heading || ""
          }
          practices={practices}
          locale={params.locale}
          categories={categories}
          baseSlug={baseSlug}
        />
      </Container>

      {/* ✅ DZ kint a Container-ből, de a viewport szélességére “clampelve” */}
      <div className="relative w-full overflow-x-hidden">
        <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-visible">
          <DynamicZoneManager dynamicZone={faqDZ} locale={params.locale} />
          <DynamicZoneManager dynamicZone={ctaDZ} locale={params.locale} />
        </div>
      </div>
    </div>
  );
}
