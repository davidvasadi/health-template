"use client";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, PerformanceMonitor, Preload } from "@react-three/drei";

import { Heading } from "../elements/heading";
import { Subheading } from "../elements/subheading";
import { Button } from "../elements/button";
import { Cover } from "../decorations/cover";

/*******************************************************************************************
 * HERO — Konverzió-fókuszú, elegáns, modern UI (CTA variánsok + új státuszkártya)
 *
 * Fő fókuszok:
 *  - 3 FÉLE CTA-VARIÁNS: "primary" | "accent" | "ghost" (Strapi-ból is választható!)
 *    → Ha a Strapi CTA elemben `variant`/`type` nincs megadva, index alapján rotálunk (0: primary, 1: accent, 2: ghost).
 *  - ÚJ JOBB ALSÓ STÁTUSZKÁRTYA: letisztult, monokróm, kompakt, óra ikon + időpont, szolid outline CTA.
 *  - RÉSZLETES KOMMENT A "Legközelebbi időpont" működéséről (lásd computeNextSlot* függvények).
 *  - LCP optimalizáció + reduced motion tisztelete.
 *******************************************************************************************/

/* =========================================================================================
   TÍPUSOK ÉS BEÁLLÍTÁSOK
   ========================================================================================= */

type BusinessHours = {
  /** Hét napjai 0..6 (vasárnap..szombat), pl. hétfő–péntek: [1,2,3,4,5] */
  days: number[];
  /** Nyitás HH:MM (helyi idő szerint) */
  open: string; // pl. "09:00"
  /** Zárás HH:MM (helyi idő szerint) */
  close: string; // pl. "18:00"
  /** Időpontlépcső percekben (pl. 30 percenként van slot) */
  slotMinutes: number; // pl. 30
};

/* =========================================================================================
   SCROLL PROGRESS (0..1)
   ========================================================================================= */
function useScrollProgress() {
  const ref = useRef(0);
  useEffect(() => {
    const calc = () => {
      const p = window.scrollY / Math.max(1, window.innerHeight);
      ref.current = Math.max(0, Math.min(1, p));
    };
    calc();
    window.addEventListener("scroll", calc, { passive: true });
    window.addEventListener("resize", calc);
    return () => { window.removeEventListener("scroll", calc); window.removeEventListener("resize", calc); };
  }, []);
  return ref;
}

/* =========================================================================================
   3D Elemek (Vertebra + SpineGroup)
   ========================================================================================= */
function Vertebra({ y, scale }: { y: number; scale: number }) {
  return (
    <group position={[0, y, 0]} scale={[scale, scale, scale]}>
      {/* Központi henger */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.4, 0.22, 48]} />
        <meshStandardMaterial metalness={0.18} roughness={0.35} color={"#c7fffa"} />
      </mesh>
      {/* Felső világító karika */}
      <mesh position={[0, 0.12, 0]}>
        <torusGeometry args={[0.34, 0.04, 24, 60]} />
        <meshStandardMaterial emissive={"#04c8c8"} emissiveIntensity={0.42} color={"#51f7f0"} transparent opacity={0.92} />
      </mesh>
      {/* Alsó világító karika */}
      <mesh position={[0, -0.12, 0]}>
        <torusGeometry args={[0.34, 0.04, 24, 60]} />
        <meshStandardMaterial emissive={"#04c8c8"} emissiveIntensity={0.42} color={"#51f7f0"} transparent opacity={0.92} />
      </mesh>
      {/* Hátrafelé mutató „tüske” */}
      <mesh position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.08, 0.5, 24]} />
        <meshStandardMaterial color={"#90fff6"} metalness={0.1} roughness={0.5} />
      </mesh>
    </group>
  );
}

