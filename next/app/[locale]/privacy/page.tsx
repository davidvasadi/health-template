import { notFound } from "next/navigation";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { LegalPage } from "@/components/legal/legal-page";

const UID = "privacy-policy";

export async function generateMetadata() {
  return {
    title: "Adatkezelési tájékoztató",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PrivacyPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
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
