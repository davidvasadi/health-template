// components/practices/practice-shared.ts
/**
 * practice-shared – közös konstansok, helper-ek és típusok (UI-agnosztikus)
 *
 * Tartalom:
 * 1) Mini i18n:
 *    - UI dict (hu/en/de) + baseLocale fallback
 *
 * 2) Tailwind tokenek (className konstansok):
 *    - focusRing, glassPanel, bentoGrid, bentoItem, filterChip, filterChipActive, stb.
 *    - Ezek megváltoztatása UI-t érint → óvatosan.
 *
 * 3) Motion shared:
 *    - spring, gridVariants, itemVariants
 *
 * 4) Strapi normalize:
 *    - get(attributes unwrap), unwrapMedia/unwrapSingleMedia, isVideo/isImage
 *    - normalizeCategory, extractPracticeCategories
 *
 * 5) Média kiválasztás:
 *    - extractThumb: video_poster (kép) -> media első kép -> none
 *
 * 6) IconCard felismerés:
 *    - pickIconCards: clock/difficult/type felismerés icon vagy label alapján (contains match)
 *
 * 7) Type-ok:
 *    - PracticeCategory, NormalizedPractice
 *
 * Fontos:
 * - Nem renderel UI-t, csak adat + közös osztály stringek.
 * - Null-safe: Strapi hiányos adatnál se dobjon.
 */

export const BRAND = "#007980";
export const ACCENT = "#00969e";

/* ──────────────────────────────────────────────────────────────
   Mini i18n
──────────────────────────────────────────────────────────────── */
export const UI = {
  hu: {
    searchPlaceholder: "Keresés: név, leírás, kulcsszavak…",
    searchLabel: "Keresés",
    filters: "Szűrők",
    close: "Bezárás",
    clear: "Törlés",
    all: "Összes gyakorlat",
    filterBy: "SZŰRÉS KATEGÓRIA SZERINT",
    filterHint: "Válassz testtájat / fókuszt.",
    results: "Találatok",
    active: "Aktív",
    open: "Videó megnyitása",
    start: "Gyakorlat indítása",
    featured: "Kiemelt",
    emptyTitle: "Nincs találat",
    emptyDesc: "Próbáld meg másik kategóriával, vagy módosítsd a keresést.",
    quickCats: "Kategóriák",
    scrollHint: "Görgess jobbra",

    difficulty: "Nehézség",
    presetsTitle: "Ajánlók",
    presetShort: "Rövid rutinok",
    presetEasy: "Kezdőknek",
    presetMid: "Mérsékelt",
    presetHard: "Akut / haladó",
    presetVideo: "Videós gyakorlatok",

    askTitle: "Egyedi kérdése van?",
    askDesc: "Nem találja az Önnek megfelelő sorozatot? Kérjen személyre szabott javaslatot.",
    askCta: "Kapcsolatfelvétel",

    collection: "Gyűjtemény",
    expertPick: "Szakértői válogatás",
    activeVideos: "Aktív videó",

    itemsLabel: "gyakorlat",
    bannerSubtitle: "Akut és krónikus fájdalom kezelése",
    tagAllLevels: "ÖSSZES SZINT",
    tagMinutes: "5-20 PERC",
    difficultyTip:
      "A szűrők segítségével az aktuális állapotához legmegfelelőbb sorozatot kapja.",
    contactSlug: "kapcsolat",
  },
  en: {
    searchPlaceholder: "Search: name, description, keywords…",
    searchLabel: "Search",
    filters: "Filters",
    close: "Close",
    clear: "Clear",
    all: "All exercises",
    filterBy: "FILTER BY CATEGORY",
    filterHint: "Pick an area / focus.",
    results: "Results",
    active: "Active",
    open: "Open video",
    start: "Start practice",
    featured: "Featured",
    emptyTitle: "No results",
    emptyDesc: "Try another category, or refine your search.",
    quickCats: "Categories",
    scrollHint: "Scroll right",

    difficulty: "Difficulty",
    presetsTitle: "Recommendations",
    presetShort: "Short routines",
    presetEasy: "For beginners",
    presetMid: "Moderate",
    presetHard: "Hard / acute",
    presetVideo: "Video practices",

    askTitle: "Have a question?",
    askDesc: "Can't find the right series? Ask for a personalized recommendation.",
    askCta: "Contact us",

    collection: "Collection",
    expertPick: "Expert pick",
    activeVideos: "Active videos",

    itemsLabel: "practices",
    bannerSubtitle: "Managing acute and chronic pain",
    tagAllLevels: "ALL LEVELS",
    tagMinutes: "5–20 MIN",
    difficultyTip:
      "Use filters to get a routine that best matches your current condition.",
    contactSlug: "contact",
  },
  de: {
    searchPlaceholder: "Suche: Name, Beschreibung, Keywords…",
    searchLabel: "Suche",
    filters: "Filter",
    close: "Schließen",
    clear: "Zurücksetzen",
    all: "Alle Übungen",
    filterBy: "NACH KATEGORIE FILTERN",
    filterHint: "Wähle Bereich / Fokus.",
    results: "Treffer",
    active: "Aktiv",
    open: "Video öffnen",
    start: "Übung starten",
    featured: "Highlight",
    emptyTitle: "Keine Treffer",
    emptyDesc: "Andere Kategorie wählen oder Suche anpassen.",
    quickCats: "Kategorien",
    scrollHint: "Nach rechts",

    difficulty: "Schwierigkeit",
    presetsTitle: "Empfehlungen",
    presetShort: "Kurze Routinen",
    presetEasy: "Für Anfänger",
    presetMid: "Mittel",
    presetHard: "Schwer / akut",
    presetVideo: "Video-Übungen",

    askTitle: "Haben Sie eine Frage?",
    askDesc: "Nicht das Passende gefunden? Fragen Sie nach einer persönlichen Empfehlung.",
    askCta: "Kontakt aufnehmen",

    collection: "Sammlung",
    expertPick: "Auswahl",
    activeVideos: "Aktive Videos",

    itemsLabel: "Übungen",
    bannerSubtitle: "Akute und chronische Schmerzen behandeln",
    tagAllLevels: "ALLE LEVELS",
    tagMinutes: "5–20 MIN",
    difficultyTip:
      "Mit den Filtern erhalten Sie die Serie, die am besten zu Ihrem aktuellen Zustand passt.",
    contactSlug: "kontakt",
  },
} as const;

