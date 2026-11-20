// next/lib/strapi/fetchContentType.ts

import { draftMode } from "next/headers";
import qs from "qs";

interface StrapiData {
  id: number;
  [key: string]: any;
}

interface StrapiResponse {
  data: StrapiData | StrapiData[];
}

export interface Practice {
  id: number;

  name?: string | null;
  slug?: string | null;

  media?: { url: string; alternativeText?: string | null; mime?: string | null }[] | any[];

  avatar?: any;
  avatar_name?: string | null;
  avatar_description?: string | null;

  practice?: {
    heading?: string | null;
    description?: string | null;
    steps?: any;
    quote?: string | null;
  } | null;

  practice_card?: { icon?: string; label?: string; value?: string }[] | any[];

  button?: { text?: string; URL?: string; variant?: string; target?: string }[] | any;

  categories?: any[];
  seo?: any;

  dynamic_zone?: any[];
  locale?: string;
  localizations?: any[];
}

/** ennyi másodpercig adja a Next a gyorsítótárból a Strapi-tartalmat (élő oldal); előnézetben nincs gyorsítótár */
export const CONTENT_REVALIDATE_SECONDS = 60;

export function spreadStrapiData(data: StrapiResponse): StrapiData | null {
  if (Array.isArray(data.data) && data.data.length > 0) return data.data[0];
  if (!Array.isArray(data.data)) return data.data;
  return null;
}

export default async function fetchContentType(
  contentType: string,
  params: Record<string, unknown> = {},
  spreadData?: boolean,
  options?: { silent?: boolean }
): Promise<any> {
  const { isEnabled } = await draftMode();

  try {
    const queryParams: Record<string, unknown> = { ...params };

    if (isEnabled) {
      queryParams.status = "draft";
    }

    // Szerveroldalon belső címen érjük el a Strapit (pl. http://127.0.0.1:1337),
    // különben a kérés kimegy a publikus domainre, és az nginx api_limit 503-mal dobja
    const url = new URL(`api/${contentType}`, process.env.STRAPI_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL);
    const href = `${url.href}?${qs.stringify(queryParams)}`;

    // Gyorsítótár (2026-11-20): eddig MINDEN oldalbetöltés friss Strapi-lekérést indított (cache: no-store) — a
    // főoldalon több ugyanolyat is —, ettől volt lassú a szerverválasz (Lighthouse: ~930 ms). Most a tartalom 60 mp-ig
    // a Next adat-gyorsítótárából jön; a Strapiban mentett változás legfeljebb ~1 perc múlva jelenik meg az oldalon.
    // Előnézeti (draft) módban mindig friss.
    const response = await fetch(href, isEnabled
      ? { method: "GET", cache: "no-store" }
      : { method: "GET", next: { revalidate: CONTENT_REVALIDATE_SECONDS } });

    // ✅ silent módban ne dobjunk és ne logoljunk — csak adjunk vissza null-t
    if (!response.ok) {
      if (options?.silent) return null;
      throw new Error(
        `Failed to fetch data from Strapi (url=${url.toString()}, status=${response.status})`
      );
    }

    const jsonData: StrapiResponse = await response.json();
    return spreadData ? spreadStrapiData(jsonData) : jsonData;
  } catch (error) {
    // ✅ csak akkor logoljunk, ha nem silent
    if (!options?.silent) {
      console.error("FetchContentTypeError", error);
    }
    return null;
  }
}
