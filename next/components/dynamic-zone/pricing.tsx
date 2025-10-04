"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCheck, IconReceipt2 } from "@tabler/icons-react";

import { Container } from "@/components/container";
import { FeatureIconContainer } from "./features/feature-icon-container";
import { Heading } from "@/components/elements/heading";
import { Subheading } from "@/components/elements/subheading";
import { Button } from "@/components/elements/button";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────────
   Típusok
────────────────────────────────────────────────────────────────────────────── */
export type PerkLike = { text: string } | Record<string, string>;
export type CTA = {
  text: string;
  href?: string;
  URL?: string;
  variant?: "simple" | "outline" | "primary" | "muted";
  target?: string | boolean;
  newTab?: boolean;
};
export type Plan = {
  name: string;
  price?: number | null;
  perks: PerkLike[];
  additional_perks?: PerkLike[];
  description?: string;
  number?: string;
  featured?: boolean;
  CTA?: CTA;
  badgeLabel?: string;
};
export type PricingProps = {
  heading: string;
  sub_heading?: string;
  plans: Plan[];
};

/* ────────────────────────────────────────────────────────────────────────────
   Segédek
────────────────────────────────────────────────────────────────────────────── */
const getPerkText = (item: PerkLike) =>
  typeof (item as any)?.text === "string"
    ? (item as any).text
    : typeof item === "object" && item
    ? Object.values(item)[0]
    : "";

