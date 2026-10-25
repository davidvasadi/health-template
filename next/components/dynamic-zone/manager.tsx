import React from 'react';
import dynamic from 'next/dynamic';

interface DynamicZoneComponent {
  __component: string;
  id: number;
  [key: string]: any;
}

interface Props {
  dynamicZone: DynamicZoneComponent[];
  locale: string;
  // Csak olyan oldalon kapcsoljuk be, ahol a sablon maga nem ad H1-et (CMS "pages").
  // Ha ilyenkor nincs Hero a zónában, az első FAQ/űrlap címe lesz az oldal H1-e.
  promoteFirstHeading?: boolean;
}

// Ezek a szekciók tudnak H1-et adni, ha az oldalon nincs Hero
const HEADING_PROMOTABLE = ['dynamic-zone.faq', 'dynamic-zone.form-next-to-section'];

// FONTOS: korábban MINDEN dynamic-zone szekció `ssr:false` volt, ami azt
// jelentette, hogy a főoldal teljes szöveges tartalma (címsorok, FAQ,
// szolgáltatás-leírások stb.) kizárólag kliensoldali JS-futás UTÁN jelent
// meg — a Google (és minden más crawler) első, nyers HTML-es betöltéskor
// GYAKORLATILAG ÜRES oldalt látott a nav/footer kivételével. Csak a Hero
// 3D (WebGL) jelenete igényel ténylegesen kliens-only renderelést — azt
// kiszerveztük a hero/spine-scene.tsx fájlba, a Hero maga (H1, alcím,
// CTA-k) mostantól szerveroldalon is renderelődik.
const componentMapping: { [key: string]: any } = {
  'dynamic-zone.hero': dynamic(() => import('./hero').then(mod => mod.Hero)),
  'dynamic-zone.features': dynamic(() => import('./features').then(mod => mod.Features)),
  'dynamic-zone.testimonials': dynamic(() => import('./testimonials').then(mod => mod.Testimonials)),
  'dynamic-zone.how-it-works': dynamic(() => import('./how-it-works').then(mod => mod.HowItWorks)),
  'dynamic-zone.brands': dynamic(() => import('./brands').then(mod => mod.Brands)),
  'dynamic-zone.pricing': dynamic(() => import('./pricing').then(mod => mod.Pricing)),
  'dynamic-zone.vouchers': dynamic(() => import('./vouchers').then(mod => mod.Vouchers)),
  'dynamic-zone.experience': dynamic(() => import('./experience').then(mod => mod.Experience)),
  'dynamic-zone.practices': dynamic(() => import('./practices').then(mod => mod.Practices)),
  'dynamic-zone.about': dynamic(() => import('./about/about').then(mod => mod.About)),
  'dynamic-zone.launches': dynamic(() => import('./launches').then(mod => mod.Launches)),
  'dynamic-zone.cta': dynamic(() => import('./cta').then(mod => mod.CTA)),
  'dynamic-zone.form-next-to-section': dynamic(() => import('./form').then(mod => mod.Form)),
  'dynamic-zone.faq': dynamic(() => import('./faq').then(mod => mod.FAQ)),
  'dynamic-zone.related-products': dynamic(() => import('./related-products').then(mod => mod.RelatedProducts)),
  'dynamic-zone.related-articles': dynamic(() => import('./related-articles').then(mod => mod.RelatedArticles))
}

const DynamicZoneManager: React.FC<Props> = ({ dynamicZone, locale, promoteFirstHeading = false }) => {
  const hasHero = dynamicZone.some((c) => c.__component === 'dynamic-zone.hero');
  const h1Index =
    promoteFirstHeading && !hasHero
      ? dynamicZone.findIndex((c) => HEADING_PROMOTABLE.includes(c.__component))
      : -1;

  return (
    <div>
      {
        dynamicZone.map((componentData, index) => {
          const Component = componentMapping[componentData.__component];
          if (!Component) {
            console.warn(`No component found for: ${componentData.__component}`);
            return null;
          }
          const headingProps = HEADING_PROMOTABLE.includes(componentData.__component)
            ? { headingAs: index === h1Index ? 'h1' : 'h2' }
            : {};
          return <Component key={componentData.id} {...componentData} {...headingProps} locale={locale} />;
        })}
    </div>
  );
};

export default DynamicZoneManager;
