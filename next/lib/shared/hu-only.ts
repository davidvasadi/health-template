// Csak a magyar piacra szóló tartalom (Dave, 2026-11-20): az ajándékutalvány csak magyarul van.
// A Strapiban a szolgáltatások között német és angol változata is létezik — ezek 301-gyel a magyar utalványoldalra
// mennek (next.config.mjs, ugyanez a lista ott is), és kimaradnak a sitemapból, a hreflangből és a strukturált adatból.
export const HU_VOUCHER_PATH = "/hu/ajandekutalvany";

/** a szolgáltatások közül azok az en/de slugok, amelyek valójában a (csak magyar) ajándékutalványt jelentik */
export const HU_ONLY_PRODUCT_SLUGS = new Set<string>([
  "geschenkgutschein-chiropraktik-budapest",
  "giftvoucher-chiropractic-budapest",
]);
