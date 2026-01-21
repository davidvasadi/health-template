// components/practice/practice-items.tsx
"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  IconSearch,
  IconCircleCheck,
  IconAdjustmentsHorizontal,
  IconSparkles,
  IconChevronRight,
  IconMessageDots,
} from "@tabler/icons-react";

import { Heading } from "@/components/elements/heading";
import { Subheading } from "@/components/elements/subheading";

import {
  UI,
  baseLocale,
  cn,
  norm,
  bentoGrid,
  bentoItem,
  filterChip,
  filterChipActive,
  focusRing,
  glassPanel,
  normalizeCategory,
  type TDict,
  type PracticeCategory,
  typo,
} from "./practice-shared";

import { MobileDrawer, QuickCategoryChips, FilterPanel } from "./practice-filters";
import { PracticeCard } from "./practice-card";
import { usePracticeIndex, type Preset, parseMinutes, difficultyLevel } from "./practice-index";
import { CategoryTile, DifficultyFilterTile, ContactTile, BannerTile, PresetChip } from "./practice-tiles";

export function PracticeItems({
  heading,
  sub_heading,
  practices,
  locale,
  categories = [],
  baseSlug = "practices",
}: {
  heading: string;
  sub_heading?: string;
  practices: any[];
  locale: string;
  categories?: any[];
  baseSlug?: string;
}) {
  const t = UI[baseLocale(locale)] as unknown as TDict;

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("");
  const [activePreset, setActivePreset] = useState<Preset>("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const safeBase = norm(baseSlug) || "practices";
  const { cats, catLabelByKey, normalized, presetStats, editorial } = usePracticeIndex(practices ?? [], categories ?? []);

  const topRef = useRef<HTMLDivElement>(null);
  const scrollToTop = () => {
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const applyCat = (key: string) => {
    setActiveCat(key);
    setDrawerOpen(false);
    scrollToTop();
  };

  const applyPreset = (p: Preset) => {
    setActivePreset((prev) => (prev === p ? "" : p));
    setDrawerOpen(false);
    scrollToTop();
  };

  const clearAll = () => {
    setQuery("");
    setActiveCat("");
    setActivePreset("");
  };

  const strapiCats = useMemo(() => {
    const arr = (categories ?? []).map(normalizeCategory).filter((c) => c?.name);
    const seen = new Set<string>();
    const out: PracticeCategory[] = [];
    for (const c of arr) {
      const key = String(c.slug || c.name || "");
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
    return out;
  }, [categories]);

  const countByKey = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of normalized) {
      for (const key of it.catKeys) m.set(key, (m.get(key) || 0) + 1);
    }
    return m;
  }, [normalized]);

  const catA = strapiCats[0] ?? null;
  const catB = strapiCats[1] ?? null;
  const catC = strapiCats[2] ?? null;

  const keyA = catA ? String(catA.slug || catA.name) : "";
  const keyB = catB ? String(catB.slug || catB.name) : "";
  const keyC = catC ? String(catC.slug || catC.name) : "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return normalized.filter((it) => {
      const matchesCat = !activeCat ? true : it.catKeys.includes(activeCat);
      const matchesQuery = !q ? true : it.searchable.includes(q);

      const matchesPreset = (() => {
        if (!activePreset) return true;
        if (activePreset === "video") return it.isVideo;
        if (activePreset === "short") {
          const mins = parseMinutes(it.iconCards?.clock?.value);
          return mins !== null && mins <= 10;
        }
        if (activePreset === "easy") return difficultyLevel(it.iconCards?.difficult?.value) === "easy";
        if (activePreset === "mid") return difficultyLevel(it.iconCards?.difficult?.value) === "mid";
        if (activePreset === "hard") return difficultyLevel(it.iconCards?.difficult?.value) === "hard";
        return true;
      })();

      return matchesCat && matchesQuery && matchesPreset;
    });
  }, [normalized, query, activeCat, activePreset]);

  const activeLabel = useMemo(() => {
    const presetLabel =
      activePreset === "short"
        ? t.presetShort
        : activePreset === "easy"
        ? t.presetEasy
        : activePreset === "mid"
        ? t.presetMid
        : activePreset === "hard"
        ? t.presetHard
        : activePreset === "video"
        ? t.presetVideo
        : "";

    const catLabel = !activeCat ? "" : catLabelByKey.get(activeCat) || activeCat;
    if (presetLabel && catLabel) return `${presetLabel} · ${catLabel}`;
    if (presetLabel) return presetLabel;
    if (catLabel) return catLabel;
    return t.all;
  }, [activePreset, activeCat, catLabelByKey, t]);

  const isEditorial = !query.trim() && !activeCat && !activePreset;
  const activeCount = (activeCat ? 1 : 0) + (activePreset ? 1 : 0) + (query.trim() ? 1 : 0);

  const presetDefs = useMemo(
    () => [
      { key: "short" as const, label: t.presetShort, count: presetStats.shortCount },
      { key: "easy" as const, label: t.presetEasy, count: presetStats.easyCount },
      { key: "video" as const, label: t.presetVideo, count: presetStats.videoCount },
    ],
    [t.presetShort, t.presetEasy, t.presetVideo, presetStats.shortCount, presetStats.easyCount, presetStats.videoCount]
  );

  const { dailyPick, tileRight, tileBottomLeft } = useMemo(() => {
    const hero = editorial.hero;
    const wide = editorial.wide;
    const pool = normalized.filter((x) => x !== hero && x !== wide);

    return {
      dailyPick: pool[0] ?? null,
      tileRight: pool[1] ?? null,
      tileBottomLeft: pool[2] ?? null,
    };
  }, [normalized, editorial.hero, editorial.wide]);

  const contactHref = `/${locale}/${t.contactSlug || "kapcsolat"}`;

  return (
    <section className="relative bg-white">
      <div ref={topRef} />

      <div className="mx-auto">
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-7">
            <div>
              <Heading as="h2" className={cn("text-left", typo.h2)}>
                {heading}
              </Heading>

              {sub_heading ? (
                <Subheading className={cn("max-w-2xl pt-6", typo.sub)}>{sub_heading}</Subheading>
              ) : null}

              {query || activeCat || activePreset ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className={cn(filterChipActive, "px-4 py-2 rounded-full border text-sm font-semibold")}>
                    {activeLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      clearAll();
                      scrollToTop();
                    }}
                    className={cn(filterChip, "px-4 py-2")}
                  >
                    {t.clear}
                  </button>
                </div>
              ) : null}
            </div>

            <div className={cn("hidden md:flex md:items-center", typo.pill)}>
              <IconCircleCheck className="h-5 w-5 text-[#057C80]" />
              <span>
                {filtered.length} {t.results.toLowerCase()}
              </span>
            </div>
          </div>

          <div className="space-y-1 md:space-y-3">
            <div className="relative group max-w-2xl">
              <IconSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[#057C80] transition-colors h-5 w-5" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={cn(
                  "w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-3 pl-14 pr-6 text-neutral-800 shadow-sm",
                  "focus:ring-2 focus:ring-[rgba(5,124,128,0.18)] text-base sm:text-lg placeholder:text-neutral-400 transition-all"
                )}
                placeholder={t.searchPlaceholder}
              />
            </div>

            {/* MOBILE: sticky action bar */}
            <div className="md:hidden sticky top-3 z-30">
              <div className={cn(glassPanel, "p-2 flex items-center gap-2")}>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className={cn(
                    "flex-1 rounded-xl px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2",
                    focusRing,
                    activeCount ? "bg-[rgba(0,121,128,1)] text-white" : "bg-neutral-100 text-neutral-800"
                  )}
                >
                  <IconAdjustmentsHorizontal className="h-4 w-4" />
                  {t.filters} {activeCount ? `(${activeCount})` : ""}
                </button>

                <div className="px-3 py-3 rounded-xl bg-neutral-100 text-neutral-700 text-sm font-semibold tabular-nums">
                  {filtered.length}
                </div>

                {activeCount ? (
                  <button
                    type="button"
                    onClick={() => {
                      clearAll();
                      scrollToTop();
                    }}
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm font-semibold bg-white border border-neutral-200 text-neutral-800",
                      "hover:border-[rgba(5,124,128,0.35)] hover:text-[#057C80] transition",
                      focusRing
                    )}
                  >
                    {t.clear}
                  </button>
                ) : null}
              </div>
            </div>

            <QuickCategoryChips
              t={t}
              quickCats={cats.slice(0, 24)}
              activeCat={activeCat}
              setActiveCat={(v) => {
                setActiveCat(v);
                scrollToTop();
              }}
            />

            <div
              className="hidden md:flex gap-2 md:gap-3 pb-2 overflow-x-auto md:flex-wrap md:overflow-visible
                         [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {presetDefs.map((p) => (
                <PresetChip
                  key={p.key}
                  label={p.label}
                  count={p.count}
                  active={activePreset === p.key}
                  onClick={() => {
                    setActivePreset(activePreset === p.key ? "" : p.key);
                    scrollToTop();
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {isEditorial ? (
          <div className={cn(bentoGrid, "lg:auto-rows-[minmax(220px,auto)]")}>
            {editorial.hero ? (
              <PracticeCard
                it={editorial.hero}
                locale={locale}
                baseSlug={safeBase}
                t={t}
                variant="hero"
                className="sm:col-span-2 lg:col-span-2 lg:row-span-2 min-h-[320px] sm:min-h-[420px]"
              />
            ) : null}

            {catA ? (
              <CategoryTile
                t={t}
                title={catA.name}
                subtitle={`${countByKey.get(keyA) ?? 0} ${t.itemsLabel}`}
                onClick={() => applyCat(keyA)}
                className="lg:col-start-3 lg:row-start-1"
              />
            ) : null}

            <DifficultyFilterTile
              t={t}
              counts={{ easyCount: presetStats.easyCount, midCount: presetStats.midCount, hardCount: presetStats.hardCount }}
              setPreset={(p) => {
                setActivePreset(p);
                scrollToTop();
              }}
              className="lg:col-start-4 lg:row-start-1 lg:row-span-2"
            />

            {dailyPick ? (
              <PracticeCard
                it={dailyPick}
                locale={locale}
                baseSlug={safeBase}
                t={t}
                variant="tile"
                className="lg:col-start-3 lg:row-start-2 min-h-[250px]"
              />
            ) : null}

            {editorial.wide ? (
              <PracticeCard
                it={editorial.wide}
                locale={locale}
                baseSlug={safeBase}
                t={t}
                variant="wide"
                className="sm:col-span-2 lg:col-span-2 lg:col-start-1 lg:row-start-3 min-h-[250px]"
              />
            ) : null}

            {catB ? (
              <CategoryTile
                t={t}
                title={catB.name}
                subtitle={`${countByKey.get(keyB) ?? 0} ${t.itemsLabel}`}
                onClick={() => applyCat(keyB)}
                className="lg:col-start-3 lg:row-start-3"
              />
            ) : null}

            {tileRight ? (
              <PracticeCard
                it={tileRight}
                locale={locale}
                baseSlug={safeBase}
                t={t}
                variant="tile"
                className="lg:col-start-4 lg:row-start-3 min-h-[250px]"
              />
            ) : null}

            {tileBottomLeft ? (
              <PracticeCard
                it={tileBottomLeft}
                locale={locale}
                baseSlug={safeBase}
                t={t}
                variant="tile"
                className="lg:col-start-1 lg:row-start-4 min-h-[250px]"
              />
            ) : null}

            {catC ? (
              <BannerTile
                t={t}
                title={catC.name}
                subtitle={t.bannerSubtitle}
                count={countByKey.get(keyC) ?? 0}
                onClick={() => applyCat(keyC)}
                className="sm:col-span-2 lg:col-span-2 lg:col-start-2 lg:row-start-4"
              />
            ) : null}

            <ContactTile t={t} href={contactHref} className="lg:col-start-4 lg:row-start-4" />
          </div>
        ) : (
          <div className={cn(bentoGrid, "lg:auto-rows-[minmax(220px,auto)]")}>
            {filtered.map((it) => (
              <PracticeCard
                key={it?.p?.documentId ?? it?.p?.id ?? it?.slug ?? it?.name}
                it={it}
                locale={locale}
                baseSlug={safeBase}
                t={t}
                variant="tile"
                className="min-h-[250px]"
              />
            ))}

            {!filtered.length ? (
              <div className={cn(bentoItem, "bg-[#f8fafc] p-8 flex flex-col justify-center", "lg:col-span-2")}>
                <div className="text-sm font-semibold tracking-tight text-neutral-950">{t.emptyTitle}</div>
                <div className="mt-2 text-sm font-medium text-neutral-500">{t.emptyDesc}</div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={t.filters} closeLabel={t.close}>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {presetDefs.map((p) => (
              <PresetChip
                key={p.key}
                label={p.label}
                count={p.count}
                active={activePreset === p.key}
                onClick={() => applyPreset(p.key)}
              />
            ))}
          </div>

          <FilterPanel
            cats={cats}
            activeCat={activeCat}
            setActiveCat={(v) => applyCat(v)}
            resultsCount={filtered.length}
            activeLabel={activeLabel}
            t={t}
            variant="mobile"
            countByKey={countByKey}
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                scrollToTop();
              }}
              className={cn("flex-1 rounded-xl bg-[rgba(0,121,128,1)] text-white px-4 py-3 text-sm font-semibold", focusRing)}
            >
              OK
            </button>

            {activeCount ? (
              <button
                type="button"
                onClick={() => clearAll()}
                className={cn(
                  "rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800",
                  "hover:border-[rgba(5,124,128,0.35)] hover:text-[#057C80] transition",
                  focusRing
                )}
              >
                {t.clear}
              </button>
            ) : null}
          </div>
        </div>
      </MobileDrawer>
    </section>
  );
}
