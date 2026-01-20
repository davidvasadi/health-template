// components/practice/practice-tiles.tsx
/**
 * practice-tiles – a PracticeItems-ben használt “bento tile” UI blokkok (csak markup komponensek)
 *
 * Tartalom:
 * - CategoryTile: kategória csempe a gridben
 * - DifficultyFilterTile: desktop nehézség panel (csak UI, a preset state a parentben)
 * - ContactTile: kapcsolat csempe
 * - BannerTile: nagy banner csempe (kategória kampány)
 * - PresetChip: egységes preset chip (desktop sor + mobil drawer is ugyanazt használja)
 *
 * Miért külön fájl:
 * - Csökkenti a PracticeItems “vizuális zaját” → a fő fájlban a flow látszik.
 *
 * Fontos:
 * - UI pixel-szinten fix: ezek a komponensek 1:1 ugyanazt a markupot/className-t tartják.
 * - Nem tartalmaznak üzleti logikát, csak props -> render.
 */

"use client";

import React from "react";
import { Link } from "next-view-transitions";
import {
  IconChevronRight,
  IconSparkles,
  IconMessageDots,
} from "@tabler/icons-react";

import {
  cn,
  bentoItem,
  filterChip,
  filterChipActive,
  focusRing,
  type TDict,
} from "./practice-shared";

import type { Preset } from "./practice-index";

/* ──────────────────────────────────────────────────────────────
   Tiles (UI 1:1 átmásolva a practice-items-ből)
   - cél: a practice-items olvashatóbb legyen
──────────────────────────────────────────────────────────────── */

export function CategoryTile({
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
        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">{t.collection}</p>
        <h4 className="text-2xl font-semibold">{title}</h4>
        <p className="text-white/70 text-xs mt-2">{subtitle}</p>
      </div>
    </button>
  );
}

export function DifficultyFilterTile({
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
    <div className={cn(bentoItem, "p-8 flex flex-col justify-between bg-[#f8fafc] hidden md:flex lg:row-span-2", className)}>
      <div>
        <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[rgba(0,121,128,1)]" />
          {t.difficulty}
        </h4>

        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-black text-[rgba(0,121,128,1)] uppercase tracking-widest mb-3">{t.filterBy}</p>

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
        <p className="text-[11px] font-semibold text-[rgba(0,121,128,1)] leading-snug">{t.difficultyTip}</p>
      </div>
    </div>
  );
}

export function ContactTile({
  t,
  href,
  className,
}: {
  t: TDict;
  href: string;
  className?: string;
}) {
  return (
    <div className={cn(bentoItem, "p-8 bg-[#f8fafc] border-dashed border-2 border-slate-200 flex flex-col justify-center", className)}>
      <div className="w-12 h-12 bg-white shadow-md rounded-2xl flex items-center justify-center mb-6">
        <IconMessageDots className="h-6 w-6 text-[rgba(0,121,128,1)]" />
      </div>
      <h4 className="text-lg font-semibold mb-2 text-slate-900">{t.askTitle}</h4>
      <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{t.askDesc}</p>
      <Link
        href={href as never}
        className={cn("text-xs font-black text-[rgba(0,121,128,1)] uppercase tracking-wider hover:underline", focusRing)}
      >
        {t.askCta}
      </Link>
    </div>
  );
}

export function BannerTile({
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
        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-2">{t.expertPick}</p>
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

/* ──────────────────────────────────────────────────────────────
   Egységes preset chip (desktop + mobile drawer ugyanaz)
──────────────────────────────────────────────────────────────── */
export function PresetChip({
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
