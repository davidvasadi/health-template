"use client";

import React, { useEffect, useMemo, useState } from "react";
import FuzzySearch from "fuzzy-search";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "next-view-transitions";
import { useParams, usePathname } from "next/navigation";
import { format } from "date-fns";
import { de as deDF, hu as huDF } from "date-fns/locale";

import { Article } from "@/types/types";
import { truncate } from "@/lib/utils";
import { strapiImage } from "@/lib/strapi/strapiImage";
import { BlurImage } from "./blur-image";

const spring = { type: "spring" as const, stiffness: 520, damping: 30, mass: 0.7 };

type SupportedLocale = "hu" | "en" | "de";
type SortKey = "newest" | "oldest" | "title";

function normalizeLocale(raw?: string | null): SupportedLocale {
  const lower = (raw || "").toLowerCase();
  if (lower.startsWith("hu")) return "hu";
  if (lower.startsWith("de")) return "de";
  return "en";
}

function useLocale(localeProp?: string): SupportedLocale {
  const params = useParams() as Record<string, string | undefined>;
  const pathname = usePathname() || "";
  const seg0 = pathname.split("/").filter(Boolean)[0];
  return normalizeLocale(localeProp || params?.locale || seg0);
}

function getThumbUrl(a: Article): string | undefined {
  const url = (a as any)?.image?.url;
  return url ? strapiImage(url) : undefined;
}

