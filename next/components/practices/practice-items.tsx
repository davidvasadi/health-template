// components/practice/practice-items.tsx
/**
 * PracticeItems – teljes “Gyakorlatok” szekció: keresés + szűrés + bento grid
 *
 * Fő feladatok:
 * 1) State:
 *    - query: szöveges keresés
 *    - activeCat: aktív kategória kulcs (slug vagy name)
 *    - activePreset: preset filter ("short" | "easy" | "mid" | "hard" | "video")
 *    - drawerOpen: mobil drawer nyitottsága
 *
 * 2) Adat bekötés:
 *    - usePracticeIndex hookból jön:
 *      - cats, catLabelByKey, normalized, presetStats, editorial
 *    - ezek ugyanazok a számítások, csak külön fájlba szervezve (practice-index)
 *
 * 3) Szűrés / címke:
 *    - filtered: query + kategória + preset kombinált szűrés
 *    - activeLabel: a UI-ban kiírt aktív filter label (preset + cat)
 *
 * 4) Render:
 *    - fejlécrész (heading/subheading + aktív filter chip + clear)
 *    - kereső input
 *    - mobil action bar (kereső alatt): filters + count + clear
 *    - desktop quick chips + desktop preset chips
 *    - editorial grid (hero/wide/tiles) vagy filtered grid
 *    - mobil drawer: preset chip-ek + FilterPanel + OK/Clear
 *
 * Fontos:
 * - UI/UX változatlan: markup és className-ek sorrendje kritikus.
 * - A “rövidítés” itt főleg duplikáció csökkentés config listákkal (pl. presetDefs).
 */

// components/practice/practice-items.tsx
"use client";

import React, { useMemo, useRef, useState } from "react";
import { Link } from "next-view-transitions";
import {
    IconSearch,
    IconCircleCheck,
    IconChevronRight,
    IconSparkles,
    IconMessageDots,
    IconAdjustmentsHorizontal,
} from "@tabler/icons-react";

import {
    UI,
    baseLocale,
    cn,
    norm,
    get,
    bentoGrid,
    bentoItem,
    filterChip,
    filterChipActive,
    focusRing,
    type TDict,
    type PracticeCategory,
    type NormalizedPractice,
    normalizeCategory,
    extractPracticeCategories,
    extractThumb,
    pickIconCards,
    difficultyTone,
    safeLower,
    isVideoPractice,
    glassPanel,
} from "./practice-shared";

import { MobileDrawer, QuickCategoryChips, FilterPanel } from "./practice-filters";
import { PracticeCard } from "./practice-card";

/* ──────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────── */
function parseMinutes(raw?: string) {
    const s = String(raw ?? "").toLowerCase();
    const m = s.match(/(\d+)\s*(p|perc|min)/i);
    return m ? Number(m[1]) : null;
}

function difficultyLevel(raw?: string): "easy" | "mid" | "hard" | "unknown" {
    const v = safeLower(raw).trim();
    const easy =
        v.includes("könny") ||
        v.includes("konny") ||
        v.includes("easy") ||
        v.includes("light") ||
        v.includes("begin") ||
        v.includes("kezd");
    const mid =
        v.includes("közep") ||
        v.includes("kozep") ||
        v.includes("medium") ||
        v.includes("moderat") ||
        v.includes("halad") ||
        v.includes("mittel");
    const hard =
        v.includes("nehéz") ||
        v.includes("nehez") ||
        v.includes("hard") ||
        v.includes("advanced") ||
        v.includes("pro") ||
        v.includes("schwer");
    if (easy) return "easy";
    if (mid) return "mid";
    if (hard) return "hard";
    return "unknown";
}

function isFeatured(p: any) {
    return Boolean(p?.featured ?? p?.is_featured ?? p?.highlighted ?? p?.isHighlighted);
}

type Preset = "" | "short" | "easy" | "mid" | "hard" | "video";

