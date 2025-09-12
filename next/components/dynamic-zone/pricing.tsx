"use client";

import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/container";
import { FeatureIconContainer } from "./features/feature-icon-container";
import { Heading } from "@/components/elements/heading";
import { Subheading } from "@/components/elements/subheading";
import { IconCheck, IconReceipt2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/elements/button";
import { usePathname } from "next/navigation";

/*************************
 * Types
 *************************/
export type PerkLike = { text: string } | Record<string, string>;
export type CTA = { text: string; href?: string; URL?: string; variant?: "simple" | "outline" | "primary" | "muted" };
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
 * CTA Helpers (Hero-style)
 *************************/
function resolveCtaVariant(cta: any, index: number) {
  const raw = String(cta?.variant || cta?.type || "").toLowerCase();
  if (["primary", "accent", "ghost"].includes(raw)) return raw;
  return index % 3 === 0 ? "primary" : index % 3 === 1 ? "accent" : "ghost";
}

function ctaHref(locale: string, cta?: CTA) {
  if (!cta) return "#";
  const path = String(cta?.href || cta?.URL || "");
  if (!path) return "#";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized}`;
}

/*************************
 * Labels
 *************************/
const Labels = {
  en: { perSession: "Session", value: "€" },
  hu: { perSession: "Alkalom", value: "HUF" },
  de: { perSession: "Einheit", value: "€" },
};

/*************************
 * Motion helpers
 *************************/
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

/*************************
 * Design Tokens
 *************************/
const t = {
  page: "bg-white",
  heading: "text-neutral-950 tracking-tight",
  sub: "text-neutral-700",
  icon: "text-breaker-bay-700",
  card:
    "bg-white/55 supports-[backdrop-filter]:bg-white/40 backdrop-blur-2xl rounded-3xl border border-neutral-200/60 shadow-[0_6px_24px_rgba(0,0,0,0.08),0_80px_140px_-80px_rgba(0,0,0,0.25)]",
  badge:
    "bg-breaker-bay-100 text-breaker-bay-900 ring-1 ring-inset ring-breaker-bay-300/60",
  priceHUF: "text-breaker-bay-700",
  price: "text-neutral-950",
  per: "text-neutral-500",
};

/*************************
 * Pricing Component
 *************************/
export const Pricing: React.FC<PricingProps> = ({ heading, sub_heading, plans, variant = "A" }) => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const yHeading = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : -60]);
  const yGrid = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : -120]);

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

  const pathname = usePathname();
  const locale = pathname?.startsWith("/hu") ? "hu" : pathname?.startsWith("/de") ? "de" : "en";
  const label = Labels[locale] || Labels.en;

  return (
    <section ref={sectionRef} className={cn("relative isolate pt-28 md:pt-36", t.page)} onMouseMove={handlePointer}>
      <Container>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto text-left">
              {plans.map((plan, i) => (
                <motion.div key={`${plan.name}-${i}`} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, ease: "easeOut", delay: i * 0.06 }}>
                  <Card plan={plan} label={label} locale={locale} index={i} variant={variant} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
};

/*************************
 * Card
 *************************/
const Card: React.FC<{ plan: Plan; label: typeof Labels["en"]; locale: string; index: number; variant?: "A" | "B" }> = ({ plan, label, locale, index, variant }) => {
  const isFeatured = !!plan.featured;
  const hasPrice = typeof plan.price === "number" && !Number.isNaN(plan.price);
  const priceStr = hasPrice ? plan.price!.toLocaleString("hu-HU") : "";
  const badgeText = (plan.badgeLabel ?? "").trim();

  const ctaVariant = resolveCtaVariant(plan.CTA, index);

  return (
    <motion.article whileHover={{ y: -4 }} whileFocus={{ y: -2 }} className={cn("group relative transition outline-none focus-visible:ring-2 focus-visible:ring-breaker-bay-400/40", t.card)} tabIndex={0} aria-label={`${plan.name} csomag`}>
      <div className="p-5 md:p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-neutral-950 tracking-tight">{plan.name}</h3>
            {plan.description && <p className="mt-1 text-sm text-neutral-600">{plan.description}</p>}
          </div>
          {badgeText && <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", t.badge)}>{badgeText}</span>}
        </header>

        <div className="mt-6 flex items-baseline gap-2">
          {hasPrice ? (
            <>
              <span className={cn("text-base font-semibold", t.priceHUF)}>{label.value}</span>
              <span className={cn("text-4xl md:text-5xl font-bold tracking-tight", t.price)}>{priceStr}</span>
              <span className={cn("text-sm md:text-base font-normal", t.per)}> / {label.perSession}</span>
            </>
          ) : (
            <span className={cn("text-2xl md:text-3xl font-bold", t.price)}>{plan?.CTA?.text || "Foglalj időpontot"}</span>
          )}
        </div>

       <Button
  as={Link}
  href={plan.CTA?.href || "#"}
  variant={plan.CTA?.variant || "primary"} // ← itt vesszük a Strapi-ben beállított variánst
  className="w-full mt-6"
  aria-label={`Válaszd: ${plan.name}`}
>
  {plan.CTA?.text || "Foglalás"}
</Button>


        <div className="mt-6">
          <PerkList perks={plan.perks} />
        </div>

        {plan.additional_perks?.length ? (
          <>
            <Divider />
            <PerkList perks={plan.additional_perks} additional />
          </>
        ) : null}
      </div>
    </motion.article>
  );
};

/*************************
 * PerkList
 *************************/
const PerkList: React.FC<{ perks: PerkLike[]; additional?: boolean }> = ({ perks, additional = false }) => (
  <ul className="grid gap-2.5 text-left">
    {perks.map((feature, idx) => (
      <motion.li key={idx} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-20px" }} transition={{ duration: 0.35, ease: "easeOut" }} className="flex items-start gap-2.5">
        <span className={cn("mt-0.5 h-5 w-5 flex-shrink-0 rounded-full ring-1 ring-inset grid place-items-center", additional ? "bg-breaker-bay-600 ring-breaker-bay-300/60" : "bg-breaker-bay-700 ring-breaker-bay-300/60")}>
          <IconCheck className="h-3.5 w-3.5 [stroke-width:3px] text-white" />
        </span>
        <p className="text-sm font-medium text-neutral-950">{getPerkText(feature)}</p>
      </motion.li>
    ))}
  </ul>
);

/*************************
 * Divider
 *************************/
const Divider = () => <div className={cn("my-6 h-px w-full bg-gradient-to-r from-transparent via-breaker-bay-200/70 to-transparent")} />;
