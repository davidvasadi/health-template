"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSlugContext } from "@/app/context/SlugContext";
import { cn } from "@/lib/utils";

const PaletteVars = () => (
<style jsx global>{`
    :root{
      --breaker-50:#effefd;
      --breaker-100:#c7fffa;
      --breaker-200:#90fff6;
      --breaker-300:#51f7f0;
      --breaker-400:#1de4e2;
      --breaker-500:#04c8c8;
      --breaker-600:#009fa3;
      --breaker-700:#057c80;
      --breaker-800:#0a6165;
      --breaker-900:#0d5154;
      --breaker-950:#002e33;
    }
`}</style>
);


export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const { state } = useSlugContext();
  const { localizedSlugs } = state;

  const pathname = usePathname(); // Current path
  const segments = pathname.split("/"); // Split path into segments

  // Generate localized path for each locale
  const generateLocalizedPath = (locale: string): string => {
    if (!pathname) return `/${locale}`; // Default to root path for the locale

    // Handle homepage (e.g., "/en" -> "/fr")
    if (segments.length <= 2) {
      return `/${locale}`;
    }

    // Handle dynamic paths (e.g., "/en/blog/[slug]")
    if (localizedSlugs[locale]) {
      segments[1] = locale; // Replace the locale
      segments[segments.length - 1] = localizedSlugs[locale]; // Replace slug if available
      return segments.join("/");
    }

    // Fallback to replace only the locale
    segments[1] = locale;
    return segments.join("/");
  };

  return (
    <div className="flex gap-2 p-1 rounded-md">
      {!pathname.includes("/products/") && Object.keys(localizedSlugs).map((locale) => (
        <Link key={locale} href={generateLocalizedPath(locale)}>
          <div
         className={cn(
  // base
  "flex cursor-pointer items-center justify-center text-sm leading-[110%] w-8 py-1 rounded-md transition duration-200",
  "text-breaker-bay-950",
  // hover (palette)
  "hover:bg-breaker-bay-950 hover:text-breaker-bay-50/90",
  // finom belső vonal hoverkor (600-as árnyalat, border helyett)
  "hover:shadow-[inset_0_1px_0_rgba(0,159,163,0.45)]",
  // active (aktuális nyelv)
  locale === currentLocale
    ? "bg-breaker-bay-950 text-breaker-bay-50 shadow-[inset_0_1px_0_rgba(0,159,163,0.55)]"
    : ""
)}

          >
            {locale}
          </div>
        </Link>
      ))}
    </div>
  );
}