/* ──────────────────────────────────────────────────────────────
   Index
──────────────────────────────────────────────────────────────── */
function usePracticeIndex(practices: any[], categories: any[]) {
    const cats = useMemo<PracticeCategory[]>(() => {
        const base = (categories ?? []).map(normalizeCategory).filter((c: any) => c?.name);

        const fromItems = (practices ?? [])
            .flatMap((p) => extractPracticeCategories(p))
            .reduce((acc: any[], c: any) => {
                const key = (c.slug || c.name) as string;
                if (!key) return acc;
                if (!acc.some((x) => (x.slug || x.name) === key)) acc.push(c);
                return acc;
            }, []);

        const merged = [...base];
        for (const c of fromItems) {
            const key = (c.slug || c.name) as string;
            if (!key) continue;
            if (!merged.some((x) => (x.slug || x.name) === key)) merged.push(c);
        }

        merged.sort((a, b) => String(a?.name ?? "").localeCompare(String(b?.name ?? "")));
        return merged;
    }, [categories, practices]);

    const catLabelByKey = useMemo(() => {
        const map = new Map<string, string>();
        for (const c of cats) {
            const key = (c.slug || c.name) as string;
            if (key) map.set(key, c.name);
        }
        return map;
    }, [cats]);

    const normalized = useMemo<NormalizedPractice[]>(() => {
        return (practices ?? []).map((raw: any) => {
            const p = get(raw);

            const name = String(p?.name ?? "");
            const slug = String(p?.slug ?? "");
            const desc = String(p?.practice?.description ?? p?.description ?? "");

            const cards = Array.isArray(p?.practice_card) ? p.practice_card : [];
            const cardText = cards
                .map((x: any) => `${x?.label ?? ""} ${x?.value ?? ""}`.trim())
                .filter(Boolean)
                .join(" ");

            const searchable = `${name} ${desc} ${cardText}`.toLowerCase();

            const itemCats = extractPracticeCategories(raw);
            const catKeys = itemCats.map((c) => (c.slug || c.name) as string).filter(Boolean);

            const primaryCat = catKeys[0];
            const primaryCatLabel = primaryCat ? catLabelByKey.get(primaryCat) : undefined;

            const thumb = extractThumb(raw);
            const isVideo = isVideoPractice(raw);

            const iconCards = pickIconCards(cards);

            const diffCard =
                iconCards?.difficult ||
                cards.find((c: any) =>
                    /neh[eé]zs[eé]g|difficulty|schwierigkeit/i.test(String(c?.label ?? ""))
                );

            const diffTone = difficultyTone(String(diffCard?.value ?? diffCard?.text ?? ""));

            const kpis = (() => {
                const used = new Set(["clock", "difficult", "type"]);
                return cards
                    .filter((x: any) => !used.has(String(x?.icon ?? "").toLowerCase()))
                    .filter((x: any) => x?.label || x?.value)
                    .slice(0, 4);
            })();

            return {
                raw,
                p,
                name,
                slug,
                desc,
                searchable,
                catKeys,
                primaryCat,
                primaryCatLabel,
                cards,
                thumb,
                isVideo,
                iconCards,
                diffTone,
                kpis,
            };
        });
    }, [practices, catLabelByKey]);

    const presetStats = useMemo(() => {
        let shortCount = 0;
        let easyCount = 0;
        let midCount = 0;
        let hardCount = 0;
        let videoCount = 0;

        for (const it of normalized) {
            const mins = parseMinutes(it.iconCards?.clock?.value);
            if (mins !== null && mins <= 10) shortCount += 1;

            const dl = difficultyLevel(it.iconCards?.difficult?.value);
            if (dl === "easy") easyCount += 1;
            else if (dl === "mid") midCount += 1;
            else if (dl === "hard") hardCount += 1;

            if (it.isVideo) videoCount += 1;
        }

        return { shortCount, easyCount, midCount, hardCount, videoCount };
    }, [normalized]);

    const editorial = useMemo(() => {
        if (!normalized.length)
            return { hero: null as NormalizedPractice | null, wide: null as NormalizedPractice | null };
        const hero = normalized.find((x) => isFeatured(x.p)) || normalized[0];
        const wide = normalized.find((x) => x !== hero) || null;
        return { hero, wide };
    }, [normalized]);

    return { cats, catLabelByKey, normalized, presetStats, editorial };
}

