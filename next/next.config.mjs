/** @type {import('next').NextConfig} */
const LOCALES = ['hu', 'de', 'en'];
const LOCALE_RE = LOCALES.join('|');

const SITE_URL =
  process.env.WEBSITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://csontkovacsbence.hu';

const API_URL =
  process.env.NEXT_PUBLIC_STRAPI_API_URL ||
  process.env.STRAPI_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  '';

function hostFrom(url) {
  try { return new URL(url).hostname; } catch { return null; }
}

const imageHosts = new Set(
  [hostFrom(SITE_URL), 'localhost', API_URL ? hostFrom(API_URL) : null].filter(Boolean)
);

const remotePatterns = [];
for (const host of imageHosts) {
  remotePatterns.push({ protocol: 'https', hostname: host, pathname: '/**' });
  remotePatterns.push({ protocol: 'http',  hostname: host, pathname: '/**' });
}

const nextConfig = {
  images: { remotePatterns },
  pageExtensions: ['ts', 'tsx'],

  // ⬇️ Egyetlen rewrite: /:locale/sitemap.xml → /sitemap.xml
  async rewrites() {
    return [
      { source: `/:locale(${LOCALE_RE})/sitemap.xml`, destination: '/sitemap.xml' },
    ];
  },

  async redirects() {
    // DEV-ben ne zajongjon (csak prodban kérdezze a Strapi-t)
    if (!API_URL || process.env.NODE_ENV !== 'production') return [];

    const base = API_URL.replace(/\/$/, '');
    try {
      const res = await fetch(`${base}/api/redirections`, { headers: { accept: 'application/json' } });
      if (!res.ok) return [];

      const json = await res.json();
      const items = Array.isArray(json?.data) ? json.data : [];
      const list = [];

      for (const item of items) {
        const attrs = item?.attributes || item;
        let source = String(attrs?.source || '').trim();
        let destination = String(attrs?.destination || '').trim();
        if (!source || !destination) continue;

        // Teljes URL → path
        try { source = new URL(source).pathname; } catch {}
        try { destination = new URL(destination).pathname; } catch {}

        if (!source.startsWith('/')) source = `/${source}`;
        if (!destination.startsWith('/')) destination = `/${destination}`;

        // Dupla perjelek normalizálása
        source = source.replace(/\/{2,}/g, '/');
        destination = destination.replace(/\/{2,}/g, '/');

        // Lokalizált minta
        list.push({
          source: `/:locale(${LOCALE_RE})${source}`,
          destination: `/:locale(${LOCALE_RE})${destination}`,
          permanent: false,
        });
      }

      return list;
    } catch {
      return [];
    }
  },
};

export default nextConfig;
