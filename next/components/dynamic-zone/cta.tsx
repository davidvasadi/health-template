"use client";
import React, { useRef } from "react";
import Link from "next/link";
import {
  motion,
  MotionConfig,
  useReducedMotion,
  useMotionValue,
  useTransform,
  useScroll,
} from "framer-motion";
import { Button } from "../elements/button";
import { Container } from "../container";

/* ====================== Inline ikonok ====================== */
const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
    <path d="M5 12h14" />
    <path d="M13 5l7 7-7 7" />
  </svg>
);

const PhoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.33 1.7.62 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.14a2 2 0 0 1 2.11-.45c.8.29 1.64.5 2.5.62A2 2 0 0 1 22 16.92z" />
  </svg>
);

/* ====================== Típusok ====================== */
export type TrustChip = { text: string };

/* ====================== Helper-ek ====================== */
const isProtocolLink = (raw: string) =>
  /^(https?:|tel:|mailto:|sms:|whatsapp:)/i.test(raw);

const looksLikePhone = (raw: string) =>
  /^[+\d][\d\s().-]{5,}$/.test(raw);

const normalizePhone = (raw: string) =>
  "tel:" + raw.replace(/[^\d+]/g, "");

/** Locale prefix csak relatív URL-re megy rá. Protokollos (tel:, mailto:, https...) érintetlen. */
const buildHref = (rawUrl: string, locale: string) => {
  let raw = rawUrl?.trim() || "#";

  // ha telefonszámnak néz ki és nincs rajta tel:, alakítsuk át
  if (!isProtocolLink(raw) && looksLikePhone(raw)) {
    raw = normalizePhone(raw);
  }

  if (isProtocolLink(raw)) return raw;

  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `/${locale}${path}`;
};

const isTelHref = (href: string) => /^tel:/i.test(href);