function getInitials(title?: string) {
  const t = (title || "").trim();
  if (!t) return "•";
  const words = t.split(/\s+/).filter(Boolean);
  const a = words[0]?.[0] ?? "";
  const b = words[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Apple-ish segmented */
function Segmented({
  value,
  onChange,
  labels,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
  labels: { newest: string; oldest: string; title: string };
}) {
  const items: Array<{ key: SortKey; label: string }> = [
    { key: "newest", label: labels.newest },
    { key: "oldest", label: labels.oldest },
    { key: "title", label: labels.title },
  ];

  return (
    <div
      className="inline-flex items-center rounded-full bg-neutral-100/80 border border-neutral-200/60 p-1"
      role="tablist"
      aria-label="Sort"
    >
      {items.map((it) => {
        const active = it.key === value;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            className={cn(
              "px-3 py-1.5 text-[13px] md:text-sm rounded-full transition",
              active
                ? "bg-white text-neutral-900 shadow-sm border border-neutral-200/60"
                : "text-neutral-600 hover:text-neutral-900"
            )}
            role="tab"
            aria-selected={active}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

const Labels: Record<
  SupportedLocale,
  {
    heading: string;
    placeholder: string;
    noResultsTitle: string;
    noResultsText: string;
    all: string;
    sortNewest: string;
    sortOldest: string;
    sortTitle: string;
    results: (n: number) => string;
    loadMore: string;
    read: string;
    reset: string;
  }
> = {
  en: {
    heading: "More posts",
    placeholder: "Search articles…",
    noResultsTitle: "No results",
    noResultsText: "Try a different keyword or category.",
    all: "All",
    sortNewest: "Newest",
    sortOldest: "Oldest",
    sortTitle: "A–Z",
    results: (n) => `${n} result${n === 1 ? "" : "s"}`,
    loadMore: "Load more",
    read: "Read",
    reset: "Reset",
  },
  hu: {
    heading: "További bejegyzések",
    placeholder: "Cikkek keresése…",
    noResultsTitle: "Nincs találat",
    noResultsText: "Próbálj más kulcsszót vagy kategóriát.",
    all: "Összes",
    sortNewest: "Legújabb",
    sortOldest: "Legrégebbi",
    sortTitle: "A–Z",
    results: (n) => `${n} találat`,
    loadMore: "Továbbiak",
    read: "Tovább",
    reset: "Törlés",
  },
  de: {
    heading: "Weitere Beiträge",
    placeholder: "Artikel suchen…",
    noResultsTitle: "Keine Ergebnisse",
    noResultsText: "Versuche ein anderes Stichwort oder eine Kategorie.",
    all: "Alle",
    sortNewest: "Neu",
    sortOldest: "Alt",
    sortTitle: "A–Z",
    results: (n) => `${n} Ergebnis${n === 1 ? "" : "se"}`,
    loadMore: "Mehr laden",
    read: "Mehr",
    reset: "Zurücksetzen",
  },
};

export const BlogPostRows: React.FC<{ articles: Article[]; locale?: string }> = ({
  articles,
  locale: localeProp,
}) => {
  const locale = useLocale(localeProp);
  const t = Labels[locale];
  const dfLocale = locale === "hu" ? huDF : locale === "de" ? deDF : undefined;
  const reduceMotion = useReducedMotion();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [visible, setVisible] = useState(10);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 160);
    return () => clearTimeout(id);
  }, [search]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (articles || []).forEach((a: any) => {
      (a?.categories || []).forEach((c: any) => {
        if (c?.name) set.add(c.name);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [articles]);

  const searcher = useMemo(() => {
    const enriched = (articles || []).map((a: any) => ({
      ...a,
      __categoriesText: (a?.categories || []).map((c: any) => c?.name).filter(Boolean).join(" "),
    }));

    return new FuzzySearch(enriched as any[], ["title", "description", "__categoriesText"], {
      caseSensitive: false,
    });
  }, [articles]);

  const filteredAndSorted = useMemo(() => {
    let list: any[] = [];

    if (!debouncedSearch) {
      list = (articles || []) as any[];
    } else {
      try {
        list = searcher.search(debouncedSearch) as any[];
      } catch {
        list = [];
      }
    }

    if (category !== "all") {
      list = list.filter((a: any) => (a?.categories || []).some((c: any) => c?.name === category));
    }

    const toTime = (a: any) => {
      const d = a?.publishedAt ? new Date(a.publishedAt) : null;
      return d && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
    };

    list = [...list].sort((a: any, b: any) => {
      if (sort === "title") return String(a?.title || "").localeCompare(String(b?.title || ""));
      if (sort === "oldest") return toTime(a) - toTime(b);
      return toTime(b) - toTime(a);
    });

    return list as Article[];
  }, [articles, debouncedSearch, searcher, category, sort]);

  useEffect(() => {
    setVisible(10);
  }, [debouncedSearch, category, sort]);

  const shown = filteredAndSorted.slice(0, visible);
  const canLoadMore = visible < filteredAndSorted.length;

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setSort("newest");
    setVisible(10);
  };

  const showReset = search.trim() || category !== "all" || sort !== "newest";

  return (
    <section className="w-full py-12 md:py-16">
      {/* Apple-ish sticky header */}
      <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-20 -mx-4 px-4 md:-mx-0 md:px-0">
        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-neutral-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
          <div className="p-4 md:p-5">
            <div className="flex flex-col gap-3">
              {/* Title row */}
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <h2
                    className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900"
                    suppressHydrationWarning
                  >
                    {t.heading}
                  </h2>
                  <p className="mt-1 text-[12px] md:text-[13px] text-neutral-500/90" suppressHydrationWarning>
                    {t.results(filteredAndSorted.length)}
                  </p>
                </div>

                {showReset && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="
                      shrink-0 text-[13px] md:text-sm
                      px-4 py-2 rounded-full
                      bg-white/80 border border-neutral-200/60
                      text-neutral-700 hover:text-neutral-900
                      hover:bg-white transition
                    "
                  >
                    {t.reset}
                  </button>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                {/* Search pill + clear */}
                <div className="relative w-full lg:w-[360px]">
                  <span
                    aria-hidden
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[14px]"
                  >
                    ⌕
                  </span>

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t.placeholder}
                    aria-label={t.placeholder}
                    suppressHydrationWarning
                    className="
                      w-full rounded-full
                      bg-white/80 border border-neutral-200/60
                      pl-9 pr-10 py-2.5
                      text-[13px] md:text-sm text-neutral-900 placeholder-neutral-400
                      focus:outline-none focus:ring-2 focus:ring-breaker-bay-500/35
                    "
                  />

                  {search.trim() && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="
                        absolute right-2.5 top-1/2 -translate-y-1/2
                        h-7 w-7 rounded-full
                        bg-neutral-100/80 border border-neutral-200/60
                        text-neutral-600 hover:text-neutral-900
                        hover:bg-neutral-100 transition
                        flex items-center justify-center
                      "
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Segmented
                    value={sort}
                    onChange={setSort}
                    labels={{ newest: t.sortNewest, oldest: t.sortOldest, title: t.sortTitle }}
                  />
                </div>
              </div>

              {/* Category chips row (scrollable) */}
              <div className="relative">
                <div
                  className="
                    flex items-center gap-2 overflow-x-auto
                    py-1.5 pr-2
                    [-ms-overflow-style:none] [scrollbar-width:none]
                  "
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>

                  <button
                    type="button"
                    onClick={() => setCategory("all")}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-[13px] md:text-sm border transition",
                      category === "all"
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-neutral-100/80 text-neutral-700 border-neutral-200/60 hover:bg-neutral-100"
                    )}
                  >
                    {t.all}
                  </button>

                  {categories.map((c) => {
                    const active = category === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={cn(
                          "shrink-0 rounded-full px-3 py-1.5 text-[13px] md:text-sm border transition",
                          active
                            ? "bg-neutral-900 text-white border-neutral-900"
                            : "bg-neutral-100/80 text-neutral-700 border-neutral-200/60 hover:bg-neutral-100"
                        )}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>

                <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white/70 to-transparent rounded-r-3xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      {filteredAndSorted.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-white border border-neutral-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.03)] p-8 text-center">
          <p className="text-neutral-900 font-medium">{t.noResultsTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">{t.noResultsText}</p>
        </div>
      ) : (
        <>
          {/* mobil: 1 oszlop, desktop: 2 oszlop */}
          <motion.ul
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045 } } }}
            className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4"
          >
            {shown.map((a, i) => {
              const thumb = getThumbUrl(a as any);
              const initials = getInitials((a as any)?.title);

              const allCats = ((a as any).categories || []) as Array<{ name: string }>;
              const firstCategory = allCats?.[0]?.name;

              const chipLimit = 2;
              const chips = allCats.slice(0, chipLimit);
              const extra = Math.max(0, allCats.length - chipLimit);

              return (
                <motion.li
                  key={(a as any).slug + i}
                  variants={{
                    hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
                    show: { opacity: 1, y: 0, transition: spring },
                  }}
                >
                  <Link
                    href={`/${locale}/blog/${(a as any).slug}`}
                    className="
                      group block h-full rounded-3xl
                      bg-white/90 border border-neutral-200/60
                      shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]
                      hover:bg-white hover:border-neutral-300/60
                      hover:shadow-[0_18px_55px_rgba(0,0,0,0.08)]
                      active:scale-[0.99] active:bg-neutral-50/60
                      transition
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-breaker-bay-500/35
                    "
                  >
                    {/* ✅ MOBIL: kép felül, SM+: kép balra */}
                    <div className="flex flex-col sm:flex-row gap-4 p-5 md:p-6">
                      {/* Media */}
                      <div className="sm:shrink-0">
                        <div
                          className="
                            relative w-full rounded-2xl overflow-hidden
                            bg-neutral-100 border border-neutral-200/60
                            sm:w-[120px] sm:h-[90px]
                          "
                        >
                          {/* 16:9 arány mobilon (plugin nélkül) */}
                          <div className="block sm:hidden" aria-hidden style={{ paddingTop: "56.25%" }} />

                          {thumb ? (
                            <>
                              <BlurImage
                                src={thumb}
                                alt={(a as any)?.title || "thumbnail"}
                                width={1200}
                                height={675}
                                className={cn(
                                  "absolute inset-0 h-full w-full object-cover transition duration-500",
                                  reduceMotion
                                    ? ""
                                    : "group-hover:brightness-[1.03] group-hover:contrast-[1.02] group-hover:scale-[1.01]"
                                )}
                              />
                              <div className="pointer-events-none absolute inset-0">
                                <div className="absolute inset-0 ring-1 ring-white/20" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10 opacity-70" />
                              </div>
                            </>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-neutral-600 font-semibold">{initials}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        {firstCategory ? (
                          <p className="text-[11px] tracking-[0.14em] uppercase text-neutral-500">
                            {firstCategory}
                          </p>
                        ) : null}

                        <p className="mt-1 text-[17px] md:text-[18px] font-semibold tracking-tight leading-[1.15] text-neutral-900 group-hover:text-breaker-bay-800 transition-colors">
                          {(a as any).title}
                        </p>

                        <p className="mt-2 text-[13px] md:text-[14px] text-neutral-600 leading-[1.6]">
                          {(a as any).description ? truncate((a as any).description, 150) : ""}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-neutral-500/90">
                          <span suppressHydrationWarning>
                            {(a as any).publishedAt
                              ? format(new Date((a as any).publishedAt), "MMMM dd, yyyy", { locale: dfLocale })
                              : ""}
                          </span>

                          <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-neutral-300" />

                          <span className="flex flex-wrap gap-1.5">
                            {chips.map((c: any, idx: number) => (
                              <span
                                key={(c?.name || "cat") + idx}
                                className="rounded-full px-2 py-0.5 bg-neutral-100/80 text-neutral-700 border border-neutral-200/60"
                              >
                                {c?.name}
                              </span>
                            ))}
                            {extra > 0 && (
                              <span className="rounded-full px-2 py-0.5 bg-neutral-100/70 text-neutral-500 border border-neutral-200/60">
                                +{extra}
                              </span>
                            )}
                          </span>

                          {/* ✅ mobilon is legyen “Tovább” (nem csak sm+) */}
                          <span className="ml-auto inline-flex items-center text-neutral-700">
                            <span className="relative inline-block font-medium">
                              <span className="absolute -bottom-0.5 left-0 h-[2px] w-0 bg-neutral-800 transition-all duration-300 group-hover:w-full" />
                              {t.read}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>

          {canLoadMore && (
            <div className="mt-7 flex justify-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + 10)}
                className="
                  px-6 py-3 rounded-full
                  bg-white border border-neutral-200/60
                  text-neutral-900 text-sm font-medium
                  shadow-[0_12px_40px_rgba(0,0,0,0.05)]
                  hover:bg-neutral-50 transition
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-breaker-bay-500/35
                "
              >
                {t.loadMore}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};
