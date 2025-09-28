"use client";
/* =========================================================================================
   HERO – teljes, optimalizált verzió (Next.js + R3F + Framer Motion)
   - Késleltetett WebGL mount (LCP kímélés)
   - Adaptív DPR / antialias kikapcs mobilon
   - HDR Environment helyett olcsó Lights (mobilon mindig)
   - Láthatóság alapú animáció-tempo
   - Újrafelhasznált geometriák/anyagok (kevesebb draw call)
   - Drága CSS (backdrop-filter) feltételes lekapcsolása mobilon/reduced-motion esetén
========================================================================================= */

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import * as THREE from "three";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  AdaptiveDpr,
  Float,
  Preload,
  PerformanceMonitor,
  useProgress,
} from "@react-three/drei";

// A projekt saját UI-elemei
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
   Segédek
========================================================================================= */
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

function strapiImgUrl(img: any): string | undefined {
  if (!img) return undefined;
  const a = img?.data?.attributes ?? img?.attributes ?? img;
  const u = a?.formats?.medium?.url ?? a?.url;
  if (!u) return undefined;
  return u.startsWith("http") ? u : `${STRAPI_URL}${u}`;
}

function strapiImgAlt(img: any, fallback = "Profilkép") {
  const a = img?.data?.attributes ?? img?.attributes ?? img;
  return a?.alternativeText || fallback;
}

