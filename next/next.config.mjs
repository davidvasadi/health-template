/** @type {import('next').NextConfig} */

const LOCALES = ["hu", "de", "en"];
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Lekéri Strapiból melyik locale-ban van voucher oldal.
// Ahol nincs → automatikus redirect generálódik /hu-ra.
async function getVoucherRedirects() {
  try {
    const res = await fetch(
      `${API_URL}/api/voucher-page?populate[localizations][fields][0]=slug&populate[localizations][fields][1]=locale&fields[0]=slug&fields[1]=locale&locale=hu`
    );
    if (!res.ok) return [];

    const json = await res.json();
    const root = json?.data;
    if (!root) return [];

    const rootSlug = root?.slug ?? root?.attributes?.slug;
    const rootLocale = root?.locale ?? root?.attributes?.locale ?? "hu";

    const available = {};
    if (rootLocale && rootSlug) available[rootLocale] = rootSlug;

    const locs = root?.localizations ?? root?.attributes?.localizations?.data ?? [];
    for (const l of locs) {
      const attrs = l?.attributes ?? l;
      if (attrs?.locale && attrs?.slug) available[attrs.locale] = attrs.slug;
    }

    return LOCALES
      .filter((lng) => !available[lng])
      .map((lng) => ({
        source: `/${lng}/vouchers`,
        destination: `/hu/${available["hu"] || "ajandekutalvany"}`,
        permanent: false,
      }));
  } catch {
    return [];
  }
}

const staticRedirects = [
  // Rossz locale-ban lévő slugok
  { source: "/hu/leistungen",         destination: "/hu/szolgaltatasok", permanent: true },
  { source: "/hu/kontakt",            destination: "/hu/kapcsolat",      permanent: true },
  { source: "/de/gyik",               destination: "/de/faq",            permanent: true },
  { source: "/en/gyik",               destination: "/en/faq",            permanent: true },
  { source: "/en/kontakt",            destination: "/en/contact-us",     permanent: true },
  { source: "/de/szolgaltatasok",     destination: "/de/leistungen",     permanent: true },
  { source: "/en/szolgaltatasok",     destination: "/en/products",       permanent: true },
  { source: "/de/arak",               destination: "/de/preise",         permanent: true },
  { source: "/en/arak",               destination: "/en/pricing",        permanent: true },
  { source: "/hu/pricing",            destination: "/hu/arak",           permanent: true },
  { source: "/de/kapcsolat",          destination: "/de/kontakt",        permanent: true },
  { source: "/en/kapcsolat",          destination: "/en/contact-us",     permanent: true },

  // Régi gyakorlatok struktúra
  { source: "/hu/gyakorlatok/:slug*", destination: "/hu/otthoni-torna-gyakorlatok/:slug*", permanent: true },
  { source: "/en/gyakorlatok/:slug*", destination: "/en",                permanent: true },
  { source: "/de/gyakorlatok/:slug*", destination: "/de",                permanent: true },

  // Prefix nélküli régi gyakorlat slugok
  { source: "/hu/kis-mellizom-nyujto-gyakorlat",      destination: "/hu/otthoni-torna-gyakorlatok/kis-mellizom-nyujto-gyakorlat", permanent: true },
  { source: "/hu/lapocka-nyujto-gyakorlat",           destination: "/hu/otthoni-torna-gyakorlatok/lapocka-nyujto-gyakorlat",      permanent: true },
  { source: "/hu/farizom-erosites-nyujtas",           destination: "/hu/otthoni-torna-gyakorlatok/farizom-erosites-nyujtas",      permanent: true },
  { source: "/hu/csipo-hajlito-nyujtas-gyakorlat",    destination: "/hu/otthoni-torna-gyakorlatok/csipo-hajlito-nyujtas-gyakorlat", permanent: true },
  { source: "/en/kis-mellizom-nyujto-gyakorlat",      destination: "/en", permanent: true },
  { source: "/en/lapocka-nyujto-gyakorlat",           destination: "/en", permanent: true },
  { source: "/de/kis-mellizom-nyujto-gyakorlat",      destination: "/de", permanent: true },
  { source: "/de/lapocka-nyujto-gyakorlat",           destination: "/de", permanent: true },

  // Megszűnt videók
  { source: "/hu/videok/:slug*", destination: "/hu", permanent: true },
  { source: "/en/videok/:slug*", destination: "/en", permanent: true },
  { source: "/de/videok/:slug*", destination: "/de", permanent: true },

  // Gyökér
  { source: "/", destination: "/hu", permanent: false },
];

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "theplacestudio.hu" },
      { protocol: "https", hostname: "www.theplacestudio.hu" },
      { protocol: "https", hostname: "csontkovacsbence.hu" },
      { protocol: "https", hostname: "www.csontkovacsbence.hu" },
      { protocol: "http",  hostname: "localhost",  port: "1337", pathname: "/uploads/**" },
      { protocol: "http",  hostname: "127.0.0.1",  port: "1337", pathname: "/uploads/**" },
      { protocol: "http",  hostname: "localhost",  port: "3000", pathname: "/uploads/**" },
    ],
  },

  pageExtensions: ["ts", "tsx"],

  async redirects() {
    const [voucherRedirects, dynamicRedirects] = await Promise.all([
      getVoucherRedirects(),
      fetch(`${API_URL}/api/redirections`)
        .then((r) => r.json())
        .then((result) =>
          (result?.data ?? [])
            .map(({ source, destination }) => ({
              source: `/:locale${source}`,
              destination: `/:locale${destination}`,
              permanent: true,
            }))
            .filter((r) => r.source !== r.destination)
        )
        .catch(() => {
          console.warn("⚠️ Strapi redirections nem tölthetők be");
          return [];
        }),
    ]);

    return [...staticRedirects, ...voucherRedirects, ...dynamicRedirects];
  },
};

export default nextConfig;