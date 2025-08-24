"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { Container } from "@/components/container";
import { FeatureIconContainer } from "./features/feature-icon-container";
import { Heading } from "@/components/elements/heading";
import { Subheading } from "@/components/elements/subheading";
import { IconCheck, IconPlus, IconReceipt2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/elements/button";

/*************************
 * Types
 *************************/
export type PerkLike = { text: string } | Record<string, string>;
export type CTA = { text: string; href?: string };
export type Plan = {
  name: string;
  price?: number | null; // 0 is valid; null/undefined means CTA-only
  perks: PerkLike[];
  additional_perks?: PerkLike[];
  description?: string;
  number?: string;
  featured?: boolean;
  CTA?: CTA;
};

export type PricingProps = {
  heading: string;
  sub_heading?: string;
  plans: Plan[];
  // A/B variánsok: A = világos gradient CTA, B = sötét outline CTA
  variant?: "A" | "B";
};

/*************************
 * Utils
 *************************/
const getPerkText = (item: PerkLike) =>
  typeof (item as any)?.text === "string"
    ? (item as any).text
    : typeof item === "object" && item
    ? Object.values(item)[0]
    : "";

/*************************
 * Motion helpers
 *************************/
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

/*************************
 * Design Tokens (Breaker Bay paletta, fehér alap)
 *************************/
const t = {
  page: "bg-white",
  heading: "text-neutral-950 tracking-tight",
  sub: "text-neutral-700",
  icon: "text-breaker-bay-700",
  card:
    "bg-white/92 supports-[backdrop-filter]:bg-white/75 backdrop-blur-xl rounded-3xl border border-breaker-bay-200/60 shadow-[0_6px_24px_rgba(6,148,162,0.10),0_80px_140px_-80px_rgba(6,148,162,0.35)]",
  badge:
    "bg-breaker-bay-100 text-breaker-bay-900 ring-1 ring-inset ring-breaker-bay-300/60",
  priceHUF: "text-breaker-bay-700",
  price: "text-neutral-950",
  per: "text-neutral-500",
  ctaPrimary:
    "bg-[linear-gradient(90deg,#067A8C,#0694A2)] text-white hover:brightness-110 active:brightness-95 focus-visible:ring-2 focus-visible:ring-breaker-bay-400/40",
  ctaOutlineDark:
    "bg-white text-neutral-900 ring-2 ring-neutral-900 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-900/30",
  checkPrimary: "bg-breaker-bay-700 ring-1 ring-inset ring-breaker-bay-300/60",
  checkSecondary: "bg-breaker-bay-600 ring-1 ring-inset ring-breaker-bay-300/60",
  divider: "bg-gradient-to-r from-transparent via-breaker-bay-200/70 to-transparent",
} as const;

/*************************
 * Parallax Background (Framer Motion only, fehér alap fölött)
 *************************/
const ParallaxBackground = ({ progress, mx, my }: { progress: any; mx: any; my: any }) => {
  const prefersReduced = useReducedMotion();

  // Kifejezettebb scroll-parallax, hogy jól látható legyen
  const yGlow = useTransform(progress, [0, 1], [0, prefersReduced ? 0 : -260]);
  const ySlow = useTransform(progress, [0, 1], [0, prefersReduced ? 0 : -420]);
  const yFast = useTransform(progress, [0, 1], [0, prefersReduced ? 0 : -520]);

  // Pointer-parallax (reduced-motion esetén off)
  const sx = useSpring(mx, { stiffness: 40, damping: 15, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 40, damping: 15, mass: 0.6 });
  const x1 = useTransform(sx, (v) => (prefersReduced ? 0 : v * 0.05));
  const y1 = useTransform(sy, (v) => (prefersReduced ? 0 : v * 0.05));
  const x2 = useTransform(sx, (v) => (prefersReduced ? 0 : v * -0.035));
  const y2 = useTransform(sy, (v) => (prefersReduced ? 0 : v * -0.03));
  const x3 = useTransform(sx, (v) => (prefersReduced ? 0 : v * 0.03));
  const y3 = useTransform(sy, (v) => (prefersReduced ? 0 : v * -0.04));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* ultrafinom grain – nem szürkíti az alapot */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
        <filter id="grainStrong">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grainStrong)" />
      </svg>

      {/* breaker-bay fényudvar */}
      <motion.div style={{ y: yGlow }} className="absolute inset-0">
        <div className="absolute left-1/2 top-[-22%] h-[72rem] w-[72rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(6,148,162,0.18),transparent_70%)]" />
      </motion.div>

      {/* lassú réteg */}
      <motion.div style={{ y: ySlow }} className="absolute inset-0">
        <motion.div style={{ x: x1, y: y1 }} className="absolute left-[6%] top-[16%] h-[26rem] w-[20rem] rounded-[40%_60%_50%_50%] bg-[radial-gradient(circle_at_30%_30%,rgba(6,148,162,0.20),transparent_65%)] blur-3xl" />
      </motion.div>

      {/* gyors réteg + központi alakzat */}
      <motion.div style={{ y: yFast }} className="absolute inset-0">
        <motion.div style={{ x: x2, y: y2 }} className="absolute right-[6%] top-[36%] h-[24rem] w-[18rem] rounded-[50%_50%_60%_40%] bg-[radial-gradient(circle_at_70%_30%,rgba(0,0,0,0.06),transparent_65%)] blur-3xl" />
        <motion.div style={{ x: x3, y: y3 }} className="absolute left-1/2 bottom-[10%] h-[28rem] w-[22rem] -translate-x-1/2 rounded-[60%_40%_50%_50%] bg-[radial-gradient(circle_at_40%_60%,rgba(6,122,140,0.18),transparent_65%)] blur-3xl" />
      </motion.div>
    </div>
  );
};

