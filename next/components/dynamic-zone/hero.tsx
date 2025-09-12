"use client";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Preload, PerformanceMonitor, useProgress } from "@react-three/drei";

import { Heading } from "../elements/heading";
import { Subheading } from "../elements/subheading";
import { Button } from "../elements/button";
import { Cover } from "../decorations/cover";

/** SWC parser workaround */
const MotionSection = motion.section as unknown as React.ComponentType<any>;
const MotionDiv = motion.div as unknown as React.ComponentType<any>;

/* =========================================================================================
   Típusok
   ========================================================================================= */
type BusinessHours = { days: number[]; open: string; close: string; slotMinutes: number };

/* =========================================================================================
   Segéd: scroll progress 0..1
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
   3D — Vertebra + SpineGroup
   ========================================================================================= */
const Vertebra = React.memo(function Vertebra({ y, scale }: { y: number; scale: number }) {
  return (
    <group position={[0, y, 0]} scale={[scale, scale, scale]}>
      <mesh castShadow={false} receiveShadow={false}>
        <cylinderGeometry args={[0.35, 0.4, 0.22, 48]} />
        <meshStandardMaterial metalness={0.18} roughness={0.35} color={"#c7fffa"} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <torusGeometry args={[0.34, 0.04, 24, 60]} />
        <meshStandardMaterial emissive={"#04c8c8"} emissiveIntensity={0.42} color={"#51f7f0"} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <torusGeometry args={[0.34, 0.04, 24, 60]} />
        <meshStandardMaterial emissive={"#04c8c8"} emissiveIntensity={0.42} color={"#51f7f0"} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.08, 0.5, 24]} />
        <meshStandardMaterial color={"#90fff6"} metalness={0.1} roughness={0.5} />
      </mesh>
    </group>
  );
});

function SpineGroup() {
  const g = useRef<THREE.Group>(null!);
  const scroll = useScrollProgress();

  // ha a dokumentum rejtve (másik fül), nem frissítünk — de NEM unmountolunk!
  const hiddenRef = useRef(false);
  useEffect(() => {
    const onVis = () => { hiddenRef.current = document.hidden; };
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useFrame((_, rawDelta) => {
    if (!g.current || hiddenRef.current) return;

    const delta = Math.min(rawDelta, 1 / 30);
    const p = scroll.current;           // 0..1
    const baseSpin = 0.18;
    const speed = baseSpin + p * 0.9;

    const targetRotX = -0.1 + p * 0.26;
    const targetPosY = 0.15 + p * 0.75;

    g.current.rotation.y += speed * delta;
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, targetRotX, 6, delta);
    g.current.position.y = THREE.MathUtils.damp(g.current.position.y, targetPosY, 6, delta);
  });

  const vertebrae = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ y: i * 0.35 - 2, s: 0.95 - i * 0.02 })), []);
  return <group ref={g}>{vertebrae.map((v, i) => <Vertebra key={i} y={v.y} scale={v.s} />)}</group>;
}

/* =========================================================================================
   SpineScene — csak egyszer animál be; onReady a teljes asset-ready után
   ========================================================================================= */
function SpineScene({
  onReady,
  dpr,
  setDpr,
}: {
  onReady: () => void;
  dpr: number | [number, number];
  setDpr: (d: [number, number]) => void;
}) {
  const { progress } = useProgress();

  useEffect(() => {
    if (progress === 100) {
      const id = requestAnimationFrame(() => onReady());
      return () => cancelAnimationFrame(id);
    }
  }, [progress, onReady]);

  return (
    <Canvas
      camera={{ position: [0, 0.5, 4.2], fov: 45 }}
      shadows={false}
      dpr={dpr}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: false,
      }}
      className="absolute inset-0 -z-10 pointer-events-none"
      onCreated={(state) => { state.gl.setClearColor(0x000000, 0); }}
      frameloop="always"
    >
      {/* @ts-ignore */}
      <color attach="background" args={["transparent"]} />
      <Suspense fallback={null}>
        <Environment preset="studio" />
        <Float floatIntensity={0.3} rotationIntensity={0.12} speed={0.6}>
          <SpineGroup />
        </Float>
        <PerformanceMonitor onDecline={() => setDpr([1, 1.25])} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}

