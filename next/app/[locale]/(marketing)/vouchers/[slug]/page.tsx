// next/app/[locale]/(marketing)/vouchers/[slug]/page.tsx
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import fetchContentType from "@/lib/strapi/fetchContentType";
import { generateMetadataObject } from "@/lib/shared/metadata";

import { Container } from "@/components/container";
import { AmbientColor } from "@/components/decorations/ambient-color";
import { VouchersFlow } from "@/components/vouchers/vouchers-flow";
import ClientSlugHandler from "../../ClientSlugHandler";

const norm = (s?: string) => (s ?? "").replace(/^\/|\/$/g, "");
const get = (x: any) => x?.attributes ?? x;

const VOUCHER_PAGE_UID = "voucher-page"; // single type
const VOUCHERS_UID = "vouchers";         // ✅ helyesen: vouchers (nem "vouches")

// --- helpers ---
function relArray(rel: any) {
  const d = rel?.data ?? rel;
  return Array.isArray(d) ? d : [];
}

const getItem = (x: any) => {
  if (!x) return x;
  if (x?.attributes) return { id: x.id, documentId: x.documentId, ...x.attributes };
  return x;
};

// ✅ base slug map a nyelvváltóhoz (mint practices)
async function getVouchersBaseLocalized(locale: string) {
  const recRaw: any = await fetchContentType(
    VOUCHER_PAGE_UID,
    { locale, populate: { localizations: true } },
    true,
    { silent: true }
  );

  const rec = get(recRaw);
  const base = norm(rec?.slug || rec?.Slug || "vouchers") || "vouchers";

  const map: Record<string, string> = { [rec?.locale || locale]: base };

  for (const lraw of relArray(rec?.localizations)) {
    const l = get(lraw);
    const s = norm(l?.slug || l?.Slug || "");
    if (s && l?.locale) map[l.locale] = s;
  }

  return map;
}

async function getVouchersBase(locale: string) {
  const map = await getVouchersBaseLocalized(locale);
  return norm(map[locale] || "vouchers") || "vouchers";
}

// --- SEO ---
export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  // ✅ voucher detail SEO: a voucher collection seo-jából
  const voucherRaw: any = await fetchContentType(
    VOUCHERS_UID,
    { filters: { slug: params.slug, locale: params.locale }, populate: "seo.metaImage" },
    true
  );

  const voucher = get(voucherRaw);
  if (!voucher) {
    // nincs ilyen voucher: canonical a listára
    const base = await getVouchersBase(params.locale);
    return generateMetadataObject(null, {
      locale: params.locale as "hu" | "en" | "de",
      pathname: `/${params.locale}/${base}`,
    });
  }

  return generateMetadataObject(voucher?.seo, {
    locale: params.locale as "hu" | "en" | "de",
    pathname: `/${params.locale}/${await getVouchersBase(params.locale)}/${params.slug}`,
  });
}

// --- PAGE ---
export default async function VoucherDetailPage({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const baseMap = await getVouchersBaseLocalized(params.locale);
  const base = norm(baseMap[params.locale] || "vouchers") || "vouchers";

  // 1) betöltjük a voucher-page singlet a flow-hoz (szövegek, steps, bank info, help)
  const pageRaw: any = await fetchContentType(
    VOUCHER_PAGE_UID,
    {
      locale: params.locale,
      populate: {
        localizations: true,
        steps: true,
        button: true,
        bank_transfer: true,
        help_button: true,
      },
    },
    true,
    { silent: true }
  );

  const page = get(pageRaw);
  if (!page) return notFound();

  // 2) betöltjük a konkrét vouchert slug alapján
  const voucherRaw: any = await fetchContentType(
    VOUCHERS_UID,
    {
      filters: { slug: params.slug, locale: params.locale },
      populate: {
        image: { populate: "*" },
        logo: { populate: { image: { populate: "*" } } },
        button: true,
        seo: { populate: "metaImage" },
      },
    },
    true
  );

  const voucher = get(voucherRaw);

  if (!voucher) {
    // nincs ilyen voucher ezen a nyelven → lista oldalra
    redirect(`/${params.locale}/${base}`);
  }

  // 3) A VouchersFlow csak listát fogad, ezért 1 elemre szűkítjük
  const vouchers = [voucher].map(getItem);

  return (
    <div className="relative overflow-hidden w-full">
      {/* nyelvváltó: innen a LISTA oldalra menjen (mint a practices detailnél) */}
      <ClientSlugHandler localizedSlugs={{ [params.locale]: base }} />

      <AmbientColor />
      <Container className="pb-16 pt-32 md:pt-40">
        <VouchersFlow page={page} vouchers={vouchers} locale={params.locale} />
      </Container>
    </div>
  );
}
