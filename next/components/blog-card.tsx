"use client";

import { Link } from "next-view-transitions";
import React from "react";
import Balancer from "react-wrap-balancer";
import { BlurImage } from "./blur-image";
import { truncate } from "@/lib/utils";
import { format } from "date-fns";
import { strapiImage } from "@/lib/strapi/strapiImage";
import { Article } from "@/types/types";
import { motion } from "framer-motion";

const spring = { type: "spring" as const, stiffness: 520, damping: 30, mass: 0.7 };

const Labels: Record<string, { read: string }> = {
  en: { read: "Read" },
  hu: { read: "Tovább" },
  de: { read: "Mehr" },
};

/** CTA "pill" – VISUAL ONLY (nem Link), hover csak desktopon */
function ReadPillVisual({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className="
        shrink-0
        inline-flex items-center justify-center
        min-h-[44px] px-4 rounded-full
        bg-white/90 border border-neutral-200/60
        text-neutral-900 text-[13px] font-medium
        shadow-[0_10px_28px_rgba(0,0,0,0.06)]
        transition
        group-hover:bg-white group-hover:border-neutral-300/60
      "
    >
      <span>{label}</span>

      {/* ✅ a te chevronod (nincs kör) */}
      <span
        aria-hidden
        className="ml-2 inline-flex items-center text-neutral-500 transition-transform group-hover:translate-x-[1px]"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="M10 7l5 5-5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </span>
  );
}

/** CTA "pill" – CLICKABLE (Link) mobilra */
function ReadPillLink({ label, href, ariaLabel }: { label: string; href: string; ariaLabel: string }) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="
        group
        shrink-0
        inline-flex items-center justify-center
        min-h-[44px] px-4 rounded-full
        bg-white/90 border border-neutral-200/60
        text-neutral-900 text-[13px] font-medium
        shadow-[0_10px_28px_rgba(0,0,0,0.06)]
        active:scale-[0.99]
        transition
        focus:outline-none focus-visible:ring-2 focus-visible:ring-breaker-bay-400/50
      "
    >
      <span>{label}</span>
      <span aria-hidden className="ml-2 inline-flex items-center text-neutral-500">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="M10 7l5 5-5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}

export const BlogCard = ({ article, locale }: { article: Article; locale: string }) => {
  const readLabel = Labels[locale]?.read || Labels.en.read;
  const href = `/${locale}/blog/${article.slug}`;
  const dateText = article.publishedAt ? format(new Date(article.publishedAt), "MMMM dd, yyyy") : "";

  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={spring} className="h-full">
      {/* OUTER CARD WRAPPER (nem Link!) */}
      <div
        className="
          group grid grid-cols-1 md:grid-rows-2 rounded-3xl overflow-hidden
          bg-white ring-1 ring-neutral-200 hover:ring-neutral-300
          transition-shadow shadow-sm hover:shadow-lg
          focus-within:outline-none focus-within:ring-2 focus-within:ring-breaker-bay-400/50
        "
      >
        {/* KÉP — NEM kattintható */}
        <div className="relative bg-neutral-100 md:h-full md:min-h-[300px] lg:min-h-[340px]">
          <div className="block md:hidden" aria-hidden style={{ paddingTop: "62.5%" }} />
          {article.image ? (
            <>
              <BlurImage
                src={strapiImage(article.image.url)}
                alt={article.title}
                width={1600}
                height={1000}
                className="
                  absolute inset-0 h-full w-full object-cover
                  transition-transform duration-300 group-hover:scale-[1.02]
                "
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent md:hidden" />
            </>
          ) : (
            <div className="absolute inset-0 bg-neutral-100" />
          )}
        </div>

        {/* =========================
            MOBILE (<md): NEM link az egész content
            CSAK a CTA gomb visz át
           ========================= */}
        <div className="md:hidden p-5 grid grid-rows-[auto_1fr_auto] gap-3 h-full">
          <div className="flex gap-1.5 flex-wrap">
            {article.categories?.map((c, i) => (
              <span
                key={c.name + i}
                className="text-[11px] font-semibold uppercase rounded-full bg-neutral-100 text-neutral-700 px-2 py-0.5 ring-1 ring-neutral-200"
              >
                {c.name}
              </span>
            ))}
          </div>

          <div className="min-w-0">
            <h3
              className="text-neutral-900 text-xl font-bold tracking-tight leading-snug"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical" as any,
                overflow: "hidden",
              }}
            >
              <Balancer>{article.title}</Balancer>
            </h3>

            {article.description ? (
              <p
                className="mt-2 text-neutral-600 text-sm leading-relaxed"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical" as any,
                  overflow: "hidden",
                }}
              >
                {truncate(article.description, 220)}
              </p>
            ) : null}
          </div>

          {/* ✅ CTA BAL, dátum JOBB — csak a gomb kattintható */}
          <div className="mt-2 flex items-center gap-3">
            <ReadPillLink
              href={href}
              label={readLabel}
              ariaLabel={`${readLabel}: ${article.title}`}
            />
            <span className="ml-auto text-neutral-500 text-xs">{dateText}</span>
          </div>
        </div>

        {/* =========================
            DESKTOP (>=md): marad minden úgy ahogy volt
            a teljes tartalom kattintható
           ========================= */}
        <Link
          href={href}
          className="hidden md:grid p-5 md:p-7 grid-rows-[auto_1fr_auto] gap-3 h-full outline-none"
          aria-label={`${article.title} – ${readLabel}`}
        >
          <div className="flex gap-1.5 flex-wrap">
            {article.categories?.map((c, i) => (
              <span
                key={c.name + i}
                className="text-[11px] font-semibold uppercase rounded-full bg-neutral-100 text-neutral-700 px-2 py-0.5 ring-1 ring-neutral-200"
              >
                {c.name}
              </span>
            ))}
          </div>

          <div className="min-w-0">
            <h3
              className="text-neutral-900 text-xl md:text-2xl font-bold tracking-tight leading-snug group-hover:text-breaker-bay-700 transition-colors"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical" as any,
                overflow: "hidden",
              }}
            >
              <Balancer>{article.title}</Balancer>
            </h3>

            {article.description ? (
              <p
                className="mt-2 text-neutral-600 text-sm md:text-base leading-relaxed"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical" as any,
                  overflow: "hidden",
                }}
              >
                {truncate(article.description, 220)}
              </p>
            ) : null}
          </div>

          {/* ✅ CTA BAL OLDALT, dátum JOBBRA (vizuál), de mivel az egész Link, nested a-t nem csinálunk */}
          <div className="mt-2 flex items-center gap-3">
            <ReadPillVisual label={readLabel} />
            <span className="ml-auto text-neutral-500 text-xs md:text-sm">{dateText}</span>
          </div>
        </Link>
      </div>
    </motion.div>
  );
};