/* =========================================================================================
   Finom overlay
   ========================================================================================= */
function SoftOverlay({ visible, reducedMotion }: { visible: boolean; reducedMotion: boolean }) {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 1], [0.55, 0.7]);
  if (!visible) return null;
  return (
    <MotionDiv style={reducedMotion ? undefined : { opacity }} className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
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
    </MotionDiv>
  );
}

/* =========================================================================================
   CTA segédek
   ========================================================================================= */
/* CTA segédek */
type CtaVariant = "primary" | "accent" | "muted" | "simple";

function resolveCtaVariant(cta: any, index: number): CtaVariant {
  const raw = String(cta?.variant || cta?.type || "").toLowerCase();
  if (["primary", "accent", "muted", "simple"].includes(raw)) return raw as CtaVariant;
  return index % 4 === 0 ? "primary" : index % 4 === 1 ? "accent" : index % 4 === 2 ? "muted" : "simple";
}

function ctaBaseClass() {
  return "rounded-lg px-4 py-2 md:px-5 md:py-2.5 text-sm md:text-base transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
}

function ctaClassByVariant(_v: CtaVariant) {
  return "focus-visible:ring-neutral-800 hover:-translate-y-1 hover:shadow-lg";
}

function ctaStyleByVariant(v: CtaVariant): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: "0.5rem", // max lg
    padding: "0.5rem 1.25rem",
    fontSize: "0.95rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.25s ease-in-out",
    backdropFilter: "blur(12px) saturate(150%)",
    WebkitBackdropFilter: "blur(12px) saturate(150%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 6px 12px rgba(0,0,0,0.08)",
  };

  switch (v) {
    case "primary":
      return {
        ...base,
        background: "linear-gradient(180deg, rgba(4,200,200,0.35) 0%, rgba(29,228,226,0.20) 100%)",
        color: "var(--breaker-950)",
        border: "none",
      };
    case "accent":
      return {
        ...base,
        background: "linear-gradient(180deg, rgba(144,255,246,0.25) 0%, rgba(199,255,250,0.12) 100%)",
        color: "var(--breaker-900)",
        border: "none",
      };
    case "muted":
      return {
        ...base,
        background: "rgba(255,255,255,0.06)",
        color: "var(--breaker-800)",
        border: "1px solid rgba(255,255,255,0.18)",
      };
    case "simple":
      return {
        ...base,
        background: "rgba(255,255,255,0.12)",
        color: "var(--breaker-950)",
        border: "1px solid rgba(255,255,255,0.20)",
      };
    default:
      return base;
  }
}



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
   Slot számítás
   ========================================================================================= */
function parseHmToDate(base: Date, hm: string): Date {
  const [h, m] = hm.split(":").map(Number);
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

  for (let walked = 0; walked <= guardMax; walked += 15 * 60 * 1000) {
    const day = cursor.getDay();
    if (isOpenDay(day, hours)) {
      const open = parseHmToDate(cursor, hours.open);
      const close = parseHmToDate(cursor, hours.close);

      if (cursor > close) {
        const nextDay = new Date(cursor);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        cursor = nextDay;
        continue;
      }

      const startCandidate = cursor < open ? open : cursor;
      const rounded = roundUpToSlot(startCandidate, hours.slotMinutes);
      if (rounded >= open && rounded <= close) return rounded;
    }

    cursor = new Date(cursor.getTime() + 15 * 60 * 1000);
  }
  return new Date(now.getTime() + 3 * 60 * 60 * 1000);
}

