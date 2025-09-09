"use client";

import React from "react";
import { TestimonialsSlider } from "./slider";
import { TestimonialsMarquee } from "./testimonials-marquee";
import { FeatureIconContainer } from "../features/feature-icon-container";
import { Heading } from "../../elements/heading";
import { Subheading } from "../../elements/subheading";
import { TbLocationBolt } from "react-icons/tb";
import { AmbientColor } from "../../decorations/ambient-color";

/**
 * Testimonials szekció — Apple-es, fehér hátterű, Breaker Bay akcent
 * ------------------------------------------------------------------
 * • Fejléc: ikon + cím + alcím + (beépített) Google-értékelés gomb
 * • Alatta: Slider (3 kiemelt vélemény) + elválasztó + két soros Marquee
 * • A gomb: outline pill, hajszál border, monokróm “G” ikon, finom hover
 */
export const Testimonials = ({
  heading,
  sub_heading,
  testimonials,
  googleReviewUrl = "#", // <- IDE add a saját Google review linkedet (Place/Review URL)
}: {
  heading: string;
  sub_heading: string;
  testimonials: any[];
  googleReviewUrl?: string;
}) => {
  return (
    // Gyökér: fehér háttér + (ha használod) ambient dísz
    <div className="relative bg-white">
      <AmbientColor />

      {/* Fejléc: középre zárt, sok levegő, minimal tipó */}
      <div className="pb-16 text-center">
        {/* Ikon-kapszula (diszkrét keret, Breaker Bay szöveg) */}
        <FeatureIconContainer className="mx-auto flex h-12 w-12 items-center justify-center bg-white text-[var(--breaker-700)] shadow-sm">
          <TbLocationBolt className="h-6 w-6" />
        </FeatureIconContainer>

        {/* Főcím + alcím */}
        <Heading className="pt-4 text-[var(--breaker-950)]">{heading}</Heading>
        <Subheading className="text-[var(--breaker-700)] mt-1">
          {sub_heading}
        </Subheading>

        {/* Google értékelés gomb (INLINE, külön komponens nélkül)
           ----------------------------------------------------------------
           • Apple-es outline pill: hajszál border, finom árnyék
           • Monokróm Google “G” ikon (elegánsabb, mint a színes)
           • Hover: neutrális 50, Fókusz-ring: Breaker Bay áttetsző
        */}
        <div className="mt-5 flex justify-center">
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Értékeld a rendelőt a Google-on"
            className={[
              "inline-flex items-center gap-2 rounded-full select-none",
              "border border-neutral-200 bg-white text-neutral-900",
              "px-4 py-2 text-sm font-medium",
              "shadow-[0_1px_0_rgba(0,0,0,0.04)]",
              "hover:bg-neutral-50 active:bg-neutral-100",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(92,183,174,0.28)]",
            ].join(" ")}
          >
            {/* Monokróm Google “G” — inline SVG, nincs extra import */}
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px] text-breaker-bay-700"
              fill="currentColor"
            >
              {/* Egyszerűsített “G” alak (brand-safe, monokróm) */}
              <path d="M21.35 11.1h-9v2.9h5.2c-.23 1.36-1.56 3.99-5.2 3.99-3.13 0-5.68-2.59-5.68-5.79s2.55-5.79 5.68-5.79c1.78 0 2.97.76 3.65 1.41l2.49-2.39C17.56 3.7 15.63 3 13.35 3 7.93 3 3.5 7.48 3.5 12.9s4.43 9.9 9.85 9.9c5.67 0 9.4-3.99 9.4-9.61 0-.65-.07-1.07-.2-1.99z" />
            </svg>
            <span className="leading-none">Értékeld a rendelőt a Google-on</span>
          </a>
        </div>
      </div>

      {/* Tartalom: slider + elválasztó + marquee
         - Védőfeltétel: csak akkor render, ha ténylegesen van adat */}
      {Array.isArray(testimonials) && testimonials.length > 0 && (
        <div className="relative md:py-16 pb-16">
          <TestimonialsSlider testimonials={testimonials} />

          {/* Hajszál elválasztó + két soros marquee */}
          <div className="h-full w-full mt-16 bg-white">
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
