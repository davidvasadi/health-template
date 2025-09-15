// app/[locale]/terms/page.tsx
import { notFound } from "next/navigation";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { LegalPage } from "@/components/legal/legal-page";
import { generateMetadataObject } from "@/lib/shared/metadata";

// ÁLLÍTSD BE PONTOSAN a Strapi “API ID (Singular)” értékére!
const UID = "terms"; // vagy "terms-of-service" – aszerint, amit a Strapi mutat

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const record: any = await fetchContentType(UID, { locale, populate: "*" }, true);
  const seo = record ? (Array.isArray(record.Seo) ? record.Seo[0] : record.Seo) : null;
  return generateMetadataObject(seo) ?? { title: "Felhasználási feltételek" };
}

export default async function TermsPage({ params: { locale } }: { params: { locale: string } }) {
  const record: any = await fetchContentType(UID, { locale, populate: "*" }, true);
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
