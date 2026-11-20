// app/[locale]/layout.tsx
import React from "react";
import { Metadata } from "next";
import { generateMetadataObject } from "@/lib/shared/metadata";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CartProvider } from "@/context/cart-context";
import { ViewTransitions } from "next-view-transitions";
import fetchContentType from "@/lib/strapi/fetchContentType";
import CookieBanner from "@/components/consent/cookie-banner";
import { businessJsonLd } from "@/lib/shared/structured-data";

import { FirstVisitPreloader } from "@/components/preload/first-visit-preloader";


export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug?: string };
}): Promise<Metadata> {
  const pageData = await fetchContentType(
    "global",
    { filters: { locale: params.locale }, populate: "seo.metaImage" },
    true
  );

  return generateMetadataObject(pageData?.seo, {
    locale: params.locale as any,
    pathname: `/${params.locale}/`,
  });
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const pageData = await fetchContentType("global", { filters: { locale } }, true);

  return (
    <ViewTransitions>
      <CartProvider>
        <div className="bg-white">
          {/* első látogatás: logó-preloader (CSS, munkamenetenként egyszer) — a régi fehér takaró és lapváltás-fedőréteg helyett */}
          <FirstVisitPreloader />

          {/* app-shell wrapper (NINCS transform rajta) */}
          <div id="app-shell">
            {/* Központi, részletes cégadatok (Chiropractor/MedicalBusiness) minden oldalon */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(await businessJsonLd(locale)) }} />
            <Navbar data={pageData.navbar} locale={locale} />
            {children}
            <Footer data={pageData.footer} locale={locale} />
            <CookieBanner locale={locale as "hu" | "en" | "de"} />
          </div>

        </div>
      </CartProvider>
    </ViewTransitions>
  );
}