/* ──────────────────────────────────────────────────────────────
   Tiles
──────────────────────────────────────────────────────────────── */
function CategoryTile({
    title,
    subtitle,
    onClick,
    t,
    className,
}: {
    title: string;
    subtitle: string;
    onClick?: () => void;
    t: TDict;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                bentoItem,
                "bg-[rgba(0,121,128,1)] text-white border-none shadow-lg shadow-[rgba(0,121,128,0.12)] hover:brightness-110",
                "p-8 flex flex-col justify-between",
                className
            )}
        >
            <div className="flex justify-between items-start">
                <div className="text-white/70">
                    <IconSparkles className="h-10 w-10 opacity-70" />
                </div>
                <IconChevronRight className="h-6 w-6 text-white/85" />
            </div>

            <div className="text-left">
                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">
                    {t.collection}
                </p>
                <h4 className="text-2xl font-semibold">{title}</h4>
                <p className="text-white/70 text-xs mt-2">{subtitle}</p>
            </div>
        </button>
    );
}

function DifficultyFilterTile({
    t,
    counts,
    setPreset,
    className,
}: {
    t: TDict;
    counts: { easyCount: number; midCount: number; hardCount: number };
    setPreset: (p: Preset) => void;
    className?: string;
}) {
    return (
        <div
            className={cn(
                bentoItem,
                "p-8 flex flex-col justify-between bg-[#f8fafc] hidden md:flex lg:row-span-2",
                className
            )}
        >
            <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[rgba(0,121,128,1)]" />
                    {t.difficulty}
                </h4>

                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-[rgba(0,121,128,1)] uppercase tracking-widest mb-3">
                            {t.filterBy}
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => setPreset("easy")}
                                className="flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-[rgba(0,121,128,1)] transition"
                            >
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> {t.presetEasy}
                                </span>
                                <span className="text-slate-400 tabular-nums">{counts.easyCount}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPreset("mid")}
                                className="flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-[rgba(0,121,128,1)] transition"
                            >
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> {t.presetMid}
                                </span>
                                <span className="text-slate-400 tabular-nums">{counts.midCount}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPreset("hard")}
                                className="flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-[rgba(0,121,128,1)] transition"
                            >
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {t.presetHard}
                                </span>
                                <span className="text-slate-400 tabular-nums">{counts.hardCount}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[rgba(0,121,128,0.06)] p-5 rounded-2xl border border-[rgba(0,121,128,0.12)]">
                <p className="text-[11px] font-semibold text-[rgba(0,121,128,1)] leading-snug">
                    {t.difficultyTip}
                </p>
            </div>
        </div>
    );
}

function ContactTile({ t, href, className }: { t: TDict; href: string; className?: string }) {
    return (
        <div
            className={cn(
                bentoItem,
                "p-8 bg-[#f8fafc] border-dashed border-2 border-slate-200 flex flex-col justify-center",
                className
            )}
        >
            <div className="w-12 h-12 bg-white shadow-md rounded-2xl flex items-center justify-center mb-6">
                <IconMessageDots className="h-6 w-6 text-[rgba(0,121,128,1)]" />
            </div>
            <h4 className="text-lg font-semibold mb-2 text-slate-900">{t.askTitle}</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{t.askDesc}</p>
            <Link
                href={href as never}
                className={cn(
                    "text-xs font-black text-[rgba(0,121,128,1)] uppercase tracking-wider hover:underline",
                    focusRing
                )}
            >
                {t.askCta}
            </Link>
        </div>
    );
}

function BannerTile({
    t,
    title,
    subtitle,
    count,
    onClick,
    className,
}: {
    t: TDict;
    title: string;
    subtitle: string;
    count: number;
    onClick?: () => void;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                bentoItem,
                "border-none overflow-hidden group",
                "p-10 flex items-start justify-between text-left",
                "bg-gradient-to-r from-[rgba(0,150,158,1)] to-[rgba(0,121,128,1)] text-white",
                className
            )}
        >
            <div className="relative z-10 text-left">
                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-2">
                    {t.expertPick}
                </p>
                <h4 className="text-4xl font-semibold mb-1">{title}</h4>
                <p className="text-white/80 font-light italic">{subtitle}</p>
                <div className="mt-4 flex gap-2">
                    <span className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-bold">{t.tagAllLevels}</span>
                    <span className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-bold">{t.tagMinutes}</span>
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-end text-right">
                <span className="text-5xl font-black mb-1">{count >= 24 ? "24+" : String(count)}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">{t.activeVideos}</span>
            </div>

            <span className="absolute -right-8 -bottom-10 text-[160px] font-black text-white/5 select-none pointer-events-none group-hover:text-white/10 transition-colors">
                {title.split(" ")[0]?.toUpperCase() || "G"}
            </span>
        </button>
    );
}

