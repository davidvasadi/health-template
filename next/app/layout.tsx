import type { Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { SlugProvider } from "./context/SlugContext";

export const viewport: Viewport = {
  themeColor: "#FAFAFA", // Tailwind neutral-50
};

// FONTOS: itt nincs params, mert ez nem dinamikus szegmens!
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="hu" suppressHydrationWarning>
      <head>
        {/* Consent Mode default – MINDENT tiltsunk, ami nem szükséges */}
        <Script id="ga-consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            gtag('consent', 'default', {
              ad_storage: 'denied',
              analytics_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              functionality_storage: 'granted',
              security_storage: 'granted'
            });
          `}
        </Script>

        {/* GA4 (gtag.js) – a consentet tiszteletben tartja */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { anonymize_ip: true });
              `}
            </Script>
          </>
        )}
      </head>

      <body suppressHydrationWarning>
        <SlugProvider>{children}</SlugProvider>
      </body>
    </html>
  );
}