export type TDict = (typeof UI)["hu"];

export function baseLocale(loc?: string): keyof typeof UI {
  const code = (loc || "hu").toLowerCase().split("-")[0] as keyof typeof UI;
  return (UI as any)[code] ? code : "hu";
}

/* ──────────────────────────────────────────────────────────────
   Tailwind helpers / tokens
──────────────────────────────────────────────────────────────── */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,121,128,0.20)] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export const glassPanel =
  "rounded-[1.25rem] border border-white/30 bg-white/55 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)]";

export const inputGlass =
  "w-full bg-white border-none rounded-2xl py-4 pl-14 pr-6 text-slate-700 shadow-sm focus:ring-2 focus:ring-[rgba(0,121,128,0.20)] text-lg placeholder:text-slate-400 transition-all";

/**
 * Mobile bento:
 * - telefonon 1 oszlop (stack), sm-től 2 oszlop, lg-től 4 oszlop
 * - grid-flow-dense + auto-rows a sűrűbb ritmushoz
 */
export const bentoGrid =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 " +
  "gap-2 sm:gap-3 grid-flow-dense auto-rows-[minmax(180px,auto)] sm:auto-rows-[minmax(220px,auto)] lg:auto-rows-[minmax(220px,auto)]";

export const bentoItem =
  "relative overflow-hidden bg-[#f8fafc] rounded-[1.25rem] border border-slate-200 transition-all duration-300";

export const videoCard = "shadow-sm hover:shadow-xl hover:-translate-y-1";

export const overlayGradient =
  "pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent";

export const microBadge =
  "px-2 py-1 bg-white/10 backdrop-blur-md text-[9px] font-bold uppercase tracking-wider rounded border border-white/20 text-white flex items-center gap-1.5";

export const filterChip =
  "rounded-full border border-slate-200 bg-[#f8fafc] font-semibold text-slate-600 hover:bg-white transition-all whitespace-nowrap " +
  "px-4 py-2 text-xs md:px-6 md:py-2.5 md:text-sm";

export const filterChipActive =
  "bg-[rgba(0,121,128,0.10)] border-[rgba(0,121,128,0.20)] text-[rgba(0,121,128,1)] hover:bg-[rgba(0,121,128,0.18)]";

/* ──────────────────────────────────────────────────────────────
   Motion (shared)
──────────────────────────────────────────────────────────────── */
export const spring = {
  type: "spring" as const,
  stiffness: 520,
  damping: 34,
  mass: 0.72,
};

export const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: spring },
  exit: { opacity: 0, y: 8, transition: { duration: 0.16 } },
};

/* ──────────────────────────────────────────────────────────────
   Strapi normalize helpers
──────────────────────────────────────────────────────────────── */
export const get = (x: any) => x?.attributes ?? x;

const relArray = (rel: any) => {
  const d = rel?.data ?? rel;
  return Array.isArray(d) ? d : [];
};

export const norm = (s?: string) => (s ?? "").replace(/^\/|\/$/g, "");

export function unwrapMedia(m: any) {
  const d = m?.data ?? m;
  if (!Array.isArray(d)) return [];
  return d.map((it: any) => get(it)).filter(Boolean);
}

export function unwrapSingleMedia(m: any) {
  const d = m?.data ?? m;
  const one = Array.isArray(d) ? d?.[0] : d;
  const g = get(one);
  return g?.url ? g : null;
}

