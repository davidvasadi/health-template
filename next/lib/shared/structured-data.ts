// Strukturált adatok (JSON-LD) központi helye.
// - A cégadatok EGY helyen vannak (BUSINESS), ebből készül a részletes Chiropractor/MedicalBusiness
//   blokk minden oldalra, ugyanazzal az @id-val (a Strapiban lévő Person/Service blokkok erre hivatkoznak).
// - A Strapi SEO structuredData-ból a cég-típusú blokkokat (és ahol a kód generálja, a BreadcrumbList-et)
//   kiszűrjük, hogy ne legyen több, egymásnak ellentmondó változat.
import fetchContentType from "@/lib/strapi/fetchContentType";
import { conditionsFor } from "./conditions";

const SITE = (process.env.WEBSITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://theplacestudio.hu").replace(/\/+$/, "");

export const BUSINESS_ID = `${SITE}/#business`;

type Locale = "hu" | "en" | "de";

export const BUSINESS = {
  name: "The Place Studio",
  telephone: "+36303196238",
  email: "info@theplacestudio.hu",
  bookingUrl: "https://theplacestudio.salonic.hu/",
  mapUrl: "https://maps.app.goo.gl/GpPv9k9LBbrpRJfu9",
  address: {
    streetAddress: "József Attila utca 76–80.",
    addressLocality: "Budapest",
    addressRegion: "Budapest",
    postalCode: "1042",
    addressCountry: "HU",
  },
  geo: { latitude: 47.560594, longitude: 19.092315 },
  opens: "09:00",
  closes: "20:30",
  sameAs: ["https://www.facebook.com/theplacestudio.hu", "https://www.tiktok.com/@theplacestudio"],
  people: [
    { id: "csonka-bence", name: "Csonka Bence", jobTitle: { hu: "Alapító, csontkovács, mozgásterapeuta, masszőr", en: "Founder, chiropractor, movement therapist, massage therapist", de: "Gründer, Chiropraktiker, Bewegungstherapeut, Masseur" } },
    { id: "oravecz-andras", name: "Oravecz András", jobTitle: { hu: "Csontkovács, masszőr", en: "Chiropractor, massage therapist", de: "Chiropraktiker, Masseur" } },
  ],
};

const DESCRIPTION: Record<Locale, string> = {
  hu: "Csontkovács és mozgásterápia Budapesten, Újpesten (IV. kerület). Személyre szabott, kombinált kezelések: csontkovácsolás, ízületi blokkok oldása, köpölyözés, kézi izomlazítás, sport- és svédmasszázs, online időpontfoglalással.",
  en: "Chiropractic and movement therapy in Budapest (Újpest, District IV). Personalised combined treatments: chiropractic adjustment, joint mobilisation, cupping, manual muscle release, sports and Swedish massage, with online booking.",
  de: "Chiropraktik und Bewegungstherapie in Budapest (Újpest, IV. Bezirk). Individuelle Kombinationsbehandlungen: Chiropraktik, Lösen von Gelenkblockaden, Schröpfen, manuelle Muskellockerung, Sport- und Schwedische Massage, mit Online-Terminbuchung.",
};

const CATALOG_NAME: Record<Locale, string> = {
  hu: "Csontkovács és masszázs kezelések",
  en: "Chiropractic and massage treatments",
  de: "Chiropraktik- und Massagebehandlungen",
};

const asLocale = (l: string): Locale => (l === "en" || l === "de" ? l : "hu");

// Szolgáltatások élőben a Strapiból (név, ár, link), hogy az árak mindig egyezzenek az oldallal
async function getServices(locale: Locale) {
  const [productsRes, productPage] = await Promise.all([
    fetchContentType(
      "products",
      {
        locale,
        fields: ["name", "slug", "price"],
        populate: { images: { fields: ["url"] } },
        pagination: { pageSize: 50 },
      },
      false,
      { silent: true }
    ),
    fetchContentType("product-page", { locale, fields: ["slug"] }, true, { silent: true }),
  ]);
  const base = (productPage?.slug || "szolgaltatasok").replace(/^\/|\/$/g, "");
  const items: any[] = productsRes?.data ?? [];
  return items.map((p) => ({
    name: p?.name as string,
    price: typeof p?.price === "number" ? p.price : null,
    url: `${SITE}/${locale}/${base}/${p?.slug}/`,
    image: p?.images?.[0]?.url as string | undefined,
  }));
}

const absUrl = (u?: string) => (!u ? undefined : /^https?:\/\//.test(u) ? u : `${SITE}${u.startsWith("/") ? "" : "/"}${u}`);

export async function businessJsonLd(locale: string) {
  const loc = asLocale(locale);
  const services = (await getServices(loc)).filter((s) => s.name);
  const prices = services.map((s) => s.price).filter((p): p is number => typeof p === "number" && p > 0);
  const image = absUrl(services.find((s) => s.image)?.image);

  return {
    "@context": "https://schema.org",
    "@type": ["Chiropractor", "MedicalBusiness"],
    "@id": BUSINESS_ID,
    name: BUSINESS.name,
    description: DESCRIPTION[loc],
    url: `${SITE}/${loc}/`,
    logo: `${SITE}/apple-icon.png`,
    ...(image ? { image } : {}),
    telephone: BUSINESS.telephone,
    email: BUSINESS.email,
    address: { "@type": "PostalAddress", ...BUSINESS.address },
    geo: { "@type": "GeoCoordinates", ...BUSINESS.geo },
    hasMap: BUSINESS.mapUrl,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        // hétfőtől szombatig — vasárnap zárva (mint az oldal láblécében és az időpontválasztóban)
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: BUSINESS.opens,
        closes: BUSINESS.closes,
      },
    ],
    ...(prices.length ? { priceRange: `${Math.min(...prices)}–${Math.max(...prices)} HUF` } : {}),
    currenciesAccepted: "HUF",
    areaServed: [
      { "@type": "City", name: "Budapest" },
      { "@type": "AdministrativeArea", name: "Budapest IV. kerület" },
      { "@type": "Place", name: "Újpest" },
    ],
    knowsLanguage: ["hu", "en", "de"],
    // a kezelt panaszok — ugyanaz a lista, ami a főoldal „Mit kezelünk?” szakaszában látszik (lib/shared/conditions.ts)
    knowsAbout: conditionsFor(loc).map((c) => c.name),
    sameAs: [...BUSINESS.sameAs, BUSINESS.mapUrl],
    founder: { "@id": `${SITE}/hu/csapat#${BUSINESS.people[0].id}` },
    employee: BUSINESS.people.map((p) => ({
      "@type": "Person",
      "@id": `${SITE}/hu/csapat#${p.id}`,
      name: p.name,
      jobTitle: p.jobTitle[loc],
      worksFor: { "@id": BUSINESS_ID },
    })),
    potentialAction: {
      "@type": "ReserveAction",
      target: { "@type": "EntryPoint", urlTemplate: BUSINESS.bookingUrl },
    },
    ...(services.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: CATALOG_NAME[loc],
            itemListElement: services.map((s) => ({
              "@type": "Offer",
              url: s.url,
              ...(s.price ? { price: s.price, priceCurrency: "HUF" } : {}),
              itemOffered: { "@type": "Service", name: s.name, url: s.url, provider: { "@id": BUSINESS_ID } },
            })),
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(locale: string, homeLabel: string, label: string, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: homeLabel, item: `${SITE}/${locale}/` },
      { "@type": "ListItem", position: 2, name: label, item: `${SITE}/${locale}/${slug}/` },
    ],
  };
}

