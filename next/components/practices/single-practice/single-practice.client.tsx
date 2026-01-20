"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "next-view-transitions";
import { cn } from "@/lib/utils";
import { IconArrowLeft } from "@tabler/icons-react";

import { UI, baseLocale } from "./i18n";
import { get, unwrapArrayRel, norm, localizeHref, safeLower } from "./strapi";
import { pickIconCards } from "./cards";
import { shell, focusRing } from "./tokens";

import {
  HeroMedia,
  CategoryChipsRow,
  MobileStatsCtaStack,
  CTAGroup,
  ProDescriptionCard,
  StepsCard,
  MediaGallery,
  PractitionerCard,
  ImportantCallout,
  PracticeStatsCard,
} from "./components";

/* ───────────────────────────────────────────────────────────────
  Categories resolver (KEEP)
─────────────────────────────────────────────────────────────── */
function extractCategoryNames(p: any): string[] {
  const candidates = [
    p?.categories,
    p?.category,
    p?.practice_categories,
    p?.practice_category,
    p?.tags,
    p?.practice_tags,
  ];
  for (const rel of candidates) {
    const arr = unwrapArrayRel(rel);
    if (arr.length) {
      return arr
        .map((c: any) => c?.name || c?.title || c?.label || c?.slug)
        .filter(Boolean)
        .map(String)
        .slice(0, 8);
    }
  }
  if (Array.isArray(p?.categories)) {
    return p.categories
      .map((c: any) => c?.name || c?.title || c?.label || c)
      .filter(Boolean)
      .map(String)
      .slice(0, 8);
  }
  return [];
}

export function SinglePractice({
  practice,
  locale,
  baseSlug = "practices",
}: {
  practice: any;
  locale: string;
  baseSlug?: string;
}) {
  const t = UI[baseLocale(locale)];
  const p = get(practice);
  const safeBase = norm(baseSlug) || "practices";

  const title = p?.practice?.heading || p?.name || "Gyakorlat";

  const desc = p?.practice?.description || p?.description || null;
  const steps = p?.practice?.steps || null;
  const important = (p?.practice?.quote as string | undefined) || undefined;

  const media = useMemo(() => unwrapArrayRel(p?.media), [p?.media]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!media.length) return;
    if (activeIndex > media.length - 1) setActiveIndex(0);
  }, [media.length, activeIndex]);

  const active = media?.[activeIndex];

  const cards = Array.isArray(p?.practice_card) ? p.practice_card : [];
  const iconCards = useMemo(() => pickIconCards(cards), [cards]);

  const ctas = Array.isArray(p?.button) ? p.button : p?.button ? [p.button] : [];
  const primaryCta = ctas?.[0];
  const primaryHref = primaryCta?.URL
    ? localizeHref(primaryCta.URL, locale)
    : `/${locale}/${safeBase}`;
  const primaryText = primaryCta?.text || "Időpontot foglalok";

  const [shareHref, setShareHref] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") setShareHref(window.location.href);
  }, []);

  const onShare = useCallback(async () => {
    try {
      if (!shareHref) return;
      if (navigator.share) {
        await navigator.share({ title: String(title), url: shareHref });
      } else {
        await navigator.clipboard.writeText(shareHref);
      }
    } catch {
      // ignore
    }
  }, [shareHref, title]);

  const categories = useMemo(() => extractCategoryNames(p), [p]);

  // hide mobile chip row when video is playing
  const [isPlaying, setIsPlaying] = useState(false);

  const extraSummary = useMemo(() => {
    const used = new Set(["clock", "difficult", "type"]);
    return cards
      .filter((x: any) => !used.has(safeLower(x?.icon)))
      .filter((x: any) => x?.label || x?.value)
      .slice(0, 6);
  }, [cards]);

  const duration =
    iconCards.clock?.value
      ? { label: iconCards.clock?.label || t.duration, value: String(iconCards.clock.value) }
      : undefined;

  const difficulty =
    iconCards.difficult?.value
      ? { label: iconCards.difficult?.label || t.difficulty, value: String(iconCards.difficult.value) }
      : undefined;

  const type =
    iconCards.type?.value
      ? { label: iconCards.type?.label || t.type, value: String(iconCards.type.value) }
      : undefined;

  return (
    <section className={cn("relative w-full", shell)}>
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* nálad: csak mx-auto + py */}
      <div className="mx-auto py-4 sm:py-6">
        <div className="mb-5">
          <Link
            href={`/${locale}/${safeBase}` as never}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-[rgba(5,124,128,1)] hover:bg-black/5 transition",
              focusRing
            )}
          >
            <IconArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT */}
          <div className="lg:col-span-8 space-y-5">
            {/* HERO */}
            <HeroMedia
              practice={p}
              active={active}
              title={title}
              categories={categories}
              onPlayingChange={setIsPlaying}
            />

            {/* MOBILE chips under hero */}
            <CategoryChipsRow categories={categories} hidden={isPlaying} variant="mobile" />

            {/* MOBILE: stats+cta stack, THEN gallery closer to hero */}
            <div className="lg:hidden space-y-3">
              <MobileStatsCtaStack
                title={t.dataTitle}
                duration={duration}
                difficulty={difficulty}
                type={type}
                primaryHref={primaryHref}
                primaryText={primaryText}
                shareLabel={t.share}
                onShare={onShare}
              />

              {/* ✅ Gallery moved up (under hero area) */}
              <MediaGallery
                title={t.gallery}
                media={media}
                practice={p}
                activeIndex={activeIndex}
                onSelect={setActiveIndex}
              />

              <PractitionerCard
                avatar={p?.avatar}
                name={p?.avatar_name || t.expertFallbackName}
                role={p?.avatar_description}
                verified
              />

              <ImportantCallout label={t.important} text={important} />
            </div>

            {/* DESKTOP: Gallery directly under hero as well */}
            <div className="hidden lg:block">
              <MediaGallery
                title={t.gallery}
                media={media}
                practice={p}
                activeIndex={activeIndex}
                onSelect={setActiveIndex}
              />
            </div>

            {/* Description */}
            {desc ? (
              <ProDescriptionCard
                title={t.descTitle}
                content={desc}
                moreLabel="Tovább"
                lessLabel="Kevesebb"
                collapsedHeight={260}
              />
            ) : null}

            {/* Steps */}
            {steps ? <StepsCard title={t.stepsTitle} steps={steps} /> : null}
          </div>

          {/* RIGHT desktop */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="lg:sticky lg:top-6 space-y-4">
              <PracticeStatsCard title={t.dataTitle} duration={duration} difficulty={difficulty} type={type} />

              <CTAGroup
                primaryHref={primaryHref}
                primaryText={primaryText}
                shareLabel={t.share}
                onShare={onShare}
              />

              <PractitionerCard
                avatar={p?.avatar}
                name={p?.avatar_name || t.expertFallbackName}
                role={p?.avatar_description}
                verified
              />

              <ImportantCallout label={t.important} text={important} />

              {extraSummary?.length ? (
                <div className="pt-2">
                  <div className="text-sm font-semibold text-neutral-900">{t.summary}</div>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {extraSummary.map((it: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-black/5 bg-white shadow-sm p-3"
                      >
                        <div className="text-[11px] font-medium text-neutral-600">{String(it?.label ?? "")}</div>
                        <div className="mt-1 text-sm font-semibold text-neutral-900">{String(it?.value ?? "")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
