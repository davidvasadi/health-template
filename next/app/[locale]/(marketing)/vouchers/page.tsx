// next/app/[locale]/(marketing)/vouchers/page.tsx
import fetchContentType from "@/lib/strapi/fetchContentType";
import { redirect } from "next/navigation";

const VOUCHER_PAGE_UID = "voucher-page";
const norm = (s?: string) => (s ?? "").replace(/^\/|\/$/g, "");

const getSingle = (x: any) => x?.attributes ?? x;

export default async function VouchersAliasPage({ params }: { params: { locale: string } }) {
  const pageRaw: any = await fetchContentType(VOUCHER_PAGE_UID, { locale: params.locale }, true, { silent: true });
  const page = getSingle(pageRaw);
  const baseSlug = norm(page?.slug || page?.Slug || "vouchers") || "vouchers";
  redirect(`/${params.locale}/${baseSlug}`);
}
