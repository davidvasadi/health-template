import React from "react";
import { Metadata } from "next";
import { Inter } from "next/font/google";
import { generateMetadataObject } from "@/lib/shared/metadata";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CartProvider } from "@/context/cart-context";
import { ViewTransitions } from "next-view-transitions";
import fetchContentType from "@/lib/strapi/fetchContentType";
import CookieBanner from "@/components/consent/cookie-banner";

import RouteOverlay from "@/components/preload/overlay";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
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
            <Navbar data={pageData.navbar} locale={locale} />
            {children}
            <Footer data={pageData.footer} locale={locale} />
            <CookieBanner locale={locale as "hu" | "en" | "de"} privacyHref={`/${locale}/privacy`} />
          </div>

          {/* globális route overlay */}
          <RouteOverlay />
        </div>
      </CartProvider>
    </ViewTransitions>
  );
}
