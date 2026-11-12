// app/[locale]/layout.tsx
import React from "react";
import { Metadata } from "next";
import localFont from "next/font/local";
import { generateMetadataObject } from "@/lib/shared/metadata";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CartProvider } from "@/context/cart-context";
import { ViewTransitions } from "next-view-transitions";
import fetchContentType from "@/lib/strapi/fetchContentType";
import CookieBanner from "@/components/consent/cookie-banner";
import { businessJsonLd } from "@/lib/shared/structured-data";

import RouteOverlay from "@/components/preload/overlay";

// Inter a projektbe téve (2026-11): a build nem a Google Fonts-ról tölti le — a Next 14.2.5 font-letöltője egy furcsa
// Google-válasznál elbukott, és vele a deploy is. Ugyanaz a betű, mint amit a Google adott: Inter (google/fonts, OFL),
// opsz=14 rögzítve (a Google is ezt a példányt szolgálta ki), 400–900 vastagság, latin + latin-ext (ő, ű).
const inter = localFont({
  src: "../fonts/Inter-latin-var.woff2",
  weight: "400 900",
  style: "normal",
  display: "swap",
});

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
        <div className={[inter.className, "bg-white"].join(" ")}>
          {/* SSR cover: stabil, nincs fehér villanás (fix bg) */}
          <div id="ssr-preload-cover" className="fixed inset-0 z-[9998] bg-white" />

          {/* app-shell wrapper (NINCS transform rajta) */}
          <div id="app-shell">
            {/* Központi, részletes cégadatok (Chiropractor/MedicalBusiness) minden oldalon */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(await businessJsonLd(locale)) }} />
            <Navbar data={pageData.navbar} locale={locale} />
            {children}
            <Footer data={pageData.footer} locale={locale} />
            <CookieBanner locale={locale as "hu" | "en" | "de"} />
          </div>

          {/* globális route overlay */}
          <RouteOverlay />
        </div>
      </CartProvider>
    </ViewTransitions>
  );
}