function formatSlotLabel(d: Date, locale: string) {
  return new Intl.DateTimeFormat(locale || "hu-HU", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

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
  phone?: string;
  nextSlotDate?: Date | string | number;
  primaryCtaPath?: string;
  businessHours?: BusinessHours;
}) => {
  const reducedMotion = useReducedMotion();

  // címsor feldarabolása
  const hasSpace = heading.includes(" ");
  const first = hasSpace ? heading.substring(0, heading.lastIndexOf(" ")) : heading;
  const last = hasSpace ? heading.split(" ").pop() : "";

  // DPR
  const [sceneReady, setSceneReady] = useState(false);
  const [dpr, setDpr] = useState<[number, number]>(() => {
    if (typeof window === "undefined") return [1, 2];
    const max = Math.min(2, window.devicePixelRatio || 1.5);
    return [1, max];
  });

  // !!! ELSŐ MEGNYITÁS vs VISSZATÉRÉS
  // ha már járt a user ezen a sessionben a főoldalon, ne animáljunk újra
  const [hasEnteredOnce, setHasEnteredOnce] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("heroSeen") === "1";
  });
  useEffect(() => {
    if (!hasEnteredOnce && sceneReady) {
      sessionStorage.setItem("heroSeen", "1");
      setHasEnteredOnce(true); // a jelen sessionben rögzítjük
    }
  }, [sceneReady, hasEnteredOnce]);

  // parallax a kártyára
  const { scrollYProgress } = useScroll();
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -12]);
  const cardScale = useTransform(scrollYProgress, [0, 1], [1, 0.997]);

  // Legközelebbi időpont
  const explicitNext = useMemo(() => coerceNextDate(nextSlotDate), [nextSlotDate]);
  const nextSlot = useMemo(() => {
    if (explicitNext) return explicitNext;
    const hours: BusinessHours = businessHours ?? { days: [1,2,3,4,5], open: "09:00", close: "18:00", slotMinutes: 30 };
    return computeNextSlot(new Date(), hours);
  }, [explicitNext, businessHours]);
  const nextSlotLabel = useMemo(() => formatSlotLabel(nextSlot, locale), [nextSlot, locale]);

  // CTAs
  const primaryCTA = useMemo(() => pickPrimaryCta(CTAs, primaryCtaPath), [CTAs, primaryCtaPath]);
  const secondaryCTAs = useMemo(() => (primaryCTA ? CTAs.filter((c) => c !== primaryCTA) : CTAs), [CTAs, primaryCTA]);

  // EGYSZERRE belépő variánsok — csak az első látogatáskor futnak le
  const sectionVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } };
  const bgVariants = { hidden: { y: 28, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };
  const cardVariants = { hidden: { y: -22, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

  // showScene: NE használjunk docVisible alapú unmountot → ez okozta a „beugrást”
  const showScene = !reducedMotion;

  return (
    <MotionSection
      className="relative min-h-svh isolate overflow-hidden"
      variants={sectionVariants}
      initial={reducedMotion ? undefined : (hasEnteredOnce ? false : "hidden")}
      animate={reducedMotion ? undefined : "show"}
    >
      {/* HÁTTÉR: Spine */}
      {showScene && (
        <MotionDiv
          className="absolute inset-0 -z-10"
          variants={bgVariants}
          // ha már láttuk egyszer, nem animáljuk újra
          initial={reducedMotion ? undefined : (hasEnteredOnce ? false : "hidden")}
          animate={reducedMotion ? undefined : "show"}
        >
          <SpineScene onReady={() => setSceneReady(true)} dpr={dpr} setDpr={setDpr} />
        </MotionDiv>
      )}

      {/* Soft overlay csak sceneReady után */}
      <SoftOverlay visible={sceneReady && showScene} reducedMotion={!!reducedMotion} />

      {/* KÖZÉP – üvegkártya */}
      <div className="relative z-30 flex items-center justify-center px-6 min-h-svh">
        <div className="relative w-full max-w-[960px] rounded-[28px] px-8 py-8 md:px-12 md:py-12 text-center">
          <div
            className="absolute inset-0 rounded-[28px] -z-20"
            style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(7px) saturate(170%)", WebkitBackdropFilter: "blur(40px) saturate(170%)", boxShadow: "0 10px 26px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.22)" }}
            aria-hidden
          />
          <div className="absolute inset-0 rounded-[28px] -z-10 pointer-events-none" style={{ background: `radial-gradient(56% 56% at 50% 50%, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.08) 42%, rgba(0,0,0,0.03) 64%, rgba(0,0,0,0.0) 78%)` }} aria-hidden />

          <MotionDiv
            variants={cardVariants}
            initial={reducedMotion ? undefined : (hasEnteredOnce ? false : "hidden")}
            animate={reducedMotion ? undefined : "show"}
            style={reducedMotion ? undefined : { y: cardY, scale: cardScale, willChange: "transform", transform: "translateZ(0)" }}
            className="relative"
          >
            {!reducedMotion && (
              <MotionDiv
                className="pointer-events-none absolute top-0 left-0 h-full w-1/3 rounded-[28px] will-change-transform"
                style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.0), rgba(255,255,255,0.22), rgba(255,255,255,0.0))" }}
                initial={{ x: "-120%", opacity: 0 }}
                animate={{ x: ["-120%", "120%"], opacity: [0, 0.28, 0] }}
                transition={{ duration: 7.2, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }}
                aria-hidden
              />
            )}

            <Heading as="h1" className="font-semibold leading-tight text-balance text-current bg-none mx-auto max-w-[22ch]" style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)", color: "var(--breaker-900)" }}>
              {hasSpace ? (<>{first} <Cover>{last}</Cover></>) : (<Cover>{heading}</Cover>)}
            </Heading>

            <Subheading className="mt-4 text-balance mx-auto max-w-[60ch]" style={{ color: "var(--breaker-950)", opacity: 0.95, textShadow: "0 1px 12px rgba(0,0,0,.25)", fontSize: "clamp(1rem, 2.2vw, 1.25rem)" }}>
              {sub_heading}
            </Subheading>

            {/* CTA-k */}
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
              </div>
            )}
          </MotionDiv>
        </div>
      </div>

      {/* JOBB ALSÓ STÁTUSZKÁRTYA */}
      {/* {primaryCTA && (
        <MotionDiv
          initial={reducedMotion ? undefined : (hasEnteredOnce ? false : { opacity: 0, y: 12 })}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="absolute bottom-5 right-5 z-40 hidden md:block"
          aria-live="polite"
        >
          <div
            className="relative w-[210px] rounded-xl px-4 py-3 shadow-lg border"
            style={{
              background: "rgba(255,255,255,0.82)",
              borderColor: "rgba(4,200,200,0.18)",
              backdropFilter: "blur(10px) saturate(150%)",
              WebkitBackdropFilter: "blur(10px) saturate(150%)",
              boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
            }}
          >
            <div className="pointer-events-none absolute -inset-px rounded-xl -z-10" style={{ background: "linear-gradient(135deg, rgba(4,200,200,0.16) 0%, rgba(4,200,200,0.00) 58%)", filter: "blur(6px)" }} aria-hidden />

            <p className="text-[11px] uppercase tracking-wide" style={{ color: "rgba(13,81,84,0.9)" }}>
              Legközelebbi szabad időpont
            </p>
            <p className="mt-0.5" style={{ color: "var(--breaker-950)", fontWeight: 700, fontSize: 18 }}>
              {nextSlotLabel}
            </p>

            <div className="mt-2.5 flex justify-end">
              {(() => { const v = "primary" as const; return (
                <Button
                  as={Link}
                  href={ctaHref(locale, primaryCTA)}
                  className={`${ctaBaseClass()} ${ctaClassByVariant(v)} hover:-translate-y-px h-9 px-3 py-1 text-sm`}
                  style={ctaStyleByVariant(v)}
                >
                  Foglalás
                </Button>
              ); })()}
            </div>
          </div>
        </MotionDiv>
      )} */}

      {/* ⛔️ Mobilos sticky micro-CTA — ELTÁVOLÍTVA  */}
    </MotionSection>
  );
};
