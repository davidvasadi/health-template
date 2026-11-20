// app/layout.tsx
// "use client";

import type { Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { SlugProvider } from "./context/SlugContext";
import GAViews from "@/lib/analytics/ga-views";
import { Suspense } from "react";
import localFont from "next/font/local";

// Inter a <body>-n, hogy MINDENHOL ez legyen (a body-ba portált panelek, pl. a nyelvválasztó, és a 404-es oldal is;
// korábban csak a [locale] layout egy belső div-jén volt).
// A projektbe téve (2026-11): a build nem a Google Fonts-ról tölti le — a Next 14.2.5 font-letöltője egy furcsa
// Google-válasznál elbukott, és vele a deploy is. Ugyanaz a betű, mint amit a Google adott: Inter (google/fonts, OFL),
// opsz=14 rögzítve (a Google is ezt a példányt szolgálta ki), 400–900 vastagság, latin + latin-ext (ő, ű).
const inter = localFont({
  src: "./fonts/Inter-latin-var.woff2",
  weight: "400 900",
  style: "normal",
  display: "swap",
});
export const viewport: Viewport = {
  
  themeColor: "#FAFAFA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="hu" suppressHydrationWarning>
      <head>
        {/* 1) Consent Mode – default deny (essentials granted) */}
        <Script id="ga-consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: 'denied',
              analytics_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              functionality_storage: 'granted',
              security_storage: 'granted',
              wait_for_update: 500
            });
          `}
        </Script>

        {/* 2) GA4 betöltése – a consentet tiszteletben tartja */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());

                // Fontos: send_page_view: false (mi küldjük manuálisan)
                gtag('config', '${GA_ID}', {
                  anonymize_ip: true,
                  send_page_view: false
                });

                // Segédfüggvény manuális page_view-hez (SPA váltásokhoz)
                window.__sendPV = function() {
                  try {
                    gtag('event', 'page_view', {
                      page_location: location.href,
                      page_title: document.title
                    });
                  } catch(e){}
                };
              `}
            </Script>
          </>
        )}

        {/* 3) Consent replay – ha korábban granted, frissít és küld 1 PV-t */}
        {GA_ID && (
          <Script id="ga-consent-replay" strategy="afterInteractive">
            {`
              (function(){
                try {
                  var choice = localStorage.getItem('consent.choice.v1');
                  if (!choice) return;

                  function gtag(){window.dataLayer.push(arguments);}
                  var val = choice === 'granted' ? 'granted' : 'denied';

                  gtag('consent', 'update', {
                    ad_storage: val,
                    analytics_storage: val,
                    ad_user_data: val,
                    ad_personalization: val
                  });

                  if (val === 'granted' && typeof window.__sendPV === 'function') {
                    window.__sendPV();
                  }
                } catch (e) {}
              })();
            `}
          </Script>
        )}
      </head>

      <body className={inter.className} suppressHydrationWarning>
        <SlugProvider>
          {children}
        <Suspense fallback={null}>
          <GAViews />
        </Suspense>
          </SlugProvider>

        {/* GAViews CSAK Suspense-ben → nem csapódik el a /_not-found prerender */}
      </body>
    </html>
  );
}
