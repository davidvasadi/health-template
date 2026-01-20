import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/container";
import { AmbientColor } from "@/components/decorations/ambient-color";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { generateMetadataObject } from "@/lib/shared/metadata";
import { SinglePractice } from "@/components/practices/single-practice";
import ClientSlugHandler from "../../ClientSlugHandler";

const norm = (s?: string) => (s ?? "").replace(/^\/|\/$/g, "");
const get = (x: any) => x?.attributes ?? x;

const PRACTICES_UID = "practices";

// ugyanaz a single type candidates lista, mint máshol
const PRACTICES_PAGE_UID_CANDIDATES = ["practice-page", "practices-page"] as const;

/**
 * ✅ Base slug map a nyelvváltóhoz:
 * { hu: "gyakorlatok", en: "practices", de: "uebungen" } stb
 * (ha nincs Strapi adat, fallback: practices)
 */
async function getPracticesBaseLocalized(locale: string) {
  for (const uid of PRACTICES_PAGE_UID_CANDIDATES) {
    const recRaw: any = await fetchContentType(
      uid,
      { locale, populate: { localizations: true } },
      true,
      { silent: true }
    );

    const rec = get(recRaw);
    const base = norm(rec?.slug || rec?.Slug || "");
    if (!rec || !base) continue;

    const map: Record<string, string> = { [rec?.locale || locale]: base };

    // Strapi v4/v5 localizations lehet array vagy {data:[]}
    const locs = Array.isArray(rec?.localizations)
      ? rec.localizations
      : rec?.localizations?.data ?? [];

    for (const lraw of locs) {
      const l = get(lraw);
      const s = norm(l?.slug || l?.Slug || "");
      if (s && l?.locale) map[l.locale] = s;
    }

    return map;
  }

  return { [locale]: "practices" };
}

async function getPracticesBase(locale: string) {
  const map = await getPracticesBaseLocalized(locale);
  return norm(map[locale] || "practices") || "practices";
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const pageData = await fetchContentType(
    PRACTICES_UID,
    { filters: { slug: params.slug, locale: params.locale }, populate: "seo.metaImage" },
    true
  );

  return generateMetadataObject(pageData?.seo, {
    locale: params.locale as "hu" | "en" | "de",
    pathname: `/${params.locale}/${params.slug}`,
  });
}

export default async function PracticeDetailPage({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  // ✅ EZ A LÉNYEG: detail oldalon is beállítjuk a base slug map-et,
  // hogy nyelvváltáskor a LISTA oldalra tudjon menni (nem notFound, nem /practices HU-n).
  const baseMap = await getPracticesBaseLocalized(params.locale);
  const base = norm(baseMap[params.locale] || "practices") || "practices";

  const practice = await fetchContentType(
    PRACTICES_UID,
    {
      filters: { slug: params.slug, locale: params.locale },
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
    true
  );

  if (!practice) {
    // ha nincs ilyen gyakorlat ezen a nyelven, akkor menjen a listaoldalra
    redirect(`/${params.locale}/${base}`);
  }

  return (
    <div className="relative overflow-hidden w-full">
      {/* ✅ nyelvváltáskor innen a LISTA oldalra fog menni az adott nyelven */}
<ClientSlugHandler localizedSlugs={{ [params.locale]: base }} />

      <AmbientColor />
      <Container className="py-20 md:py-40">
        <SinglePractice practice={practice} locale={params.locale} />
      </Container>
    </div>
  );
}