/* ====================== Komponens ====================== */
export const CTA = ({
  heading,
  sub_heading,
  CTAs,
  locale,
  trust_chips = [],
}: {
  heading: string;
  sub_heading: string;
  CTAs: { text: string; URL: string; variant?: string; target?: "_blank" | "_self" }[];
  locale: string;
  trust_chips?: TrustChip[];
}) => {
  // Variáns osztály
  const variantClass = (v?: string) => {
    if (!v) return "cta-solid";
    switch (v) {
      case "primary":
      case "cta-primary":
        return "cta-solid";
      case "accent":
      case "cta-accent":
        return "cta-outline";
      case "ghost":
      case "cta-ghost":
        return "cta-ghost";
      default:
        return v;
    }
  };

  // Motion presetek
  const prefersReduced = useReducedMotion();
  const sharedSpring = { type: "spring", stiffness: 220, damping: 26, mass: 0.9 } as const;
  const textGroup = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { ...sharedSpring, staggerChildren: 0.06, delayChildren: 0.04 } } } as const;
  const textItem = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: sharedSpring } } as const;
  const buttonVariants = { rest: { y: 0, scale: 1, boxShadow: "var(--cta-shadow-rest)" }, hover: { y: -2, scale: 1.02, boxShadow: "var(--cta-shadow-hover)" }, tap: { y: 0, scale: 0.98 } } as const;
  const arrowVariants = { rest: { x: 0 }, hover: { x: 5 }, tap: { x: 0 } } as const;

  // Pointer-parallax
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useTransform(py, [-40, 40], [6, -6]);
  const ry = useTransform(px, [-40, 40], [-6, 6]);
  const translateBeamX = useTransform(px, [-40, 40], ["-6%", "6%"]);
  const translateBeamY = useTransform(py, [-40, 40], ["-3%", "3%"]);

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    px.set(clamp(x / 10, -40, 40));
    py.set(clamp(y / 10, -40, 40));
  };
  const onPointerLeave = () => { px.set(0); py.set(0); };

  // Scroll-progress
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start 80%", "end 20%"] });
  const ringGlow = useTransform(scrollYProgress, [0, 1], [0.15, 0.9]);
  const ringScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);

  // „Mágneses” fő CTA
  const magX = useMotionValue(0);
  const magY = useMotionValue(0);
  const magneticHandlers = {
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const relX = e.clientX - (r.left + r.width / 2);
      const relY = e.clientY - (r.top + r.height / 2);
      const strength = 0.18;
      magX.set(Math.max(-8, Math.min(8, (relX * strength) / 10)));
      magY.set(Math.max(-6, Math.min(6, (relY * strength) / 10)));
    },
    onPointerLeave: () => { magX.set(0); magY.set(0); },
  } as const;

  // Chips fallback
  const defaultChips: TrustChip[] = [
    { text: "Személyre szabott kezelés" },
    { text: "Gyors időpontfoglalás" },
    { text: "Átlátható folyamat" },
  ];
  const chips = trust_chips?.length ? trust_chips : defaultChips;

  return (
    <MotionConfig reducedMotion={prefersReduced ? "always" : "never"} transition={sharedSpring}>
      <motion.div
        ref={sectionRef}
        className="relative isolate py-28 md:py-40 overflow-hidden cta-shell will-change-transform fm-surface"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{ perspective: 900 }}
      >
        {/* ===== HÁTTÉR ===== */}
        <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b " />
          <motion.div className="absolute -top-40 -left-40 size-[520px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,180,170,.12), transparent 60%)", rotateX: rx, rotateY: ry, opacity: ringGlow, scale: ringScale }}
            animate={{ scale: prefersReduced ? 1 : [1, 1.03, 1] }}
            transition={{ duration: 6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          />
          <motion.div className="absolute -bottom-40 -right-40 size-[520px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,180,170,.10), transparent 60%)", rotateX: rx, rotateY: ry, opacity: ringGlow, scale: ringScale }}
            animate={{ scale: prefersReduced ? 1 : [1, 1.05, 1] }}
            transition={{ duration: 7.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          />
          <motion.svg
            className="absolute right-[6%] top-1/2 -translate-y-1/2 w-[420px] h-[520px]"
            viewBox="0 0 420 520"
            xmlns="http://www.w3.org/2000/svg"
            style={{ rotateX: rx, rotateY: ry }}
          >
            <defs>
              <radialGradient id="rg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--ring-color)" stopOpacity=".18" />
                <stop offset="100%" stopColor="var(--ring-color)" stopOpacity="0" />
              </radialGradient>
            </defs>
            {Array.from({ length: 7 }).map((_, i) => (
              <circle key={i} cx="210" cy="260" r={40 + i * 38} fill="none" stroke="var(--ring-stroke)" strokeOpacity=".10" strokeWidth="1.25" />
            ))}
            <motion.circle cx="210" cy="260" r="120" fill="url(#rg)" style={{ opacity: ringGlow, scale: ringScale, transformOrigin: "210px 260px" }} />
            <path d="M160 70 C 260 140, 110 220, 230 300 C 330 360, 180 420, 260 490" stroke="var(--ring-stroke)" strokeOpacity=".18" strokeDasharray="2 7" strokeWidth="2" fill="none" />
            <motion.circle cx="210" cy="260" r="170" fill="none" stroke="var(--ring-color)" strokeWidth="2.5" strokeLinecap="round" style={{ pathLength: scrollYProgress, opacity: scrollYProgress }} strokeDasharray="1 1" />
          </motion.svg>
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-1/2 w-[52vw] -translate-x-1/2 opacity-70 mix-blend-normal"
            style={{ WebkitMaskImage: "linear-gradient(90deg,transparent,black 20%,black 80%,transparent)", maskImage: "linear-gradient(90deg,transparent,black 20%,black 80%,transparent)", x: translateBeamX, y: translateBeamY }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: "linear-gradient(100deg,rgba(0,0,0,0)_0%,rgba(0,180,170,0.06)_35%,rgba(0,180,170,0.10)_50%,rgba(0,180,170,0.06)_65%,rgba(0,0,0,0)_100%)" }}
              animate={prefersReduced ? undefined : { x: ["-18%", "18%", "-18%"], opacity: [0.55, 0.75, 0.55] }}
              transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
            />
          </motion.div>
          <div className="hidden md:block absolute inset-y-12 right-[8%] w-px bg-[linear-gradient(to_bottom,rgba(0,0,0,.10),rgba(0,0,0,0))]" />
        </div>

        {/* ===== TARTALOM ===== */}
        <Container className="relative z-10 w-full px-6 md:px-8">
          <motion.div className="flex flex-col md:flex-row justify-between items-center gap-10 md:gap-12" variants={textGroup} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }}>
            <div className="flex-1 min-w-0">
              <motion.h2 variants={textItem} className="text-breaker-bay-950 text-2xl md:text-4xl font-semibold tracking-tight text-center md:text-left">
                {heading}
              </motion.h2>
              <motion.p variants={textItem} className="max-w-xl mx-auto md:mx-0 mt-5 md:mt-6 text-sm md:text-base leading-relaxed text-neutral-600 text-center md:text-left">
                {sub_heading}
              </motion.p>
              <motion.div aria-hidden className="mx-auto md:mx-0 mt-3 h-[2px] w-16 rounded bg-[var(--breaker-400)]" initial={{ scaleX: 0, opacity: 0 }} whileInView={{ scaleX: 1, opacity: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 300, damping: 28 }} style={{ transformOrigin: "0% 50%" }} />
              <motion.ul variants={textItem} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 text-[12px] md:text-[13px] text-neutral-600">
                {(trust_chips?.length ? trust_chips : [
                  { text: "Személyre szabott kezelés" },
                  { text: "Gyors időpontfoglalás" },
                  { text: "Átlátható folyamat" },
                ]).map((chip, i) => (
                  <motion.li key={`${chip.text}-${i}`} whileHover={{ y: -1, scale: 1.02 }} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full ring-1 ring-black/5 bg-white/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,.7)]">
                    <span className="inline-block size-1.5 rounded-full bg-[var(--breaker-400)]" />
                    {chip.text}
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            {/* CTA gombok */}
            <motion.div initial={{ opacity: 0, scale: 0.985 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.5 }} transition={sharedSpring} className="relative flex flex-wrap items-center justify-center md:justify-end gap-3 md:gap-4 pt-2">
              {CTAs?.map((cta, index) => {
                const href = buildHref(cta.URL, locale);
                const tel = isTelHref(href);
                const isExternal = isProtocolLink(href) && !tel && !/^mailto:/i.test(href);
                const target = cta.target ?? (isExternal ? "_blank" : undefined);
                const rel = target === "_blank" ? "noopener noreferrer" : undefined;

                const isPrimary = index === 0;
                const wrapperProps = isPrimary ? { style: { x: magX, y: magY }, ...magneticHandlers } : {};

                // Protokollos linkekhez <a>, különben <Link>
                const asExternal = isProtocolLink(href);

                return (
                  <motion.div key={`${cta.text}-${index}`} variants={buttonVariants} initial="rest" whileHover="hover" whileTap="tap" {...wrapperProps}>
                    {asExternal ? (
                      <a href={href} target={target} rel={rel} className="block w-full">
                        <Button className={`group inline-flex items-center gap-2 px-5 md:px-6 py-3 md:py-3.5 rounded-lg font-medium transition will-change-transform fm-focus ${variantClass(cta.variant)} ${isPrimary ? "cta-emphasis" : ""}`}>
                          <span>{cta.text}</span>
                          <motion.span className="cta-arrow w-4 h-4" variants={arrowVariants} aria-hidden>
                            {tel ? <PhoneIcon className="w-4 h-4" /> : <ArrowRightIcon className="w-4 h-4" />}
                          </motion.span>
                        </Button>
                      </a>
                    ) : (
                      <Button
                        as={Link}
                        href={href}
                        aria-label={cta.text}
                        className={`group inline-flex items-center gap-2 px-5 md:px-6 py-3 md:py-3.5 rounded-lg font-medium transition will-change-transform fm-focus ${variantClass(cta.variant)} ${isPrimary ? "cta-emphasis" : ""}`}
                      >
                        <span>{cta.text}</span>
                        <motion.span className="cta-arrow w-4 h-4" variants={arrowVariants} aria-hidden>
                          <ArrowRightIcon className="w-4 h-4" />
                        </motion.span>
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </Container>

        {/* Lokális style-ok */}
        <style jsx global>{`
          :root{
            --ring-color: rgba(0,180,170,1);
            --ring-stroke: rgba(10,120,115,1);
            --cta-shadow-rest: 0 1px 0 rgba(255,255,255,.8) inset, 0 8px 20px rgba(0,0,0,.06);
            --cta-shadow-hover: 0 1px 0 rgba(255,255,255,.8) inset, 0 12px 26px rgba(0,0,0,.08);
          }
          .fm-surface{ box-shadow: 0 1px 0 rgba(255,255,255,.8) inset; }
          .cta-solid{ background: linear-gradient(180deg, rgba(0,195,185,0.16) 0%, rgba(0,175,165,0.12) 100%), white; border: 1px solid rgba(0,0,0,.06); box-shadow: var(--cta-shadow-rest); color: var(--breaker-950) !important; }
          .cta-solid:hover{ transform: translateY(-1px); box-shadow: var(--cta-shadow-hover); }
          .cta-outline{ background: white; border: 1px solid color-mix(in srgb, var(--breaker-400) 34%, rgba(0,0,0,.06)); box-shadow: 0 1px 0 rgba(255,255,255,.8) inset; color: var(--breaker-900) !important; }
          .cta-outline:hover{ transform: translateY(-1px); }
          .cta-ghost{ background: rgba(255,255,255,.6); border: 1px solid rgba(0,0,0,.05); color: var(--breaker-800) !important; }
          .cta-ghost:hover{ transform: translateY(-1px); }
          @keyframes focusPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(0,0,0,0) } 50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--breaker-300) 18%, transparent) } }
          .fm-focus:focus-visible { animation: focusPulse 900ms ease-out 1; }
          .cta-arrow{ display:inline-flex; align-items:center; }
          .group:active{ transform: translateY(1px); }
          .cta-emphasis{ box-shadow: 0 10px 30px rgba(0,0,0,.08), 0 0 0 2px color-mix(in srgb, var(--breaker-300) 28%, transparent); }
        `}</style>
      </motion.div>
    </MotionConfig>
  );
};