/*************************
 * Public API
 *************************/
export const Pricing: React.FC<PricingProps> = ({ heading, sub_heading, plans, variant = "A" }) => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const yHeading = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : -60]);
  const yGrid = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : -120]);

  // pointer parallax értékek
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const handlePointer = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReduced) return;
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 3;
    mx.set(e.clientX - cx);
    my.set(e.clientY - cy);
  };

  return (
    <section ref={sectionRef} className={cn("relative isolate pt-28 md:pt-36", t.page)} onMouseMove={handlePointer}>
      <ParallaxBackground progress={scrollYProgress} mx={mx} my={my} />

      <Container>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center">
          <motion.div variants={fadeUp} style={{ y: yHeading }}>
            <FeatureIconContainer className="mx-auto flex justify-center items-center  backdrop-blur-sm ring-1 ring-breaker-bay-200/60 shadow-none">
              <IconReceipt2 className={cn("h-6 w-6", t.icon)} />
            </FeatureIconContainer>
          </motion.div>

          <motion.div variants={fadeUp} style={{ y: yHeading }}>
            <Heading as="h2" className={cn("pt-4", t.heading)}>
              {heading}
            </Heading>
          </motion.div>

          {sub_heading ? (
            <motion.div variants={fadeUp} style={{ y: yHeading }}>
              <Subheading className={cn("max-w-3xl mx-auto", t.sub)}>{sub_heading}</Subheading>
            </motion.div>
          ) : null}

          <motion.div variants={fadeUp} className="pt-10 lg:pt-12" style={{ y: yGrid }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {plans.map((plan, i) => (
                <motion.div key={`${plan.name}-${i}`} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, ease: "easeOut", delay: i * 0.06 }}>
                  <Card plan={plan} ctaVariant={variant} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </Container>

      {/* Mobil sticky CTA */}
      <div className="lg:hidden fixed bottom-4 inset-x-4 z-40">
        <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-breaker-bay-200/60 shadow-[0_12px_40px_-16px_rgba(6,148,162,0.25)] p-3 flex items-center gap-3">
          <div className="text-sm text-neutral-700">Készen állsz? Foglalj most egy időpontot.</div>
          <Button className={cn("ml-auto rounded-xl px-4", variant === "A" ? t.ctaPrimary : t.ctaOutlineDark)}>Lépj tovább</Button>
        </div>
      </div>
    </section>
  );
};

/*************************
 * Card
 *************************/
const Card: React.FC<{ plan: Plan; ctaVariant?: "A" | "B" }> = ({ plan, ctaVariant = "A" }) => {
  const isFeatured = !!plan.featured;
  const hasPrice = typeof plan.price === "number" && !Number.isNaN(plan.price);
  const priceStr = hasPrice ? plan.price!.toLocaleString("hu-HU") : "";

  return (
    <motion.article whileHover={{ y: -4 }} whileFocus={{ y: -2 }} className={cn("group relative transition outline-none focus-visible:ring-2 focus-visible:ring-breaker-bay-400/40", t.card)} tabIndex={0} aria-label={`${plan.name} csomag`}>
      <div className="p-5 md:p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-neutral-950 tracking-tight">{plan.name}</h3>
            {plan.description ? <p className="mt-1 text-sm text-neutral-600">{plan.description}</p> : null}
          </div>

          {isFeatured && (
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", t.badge)}>Népszerű</span>
          )}
        </header>

        <div className="mt-6 flex items-baseline gap-2">
          {hasPrice ? (
            <>
              <span className={cn("text-base font-semibold", t.priceHUF)}>HUF</span>
              <span className={cn("text-4xl md:text-5xl font-bold tracking-tight", t.price)}>{priceStr}</span>
              <span className={cn("text-sm md:text-base font-normal", t.per)}>/ alkalom</span>
            </>
          ) : (
            <span className={cn("text-2xl md:text-3xl font-bold", t.price)}>{plan?.CTA?.text || "Foglalj időpontot"}</span>
          )}
        </div>

        <Button
          variant="outline"
          className={cn(
            "mt-6 w-full rounded-xl backdrop-blur-sm focus-visible:outline-none",
            isFeatured
              ? ctaVariant === "A" ? t.ctaPrimary : t.ctaOutlineDark
              : ctaVariant === "A" ? "bg-white/70 text-neutral-900 ring-1 ring-inset ring-breaker-bay-300/70 hover:bg-white" : t.ctaOutlineDark
          )}
          onClick={() => {
            if (plan?.CTA?.href) window.location.href = plan.CTA.href;
          }}
          aria-label={`Válaszd: ${plan.name}`}
        >
          {plan?.CTA?.text || "Foglalás"}
        </Button>

        <div className="mt-6">
          <PerkList perks={plan.perks} limit={4} />
        </div>

        {plan.additional_perks?.length ? (
          <>
            <Divider />
            <PerkList perks={plan.additional_perks!} additional />
          </>
        ) : null}
      </div>
    </motion.article>
  );
};

/*************************
 * PerkList
 *************************/
const PerkList: React.FC<{ perks: PerkLike[]; limit?: number; additional?: boolean }> = ({ perks, limit = 4, additional = false }) => {
  const [expanded, setExpanded] = useState(false);
  const visible = useMemo(() => (expanded ? perks : perks.slice(0, limit)), [expanded, perks, limit]);
  const hasMore = perks.length > limit;

  return (
    <div>
      <ul className="grid gap-2.5">
        {visible.map((feature, idx) => (
          <motion.li key={idx} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-20px" }} transition={{ duration: 0.35, ease: "easeOut" }} className="flex items-start gap-2.5">
            <span className={cn("mt-0.5 h-5 w-5 flex-shrink-0 rounded-full ring-1 ring-inset grid place-items-center", additional ? t.checkSecondary : t.checkPrimary)}>
              <IconCheck className="h-3.5 w-3.5 [stroke-width:3px] text-white" />
            </span>
            <p className="text-sm font-medium text-neutral-950">{getPerkText(feature)}</p>
          </motion.li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((s) => !s)}
          className={cn("mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-breaker-bay-800 hover:text-breaker-bay-900 focus-visible:outline-none rounded-lg", "focus-visible:ring-2 focus-visible:ring-breaker-bay-400/40")}
          aria-expanded={expanded}
          aria-controls="perklist-extra"
        >
          <IconPlus className={cn("h-4 w-4 [stroke-width:3px] transition-transform", expanded ? "rotate-45" : "")} />
          {expanded ? "Kevesebb" : "További részletek"}
        </button>
      )}

      <AnimatePresence initial={false}>
        {expanded && perks.length > limit && (
          <motion.div id="perklist-extra" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} />
        )}
      </AnimatePresence>
    </div>
  );
};

/*************************
 * Divider
 *************************/
const Divider = () => <div className={cn("my-6 h-px w-full", t.divider)} />;