function SpineGroup() {
  const g = useRef<THREE.Group>(null!);
  const scroll = useScrollProgress();
  useFrame((_state, delta) => {
    if (!g.current) return;
    const p = scroll.current;           // 0..1
    const baseSpin = 0.18;
    const speed = baseSpin + p * 0.9;   // görgetésre gyorsul
    g.current.rotation.y += speed * delta;
    g.current.rotation.x = -0.1 + p * 0.26;
    g.current.position.y = 0.15 + p * 0.75;
  });

  const vertebrae = Array.from({ length: 12 }, (_, i) => ({ y: i * 0.35 - 2, s: 0.95 - i * 0.02 }));
  return <group ref={g}>{vertebrae.map((v, i) => <Vertebra key={i} y={v.y} scale={v.s} />)}</group>;
}

/* =========================================================================================
   R3F Canvas (áttetsző, villanás nélkül, adaptív)
   ========================================================================================= */
function SpineScene({ onReady, dpr, hidden }: { onReady: () => void; dpr: number | [number, number]; hidden?: boolean }) {
  if (hidden) return null; // teljesen kihagyjuk renderből (akku kímélés)
  return (
    <Canvas
      camera={{ position: [0, 0.5, 4.2], fov: 45 }}
      shadows={false}
      dpr={dpr}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      className="absolute inset-0 -z-10 pointer-events-none"
      onCreated={(state) => { state.gl.setClearColor(0x000000, 0); onReady(); }}
    >
      {/* @ts-ignore */}
      <color attach="background" args={["transparent"]} />
      <Suspense fallback={null}>
        <Environment preset="studio" />
        <Float floatIntensity={0.3} rotationIntensity={0.12} speed={0.6}>
          <SpineGroup />
        </Float>
        <PerformanceMonitor onDecline={() => { /* DPR-t a szülő állítja */ }} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}

/* =========================================================================================
   Finom overlay (csak ha a scene kész)
   ========================================================================================= */
function SoftOverlay({ visible, reducedMotion }: { visible: boolean; reducedMotion: boolean }) {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 1], [0.55, 0.7]);
  if (!visible) return null;
  return (
    <motion.div style={reducedMotion ? undefined : { opacity }} className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            `radial-gradient(820px 520px at 18% 26%, rgba(81,247,240,0.14) 0%, rgba(255,255,255,0.10) 36%, transparent 60%),
             radial-gradient(880px 540px at 82% 32%, rgba(29,228,226,0.12) 0%, rgba(255,255,255,0.08) 34%, transparent 62%)`,
          filter: "saturate(110%)",
        }}
      />
      <div className="absolute inset-0" style={{ background: `radial-gradient(1200px 800px at 50% 100%, rgba(10,97,101,0.06) 0%, transparent 60%)` }} />
    </motion.div>
  );
}

/* =========================================================================================
   CTA VARIÁNS KEZELÉS (3 distinct stílus)
   ========================================================================================= */

type CtaVariant = "primary" | "accent" | "ghost";

function resolveCtaVariant(cta: any, index: number): CtaVariant {
  const raw = String(cta?.variant || cta?.type || "").toLowerCase();
  if (["primary", "accent", "ghost"].includes(raw)) return raw as CtaVariant;
  // fallback: rotáció index alapján
  return (index % 3 === 0 ? "primary" : index % 3 === 1 ? "accent" : "ghost");
}

function ctaBaseClass() {
  return "rounded-xl px-4 py-2 md:px-5 md:py-2.5 text-sm md:text-base transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
}

function ctaClassByVariant(v: CtaVariant) {
  // Egységes focus ring semleges színnel (dark mode kompatibilis)
  const ring = "focus-visible:ring-neutral-800";
  if (v === "primary") return `${ring}`;
  if (v === "accent") return `${ring}`;
  return `${ring}`; // ghost
}

