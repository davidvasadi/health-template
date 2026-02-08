"use client";

// =============================================================
// Launches — egy komponensben, tisztítva + Safari light mode (FIXED hooks)
// =============================================================

import React, { useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";

import { FeatureIconContainer } from "./features/feature-icon-container";
import { Heading } from "../elements/heading";
import { Subheading } from "../elements/subheading";
import { StickyScroll } from "@/components/ui/sticky-scroll";
import { IconRocket } from "@tabler/icons-react";

/* ------------------------------------------------------------------
   Globális színek + StickyScroll világos felülírásai
------------------------------------------------------------------ */
const LaunchStyles = () => (
  <style jsx global>{`
    :root {
      --breaker-50: #effefd;
      --breaker-100: #c7fffa;
      --breaker-200: #90fff6;
      --breaker-300: #51f7f0;
      --breaker-400: #1de4e2;
      --breaker-500: #04c8c8;
      --breaker-600: #009fa3;
      --breaker-700: #057c80;
      --breaker-800: #0a6165;
      --breaker-900: #0d5154;
      --breaker-950: #002e33;
    }

    @keyframes breathe {
      0%, 100% { box-shadow: 0 0 0 0 rgba(0,159,163,.18) }
      50%     { box-shadow: 0 0 0 6px rgba(0,159,163,.08) }
    }

    .chip { background: var(--breaker-50); border: 1px solid rgba(0,159,163,.35); color: var(--breaker-800); }
    .chip-breathe { animation: breathe 4.8s ease-in-out infinite; }

    .num-gradient{
      background: linear-gradient(180deg, var(--breaker-900) 0%, var(--breaker-700) 70%, var(--breaker-600) 100%);
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }

    /* StickyScroll sötét szövegek világosítása ezen a szekción belül */
    .sticky-dark{ --sticky-fg: var(--breaker-950); --sticky-muted: rgba(13,81,84,0.78); --sticky-link: var(--breaker-700); }
    .sticky-dark h1, .sticky-dark h2, .sticky-dark h3, .sticky-dark h4,
    .sticky-dark h5, .sticky-dark h6, .sticky-dark p, .sticky-dark li,
    .sticky-dark .text-white, .sticky-dark [class*="text-neutral-200"],
    .sticky-dark [class*="text-neutral-300"], .sticky-dark [class*="text-neutral-400"]{ color: var(--sticky-fg) !important; }
    .sticky-dark .muted, .sticky-dark .text-muted-foreground{ color: var(--sticky-muted) !important; }
    .sticky-dark a{ color: var(--sticky-link) !important; }
    .sticky-dark .num-gradient{ color: transparent !important; }
  `}</style>
);

/* ------------------------------------------------------------------
   Safari “light mode” detektálás (csak vizuális könnyítéshez)
------------------------------------------------------------------ */
function useSafariLow() {
  const [low, setLow] = React.useState(false);
  React.useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isSafari = ua.includes("safari") && !ua.includes("chrome");
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const mem = (navigator as any).deviceMemory ?? 4;
    const cores = navigator.hardwareConcurrency ?? 4;
    setLow(isSafari && (isIOS || mem <= 4 || cores <= 4));
  }, []);
  return low;
}

