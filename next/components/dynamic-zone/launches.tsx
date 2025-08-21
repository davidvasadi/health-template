"use client";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import React, { useRef, useState } from "react";
import { FeatureIconContainer } from "./features/feature-icon-container";
import { Heading } from "../elements/heading";
import { Subheading } from "../elements/subheading";
import { StickyScroll } from "@/components/ui/sticky-scroll";
import { IconRocket } from "@tabler/icons-react";

/* ---------- Paletta + util + STICKY DARK OVERRIDES ---------- */
const LaunchStyles = () => (
  <style jsx global>{`
    :root{
      --breaker-50:#effefd; --breaker-100:#c7fffa; --breaker-200:#90fff6;
      --breaker-300:#51f7f0; --breaker-400:#1de4e2; --breaker-500:#04c8c8;
      --breaker-600:#009fa3; --breaker-700:#057c80; --breaker-800:#0a6165;
      --breaker-900:#0d5154; --breaker-950:#002e33;
    }
    @keyframes breathe {
      0%,100% { box-shadow: 0 0 0 0 rgba(0,159,163,.18) }
      50%     { box-shadow: 0 0 0 6px rgba(0,159,163,.08) }
    }
    .chip{ background: var(--breaker-50); border: 1px solid rgba(0,159,163,.35); color: var(--breaker-800); }
    .chip-breathe{ animation: breathe 4.8s ease-in-out infinite; }
    .num-gradient{
      background: linear-gradient(180deg, var(--breaker-900) 0%, var(--breaker-700) 70%, var(--breaker-600) 100%);
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }

    /* 👉 FEHÉR SZÖVEG FELÜLÍRÁSA a StickyScroll terén belül */
    .sticky-dark{
      --sticky-fg: var(--breaker-950);
      --sticky-muted: rgba(13,81,84,0.78);  /* breaker-900 ~ */
      --sticky-link: var(--breaker-700);
    }
    .sticky-dark h1,
    .sticky-dark h2,
    .sticky-dark h3,
    .sticky-dark h4,
    .sticky-dark h5,
    .sticky-dark h6,
    .sticky-dark p,
    .sticky-dark li,
    .sticky-dark .text-white,
    .sticky-dark [class*="text-neutral-200"],
    .sticky-dark [class*="text-neutral-300"],
    .sticky-dark [class*="text-neutral-400"]{
      color: var(--sticky-fg) !important;
    }
    .sticky-dark .muted,
    .sticky-dark .text-muted-foreground{
      color: var(--sticky-muted) !important;
    }
    .sticky-dark a{ color: var(--sticky-link) !important; }
    /* ne rontsuk el a gradiens-számot */
    .sticky-dark .num-gradient{ color: transparent !important; }
  `}</style>
);

/* ---------- Háttér fűszerezés ---------- */
function BackgroundFlavor({ progress }: { progress: any }) {
  const gridOpacity   = useTransform(progress, [0,1], [0.08, 0.14]);
  const orbY1         = useTransform(progress, [0,1], [0, 24]);
  const orbY2         = useTransform(progress, [0,1], [0, -18]);
  const ringsOpacity  = useTransform(progress, [0,1], [0.06, 0.10]);
  const grainOpacity  = useTransform(progress, [0,1], [0.04, 0.06]);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <motion.div style={{ opacity: gridOpacity }} className="absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,159,163,0.12) 1px, transparent 1px),"+
              "linear-gradient(to bottom, rgba(0,159,163,0.10) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            WebkitMaskImage:
              "radial-gradient(70% 70% at 50% 50%, black 60%, transparent 100%)",
            maskImage:
              "radial-gradient(70% 70% at 50% 50%, black 60%, transparent 100%)",
          }}
        />
      </motion.div>

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

      <motion.div style={{ opacity: ringsOpacity }} className="absolute -right-28 -top-28 w-[560px] h-[560px]" aria-hidden>
        <div className="w-full h-full"
          style={{
            background:"repeating-radial-gradient(circle at 70% 30%, rgba(0,159,163,0.14) 0 2px, rgba(0,159,163,0.0) 2px 18px)",
            WebkitMaskImage:"radial-gradient(60% 60% at 70% 30%, black 40%, transparent 100%)",
            maskImage:"radial-gradient(60% 60% at 70% 30%, black 40%, transparent 100%)",
          }}
        />
      </motion.div>

      <motion.div style={{ opacity: grainOpacity }} className="absolute inset-0" aria-hidden>
        <div className="w-full h-full"
          style={{ background:"repeating-linear-gradient(0deg, rgba(0,0,0,0.015) 0 1px, transparent 1px 2px)", mixBlendMode:"multiply" }}
        />
      </motion.div>
    </div>
  );
}

export const Launches = ({
  heading, sub_heading, launches
}: { heading: string; sub_heading: string; launches: any[] }) => {
  const launchesWithDecoration = launches.map((entry) => ({
    ...entry,
    icon: (
      <div className="chip chip-breathe h-10 w-10 rounded-xl flex items-center justify-center">
        <IconRocket className="h-5 w-5 text-[color:var(--breaker-700)]" />
      </div>
    ),
    content: (
      <p className="num-gradient text-5xl md:text-7xl font-extrabold tracking-tight">
        {entry.mission_number}
      </p>
    ),
  }));

  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const backgrounds = [
    `radial-gradient(900px 600px at 12% 12%, rgba(81,247,240,.10) 0%, rgba(255,255,255,.92) 38%, transparent 62%), radial-gradient(840px 560px at 88% 10%, rgba(29,228,226,.08) 0%, rgba(255,255,255,.92) 36%, transparent 60%), #ffffff`,
    `radial-gradient(900px 600px at 18% 18%, rgba(4,200,200,.10) 0%, rgba(255,255,255,.94) 40%, transparent 65%), radial-gradient(820px 520px at 80% 16%, rgba(144,255,246,.08) 0%, rgba(255,255,255,.94) 38%, transparent 63%), #ffffff`,
    `radial-gradient(900px 600px at 14% 20%, rgba(0,159,163,.10) 0%, rgba(255,255,255,.94) 40%, transparent 65%), radial-gradient(820px 520px at 86% 22%, rgba(81,247,240,.08) 0%, rgba(255,255,255,.94) 38%, transparent 63%), #ffffff`,
  ];
  const [gradient, setGradient] = useState(backgrounds[0]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const bps = launches.map((_, i) => i / launches.length);
    const idx = bps.reduce((acc, bp, i) =>
      Math.abs(latest - bp) < Math.abs(latest - bps[acc]) ? i : acc, 0);
    setGradient(backgrounds[idx % backgrounds.length]);
  });

  return (
    <motion.section
      ref={ref}
      className="relative w-full h-full pt-20 md:pt-40 bg-white"
      animate={{ background: gradient }}
      transition={{ duration: 0.5 }}
    >
      <LaunchStyles />
      <BackgroundFlavor progress={scrollYProgress} />

      {/* fej */}
      <div className="px-6 relative z-10">
        <FeatureIconContainer className="mx-auto flex justify-center items-center bg-white ">
          <IconRocket className="h-6 w-6 text-[color:var(--breaker-700)]" />
        </FeatureIconContainer>
        <Heading as="h2" className="mt-4 text-[color:var(--breaker-950)]">
          {heading}
        </Heading>
        <Subheading className="text-[color:var(--breaker-900)]/75">
          {sub_heading}
        </Subheading>
      </div>

      {/* timeline – FEKETE/FEHÉR felülírása a scope-on belül */}
      <div className="relative z-10 sticky-dark">
        <StickyScroll content={launchesWithDecoration} />
      </div>
    </motion.section>
  );
};