// Scroll progress 0..1 (1 viewport-nyit mér)
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
    return () => {
      window.removeEventListener("scroll", calc);
      window.removeEventListener("resize", calc);
    };
  }, []);
  return ref;
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
  return new Intl.DateTimeFormat(locale || "hu-HU", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/* =========================================================================================
   CTA-k
========================================================================================= */
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
    borderRadius: "0.5rem",
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
  const byType = CTAs.find((c) =>
    ["primary", "booking", "book", "reserve"].includes(String(c?.type || c?.variant || "").toLowerCase())
  );
  if (byType) return byType;
  const byPath = CTAs.find((c) => String(c?.URL || "").toLowerCase().includes("book"));
  if (byPath) return byPath;
  return CTAs[0];
}
function ctaHref(locale: string, cta: any) {
  if (!cta) return "#";
  const path = String(cta?.href || cta?.URL || "").trim();
  if (!path) return "#";
  if (/^https?:\/\//i.test(path)) return path; // külső link
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized}`.replace(/\/{2,}/g, "/");
}

/* =========================================================================================
   3D – újrafelhasznált geometriák/anyagok
========================================================================================= */
const cylGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.22, 48);
const torusGeo = new THREE.TorusGeometry(0.34, 0.04, 24, 60);
const coneGeo = new THREE.ConeGeometry(0.08, 0.5, 24);

const matBody = new THREE.MeshStandardMaterial({ metalness: 0.18, roughness: 0.35, color: "#c7fffa" });
const matRing = new THREE.MeshStandardMaterial({
  emissive: "#04c8c8",
  emissiveIntensity: 0.42,
  color: "#51f7f0",
  transparent: true,
  opacity: 0.92,
});
const matCone = new THREE.MeshStandardMaterial({ color: "#90fff6", metalness: 0.1, roughness: 0.5 });

const Vertebra = React.memo(function Vertebra({ y, scale }: { y: number; scale: number }) {
  return (
    <group position={[0, y, 0]} scale={[scale, scale, scale]}>
      <mesh geometry={cylGeo} material={matBody} />
      <mesh geometry={torusGeo} material={matRing} position={[0, 0.12, 0]} />
      <mesh geometry={torusGeo} material={matRing} position={[0, -0.12, 0]} />
      <mesh geometry={coneGeo} material={matCone} position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
});

/* =========================================================================================
   SpineGroup – láthatóság alapú frissítés, scroll-vezérelt mozgás
========================================================================================= */
function SpineGroup({ inView }: { inView: boolean }) {
  const g = useRef<THREE.Group>(null!);
  const scroll = useScrollProgress();

  // Tab/fül láthatóság
  const hiddenRef = useRef(false);
  useEffect(() => {
    const onVis = () => {
      hiddenRef.current = document.hidden;
    };
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useFrame((_, rawDelta) => {
    if (!g.current || hiddenRef.current) return;

    // ha nincs képernyőn, csökkentsük az update frekit
    const targetFps = inView ? 60 : 10;
    const maxDelta = 1 / targetFps;
    const delta = Math.min(rawDelta, maxDelta);

    const p = scroll.current; // 0..1
    const baseSpin = 0.18;
    const speed = baseSpin + p * 0.9;

    const targetRotX = -0.1 + p * 0.26;
    const targetPosY = 0.15 + p * 0.75;

    g.current.rotation.y += speed * delta;
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, targetRotX, 6, delta);
    g.current.position.y = THREE.MathUtils.damp(g.current.position.y, targetPosY, 6, delta);
  });

  const vertebrae = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ y: i * 0.35 - 2, s: 0.95 - i * 0.02 })),
    []
  );
  return <group ref={g}>{vertebrae.map((v, i) => <Vertebra key={i} y={v.y} scale={v.s} />)}</group>;
}

/* =========================================================================================
   SpineScene – késleltetett onReady, adaptív DPR, mobil fények
========================================================================================= */
function SpineScene({
  onReady,
  dpr,
  setDpr,
  inView,
  isMobile,
}: {
  onReady: () => void;
  dpr: number | [number, number];
  setDpr: (d: [number, number]) => void;
  inView: boolean;
  isMobile: boolean;
}) {
  const { progress } = useProgress();

  useEffect(() => {
    if (progress === 100) {
      const id = requestAnimationFrame(() => onReady());
      return () => cancelAnimationFrame(id);
    }
  }, [progress, onReady]);

  const Lights = ({ mobile }: { mobile: boolean }) => (
    <>
      <ambientLight intensity={mobile ? 0.5 : 0.7} />
      <directionalLight position={[3, 4, 2]} intensity={mobile ? 0.6 : 0.8} />
      <directionalLight position={[-2, -3, -1]} intensity={mobile ? 0.2 : 0.3} />
    </>
  );

  return (
    <Canvas
      camera={{ position: [0, 0.5, 4.2], fov: 45 }}
      shadows={false}
      dpr={dpr}
      gl={{
        alpha: true,
        antialias: !isMobile,
        powerPreference: isMobile ? "low-power" : "high-performance",
        stencil: false,
        depth: true,
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: false,
      }}
      className="absolute inset-0 -z-10 pointer-events-none"
      onCreated={(state) => {
        state.gl.setClearColor(0x000000, 0);
      }}
      // folyamatos animációhoz "always"; ha extrém spórolás kell, lehet "demand"
      frameloop="always"
    >
      {/* @ts-ignore */}
      <color attach="background" args={["transparent"]} />
      <AdaptiveDpr pixelated />
      <Suspense fallback={null}>
        {/* HDR helyett olcsó fények (mobilon mindenképp) */}
        <Lights mobile={isMobile} />
        {isMobile ? (
          <SpineGroup inView={inView} />
        ) : (
          <Float floatIntensity={0.25} rotationIntensity={0.1} speed={0.5}>
            <SpineGroup inView={inView} />
          </Float>
        )}
        <PerformanceMonitor onDecline={() => setDpr([0.85, 1.1])} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}

/* =========================================================================================
   SoftOverlay – finom háttér, heavy effektek kikapcs mobilon/RM esetén
========================================================================================= */
function SoftOverlay({
  visible,
  reducedMotion,
  heavyAllowed,
}: {
  visible: boolean;
  reducedMotion: boolean;
  heavyAllowed: boolean;
}) {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 1], [0.55, 0.7]);
  if (!visible) return null;
  return (
    <MotionDiv
      style={reducedMotion ? undefined : { opacity }}
      className="absolute inset-0 z-0 pointer-events-none"
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(820px 520px at 18% 26%, rgba(81,247,240,0.14) 0%, rgba(255,255,255,0.10) 36%, transparent 60%),
                       radial-gradient(880px 540px at 82% 32%, rgba(29,228,226,0.12) 0%, rgba(255,255,255,0.08) 34%, transparent 62%)`,
          ...(heavyAllowed ? { filter: "saturate(110%)" } : undefined),
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(1200px 800px at 50% 100%, rgba(10,97,101,0.06) 0%, transparent 60%)`,
        }}
      />
    </MotionDiv>
  );
}

/* =========================================================================================
   HERO KOMPONENS (publikus export)
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
  profile_image,
}: {
  heading: string;
  sub_heading: string;
  CTAs: any[];
  locale: string;
  phone?: string;
  nextSlotDate?: Date | string | number;
  primaryCtaPath?: string;
  businessHours?: BusinessHours;
  profile_image?: any;
}) => {
  const reducedMotion = useReducedMotion();

  // egyszerű mobil detekt
  const isMobile =
    typeof navigator !== "undefined" && /iPhone|Android.+Mobile/i.test(navigator.userAgent);

  // Címsor feldarabolása
  const hasSpace = heading.includes(" ");
  const first = hasSpace ? heading.substring(0, heading.lastIndexOf(" ")) : heading;
  const last = hasSpace ? heading.split(" ").pop() : "";

  // Canvas mount késleltetése (LCP kímélés)
  const [mountCanvas, setMountCanvas] = useState(false);
  useEffect(() => {
    const idleId: any =
      (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback(() => setMountCanvas(true), { timeout: 180 })
        : setTimeout(() => setMountCanvas(true), 150);
    return () => {
      (window as any).cancelIdleCallback?.(idleId);
      clearTimeout(idleId);
    };
  }, []);

  // DPR induló tartomány (alacsonyabb kezdés)
  const [dpr, setDpr] = useState<[number, number]>(() => {
    if (typeof window === "undefined") return [1, 1.5];
    const max = Math.min(1.5, window.devicePixelRatio || 1.25);
    return [0.85, max];
  });

  // Egyszer már belépett a sessionben?
  const [hasEnteredOnce, setHasEnteredOnce] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("heroSeen") === "1";
  });
  const [sceneReady, setSceneReady] = useState(false);
  useEffect(() => {
    if (!hasEnteredOnce && sceneReady) {
      sessionStorage.setItem("heroSeen", "1");
      setHasEnteredOnce(true);
    }
  }, [sceneReady, hasEnteredOnce]);

  // Láthatóság figyelése
  const heroRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    if (!heroRef.current) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.1 });
    io.observe(heroRef.current);
    return () => io.disconnect();
  }, []);

  // Parallax a kártyára
  const { scrollYProgress } = useScroll();
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -12]);
  const cardScale = useTransform(scrollYProgress, [0, 1], [1, 0.997]);

  // Legközelebbi időpont
  const explicitNext = useMemo(() => coerceNextDate(nextSlotDate), [nextSlotDate]);
  const nextSlot = useMemo(() => {
    if (explicitNext) return explicitNext;
    const hours: BusinessHours =
      businessHours ?? { days: [1, 2, 3, 4, 5], open: "09:00", close: "18:00", slotMinutes: 30 };
    return computeNextSlot(new Date(), hours);
  }, [explicitNext, businessHours]);
  const nextSlotLabel = useMemo(() => formatSlotLabel(nextSlot, locale), [nextSlot, locale]);
  const profileUrl = useMemo(() => strapiImgUrl(profile_image), [profile_image]);
  const profileAlt = useMemo(() => strapiImgAlt(profile_image), [profile_image]);

  // CTA-k
  const primaryCTA = useMemo(() => pickPrimaryCta(CTAs, primaryCtaPath), [CTAs, primaryCtaPath]);

  // Animációs variánsok
  const sectionVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  };
  const bgVariants = {
    hidden: { y: 28, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };
  const cardVariants = {
    hidden: { y: -22, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };

  // Scene megjelenítés (reduced-motion esetén kikapcs)
  const showScene = !reducedMotion;
  // Drága vizuális effektek korlátozása mobilon / RM esetén
  const cheapGlass = isMobile || !!reducedMotion;
  const overlayHeavy = !reducedMotion && !isMobile;

  return (
    <MotionSection
      ref={heroRef as any}
      className="relative min-h-svh isolate overflow-hidden"
      variants={sectionVariants}
      initial={reducedMotion ? undefined : hasEnteredOnce ? false : "hidden"}
      animate={reducedMotion ? undefined : "show"}
    >
      {/* HÁTTÉR: Spine (WebGL) – késleltetve mountoljuk */}
      {showScene && mountCanvas && (
        <MotionDiv
          className="absolute inset-0 -z-10"
          variants={bgVariants}
          initial={reducedMotion ? undefined : hasEnteredOnce ? false : "hidden"}
          animate={reducedMotion ? undefined : "show"}
        >
          <SpineScene
            onReady={() => setSceneReady(true)}
            dpr={dpr}
            setDpr={setDpr}
            inView={inView}
            isMobile={!!isMobile}
          />
        </MotionDiv>
      )}

      {/* Soft overlay – csak sceneReady után */}
      <SoftOverlay visible={sceneReady && showScene} reducedMotion={!!reducedMotion} heavyAllowed={overlayHeavy} />

      {/* KÖZÉP – üvegkártya */}
      <div className="relative z-30 flex items-center justify-center px-6 min-h-svh">
        <div className="relative w-full max-w-[960px] rounded-[28px] px-8 py-8 md:px-12 md:py-12 text-center">
          <div
            className="absolute inset-0 rounded-[28px] -z-20"
            style={{
              background: "rgba(255,255,255,0.10)",
              ...(cheapGlass
                ? undefined
                : {
                    backdropFilter: "blur(7px) saturate(170%)",
                    WebkitBackdropFilter: "blur(7px) saturate(170%)",
                  }),
              boxShadow: "0 10px 26px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.22)",
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0 rounded-[28px] -z-10 pointer-events-none"
            style={{
              background:
                "radial-gradient(56% 56% at 50% 50%, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.08) 42%, rgba(0,0,0,0.03) 64%, rgba(0,0,0,0.0) 78%)",
            }}
            aria-hidden
          />

          <MotionDiv
            variants={cardVariants}
            initial={reducedMotion ? undefined : hasEnteredOnce ? false : "hidden"}
            animate={reducedMotion ? undefined : "show"}
            style={
              reducedMotion
                ? undefined
                : { y: cardY, scale: cardScale, willChange: "transform", transform: "translateZ(0)" }
            }
            className="relative"
          >
            {/* Avatar – jobb felső sarokban, helyet foglal */}
            {profileUrl && (
              <div className="flex justify-end">
                <div
                  className="relative h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden ring-1 ring-white/60 shadow-lg"
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    ...(cheapGlass
                      ? undefined
                      : { backdropFilter: "blur(10px) saturate(150%)", WebkitBackdropFilter: "blur(10px) saturate(150%)" }),
                  }}
                >
                  <Image
                    src={profileUrl}
                    alt={profileAlt}
                    fill
                    sizes="64px"
                    className="object-cover"
                    priority={!hasEnteredOnce}
                    fetchPriority={!hasEnteredOnce ? ("high" as any) : ("auto" as any)}
                  />
                </div>
              </div>
            )}

            <Heading
              as="h1"
              className="font-semibold leading-tight text-balance text-current bg-none mx-auto max-w-[22ch]"
              style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)", color: "var(--breaker-900)" }}
            >
              {hasSpace ? (
                <>
                  {first} <Cover>{last}</Cover>
                </>
              ) : (
                <Cover>{heading}</Cover>
              )}
            </Heading>

            <Subheading
              className="mt-4 text-balance mx-auto max-w-[60ch]"
              style={{
                color: "var(--breaker-950)",
                opacity: 0.95,
                textShadow: "0 1px 12px rgba(0,0,0,.25)",
                fontSize: "clamp(1rem, 2.2vw, 1.25rem)",
              }}
            >
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
                      style={{
                        ...ctaStyleByVariant(v),
                        ...(cheapGlass
                          ? {
                              // mobil/RM: kevesebb blur
                              backdropFilter: "none",
                              WebkitBackdropFilter: "none",
                              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 6px 12px rgba(0,0,0,0.06)",
                            }
                          : undefined),
                      }}
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

      {/* Opcionális: jobb alsó státuszkártya – ha kell, visszakapcsolható */}
      {/* 
      {primaryCTA && (
        <MotionDiv
          initial={reducedMotion ? undefined : hasEnteredOnce ? false : { opacity: 0, y: 12 }}
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
              ...(cheapGlass ? undefined : { backdropFilter: "blur(10px) saturate(150%)", WebkitBackdropFilter: "blur(10px) saturate(150%)" }),
              boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
            }}
          >
            <div className="pointer-events-none absolute -inset-px rounded-xl -z-10" style={{ background: "linear-gradient(135deg, rgba(4,200,200,0.16) 0%, rgba(4,200,200,0.00) 58%)", filter: "blur(6px)" }} aria-hidden />
            <p className="text-[11px] uppercase tracking-wide" style={{ color: "rgba(13,81,84,0.9)" }}>Legközelebbi szabad időpont</p>
            <p className="mt-0.5" style={{ color: "var(--breaker-950)", fontWeight: 700, fontSize: 18 }}>{nextSlotLabel}</p>
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
      )} 
      */}
    </MotionSection>
  );
};