/* ------------------------------------------------------------------
   Háttér díszítés — hook-ok mindig meghívva, majd feltételes render
------------------------------------------------------------------ */
function BackgroundFlavor({
  progress,
  safariLow,
}: {
  progress: MotionValue<number> | null;
  safariLow?: boolean;
}) {
  // ⬇️ Hookok MINDIG lefutnak (dummy inputtal), így nincs cond. hook hiba
  const dummy = useMotionValue(0);
  const base = progress ?? dummy;

  const gridOpacity  = useTransform(base, [0, 1], [0.08, 0.14]);
  const orbY1        = useTransform(base, [0, 1], [0, 24]);
  const orbY2        = useTransform(base, [0, 1], [0, -18]);
  const ringsOpacity = useTransform(base, [0, 1], [0.06, 0.10]);
  const grainOpacity = useTransform(base, [0, 1], [0.04, 0.06]);

  if (safariLow) {
    // LIGHT: nincs blur/mask/folyamatos transform — olcsó rétegek
    return (
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,159,163,0.10) 1px, transparent 1px),"+
              "linear-gradient(to bottom, rgba(0,159,163,0.08) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          className="absolute -top-16 -left-10 w-[360px] h-[360px] rounded-full"
          aria-hidden
          style={{ background:"radial-gradient(closest-side, rgba(81,247,240,0.14), rgba(81,247,240,0.00) 70%)" }}
        />
        <div
          className="absolute -bottom-16 -right-16 w-[420px] h-[420px] rounded-full"
          aria-hidden
          style={{ background:"radial-gradient(closest-side, rgba(0,159,163,0.12), rgba(0,159,163,0.00) 70%)" }}
        />
      </div>
    );
  }

  // EREDETI mozgó rétegek
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      {/* rács */}
      <motion.div style={{ opacity: gridOpacity }} className="absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,159,163,0.12) 1px, transparent 1px),"+
              "linear-gradient(to bottom, rgba(0,159,163,0.10) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            WebkitMaskImage:"radial-gradient(70% 70% at 50% 50%, black 60%, transparent 100%)",
            maskImage:"radial-gradient(70% 70% at 50% 50%, black 60%, transparent 100%)",
          }}
        />
      </motion.div>

      {/* fénygömbök */}
      <motion.div style={{ y: orbY1 }} className="absolute -top-24 -left-16 w-[520px] h-[520px] blur-3xl" aria-hidden>
        <div className="w-full h-full rounded-full"
          style={{ background:"radial-gradient(closest-side, rgba(81,247,240,0.18), rgba(81,247,240,0.00) 70%)" }}
        />
      </motion.div>
      <motion.div style={{ y: orbY2 }} className="absolute -bottom-24 -right-24 w-[620px] h-[620px] blur-3xl" aria-hidden>
        <div className="w-full h-full rounded-full"
          style={{ background:"radial-gradient(closest-side, rgba(0,159,163,0.16), rgba(0,159,163,0.00) 70%)" }}
        />
      </motion.div>

      {/* konszentrikus gyűrűk */}
      <motion.div style={{ opacity: ringsOpacity }} className="absolute -right-28 -top-28 w-[560px] h-[560px]" aria-hidden>
        <div className="w-full h-full"
          style={{
            background:"repeating-radial-gradient(circle at 70% 30%, rgba(0,159,163,0.14) 0 2px, rgba(0,159,163,0.0) 2px 18px)",
            WebkitMaskImage:"radial-gradient(60% 60% at 70% 30%, black 40%, transparent 100%)",
            maskImage:"radial-gradient(60% 60% at 70% 30%, black 40%, transparent 100%)",
          }}
        />
      </motion.div>

      {/* finom grain overlay */}
      <motion.div style={{ opacity: grainOpacity }} className="absolute inset-0" aria-hidden>
        <div className="w-full h-full" style={{ background:"repeating-linear-gradient(0deg, rgba(0,0,0,0.015) 0 1px, transparent 1px 2px)", mixBlendMode:"multiply" }} />
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------
   MOBIL Sticky section (egyszerre 1 elem) — külön motion blokkok
