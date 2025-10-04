import { notFound } from "next/navigation";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { LegalPage } from "@/components/legal/legal-page";
import { generateMetadataObject } from "@/lib/shared/metadata";

// >>> ÁLLÍTSD BE a Strapi Single Type API ID-ját!
// Ha az admin URL-ben ilyet látsz: api::terms-of-service.terms-of-service -> akkor "terms-of-service"
// Ha api::terms.terms -> akkor "terms"
const TERMS_UID = "terms-of-service"; // ← ha nálad "terms", írd át

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const record: any = await fetchContentType(TERMS_UID, { locale, populate: "*" }, true);
  const seo = record ? (Array.isArray(record.Seo) ? record.Seo[0] : record.Seo) : null;
  return generateMetadataObject(seo) ?? { title: "Felhasználási feltételek" };
}

export default async function TermsPage({ params: { locale } }: { params: { locale: string } }) {
  const record: any = await fetchContentType(TERMS_UID, { locale, populate: "*" }, true);
  if (!record) notFound();

  return (
    <LegalPage
      locale={locale}
      title={record.Text || "Felhasználási feltételek"}
      lastUpdated={record.Last_updated || record.updatedAt || null}
      content={record.Content}
    />
  );
}
