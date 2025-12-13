import { notFound } from "next/navigation";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { LegalPage } from "@/components/legal/legal-page";

const TERMS_UID = "terms-of-service"; // ha nálad "terms", írd át

export async function generateMetadata() {
  return {
    title: "Felhasználási feltételek",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function TermsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
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