function ctaStyleByVariant(v: CtaVariant): React.CSSProperties {
  // PRIMARY: teltebb teal üveg, erősebb shadow, sötétebb szöveg
  if (v === "primary") {
    return {
      background: "linear-gradient(180deg, rgba(4,200,200,0.28) 0%, rgba(29,228,226,0.18) 100%)",
      color: "var(--breaker-950)",
      backdropFilter: "blur(16px) saturate(170%)",
      WebkitBackdropFilter: "blur(16px) saturate(170%)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.30), 0 14px 28px rgba(0,0,0,0.14)",
    };
  }
  // ACCENT: világosabb üveg, enyhébb shadow, közép sötét szöveg
  if (v === "accent") {
    return {
      background: "linear-gradient(180deg, rgba(144,255,246,0.20) 0%, rgba(199,255,250,0.12) 100%)",
      color: "var(--breaker-900)",
      backdropFilter: "blur(14px) saturate(160%)",
      WebkitBackdropFilter: "blur(14px) saturate(160%)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28), 0 10px 22px rgba(0,0,0,0.10)",
    };
  }
  // GHOST: üveg-átlátszó, vékony outline, teal szöveg
  return {
    background: "rgba(255,255,255,0.06)",
    color: "var(--breaker-800)",
    border: "1px solid rgba(17,17,17,0.12)",
    backdropFilter: "blur(10px) saturate(140%)",
    WebkitBackdropFilter: "blur(10px) saturate(140%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)",
  };
}

/* =========================================================================================
   CTA segédek (primer kiválasztás + URL normalizálás)
   ========================================================================================= */
function pickPrimaryCta(CTAs: any[], primaryCtaPath?: string) {
  if (!CTAs?.length) return undefined;
  if (primaryCtaPath) return CTAs.find((c) => c?.URL === primaryCtaPath);
  const byType = CTAs.find((c) => ["primary", "booking", "book", "reserve"].includes(String(c?.type || c?.variant || "").toLowerCase()));
  if (byType) return byType;
  const byPath = CTAs.find((c) => String(c?.URL || "").toLowerCase().includes("book"));
  if (byPath) return byPath;
  return CTAs[0];
}