export function isVideo(m: any) {
  const url = m?.url || "";
  const mime = m?.mime || "";
  return mime.startsWith("video/") || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

export function isImage(m: any) {
  const url = m?.url || "";
  const mime = m?.mime || "";
  return (
    mime.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(url)
  );
}

export function safeLower(x: any) {
  return String(x ?? "").toLowerCase();
}

export function difficultyTone(value?: string) {
  const v = safeLower(value).trim();

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

  if (easy) return { wrap: "text-emerald-300", dot: "bg-emerald-500" };
  if (mid) return { wrap: "text-orange-200", dot: "bg-orange-500" };
  if (hard) return { wrap: "text-red-300", dot: "bg-red-500" };
  return { wrap: "text-white/70", dot: "bg-white/35" };
}

/* ──────────────────────────────────────────────────────────────
   Category helpers
──────────────────────────────────────────────────────────────── */
export type PracticeCategory = { id: any; name: string; slug: string };

export function normalizeCategory(c: any): PracticeCategory {
  const cc = get(c);
  return {
    id: cc?.id ?? cc?._id ?? cc?.documentId ?? cc?.slug ?? cc?.name,
    name: cc?.name ?? "",
    slug: cc?.slug ?? "",
  };
}

export function extractPracticeCategories(practice: any) {
  const p = get(practice);
  return relArray(p?.categories).map(normalizeCategory).filter((c: any) => c?.name);
}

/* ──────────────────────────────────────────────────────────────
   poster + thumb selection
──────────────────────────────────────────────────────────────── */
export function strapiImage(url?: string) {
  if (!url) return "";
  return url.startsWith("http") ? url : url;
}

export function isVideoPractice(pLike: any) {
  const p = get(pLike);
  const media = unwrapMedia(p?.media);
  return media.some((m: any) => isVideo(m));
}

export function extractThumb(practice: any) {
  const p = get(practice);

  const poster = unwrapSingleMedia(p?.video_poster);
  if (poster && isImage(poster)) return { kind: "image" as const, url: strapiImage(poster.url) };

  const media = unwrapMedia(p?.media);
  const firstImg = media.find((m: any) => isImage(m));
  if (firstImg?.url) return { kind: "image" as const, url: strapiImage(firstImg.url) };

  return { kind: "none" as const, url: "" };
}

export type IconCardKey = "clock" | "difficult" | "type";

/**
 * pickIconCards
 * - icon + label alapján is talál (contains match)
 * - több nyelv támogatás (HU/EN/DE)
 */
export function pickIconCards(cards: any[]) {
  const normKey = (s: any) => safeLower(s).replace(/\s+/g, "").trim();

  const pick = (keys: string[]) => {
    const keysNorm = (keys ?? []).map(normKey).filter(Boolean);

    return (cards ?? []).find((x: any) => {
      const icon = normKey(x?.icon);
      const label = normKey(x?.label);

      if (keysNorm.includes(icon) || keysNorm.includes(label)) return true;

      for (let i = 0; i < keysNorm.length; i += 1) {
        const k = keysNorm[i];
        if (!k) continue;
        if (icon.includes(k) || label.includes(k)) return true;
      }
      return false;
    });
  };

  return {
    clock: pick(["clock", "time", "duration", "idő", "ido", "perc", "minutes", "min"]),
    difficult: pick(["difficult", "difficulty", "level", "nehézség", "nehezseg", "schwierigkeit"]),
    type: pick(["type", "focus", "target", "típus", "tipus", "fókusz", "fokus", "ziel"]),
  };
}

/* ──────────────────────────────────────────────────────────────
   Normalized type
──────────────────────────────────────────────────────────────── */
export type NormalizedPractice = {
  raw: any;
  p: any;
  name: string;
  slug: string;
  desc: string;
  searchable: string;
  catKeys: string[];
  primaryCat?: string;
  primaryCatLabel?: string;
  cards: any[];
  thumb: { kind: "none" | "image"; url: string };
  isVideo: boolean;
  iconCards: any;
  diffTone: ReturnType<typeof difficultyTone>;
  kpis: any[];
};

/* ──────────────────────────────────────────────────────────────
   Shared helpers used by PracticeCard (EXPORT OK!)
──────────────────────────────────────────────────────────────── */
export function isFeaturedFlag(p: any) {
  return Boolean(p?.featured ?? p?.is_featured ?? p?.highlighted ?? p?.isHighlighted);
}

export function findDifficultyCard(cards: any[] = [], iconCards?: any) {
  const fromIcon = iconCards?.difficult;
  if (fromIcon) return fromIcon;

  return (
    (cards ?? []).find((c: any) =>
      /neh[eé]zs[eé]g|difficulty|schwierigkeit/i.test(String(c?.label ?? ""))
    ) ?? null
  );
}
