// next/lib/shared/PageContent.tsx
import { AmbientColor } from '@/components/decorations/ambient-color';
import DynamicZoneManager from '@/components/dynamic-zone/manager'
import { Breadcrumb, resolveBreadcrumb } from '@/components/navbar/breadcrumb';
import { cleanStructuredData } from '@/lib/shared/structured-data';
import { slimStrapi } from '@/lib/strapi/slim';

export default async function PageContent({ pageData }: { pageData: any }) {
  // a szakaszok kliens-komponensek: a képek felesleges Strapi-metaadata ne kerüljön a HTML-be (lib/strapi/slim.ts)
  const dynamicZone = slimStrapi(pageData?.dynamic_zone);

  const hasHero = Array.isArray(dynamicZone) && dynamicZone.some((c: any) => c?.__component === 'dynamic-zone.hero');
  const crumb = hasHero ? null : await resolveBreadcrumb(pageData?.locale, pageData?.slug ?? '');
  // cég-blokk a layoutból; ha van breadcrumb, annak BreadcrumbList-je a kódból jön
  const structuredData = cleanStructuredData(pageData?.seo?.structuredData, { stripBreadcrumb: !!crumb });

  return (
    <>
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      ) : null}


      <div className="relative overflow-hidden w-full">
        <AmbientColor />
        <Breadcrumb crumb={crumb} />
        {dynamicZone && (
          <DynamicZoneManager dynamicZone={dynamicZone} locale={pageData.locale} promoteFirstHeading />
        )}
      </div>
    </>
  );
}

