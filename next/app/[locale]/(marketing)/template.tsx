"use client";

// Lapváltás (2026-11-20) — „függöny tolja ki a régi oldalt, logóval, majd felhúzódik”.
//
// Két rész dolgozik együtt:
//  1. View Transitions (app/globals.css, ::view-transition-old/new(root)): a régi oldal felfelé kicsúszik, az új alulról
//     feltolódik — a fejléc a helyén marad.
//  2. Ez a template: az új oldal tetején egy sötét türkiz FÜGGÖNY van, rajta kirajzolódik a logó (ugyanaz a rajzolat,
//     mint a preloaderé — components/preload/logo-paths.ts). Mivel az 1. pont az új oldalt élőben tolja fel, a függöny
//     az, ami kitolja a régi oldalt; utána a függöny ívelt alsó éllel felfelé elhúzódik, és előbukkan az új oldal.
// Ahol a böngésző nem tud View Transitions-t (pl. Firefox), csak a függöny megy (azonnal takar, majd felhúzódik).
//
// - Az első betöltéskor NINCS függöny (ott a CSS-es első-látogatás preloader van), és a szerver sosem rajzolja
//   (különben a HTML-ben eltakarná a tartalmat — keresők, lassú JS).
// - Csökkentett mozgásnál nincs függöny.
// - A (marketing) csoportban van, mert a főoldal és az aloldalak itt vannak: a [locale] szintű template lapváltáskor
//   nem mountolt újra.
import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PRELOAD_PATHS } from "@/components/preload/logo-paths";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const CURTAIN_EASE: [number, number, number, number] = [0.76, 0, 0.24, 1];
/** a függöny felhúzódása ennyi után indul — a View Transitions tolás (0,6 mp) és a logó-rajzolás után */
const LIFT_DELAY = 0.7;

// a jelzőt az első megjelenés UTÁN (useEffect) állítjuk át — így az első betöltésnél (szerver-HTML és hydration, akár
// dupla Strict Mode-renderrel is) soha nincs függöny, csak a későbbi, kliensoldali lapváltásoknál
let appHydrated = false;

export default function MarketingTemplate({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const navigated = typeof window !== "undefined" && appHydrated;
  useEffect(() => { appHydrated = true; }, []);

  if (reduce || !navigated) return <>{children}</>;

  return (
    <>
      {children}

      <motion.div
        aria-hidden
        // a menü FÖLÖTT (z-50 felett): a menü az oldallal együtt tolódik ki, a függöny takarja, és a felhúzódáskor
        // az új oldallal együtt bukkan elő
        className="pointer-events-none fixed inset-0 z-[9997] flex items-center justify-center"
        style={{ background: "linear-gradient(160deg, #057C80 0%, #0a6165 45%, #003133 100%)" }}
        initial={{ y: "0%", borderBottomLeftRadius: "50% 0vh", borderBottomRightRadius: "50% 0vh" }}
        animate={{ y: "-110%", borderBottomLeftRadius: "50% 18vh", borderBottomRightRadius: "50% 18vh" }}
        transition={{ duration: 0.7, ease: CURTAIN_EASE, delay: LIFT_DELAY }}
      >
        <motion.svg
          viewBox="0 0 350 334"
          className="h-auto w-[120px] md:w-[150px]"
          initial={{ scale: 0.92 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          {PRELOAD_PATHS.map((p, i) => (
            <motion.path
              key={i}
              d={p.d}
              fill={p.kind === "teal" ? "#90fff6" : "#ffffff"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.16, ease: EASE, delay: 0.1 + i * 0.035 }}
            />
          ))}
        </motion.svg>
      </motion.div>
    </>
  );
}