function PresetChip({
    label,
    count,
    active,
    onClick,
}: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button type="button" onClick={onClick} className={cn(filterChip, active && filterChipActive)}>
            {label} <span className="ml-2 text-slate-400 tabular-nums">{count}</span>
        </button>
    );
}

/* ──────────────────────────────────────────────────────────────
   PracticeItems
──────────────────────────────────────────────────────────────── */
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
    const { cats, catLabelByKey, normalized, presetStats, editorial } = usePracticeIndex(
        practices ?? [],
        categories ?? []
    );

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
        () =>
            [
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
                            <h2 className="text-4xl sm:text-6xl font-bold text-slate-900 tracking-tight mb-4">
                                {heading}
                            </h2>
                            {sub_heading ? <p className="text-lg text-slate-500 font-normal">{sub_heading}</p> : null}

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

                        <div className="hidden md:flex md:items-center gap-2 text-slate-500 font-semibold text-sm bg-slate-100 px-3 py-2 rounded-lg">
                            <IconCircleCheck className="h-5 w-5 text-[rgba(0,121,128,1)]" />
                            <span>
                                {filtered.length} {t.results.toLowerCase()}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="relative group max-w-2xl">
                            <IconSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[rgba(0,121,128,1)] transition-colors h-5 w-5" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className={cn(
                                    "w-full bg-[#f8fafc] border border-slate-200 rounded-2xl py-3 pl-14 pr-6 text-slate-700 shadow-sm",
                                    "focus:ring-2 focus:ring-[rgba(0,121,128,0.20)] text-base sm:text-lg placeholder:text-slate-400 transition-all"
                                )}
                                placeholder={t.searchPlaceholder}
                            />
                        </div>

                        {/* MOBILE: sticky action bar (gyors elérés 1 tap + drawer) */}
                        <div className="md:hidden sticky top-3 z-30">
                            <div className={cn(glassPanel, "p-2 flex items-center gap-2")}>
                                <button
                                    type="button"
                                    onClick={() => setDrawerOpen(true)}
                                    className={cn(
                                        "flex-1 rounded-xl px-4 py-3 text-sm font-black tracking-wide inline-flex items-center justify-center gap-2",
                                        focusRing,
                                        activeCount ? "bg-[rgba(0,121,128,1)] text-white" : "bg-slate-100 text-slate-800"
                                    )}
                                >
                                    <IconAdjustmentsHorizontal className="h-4 w-4" />
                                    {t.filters} {activeCount ? `(${activeCount})` : ""}
                                </button>

                                <div className="px-3 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-black tabular-nums">
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
                                            "rounded-xl px-4 py-3 text-sm font-black bg-white border border-slate-200 text-slate-800",
                                            "hover:border-[rgba(0,121,128,0.35)] hover:text-[rgba(0,121,128,1)] transition",
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
                        {/* HERO (mobilon 1 oszlop, sm-től full width 2-col) */}
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

                        {/* WIDE: mobil 1 oszlop, sm-től full width */}
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

                        {/* BANNER: mobil 1 oszlop, sm-től full width */}
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
                                <div className="text-sm font-semibold text-slate-900">{t.emptyTitle}</div>
                                <div className="mt-2 text-sm font-medium text-slate-500">{t.emptyDesc}</div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            <MobileDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={t.filters}
                closeLabel={t.close}
            >
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
                            className={cn(
                                "flex-1 rounded-xl bg-[rgba(0,121,128,1)] text-white px-4 py-3 text-sm font-black",
                                focusRing
                            )}
                        >
                            OK
                        </button>

                        {activeCount ? (
                            <button
                                type="button"
                                onClick={() => clearAll()}
                                className={cn(
                                    "rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800",
                                    "hover:border-[rgba(0,121,128,0.35)] hover:text-[rgba(0,121,128,1)] transition",
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
