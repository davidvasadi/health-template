import { draftMode } from "next/headers";
import qs from "qs";

/**
 * Strapi válasz típusok
 */
interface StrapiData {
  id: number;
  [key: string]: any;
}

interface StrapiResponse {
  data: StrapiData | StrapiData[];
}

/**
 * Ha a Strapi egy tömböt ad vissza, az első elemet bontjuk ki
 */
export function spreadStrapiData(data: StrapiResponse): StrapiData | null {
  if (Array.isArray(data.data) && data.data.length > 0) {
    return data.data[0];
  }
  if (!Array.isArray(data.data)) {
    return data.data;
  }
  return null;
}

/**
 * Strapi lekérés – 404-re `null`-t ad, más hibára dob.
 *
 * @param contentType  API endpoint pl. "pages" vagy "global"
 * @param params       query paraméterek pl. { filters: {...}, populate: "*" }
 * @param spreadData   ha true → visszaadja csak a data[0]-t
 */
export default async function fetchContentType(
  contentType: string,
  params: Record<string, unknown> = {},
  spreadData?: boolean
): Promise<any | null> {
  const { isEnabled } = await draftMode();

  try {
    const queryParams = { ...params };

    // Draft mód – ha preview-ból jövünk
    if (isEnabled) {
      // Strapi v4-ben a "status=draft" nem mindig működik, de ha nálad igen, maradhat
      queryParams.status = "draft";
    }

    // Alap URL fallback-el
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_STRAPI_URL ||
      process.env.STRAPI_URL ||
      "http://localhost:1337";

    // Tisztítsuk le a duplikált "/"
    const normalizedBase = baseUrl.replace(/\/+$/, "");
    const url = `${normalizedBase}/api/${contentType}`;

    // Paraméterek összeállítása
    const query = qs.stringify(queryParams, { encodeValuesOnly: true });

    // Lekérés
    const response = await fetch(`${url}?${query}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // --- 🔹 404-es válasz: visszaadunk null-t, nem dobunk hibát ---
    if (response.status === 404) {
      console.warn(`[fetchContentType] 404: ${url}`);
      return null;
    }

    // --- 🔹 Egyéb hibákra dobjuk ---
    if (!response.ok) {
      throw new Error(
        `Failed to fetch data from Strapi (url=${url}, status=${response.status})`
      );
    }

    // JSON dekódolás
    const jsonData: StrapiResponse = await response.json();

    // Ha a hívó kérte → kicsomagoljuk
    return spreadData ? spreadStrapiData(jsonData) : jsonData;
  } catch (error) {
    console.error("❌ FetchContentTypeError:", error);
    return null;
  }
}
