// components/practice/practice-card.tsx
"use client";

import React from "react";
import { Link } from "next-view-transitions";
import { StrapiImage } from "@/components/ui/strapi-image";
import {
  IconPlayerPlayFilled,
  IconChevronRight,
  IconClock,
  IconTools,
  IconGauge,
} from "@tabler/icons-react";

import {
  cn,
  bentoItem,
  videoCard,
  overlayGradient,
  microBadge,
  focusRing,
  difficultyTone,
  findDifficultyCard,
  isFeaturedFlag,
  type NormalizedPractice,
  type TDict,
} from "./practice-shared";

type Variant = "hero" | "wide" | "tile";

function Micro({
  icon,
  children,
  className,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn(microBadge, className)}>
      <span className="text-white/90">{icon}</span>
      {children}
    </span>
  );
}

export function PracticeCard({
  it,
  locale,
  baseSlug,
  t,
  variant = "tile",
  className,
}: {
  it: NormalizedPractice;
  locale: string;
  baseSlug: string;
  t: TDict;
  variant?: Variant;
  className?: string;
}) {
  const href = `/${locale}/${baseSlug}/${it.slug}`;

  const typeValue = String(
    it.iconCards?.type?.value ?? it.iconCards?.type?.text ?? ""
  );
  const clockValue = String(
    it.iconCards?.clock?.value ?? it.iconCards?.clock?.text ?? ""
  );

  const diffCard = findDifficultyCard(it.cards, it.iconCards);
  const diffValue = String(diffCard?.value ?? diffCard?.text ?? "").trim();
  const diffTone = difficultyTone(diffValue);

  const isFeatured = isFeaturedFlag(it?.p);

  const isHero = variant === "hero";
  const isWide = variant === "wide";

  const pad = isHero ? "p-8" : isWide ? "p-8" : "p-5";
  const titleClass = isHero
    ? "text-3xl sm:text-4xl font-semibold tracking-tight"
    : isWide
    ? "text-2xl font-semibold tracking-tight"
    : "text-base font-semibold tracking-tight";

  return (
    <div className={cn("group relative h-full outline-none", className)}>
      {/* ✅ Desktop: teljes kártya kattintható (overlay link) */}
      <Link
        href={href as never}
        className={cn(
          "hidden md:block absolute inset-0 z-10",
          focusRing
        )}
        aria-label={`${it.name} ${t.open}`}
      />

      <div className={cn(bentoItem, videoCard, "h-full")}>
        {/* Media */}
        <div className="absolute inset-0">
          {it.thumb.kind === "image" ? (
            <StrapiImage
              src={it.thumb.url}
              alt={it.name}
              width={1400}
              height={900}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-neutral-100 via-white to-neutral-200" />
          )}
        </div>

        {/* Overlay */}
        <div className={overlayGradient} />

        {/* Top badges */}
        <div className="absolute left-5 top-5 right-5 flex flex-wrap items-center gap-2">
          {isFeatured ? (
            <span className="px-3 py-1 bg-[rgba(0,150,158,1)] text-white text-[10px] font-semibold uppercase tracking-wide rounded-md shadow-lg">
              {t.featured}
            </span>
          ) : null}

          {clockValue ? (
            <Micro icon={<IconClock className="h-3.5 w-3.5" />}>
              {clockValue}
            </Micro>
          ) : null}

          {typeValue ? (
            <Micro icon={<IconTools className="h-3.5 w-3.5" />}>
              {typeValue}
            </Micro>
          ) : null}

          {diffValue ? (
            <Micro
              icon={<IconGauge className="h-3.5 w-3.5" />}
              className={cn(diffTone.wrap)}
            >
              {diffValue}
              <span
                className={cn(
                  "ml-2 inline-block h-1.5 w-1.5 rounded-full",
                  diffTone.dot
                )}
              />
            </Micro>
          ) : null}
        </div>

        {/* Bottom content */}
        <div className={cn("absolute inset-x-0 bottom-0", pad)}>
          <h3 className={cn(titleClass, "text-white leading-tight drop-shadow")}>
            {it.name}
          </h3>

          {/* LEÍRÁS: itt NE jelenjen meg, csak a videó megnyitása után (külön file kezeli) */}

          {/* CTA */}
          <div className={cn("mt-6 flex items-center gap-4", !isHero && "mt-4")}>
            {/* ✅ Mobil: CSAK a CTA legyen kattintható */}
            <Link
              href={href as never}
              className={cn(
                "md:hidden relative z-20 inline-flex items-center gap-4",
                focusRing
              )}
              aria-label={`${it.name} ${t.open}`}
            >
              <div
                className={cn(
                  "w-12 h-12 shrink-0 bg-[rgba(0,121,128,1)] rounded-full flex items-center justify-center text-white transition-transform shadow-lg shadow-[rgba(0,121,128,0.30)]",
                  "group-hover:scale-110"
                )}
              >
                <IconPlayerPlayFilled className="h-6 w-6" />
              </div>

              <span className="text-white text-sm font-semibold uppercase tracking-wide">
                {isHero ? t.start : t.open}
              </span>

              <IconChevronRight className="h-5 w-5 text-white/80" />
            </Link>

            {/* ✅ Desktop: vizuálisan ugyanaz, a katt az overlay link-en van */}
            <div className="hidden md:flex items-center gap-4">
              <div
                className={cn(
                  "w-12 h-12 shrink-0 bg-[rgba(0,121,128,1)] rounded-full flex items-center justify-center text-white transition-transform shadow-lg shadow-[rgba(0,121,128,0.30)]",
                  "group-hover:scale-110"
                )}
              >
                <IconPlayerPlayFilled className="h-6 w-6" />
              </div>

              <span className="text-white text-sm font-semibold uppercase tracking-wide">
                {isHero ? t.start : t.open}
              </span>

              <IconChevronRight className="h-5 w-5 text-white/80" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
