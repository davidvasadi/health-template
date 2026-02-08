// components/practice/practice-index.ts
"use client";

import { useMemo } from "react";
import {
  get,
  normalizeCategory,
  extractPracticeCategories,
  extractThumb,
  pickIconCards,
  difficultyTone,
  safeLower,
  isVideoPractice,
  findDifficultyCard,
  isFeaturedFlag,
  type PracticeCategory,
  type NormalizedPractice,
} from "./practice-shared";

export type Preset = "" | "short" | "easy" | "mid" | "hard" | "video";

export function parseMinutes(raw?: string) {
  const s = String(raw ?? "").toLowerCase();
  const m = s.match(/(\d+)\s*(p|perc|min)/i);
  return m ? Number(m[1]) : null;
}

export function difficultyLevel(raw?: string): "easy" | "mid" | "hard" | "unknown" {
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

export function usePracticeIndex(practices: any[], categories: any[]) {
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

      const diffCard = findDifficultyCard(cards, iconCards);
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
    const hero = normalized.find((x) => isFeaturedFlag(x.p)) || normalized[0];
    const wide = normalized.find((x) => x !== hero) || null;
    return { hero, wide };
  }, [normalized]);

  return { cats, catLabelByKey, normalized, presetStats, editorial };
}