// Cég-típusú blokkok: ezeket a központi businessJsonLd adja
const BUSINESS_TYPES = new Set([
  "Organization",
  "LocalBusiness",
  "MedicalBusiness",
  "Chiropractor",
  "MedicalClinic",
  "HealthAndBeautyBusiness",
  "Physiotherapy",
]);

const typesOf = (x: any): string[] => (Array.isArray(x?.["@type"]) ? x["@type"] : x?.["@type"] ? [x["@type"]] : []);

// A Strapi structuredData megtisztítása: cég-blokkok (és kérésre a BreadcrumbList) nélkül
export function cleanStructuredData(sd: any, opts: { stripBreadcrumb?: boolean } = {}) {
  if (!sd) return null;
  const drop = (x: any) => {
    const t = typesOf(x);
    if (t.some((k) => BUSINESS_TYPES.has(k))) return true;
    if (opts.stripBreadcrumb && t.includes("BreadcrumbList")) return true;
    return false;
  };

  if (Array.isArray(sd)) {
    const out = sd.filter((x) => !drop(x));
    return out.length ? out : null;
  }
  if (Array.isArray(sd?.["@graph"])) {
    const graph = sd["@graph"].filter((x: any) => !drop(x));
    return graph.length ? { ...sd, "@graph": graph } : null;
  }
  return drop(sd) ? null : sd;
}
