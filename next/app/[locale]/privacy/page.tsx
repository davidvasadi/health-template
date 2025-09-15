// app/[locale]/privacy/page.tsx
import { notFound } from "next/navigation";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { LegalPage } from "@/components/legal/legal-page";
import { generateMetadataObject } from "@/lib/shared/metadata";

const UID = "privacy-policy"; // Strapi Single Type API ID (ellenőrizd a Basic settings-ben)

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const record: any = await fetchContentType(UID, { locale, populate: "*" }, true);
  const seo = record ? (Array.isArray(record.Seo) ? record.Seo[0] : record.Seo) : null;
  return generateMetadataObject(seo) ?? { title: "Adatkezelési tájékoztató" };
}

export default async function PrivacyPage({ params: { locale } }: { params: { locale: string } }) {
  const record: any = await fetchContentType(UID, { locale, populate: "*" }, true);
  if (!record) notFound();

  return (
    <LegalPage
      locale={locale}
      title={record.Text || "Adatkezelési tájékoztató"}
      lastUpdated={record.Last_updated || record.updatedAt || null}
      content={record.Content}
    />
  );
}
