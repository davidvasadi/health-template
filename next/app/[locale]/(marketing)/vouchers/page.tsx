// next/app/[locale]/(marketing)/vouchers/page.tsx
import fetchContentType from "@/lib/strapi/fetchContentType";
import { redirect } from "next/navigation";
import { HU_VOUCHER_PATH } from "@/lib/shared/hu-only";

const VOUCHER_PAGE_UID = "voucher-page";
const norm = (s?: string) => (s ?? "").replace(/^\/|\/$/g, "");

const getSingle = (x: any) => x?.attributes ?? x;

export default async function VouchersAliasPage({ params }: { params: { locale: string } }) {
  const pageRaw: any = await fetchContentType(VOUCHER_PAGE_UID, { locale: params.locale }, true, { silent: true });
  const page = getSingle(pageRaw);
  const baseSlug = norm(page?.slug || page?.Slug);
  // Ha ezen a nyelven nincs utalványoldal (en/de — az utalvány csak magyar), a magyarra visz. Korábban a "vouchers"
  // tartalékra irányított, vagyis ÖNMAGÁRA → végtelen átirányítás volt a /en/vouchers és a /de/vouchers címen.
  if (!baseSlug || baseSlug === "vouchers") redirect(HU_VOUCHER_PATH);
  redirect(`/${params.locale}/${baseSlug}`);
}
