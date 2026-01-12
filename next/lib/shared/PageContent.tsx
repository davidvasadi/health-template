// next/lib/shared/PageContent.tsx
import { AmbientColor } from '@/components/decorations/ambient-color';
import DynamicZoneManager from '@/components/dynamic-zone/manager'

export default function PageContent({ pageData }: { pageData: any }) {
  const dynamicZone = pageData?.dynamic_zone;

  return (
    <>
      {pageData?.seo?.structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(pageData.seo.structuredData),
          }}
        />
      ) : null}

      <div className="relative overflow-hidden w-full">
        <AmbientColor />
        {dynamicZone && (
          <DynamicZoneManager dynamicZone={dynamicZone} locale={pageData.locale} />
        )}
      </div>
    </>
  );
}

