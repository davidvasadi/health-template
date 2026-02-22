// lib/shared/metadata.ts
import type { Metadata } from 'next';

type Locale = 'hu' | 'en' | 'de';
const LOCALES: Locale[] = ['hu', 'en', 'de'];

const BRAND = 'The Place Studio';

const toStr = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (v == null) return '';
  if (Array.isArray(v)) return v.map(toStr).join(' ');
  if (typeof v === 'object') return '';
  return String(v);
};

const SITE_RAW = toStr(
  process.env.WEBSITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://theplacestudio.hu'
).trim();

const SITE = (SITE_RAW || 'https://theplacestudio.hu').replace(/\/+$/, '');

const OLD_HOSTS = new Set([
  'csontkovacsbence.hu',
  'www.csontkovacsbence.hu',
  'peldadomain.hu',
  'www.peldadomain.hu',
  'localhost',
  'localhost:3000',
  'localhost:1337',
  '127.0.0.1',
  '127.0.0.1:1337',
]);

const ensureLeadingSlash = (p: unknown) => {
  const s = toStr(p).trim();
  if (!s) return '/';
  return s.startsWith('/') ? s : `/${s}`;
};

const ensureTrailingSlash = (p: unknown) => {
  const s = toStr(p).trim();
  if (!s) return '/';
  return s.endsWith('/') ? s : `${s}/`;
};

function safeSiteUrl(): URL {
  try {
    return new URL(SITE);
  } catch {
    return new URL('https://theplacestudio.hu');
  }
}

type NormalizeOpts = {
  trailingSlash?: boolean; // canonical/oldalakhoz true
  asset?: boolean; // képekhez true (SOHA nincs trailing slash)
};

function normalizeToSite(raw?: unknown, opts: NormalizeOpts = {}): string | undefined {
  const trailingSlash = opts.trailingSlash ?? true;
  const asset = opts.asset ?? false;

  let u = toStr(raw).trim();
  if (!u) return undefined;

  if (/^(mailto:|tel:|javascript:)/i.test(u)) return undefined;

  // __NEXT_DATA__ / JSON escape
  u = u.replace(/\\\//g, '/');

  if (u.startsWith('/')) u = `${SITE}${u}`;
  if (u.startsWith('//')) u = `${safeSiteUrl().protocol}${u}`;
  if (!/^https?:\/\//i.test(u)) u = `${SITE}/${u.replace(/^\/+/, '')}`;

  try {
    const site = safeSiteUrl();
    const url = new URL(u);

    const hostLower = url.host.toLowerCase();
    const hostnameLower = url.hostname.toLowerCase();

    if (OLD_HOSTS.has(hostLower) || OLD_HOSTS.has(hostnameLower)) {
      url.protocol = site.protocol;
      url.host = site.host;
    }

    url.protocol = site.protocol;
    url.hash = '';

    // Oldalakhoz trailing slash OK, assethez NEM
    if (asset) {
      url.pathname = url.pathname.replace(/\/+$/, '');
      if (!url.pathname) url.pathname = '/';
    } else {
      url.pathname = ensureTrailingSlash(url.pathname);
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

const joinUrl = (base: string, path: unknown) =>
  `${base.replace(/\/+$/, '')}/${toStr(path).replace(/^\/+/, '')}`;

function pathForLocale(pathname: unknown, locale: Locale): string {
  const p = ensureLeadingSlash(pathname);
  const parts = p.split('/');
  if (parts.length >= 2 && (LOCALES as string[]).includes(parts[1])) {
    parts[1] = locale;
    return parts.join('/');
  }
  return `/${locale}${p}`;
}

function parseRobots(metaRobots?: unknown): Metadata['robots'] {
  const s = toStr(metaRobots).toLowerCase();
  if (!s) return { index: true, follow: true };
  const tokens = s.split(/[,\s]+/).filter(Boolean);
  return {
    index: !tokens.includes('noindex'),
    follow: !tokens.includes('nofollow'),
  };
}

export function generateMetadataObject(
  seo: any,
  opts: { locale: Locale; pathname?: unknown }
): Metadata {
  const locale = (opts?.locale ?? 'hu') as Locale;
  const pathname = typeof opts?.pathname === 'string' ? opts.pathname : `/${locale}/`;

  const canonicalFromStrapi = normalizeToSite(
    seo?.canonicalURL ?? seo?.canonicalUrl ?? seo?.canonical ?? seo?.canonical_url,
    { trailingSlash: true }
  );

  const canonical =
    canonicalFromStrapi ??
    normalizeToSite(joinUrl(SITE, pathname), { trailingSlash: true }) ??
    `${SITE}/${locale}/`;

  const title =
    (typeof seo?.metaTitle === 'string' && seo.metaTitle.trim()) ||
    (typeof seo?.title === 'string' && seo.title.trim()) ||
    BRAND;

  const description =
    (typeof seo?.metaDescription === 'string' && seo.metaDescription.trim()) ||
    (typeof seo?.description === 'string' && seo.description.trim()) ||
    '';

  const robots = parseRobots(seo?.metaRobots);

  // OG image: assetként kezeljük -> NINCS trailing slash
  const rawImg =
    seo?.metaImage?.url ??
    seo?.metaImage?.data?.attributes?.url ??
    seo?.metaImage?.attributes?.url;

  const ogImage = normalizeToSite(rawImg, { asset: true, trailingSlash: false });

  const languages: Record<string, string> = {};
  for (const l of LOCALES) {
    const p = pathForLocale(pathname, l);
    languages[l] = normalizeToSite(joinUrl(SITE, p), { trailingSlash: true }) ?? `${SITE}/${l}/`;
  }

  return {
    metadataBase: safeSiteUrl(),

    // ✅ brand jel
    applicationName: BRAND,

    title,
    description,
    robots,

    alternates: {
      canonical,
      languages,
    },

    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      siteName: BRAND, // ✅ brandname added
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}