------------------------------------------------------------------ */
function MobileStickySection({
  title,
  description,
  missionNumber,
}: {
  title: string;
  description: string;
  missionNumber?: string | number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Stabil mobil offset → 0..1 progress a szekción belül
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 92%", "end 8%"] });

  // 1) Mission number — gyors felbukkanás + nagyobb parallax
  const numOpacity   = useTransform(scrollYProgress, [0.08, 0.18], [0, 1]);
  const numRevealY   = useTransform(scrollYProgress, [0.08, 0.18], [30, 0]);
  const numParallaxY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const numY         = useTransform([numRevealY, numParallaxY], ([reveal, parallax]: number[]) => reveal + parallax);

  // 2) Title + Description — együtt, lassabb
  const tdOpacity  = useTransform(scrollYProgress, [0.20, 0.44], [0, 1]);
  const tdRevealY  = useTransform(scrollYProgress, [0.20, 0.44], [22, 0]);
  const tdParallax = useTransform(scrollYProgress, [0, 1], [0, -24]);
  const tdY        = useTransform([tdRevealY, tdParallax], ([reveal, parallax]: number[]) => reveal + parallax);

  return (
    <div ref={ref} className="relative min-h-[60svh]">
      {/* sticky belső: egyszerre 1 elem a képernyőn */}
      <div className="sticky top-0 h-[60svh] flex flex-col justify-center">
        <div className="w-full px-6">
          {/* 1) MISSION NUMBER */}
          <motion.div style={reduce ? undefined : { opacity: numOpacity, y: numY, willChange: "transform,opacity" }} className="mb-3">
            {missionNumber != null && (
              <p className="num-gradient text-4xl font-extrabold tracking-tight leading-none">{missionNumber}</p>
            )}
          </motion.div>

          {/* 2) TITLE + DESCRIPTION */}
          <motion.div style={reduce ? undefined : { opacity: tdOpacity, y: tdY, willChange: "transform,opacity" }}>
            <div className="flex items-center gap-3">
              <div className="chip chip-breathe h-10 w-10 rounded-xl flex items-center justify-center">
                <IconRocket className="h-5 w-5 text-[color:var(--breaker-700)]" />
              </div>
              <h3 className="text-xl font-semibold text-[color:var(--breaker-950)]">{title}</h3>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-[color:var(--breaker-900)]/90">{description}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function MobileStickyScroll({ items }: { items: Array<{ title: string; description: string; missionNumber?: string | number }> }) {
  return (
    <div className="md:hidden">
      {items.map((it, i) => (
        <MobileStickySection key={i} title={it.title} description={it.description} missionNumber={it.missionNumber} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------
   Fő komponens — Launches
------------------------------------------------------------------ */
export const Launches = ({ heading, sub_heading, launches }: { heading: string; sub_heading: string; launches: any[] }) => {
  const safariLow = useSafariLow();

  // StickyScroll-hoz dekorációs mezők
  const launchesWithDecoration = useMemo(
    () =>
      launches.map((entry) => ({
        ...entry,
        icon: (
          <div className="chip chip-breathe h-10 w-10 rounded-xl flex items-center justify-center">
            <IconRocket className="h-5 w-5 text-[color:var(--breaker-700)]" />
          </div>
        ),
        content: (
          <p className="num-gradient text-5xl md:text-7xl font-extrabold tracking-tight">{entry.mission_number}</p>
        ),
      })),
    [launches]
  );

  // Scroll progress a háttér díszítéshez
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  // Háttér gradiens variációk
  const backgrounds = useMemo(
    () => [
      `radial-gradient(900px 600px at 12% 12%, rgba(81,247,240,.10) 0%, rgba(255,255,255,.92) 38%, transparent 62%), radial-gradient(840px 560px at 88% 10%, rgba(29,228,226,.08) 0%, rgba(255,255,255,.92) 36%, transparent 60%), #ffffff`,
      `radial-gradient(900px 600px at 18% 18%, rgba(4,200,200,.10) 0%, rgba(255,255,255,.94) 40%, transparent 65%), radial-gradient(820px 520px at 80% 16%, rgba(144,255,246,.08) 0%, rgba(255,255,255,.94) 38%, transparent 63%), #ffffff`,
      `radial-gradient(900px 600px at 14% 20%, rgba(0,159,163,.10) 0%, rgba(255,255,255,.94) 40%, transparent 65%), radial-gradient(820px 520px at 86% 22%, rgba(81,247,240,.08) 0%, rgba(255,255,255,.94) 38%, transparent 63%), #ffffff`,
    ],
    []
  );
  const [gradient, setGradient] = useState(backgrounds[0]);

  // Breakpointok (melyik launch környékén járunk) — 1× számoljuk
  const bps = useMemo(() => launches.map((_, i) => i / launches.length), [launches]);

  // Guard: csak akkor állítsunk state-et, ha TÉNYLEG másik szakaszba léptünk
  const lastIdxRef = useRef(-1);
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const idx = bps.reduce((acc, bp, i) => (Math.abs(latest - bp) < Math.abs(latest - bps[acc]) ? i : acc), 0);
    if (idx !== lastIdxRef.current) {
      lastIdxRef.current = idx;
      setGradient(backgrounds[idx % backgrounds.length]);
    }
  });

  // Mobil-specifikus lista (egyszerű értékekkel)
  const mobileItems = useMemo(
    () =>
      launches.map((entry: any, idx: number) => ({
        title: entry.title ?? entry.heading ?? entry.name ?? `Mission ${entry.mission_number ?? idx + 1}`,
        description: entry.description ?? entry.subheading ?? entry.text ?? "",
        missionNumber: entry.mission_number,
      })),
    [launches]
  );

  return (
    <motion.section
      ref={ref}
      className="relative w-full h-full pt-20 md:pt-10"
      animate={{ background: gradient }}
      transition={{ duration: 0.5 }}
    >
      <LaunchStyles />
      <BackgroundFlavor progress={safariLow ? null : scrollYProgress} safariLow={safariLow} />

      {/* fej */}
      <div className="px-6 relative z-10">
        <FeatureIconContainer className="mx-auto flex justify-center items-center bg-white">
          <IconRocket className="h-6 w-6 text-[color:var(--breaker-700)]" />
        </FeatureIconContainer>
        <Heading as="h2" className="my-6 mx-auto text-[color:var(--breaker-950)]">{heading}</Heading>
        <Subheading className="text-breaker-bay-900 mx-auto text-center">{sub_heading}</Subheading>
      </div>

      {/* timeline – FEKETE/FEHÉR felülírás a scope-on belül */}
      <div className="relative z-10 sticky-dark">
        {/* DESKTOP / TABLET */}
        <div className="hidden md:block">
          <StickyScroll content={launchesWithDecoration} />
        </div>
        {/* MOBIL */}
        <MobileStickyScroll items={mobileItems} />
      </div>
    </motion.section>
  );
};