function ctaHref(locale: string, cta: any) {
  const path = String(cta?.URL || "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized}`;
}

/* =========================================================================================
   "Legközelebbi időpont" — Hogyan működik?
   -----------------------------------------------------------------------------------------
   1) Ha `nextSlotDate` prop érkezik (Date | string | number), azt használjuk.
      - A `coerceNextDate()` biztonságosan Date-t csinál belőle.
   2) Ha NINCS megadva, `computeNextSlot()` számol:
      - Alapértelmezett nyitvatartás: H-P 09:00–18:00, 30 perces slotok.
      - A mostani időt felkerekíti a legközelebbi slotra.
      - Ha már zárás után van, a KÖVETKEZŐ nyitvatartó nap 09:00-ját adja.
      - Max 14 napot lép előre, hogy találjon slotot (védőkorlát).
   3) A dátum kijelzése `Intl.DateTimeFormat(locale)`-val megy (pl. hu-HU),
      formátum: rövid hét nap + HH:MM.
 *******************************************************************************************/
function parseHmToDate(base: Date, hm: string): Date {
  const [h, m] = hm.split(":" ).map(Number);
  const d = new Date(base);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function coerceNextDate(input?: Date | string | number) {
  if (!input) return undefined;
  const d = new Date(input);
  return isNaN(d.getTime()) ? undefined : d;
}

function roundUpToSlot(date: Date, slotMinutes: number) {
  const d = new Date(date);
  const ms = slotMinutes * 60 * 1000;
  const rounded = Math.ceil(d.getTime() / ms) * ms;
  return new Date(rounded);
}

function isOpenDay(day: number, hours: BusinessHours) {
  return hours.days.includes(day);
}

function computeNextSlot(now: Date, hours: BusinessHours): Date {
  const guardMax = 14 * 24 * 60 * 60 * 1000; // 14 nap védőkorlát
  let cursor = new Date(now);

  for (let walked = 0; walked <= guardMax; walked += 15 * 60 * 1000) { // 15 perces lépés a loopban
    const day = cursor.getDay();
    if (isOpenDay(day, hours)) {
      const open = parseHmToDate(cursor, hours.open);
      const close = parseHmToDate(cursor, hours.close);

      // Zárás utáni idő: ugorjunk másnapra
      if (cursor > close) {
        const nextDay = new Date(cursor);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        cursor = nextDay;
        continue;
      }

      // Nyitás előtti idő → nyitáshoz kerekítünk
      const startCandidate = cursor < open ? open : cursor;
      const rounded = roundUpToSlot(startCandidate, hours.slotMinutes);
      if (rounded >= open && rounded <= close) return rounded;
    }

    // következő óra/negyedóra felé lépkedünk
    cursor = new Date(cursor.getTime() + 15 * 60 * 1000);
  }
  // Fallback: most + 3 óra
  return new Date(now.getTime() + 3 * 60 * 60 * 1000);
}

function formatSlotLabel(d: Date, locale: string) {
  return new Intl.DateTimeFormat(locale || "hu-HU", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

/* =========================================================================================
   ÓRA IKON (státuszkártyához)
   ========================================================================================= */
const ClockIcon = (props: React.HTMLAttributes<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* =========================================================================================
   HERO KOMPONENS
   ========================================================================================= */
export const Hero = ({
  heading,
  sub_heading,
  CTAs,
  locale,
  phone,
  nextSlotDate,
  primaryCtaPath,
  businessHours,
}: {
  heading: string;
  sub_heading: string;
  CTAs: any[];
  locale: string;
  phone?: string;                 // opcionális: mobil CTA-hoz
  nextSlotDate?: Date | string | number; // opcionális: legközelebbi időpont
  primaryCtaPath?: string;        // opcionális: primer CTA Strapi URL-je
  businessHours?: BusinessHours;  // opcionális: saját nyitvatartás
}) => {
  const reducedMotion = useReducedMotion();

  // címsor feldarabolása: utolsó szó külön (Cover wrapper)
  const hasSpace = heading.includes(" ");
  const first = hasSpace ? heading.substring(0, heading.lastIndexOf(" ")) : heading;
  const last = hasSpace ? heading.split(" ").pop() : "";

  // jelenet-kész flag a villanás elkerülésére
  const [sceneReady, setSceneReady] = useState(false);
  // adaptív DPR: kezdeti tartomány
  const [dpr, setDpr] = useState<[number, number]>([1, 1.5]);

  // 3D mount: LCP barát — késleltetve, és ha tab rejtett vagy reducedMotion, kihagyjuk
  const [showScene, setShowScene] = useState(false);
  const [docVisible, setDocVisible] = useState(true);
  useEffect(() => {
    const onVis = () => setDocVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  useEffect(() => {
    if (reducedMotion || !docVisible) { setShowScene(false); return; }
    const t = setTimeout(() => setShowScene(true), 250);
    return () => clearTimeout(t);
  }, [reducedMotion, docVisible]);

  // parallax a kártyára
  const { scrollYProgress } = useScroll();
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -14]);
  const cardScale = useTransform(scrollYProgress, [0, 1], [1, 0.995]);

  // teljesítmény auto: ha gyengül az fps, visszavesszük a DPR-t (heurisztika)
  useEffect(() => {
    let low = false;
    let r = 0;
    const cb = () => {
      r = requestAnimationFrame(cb);
      if (!low && performance.now() % 5000 < 16) { setDpr([1, 1.25]); low = true; }
    };
    r = requestAnimationFrame(cb);
    return () => cancelAnimationFrame(r);
  }, []);

  // Legközelebbi időpont meghatározása
  const explicitNext = useMemo(() => coerceNextDate(nextSlotDate), [nextSlotDate]);
  const nextSlot = useMemo(() => {
    if (explicitNext) return explicitNext;
    const hours: BusinessHours = businessHours ?? { days: [1,2,3,4,5], open: "09:00", close: "18:00", slotMinutes: 30 };
    return computeNextSlot(new Date(), hours);
  }, [explicitNext, businessHours]);
  const nextSlotLabel = useMemo(() => formatSlotLabel(nextSlot, locale), [nextSlot, locale]);

  // Primer + szekunder CTA-k kiválasztása Strapi-ból
  const primaryCTA = useMemo(() => pickPrimaryCta(CTAs, primaryCtaPath), [CTAs, primaryCtaPath]);
  const secondaryCTAs = useMemo(() => (primaryCTA ? CTAs.filter((c) => c !== primaryCTA) : CTAs), [CTAs, primaryCTA]);

  return (
    <section className="relative h-screen isolate overflow-hidden">
      {/* HÁTTÉR: spine (átlátszó, nincs preload villanás) */}
      {showScene && (
        <SpineScene onReady={() => setSceneReady(true)} dpr={dpr} hidden={!docVisible} />
      )}

      {/* Soft overlay csak akkor, ha a scene már látszik */}
      <SoftOverlay visible={sceneReady && showScene} reducedMotion={!!reducedMotion} />

      {/* KÖZÉP – üvegkártya */}
      <div className="absolute inset-0 z-30 grid place-items-center px-6">
        <motion.div style={reducedMotion ? undefined : { y: cardY, scale: cardScale }} className="relative w-[min(92vw,960px)] rounded-[28px] px-8 py-8 md:px-12 md:py-12 text-center">
          {/* ÜVEG háttér */}
          <div
            className="absolute inset-0 rounded-[28px] -z-20"
            style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(7px) saturate(170%)", WebkitBackdropFilter: "blur(40px) saturate(170%)", boxShadow: "0 10px 26px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.22)" }}
            aria-hidden
          />
          {/* Szöveg-halo */}
          <div className="absolute inset-0 rounded-[28px] -z-10 pointer-events-none" style={{ background: "radial-gradient(56% 56% at 50% 50%, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.08) 42%, rgba(0,0,0,0.03) 64%, rgba(0,0,0,0.0) 78%)" }} aria-hidden />
          {/* finom sheen */}
          {!reducedMotion && (
            <motion.div
              className="pointer-events-none absolute top-0 left-0 h-full w-1/3 rounded-[28px]"
              style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.0), rgba(255,255,255,0.22), rgba(255,255,255,0.0))" }}
              initial={{ x: "-120%", opacity: 0 }}
              animate={{ x: ["-120%", "120%"], opacity: [0, 0.35, 0] }}
              transition={{ duration: 6.5, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }}
              aria-hidden
            />
          )}

          {/* CÍMSOR */}
          <Heading as="h1" className="font-semibold leading-tight text-balance text-current bg-none mx-auto max-w-[22ch]" style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)", color: "var(--breaker-900)" }}>
            {hasSpace ? (<>{first} <Cover>{last}</Cover></>) : (<Cover>{heading}</Cover>)}
          </Heading>

          {/* ALCÍM */}
          <Subheading className="mt-4 text-balance mx-auto max-w-[60ch]" style={{ color: "var(--breaker-950)", opacity: 0.95, textShadow: "0 1px 12px rgba(0,0,0,.25)", fontSize: "clamp(1rem, 2.2vw, 1.25rem)" }}>
            {sub_heading}
          </Subheading>

          {/* CTA-k — 3 variáns, Strapi driven */}
          {!!CTAs?.length && (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {CTAs.map((cta: any, i: number) => {
                const v = resolveCtaVariant(cta, i);
                return (
                  <Button
                    key={cta?.id ?? i}
                    as={Link}
                    href={ctaHref(locale, cta)}
                    className={`${ctaBaseClass()} ${ctaClassByVariant(v)} hover:-translate-y-px`}
                    style={ctaStyleByVariant(v)}
                    aria-label={cta?.ariaLabel || cta?.text}
                  >
                    {cta.text}
                  </Button>
                );
              })}

              {/* Egyérintéses hívás – csak mobilon, ha van telefonszám */}
              {phone && (
                <div className="md:hidden w-full flex justify-center">
                  {(() => { const v: CtaVariant = "ghost"; return (
                    <Button as="a" href={`tel:${phone}`} className={`${ctaBaseClass()} ${ctaClassByVariant(v)} mt-2 hover:-translate-y-px`} style={ctaStyleByVariant(v)} aria-label="Hívás">
                      Hívás most
                    </Button>
                  ); })()}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* JOBB ALSÓ STÁTUSZKÁRTYA — "kártya" méret az eredetivel egyező, új színképlet */}
{primaryCTA && (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1, duration: 0.35 }}
    className="absolute bottom-6 right-6 z-40 hidden md:block"
    aria-live="polite"
  >
    <div
      className="relative rounded-2xl px-5 py-4 shadow-xl border"
      style={{
        /* Üvegkártya: világosabb háttér, enyhe teal kontúr, finom árnyék */
        background: "rgba(255,255,255,0.85)",
        borderColor: "rgba(4,200,200,0.18)",
        backdropFilter: "blur(12px) saturate(160%)",
        WebkitBackdropFilter: "blur(12px) saturate(160%)",
        boxShadow: "0 10px 26px rgba(0,0,0,0.08)",
      }}
    >
      {/* diszkrét teal "fénycsóva" háttér, túlzó glow nélkül */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl -z-10"
        style={{
          background: "linear-gradient(135deg, rgba(4,200,200,0.18) 0%, rgba(4,200,200,0.00) 60%)",
          filter: "blur(8px)",
        }}
        aria-hidden
      />

      {/* CÍMKE + IDŐPONT */}
      <p className="text-[12px] uppercase tracking-wide" style={{ color: "rgba(13,81,84,0.9)" }}>
        Legközelebbi szabad időpont
      </p>
      {/*
        A megjelenített időpont (nextSlotLabel) így készül:
        - Ha a komponens kap `nextSlotDate` propot (Date|string|number), azt használjuk.
        - Ha nem, a computeNextSlot() számol a `businessHours` alapján (alap: H–P 09:00–18:00, 30p slot).
        - A labelt Intl.DateTimeFormat(locale) formázza (pl. "csü., 16:30").
      */}
      <p className="mt-0.5" style={{ color: "var(--breaker-950)", fontWeight: 700, fontSize: 20 }}>
        {nextSlotLabel}
      </p>

      {/* JOBB OLDALI CTA — primer stílus, nem túl harsány */}
      <div className="mt-3 flex justify-end">
        {(() => { const v = "primary" as const; return (
          <Button
            as={Link}
            href={ctaHref(locale, primaryCTA)}
            className={`${ctaBaseClass()} ${ctaClassByVariant(v)} hover:-translate-y-px`}
            style={ctaStyleByVariant(v)}
          >
            {primaryCTA.text}
          </Button>
        ); })()}
      </div>
    </div>
  </motion.div>
)}

      {/* Sticky micro-CTA — mobilon, csak ha van legalább egy CTA */}
      {!!CTAs?.length && (
        <div className="fixed bottom-4 left-0 right-0 z-40 px-4 md:hidden">
          <div className="mx-auto max-w-sm rounded-full shadow-xl backdrop-blur-xl" style={{ background: "rgba(255,255,255,.75)" }}>
            {(() => { const firstCta = CTAs[0]; const v = resolveCtaVariant(firstCta, 0); return (
              <Button as={Link} href={ctaHref(locale, firstCta)} className={`w-full ${ctaBaseClass()} ${ctaClassByVariant(v)}`} style={ctaStyleByVariant(v)}>
                {firstCta.text}
              </Button>
            ); })()}
          </div>
        </div>
      )}
    </section>
  );
};
