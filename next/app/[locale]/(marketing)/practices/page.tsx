// next/app/[locale]/(marketing)/practices/page.tsx
import { Metadata } from "next";
import { Container } from "@/components/container";
import { AmbientColor } from "@/components/decorations/ambient-color";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { generateMetadataObject } from "@/lib/shared/metadata";
import ClientSlugHandler from "../ClientSlugHandler";
import { PracticeItems } from "@/components/practices/practice-items";

const norm = (s?: string) => (s ?? "").replace(/^\/|\/$/g, "");

// ✅ v4/v5 normalize helper
const get = (x: any) => x?.attributes ?? x;

/** relation normalize: { data: [...] } or [...] */
function relArray(rel: any) {
  const d = rel?.data ?? rel;
  return Array.isArray(d) ? d : [];
}

const PRACTICES_UID = "practices";

const PRACTICES_PAGE_UID_CANDIDATES = [
  "practice-page",     // ez a legvalószínűbb
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
        },
      },
      true,
      { silent: true }
    );

    const rec = get(raw);
    // ha van bármi értelmes adat, elfogadjuk
    if (rec && (rec.heading || rec.slug || rec.seo || rec.localizations)) return { uid, rec };
  }
  return { uid: null as any, rec: null as any };
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { rec } = await getPracticesPageSingle(params.locale);

  const baseSlug = norm(rec?.slug || rec?.Slug || "practices");

  return generateMetadataObject(rec?.seo, {
    locale: params.locale as "hu" | "en" | "de",
    pathname: `/${params.locale}/${baseSlug}`,
  });
}

export default async function PracticesPage({ params }: { params: { locale: string } }) {
  const { rec } = await getPracticesPageSingle(params.locale);
  const practicesPage = get(rec);

  // ✅ base slug a single type-ból
  const baseSlug = norm(practicesPage?.slug || practicesPage?.Slug || "practices");

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

  // ✅ localized base slugs a nyelvváltóhoz (szintén normalize-olva!)
  const localizedSlugs: Record<string, string> = {
    [practicesPage?.locale || params.locale]: baseSlug,
  };

  for (const loc of relArray(practicesPage?.localizations).map(get)) {
    const s = norm(loc?.slug || loc?.Slug);
    if (s) localizedSlugs[loc.locale] = s;
  }

  // categories a single type-ból
  const categories = relArray(practicesPage?.categories).map(get);

  return (
    <div className="relative overflow-hidden w-full">
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <AmbientColor />
      <Container className="pb-16 pt-40">
        <PracticeItems
          heading={practicesPage?.heading || practicesPage?.Heading || "Gyakorlatok"}
          sub_heading={practicesPage?.sub_heading || practicesPage?.Sub_heading || ""}
          practices={practices}
          locale={params.locale}
          categories={categories}
          baseSlug={baseSlug}  // ✅ EZ MOST TÉNYLEG "gyakorlatok" LESZ HU-N
        />
      </Container>
    </div>
  );
}
