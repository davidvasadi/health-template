"use client";
import React from "react";
import { motion } from "framer-motion";
import { Button } from "../elements/button";
import { Container } from "../container";
import Link from "next/link";
import { AmbientColor } from "../decorations/ambient-color";

// Inline arrow icon (no external deps)
const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12h14" />
    <path d="M13 5l7 7-7 7" />
  </svg>
);

/**
 * CTA section – premium chiropractic (all-in-one, no external assets)
 * - Original layout kept (copy left, buttons right)
 * - Full, clean WHITE background with a realistic-feel animated spine
 * - Pure inline SVG + CSS transforms (GPU-friendly, no heavy filters)
 * - Breaker Bay glass CTA variants included below
 */
export const CTA = ({
  heading,
  sub_heading,
  CTAs,
  locale,
}: {
  heading: string;
  sub_heading: string;
  CTAs: { text: string; URL: string; variant?: string }[];
  locale: string;
}) => {
  const variantClass = (v?: string) => {
    if (!v) return "cta-primary";
    switch (v) {
      case "primary":
      case "cta-primary":
        return "cta-primary";
      case "accent":
      case "cta-accent":
        return "cta-accent";
      case "ghost":
      case "cta-ghost":
        return "cta-ghost";
      default:
        return v;
    }
  };

  // Background now uses abstract fascia ribbons; remove vertebra/disc logic
  const vertebrae: any[] = [];
  const discs: any[] = [];

  return (
    <div className="relative isolate py-28 md:py-40 bg-white overflow-hidden cta-chiro">
      {/* subtle ambient tint */}
      <AmbientColor />

      {/* === CLEAN BACKGROUND (subtle, elegant) === */}
      <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-white" />

        {/* Minimal premium divider */}
        <div className="hidden md:block absolute inset-y-10 right-[8%] w-px gradient-divider" />

        {/* Embossed spine watermark (ultra subtle) */}
        <svg className="hidden md:block absolute right-[6%] top-1/2 -translate-y-1/2 w-[420px] h-[520px] spine-mark" viewBox="0 0 420 520" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          {/* soft outer glow line */}
          <path className="glow" d="M210 60 C190 140 230 220 210 300 C200 360 220 420 210 480" />
          {/* crisp spine curve */}
          <path d="M210 60 C190 140 230 220 210 300 C200 360 220 420 210 480" />
          {/* small ticks to hint vertebrae (no gimmicks) */}
          {Array.from({ length: 9 }).map((_, i) => {
            const y = 100 + i * 42;
            const len = i < 2 ? 28 : i < 6 ? 34 : 30;
            return (
              <line key={i} className="tick" x1={210 - len / 2} x2={210 + len / 2} y1={y} y2={y} />
            );
          })}
        </svg>
      </div>

      {/* === CONTENT === */}
      <Container className="relative z-10 w-full px-6 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 md:gap-12">
          <div className="flex-1 min-w-0">
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-breaker-bay-950 text-2xl md:text-4xl font-bold tracking-tight text-center md:text-left"
            >
              {heading}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
              className="max-w-xl mx-auto md:mx-0 mt-5 md:mt-6 text-sm md:text-base leading-relaxed text-neutral-500 text-center md:text-left"
            >
              {sub_heading}
            </motion.p>

            {/* Trust mini-bullets to reduce friction */}
            <ul className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-[12px] md:text-[13px] text-neutral-500">
              <li className="flex items-center gap-2"><span className="inline-block rounded-full w-1.5 h-1.5 bg-[var(--breaker-400)]"/>Személyre szabott kezelés</li>
              <li className="flex items-center gap-2"><span className="inline-block rounded-full w-1.5 h-1.5 bg-[var(--breaker-400)]"/>Gyors időpontfoglalás</li>
              <li className="flex items-center gap-2"><span className="inline-block rounded-full w-1.5 h-1.5 bg-[var(--breaker-400)]"/>Átlátható folyamat</li>
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative flex flex-wrap items-center justify-center md:justify-end gap-3 md:gap-4 pt-2"
          >
            {CTAs?.map((cta, index) => (
              <Button
                as={Link}
                key={index}
                href={`/${locale}${cta.URL}`}
                aria-label={`${cta.text}`}
                className={`group relative inline-flex items-center gap-2 px-5 md:px-6 py-3 md:py-3.5 rounded-xl font-medium shadow-sm transition will-change-transform ${variantClass(
                  cta.variant
                )} btn-sheen focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--breaker-300)] focus-visible:ring-offset-white ${index===0 ? 'cta-emphasis' : ''}`}
              >
                <span>{cta.text}</span>
                <ArrowRightIcon className="cta-arrow w-4 h-4" aria-hidden />
              </Button>
            ))}
            
        </motion.div>
        </div>
      </Container>

      {/* === GLOBAL STYLES === */}
      <style jsx global>{`
        /* using breaker-bay palette from global CSS (no local :root override) */

        @keyframes glassSheen {
          0% { transform: translateX(-120%); opacity: .0; }
          25% { opacity: .35; }
          60% { opacity: .0; }
          100% { transform: translateX(120%); opacity: .0; }
        }

        /* CTA üveg variánsok (border nélkül) */
        .cta-primary{
          background: linear-gradient(180deg, rgba(29,228,226,0.18) 0%, rgba(4,200,200,0.12) 100%);
          backdrop-filter: blur(14px) saturate(160%);
          -webkit-backdrop-filter: blur(14px) saturate(160%);
          color: var(--breaker-950) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.28), 0 10px 24px rgba(0,0,0,0.10);
        }
        .cta-accent{
          background: linear-gradient(180deg, rgba(144,255,246,0.18) 0%, rgba(199,255,250,0.10) 100%);
          backdrop-filter: blur(14px) saturate(160%);
          -webkit-backdrop-filter: blur(14px) saturate(160%);
          color: var(--breaker-900) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.28), 0 10px 24px rgba(0,0,0,0.08);
        }
        .cta-ghost{
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(10px) saturate(140%);
          -webkit-backdrop-filter: blur(10px) saturate(140%);
          color: var(--breaker-800) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.22);
        }
        .cta-primary:hover,.cta-accent:hover,.cta-ghost:hover{ transform: translateY(-1px); }

        /* Button sheen */
        .btn-sheen{ position: relative; overflow: hidden; }
        .btn-sheen::after{
          content: "";
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(75deg, transparent 35%, rgba(255,255,255,.45) 50%, transparent 65%);
          transform: translateX(-120%);
          opacity: 0;
        }
        .btn-sheen:hover::after{ animation: glassSheen 1200ms ease-out forwards; }

        /* Minimal premium accents */
        .gradient-divider{ background: linear-gradient(to bottom, color-mix(in srgb, var(--breaker-400) 26%, transparent), transparent); opacity:.35; }
        .spine-mark path{ stroke: var(--breaker-700); stroke-opacity: .08; stroke-width: 2; }
        .spine-mark .tick{ stroke: var(--breaker-600); stroke-opacity: .08; stroke-width: 2; }
        .spine-mark .glow{ stroke: var(--breaker-300); stroke-opacity: .08; stroke-width: 10; }

        /* Conversion helpers */
        .cta-arrow{ transition: transform .25s ease; }
        .group:hover .cta-arrow{ transform: translateX(4px); }
        .group:active{ transform: translateY(1px); }
        .cta-emphasis{ box-shadow: 0 8px 28px rgba(0,0,0,0.08), 0 0 0 2px color-mix(in srgb, var(--breaker-300) 26%, transparent); }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce){
          .btn-sheen::after{ animation: none !important; }
        }
      `}</style>
    </div>
  );
};

