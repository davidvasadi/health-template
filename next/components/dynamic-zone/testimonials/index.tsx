"use client";

import React from "react";
import { TestimonialsSlider } from "./slider";
import { TestimonialsMarquee } from "./testimonials-marquee";
import { FeatureIconContainer } from "../features/feature-icon-container";
import { Heading } from "../../elements/heading";
import { Subheading } from "../../elements/subheading";
import { TbLocationBolt } from "react-icons/tb";
import { AmbientColor } from "../../decorations/ambient-color";

type Locale = "hu" | "en" | "de";
type UrlByLocale = string | Partial<Record<Locale, string>>;

function resolveReviewUrl(
  input: UrlByLocale | undefined,
  locale: Locale,
  fallback: string
): string {
  if (!input) return fallback;
  if (typeof input === "string") return input;

  const byLocale = input as Partial<Record<Locale, string>>;
  const exact = byLocale[locale];
  if (exact) return exact;

  const first = Object.values(byLocale).find(
    (v): v is string => typeof v === "string" && v.length > 0
  );
  if (first) return first;

  return fallback;
}

export const Testimonials = ({
  heading,
  sub_heading,
  testimonials,
  locale,
  googleReviewUrl = "https://www.google.com/maps/place/Csonka+Bence+Csontkovács,+Masszőr,+Mozgásterapeuta/@47.5605919,19.0923303,17z/data=!4m8!3m7!1s0x4741db3703e5eccb:0x45799a297460ef7a!8m2!3d47.5605919!4d19.0923303!9m1!1b1!16s%2Fg%2F11vwjbdm9y?entry=ttu",
}: {
  heading: string;
  sub_heading: string;
  testimonials: any[];
  locale?: Locale;
  googleReviewUrl?: UrlByLocale;
}) => {
  const resolveLocale = (fallback: Locale = "hu"): Locale => {
    if (locale) return locale;
    if (typeof navigator !== "undefined") {
      const l = navigator.language.toLowerCase();
      if (l.startsWith("de")) return "de";
      if (l.startsWith("en")) return "en";
    }
    return fallback;
  };
  const currentLocale: Locale = resolveLocale();

  const t = {
    hu: {
      cta: "A Google megnyitása a tapasztalat megosztásához",
      aria: "A Google megnyitása a tapasztalat megosztásához",
    },
    en: {
      cta: "Open Google to share an experience",
      aria: "Open Google to share an experience",
    },
    de: {
      cta: "Google öffnen, um eine Erfahrung zu teilen",
      aria: "Google öffnen, um eine Erfahrung zu teilen",
    },
  } as const;

  const defaultUrl =
    "https://www.google.com/maps/place/Csonka+Bence+Csontkovács,+Masszőr,+Mozgásterapeuta/@47.5605919,19.0923303,17z/data=!4m8!3m7!1s0x4741db3703e5eccb:0x45799a297460ef7a!8m2!3d47.5605919!4d19.0923303!9m1!1b1!16s%2Fg%2F11vwjbdm9y?entry=ttu";

  const reviewUrl = resolveReviewUrl(googleReviewUrl, currentLocale, defaultUrl);

  return (
    <div className="relative bg-white">
      <AmbientColor />

      {/* Fejléc */}
      <div className="pb-16 text-center">
        <FeatureIconContainer className="mx-auto flex h-12 w-12 items-center justify-center bg-white text-[var(--breaker-700)] shadow-sm">
          <TbLocationBolt className="h-6 w-6" />
        </FeatureIconContainer>

        <Heading className="mx-auto my-6 pt-4 text-[var(--breaker-950)]">{heading}</Heading>
        <Subheading className="mx-auto text-[var(--breaker-700)] mt-1 text-pretty">
          {sub_heading}
        </Subheading>

        {/* Google értékelés gomb */}
        <div className="mt-5 flex justify-center">
          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t[currentLocale].aria}
            className={[
              "inline-flex items-center gap-2 rounded-full select-none",
              "w-full max-w-[22rem] sm:w-auto sm:max-w-none",
              "justify-center text-center whitespace-normal break-words",
              "border border-neutral-200 bg-white text-neutral-900",
              "px-4 py-2 text-sm font-medium",
              "shadow-[0_1px_0_rgba(0,0,0,0.04)]",
              "hover:bg-neutral-50 active:bg-neutral-100",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(92,183,174,0.28)]",
            ].join(" ")}
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px] text-[var(--breaker-700)] flex-shrink-0"
              fill="currentColor"
            >
              <path d="M21.35 11.1h-9v2.9h5.2c-.23 1.36-1.56 3.99-5.2 3.99-3.13 0-5.68-2.59-5.68-5.79s2.55-5.79 5.68-5.79c1.78 0 2.97.76 3.65 1.41l2.49-2.39C17.56 3.7 15.63 3 13.35 3 7.93 3 3.5 7.48 3.5 12.9s4.43 9.9 9.85 9.9c5.67 0 9.4-3.99 9.4-9.61 0-.65-.07-1.07-.2-1.99z" />
            </svg>
            <span className="leading-tight text-center text-pretty">
              {t[currentLocale].cta}
            </span>
          </a>
        </div>
      </div>

      {/* Tartalom */}
      {Array.isArray(testimonials) && testimonials.length > 0 && (
        <div className="relative md:py-16 pb-16">
          <TestimonialsSlider testimonials={testimonials} />

          <div className="h-full w-full  bg-white">
            <div className="max-w-7xl mx-auto px-4">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--breaker-200)] to-transparent mb-8" />
            </div>
            <TestimonialsMarquee testimonials={testimonials} />
          </div>
        </div>
      )}
    </div>
  );
};
