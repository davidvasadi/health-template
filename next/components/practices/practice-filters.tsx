// components/practice/practice-filters.tsx
/**
 * practice-filters – szűrő UI komponensek (drawer + category chips + filter panel)
 *
 * Tartalom:
 * - MobileDrawer:
 *   - mobil bottom-sheet (framer motion AnimatePresence)
 *   - backdrop click + ESC bezárás
 *   - max-h + belső scroll, hogy kis kijelzőn se “ragadjon be”
 *   - safe-area inset bottom (iOS) támogatás
 *
 * - QuickCategoryChips:
 *   - desktop gyors kategória chip sor
 *   - itt csak a megjelenítés van; a state a practice-items-ben él
 *
 * - FilterPanel:
 *   - kategória lista + számláló + aktív státusz blokk
 *   - variant: desktop/mobile (padding eltérés), minden más ugyanaz
 *
 * Fontos:
 * - A state/logic a parentben van (practice-items), itt főleg markup és esemény továbbadás.
 * - UI pixel-szinten fix: className sorrend és markup fontos.
 */

// components/practice/practice-filters.tsx
"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IconChevronRight, IconX } from "@tabler/icons-react";
import {
  cn,
  glassPanel,
  focusRing,
  filterChip,
  filterChipActive,
  spring,
  type TDict,
  type PracticeCategory,
} from "./practice-shared";

export function MobileDrawer({
  open,
  onClose,
  title,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/25"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: reduceMotion ? { duration: 0 } : undefined,
            }}
            exit={{
              opacity: 0,
              transition: reduceMotion ? { duration: 0 } : undefined,
            }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-x-0 bottom-0 z-50 p-3"
            style={{
              paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
            }}
            initial={reduceMotion ? { y: 0, opacity: 1 } : { y: 32, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: reduceMotion ? { duration: 0 } : spring,
            }}
            exit={{
              y: reduceMotion ? 0 : 32,
              opacity: reduceMotion ? 1 : 0,
              transition: reduceMotion ? { duration: 0 } : { duration: 0.16 },
            }}
          >
            <div
              className={cn(
                glassPanel,
                "p-0 overflow-hidden max-h-[85vh] flex flex-col"
              )}
            >
              <div className="shrink-0 flex items-center justify-between gap-3 p-4 border-b border-slate-200/70 bg-white/55 backdrop-blur-2xl">
                <div className="text-base font-semibold text-slate-900">
                  {title}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={closeLabel}
                    className={cn(
                      "inline-flex items-center justify-center rounded-full border border-slate-200 bg-white h-10 w-10 text-slate-700 hover:border-[rgba(0,121,128,0.35)] hover:text-[rgba(0,121,128,1)] transition",
                      focusRing
                    )}
                  >
                    <IconX className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className={cn(
                      "hidden xs:inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[rgba(0,121,128,0.35)] hover:text-[rgba(0,121,128,1)] transition",
                      focusRing
                    )}
                  >
                    {closeLabel}
                  </button>
                </div>
              </div>

              <div
                className="p-4 overflow-y-auto"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {children}
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export function QuickCategoryChips({
  t,
  quickCats,
  activeCat,
  setActiveCat,
}: {
  t: TDict;
  quickCats: PracticeCategory[];
  activeCat: string;
  setActiveCat: (v: string) => void;
}) {
  if (!quickCats.length) return null;

  return (
    <div className="mt-2 hidden md:block">
      <div className="relative">
        <div
          className="flex gap-1.5 md:gap-2 overflow-x-auto md:flex-wrap md:overflow-visible
                     [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <button
            type="button"
            onClick={() => setActiveCat("")}
            className={cn(filterChip, !activeCat && filterChipActive)}
          >
            {t.all}
          </button>

          {quickCats.map((c) => {
            const key = (c.slug || c.name) as string;
            const active = key === activeCat;
            return (
              <button
                key={c.id || key}
                type="button"
                onClick={() => setActiveCat(active ? "" : key)}
                className={cn(filterChip, active && filterChipActive)}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        <div className="md:hidden pointer-events-none absolute right-0 top-0 bottom-0 flex items-center pr-3 pl-8 bg-gradient-to-l from-white via-white/90 to-transparent">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
            {t.scrollHint}
            <IconChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function FilterPanel({
  cats,
  activeCat,
  setActiveCat,
  resultsCount,
  activeLabel,
  t,
  variant,
  countByKey,
}: {
  cats: PracticeCategory[];
  activeCat: string;
  setActiveCat: (v: string) => void;
  resultsCount: number;
  activeLabel: string;
  t: TDict;
  variant: "desktop" | "mobile";
  countByKey?: Map<string, number>;
}) {
  return (
    <div className={cn(glassPanel, variant === "desktop" ? "p-5" : "p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            {t.filterBy}
          </div>
          <div className="mt-2 text-sm font-medium text-slate-500">
            {t.filterHint}
          </div>
        </div>

        {activeCat ? (
          <button
            type="button"
            onClick={() => setActiveCat("")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800",
              "hover:border-[rgba(0,121,128,0.35)] hover:text-[rgba(0,121,128,1)] transition",
              focusRing
            )}
            aria-label={t.clear}
          >
            <IconX className="h-4 w-4" />
            {t.clear}
          </button>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-1.5 md:gap-2">
        <button
          type="button"
          onClick={() => setActiveCat("")}
          className={cn("text-left", filterChip, !activeCat && filterChipActive)}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="block line-clamp-2">{t.all}</span>
          </span>
        </button>

        {cats.map((c) => {
          const key = (c.slug || c.name) as string;
          const active = key === activeCat;
          const n = countByKey?.get(key) ?? 0;

          return (
            <button
              key={c.id || key}
              type="button"
              onClick={() => setActiveCat(active ? "" : key)}
              className={cn("text-left", filterChip, active && filterChipActive)}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="block line-clamp-2">{c.name}</span>
                <span className="text-slate-400 text-xs font-semibold tabular-nums">
                  {n}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className="text-slate-500">{t.results}</span>
          <span className="text-slate-900 tabular-nums">{resultsCount}</span>
        </div>
        <div className="mt-2 text-sm text-slate-600">
          {t.active}:{" "}
          <span className="font-semibold text-slate-900">{activeLabel}</span>
        </div>
      </div>
    </div>
  );
}