function ctaHref(locale: string, cta?: CTA) {
  if (!cta) return "#";
  const path = String(cta?.href || cta?.URL || "").trim();
  if (!path) return "#";
  if (/^https?:\/\//i.test(path)) return path; // külső link érintetlen
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized}`.replace(/\/{2,}/g, "/");
}

/* ────────────────────────────────────────────────────────────────────────────
   Design tokenek – a világos/üveges stílusod
────────────────────────────────────────────────────────────────────────────── */
const t = {
  page: "bg-white",
  heading: "text-neutral-950 tracking-tight",
  sub: "text-neutral-700",
  icon: "text-breaker-bay-700",
  // üveg/fehér kártya – egyezik a korábbi stílusoddal
  card:
    "bg-white/55 supports-[backdrop-filter]:bg-white/40 backdrop-blur-2xl rounded-3xl border border-neutral-200/60 shadow-[0_6px_24px_rgba(0,0,0,0.08),0_80px_140px_-80px_rgba(0,0,0,0.25)]",
  badge:
    "bg-breaker-bay-100 text-breaker-bay-900 ring-1 ring-inset ring-breaker-bay-300/60",
  priceHUF: "text-breaker-bay-700",
  price: "text-neutral-950",
  per: "text-neutral-500",
};

/* ────────────────────────────────────────────────────────────────────────────
   Csak a „/ alkalom” lokalizálása
────────────────────────────────────────────────────────────────────────────── */
const PER_SESSION_LABELS = {
  hu: "/ alkalom",
  en: "/ session",
  de: "/ Sitzung",
} as const;

/* ────────────────────────────────────────────────────────────────────────────
   Animáció segédek
────────────────────────────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/* ────────────────────────────────────────────────────────────────────────────
   Fő komponens – 4 kártya (lg)
────────────────────────────────────────────────────────────────────────────── */
export const Pricing: React.FC<PricingProps> = ({ heading, sub_heading, plans }) => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const yHeading = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : -40]);
  const yGrid = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : -80]);

  const pathname = usePathname();
  const locale = pathname?.startsWith("/hu") ? "hu" : pathname?.startsWith("/de") ? "de" : "en";

  return (
    <section ref={sectionRef} className={cn("relative isolate pt-28 md:pt-36", t.page)}>
      <Container>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="text-center">
          <motion.div variants={fadeUp} style={{ y: yHeading }}>
            <FeatureIconContainer className="mx-auto flex justify-center items-center backdrop-blur-sm ring-1 ring-breaker-bay-200/60 shadow-none">
              <IconReceipt2 className={cn("h-6 w-6", t.icon)} />
            </FeatureIconContainer>
          </motion.div>

          <motion.div variants={fadeUp} style={{ y: yHeading }}>
            <Heading as="h2" className={cn("pt-4", t.heading)}>
              {heading}
            </Heading>
          </motion.div>

          {sub_heading && (
            <motion.div variants={fadeUp} style={{ y: yHeading }}>
              <Subheading className={cn("max-w-3xl mx-auto", t.sub)}>{sub_heading}</Subheading>
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="pt-10 lg:pt-12" style={{ y: yGrid }}>
            {/* 1 → 2 → 4 kártya */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto text-left">
              {plans.map((plan, i) => (
                <motion.div
                  key={`${plan.name}-${i}`}
                  initial={{ opacity: 0, y: 12, scale: 0.995 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.04 }}
                >
                  <Card plan={plan} locale={locale} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   Kártya
────────────────────────────────────────────────────────────────────────────── */
const Card: React.FC<{ plan: Plan; locale: string }> = ({ plan, locale }) => {
  const isFeatured = !!plan.featured;
  const hasPrice = typeof plan.price === "number" && !Number.isNaN(plan.price);
  const priceStr = hasPrice ? plan.price!.toLocaleString("hu-HU") : "";
  const badgeText = (plan.badgeLabel ?? "").trim();

  const resolvedHref = ctaHref(locale, plan.CTA);
  const rawPath = String(plan.CTA?.href || plan.CTA?.URL || "");
  const isExternal = /^https?:\/\//i.test(rawPath);
  const explicitTarget = plan.CTA?.target;
  const explicitNewTab = (plan.CTA && ((plan.CTA as any).newTab === true)) || false;
  const openInNewTab = explicitTarget === "_blank" || explicitTarget === true || explicitNewTab || isExternal;
  const relAttr = openInNewTab ? "noopener" : undefined;

  // CTA vizuális variáns (a Button saját variant prop-jára)
  const btnVariant = (plan.CTA?.variant as any) || (isFeatured ? "primary" : "muted");

  // csak a per-session felirat lokalizálása
  const perSession =
    PER_SESSION_LABELS[(["hu", "en", "de"] as const).includes(locale as any) ? (locale as "hu" | "en" | "de") : "hu"];

  return (
    <article
      className={cn(
        t.card,
        "relative h-full p-5 md:p-6 transition-transform duration-300 hover:-translate-y-1",
        isFeatured && "ring-1 ring-breaker-bay-300/60"
      )}
    >
      {/* Fejléc */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-neutral-950 tracking-tight">{plan.name}</h3>
          {plan.description && <p className="mt-1 text-sm text-neutral-600">{plan.description}</p>}
        </div>
        {badgeText && (
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", t.badge)}>
            {badgeText}
          </span>
        )}
      </header>

      {/* Ár / CTA cím */}
      <div className="mt-6 flex items-baseline gap-2">
        {hasPrice ? (
          <>
            <span className={cn("text-base font-semibold", t.priceHUF)}>HUF</span>
            <span className={cn("text-3xl md:text-4xl font-bold tracking-tight", t.price)}>{priceStr}</span>
            <span className={cn("text-sm md:text-base font-normal", t.per)}>{perSession}</span>
          </>
        ) : (
          <span className={cn("text-2xl font-bold", t.price)}>{plan?.CTA?.text || "Foglalj időpontot"}</span>
        )}
      </div>

      {/* CTA */}
      {plan.CTA && (
        <div className="mt-6">
          {openInNewTab ? (
            <a href={resolvedHref} target="_blank" rel={relAttr} className="block w-full">
              <Button variant={btnVariant} className="w-full">
                {plan.CTA?.text || "Foglalás"}
              </Button>
            </a>
          ) : (
            <Link href={resolvedHref} className="block w-full">
              <Button variant={btnVariant} className="w-full">
                {plan.CTA?.text || "Foglalás"}
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Perk lista */}
      <ul className="mt-6 grid gap-2.5">
        {plan.perks?.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2.5">
            <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full ring-1 ring-inset ring-breaker-bay-300/60 bg-breaker-bay-700 grid place-items-center">
              <IconCheck className="h-3.5 w-3.5 [stroke-width:3px] text-white" />
            </span>
            <p className="text-sm font-medium text-neutral-950">{getPerkText(feature)}</p>
          </li>
        ))}
      </ul>

      {/* Additional + elválasztó, ha van */}
      {plan.additional_perks?.length ? (
        <>
          <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-neutral-200/80 to-transparent" />
          <ul className="grid gap-2.5">
            {plan.additional_perks.map((feature, idx) => (
              <li key={`add-${idx}`} className="flex items-start gap-2.5">
                <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full ring-1 ring-inset ring-breaker-bay-300/60 bg-breaker-bay-600 grid place-items-center">
                  <IconCheck className="h-3.5 w-3.5 [stroke-width:3px] text-white" />
                </span>
                <p className="text-sm font-medium text-neutral-950">{getPerkText(feature)}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </article>
  );
};
