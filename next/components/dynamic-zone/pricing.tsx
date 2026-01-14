"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCheck, IconClock, IconReceipt2 } from "@tabler/icons-react";
import { Calendar } from "lucide-react";
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

  /** Strapi-ból jöhet bárhogy – ezekre rápróbálunk */
  duration?: string | number | null;
  minutes?: number | null;
  time?: string | number | null;
  durationLabel?: string | null;

  background?: any; // Strapi media field (data/attributes/url) vagy bármi
  cover?: any;
  image?: any;
  heroImage?: any;

  /** ha mégis string URL-t adsz */
  imageSrc?: string;
  imageAlt?: string;
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
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized}`.replace(/\/{2,}/g, "/");
}

/** Strapi base url (ha relatív media url-t kapsz) */
const STRAPI_URL =
  (process.env.NEXT_PUBLIC_STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL?.trim() || "").replace(/\/$/, "");

/** Strapi media URL feloldás: string | {data:{attributes:{url}}} | {url} */
function resolveMediaUrl(input: any): { url?: string; alt?: string } {
  if (!input) return {};

  // ha már string
  if (typeof input === "string") {
    const u = input.trim();
    if (!u) return {};
    if (/^https?:\/\//i.test(u)) return { url: u };
    return { url: STRAPI_URL ? `${STRAPI_URL}${u.startsWith("/") ? "" : "/"}${u}` : u };
  }

  // Strapi v4: { data: { attributes: { url, alternativeText } } }
  const url1 = input?.data?.attributes?.url;
  const alt1 = input?.data?.attributes?.alternativeText || input?.data?.attributes?.name;

  if (typeof url1 === "string" && url1.trim()) {
    const u = url1.trim();
    const abs = /^https?:\/\//i.test(u) ? u : STRAPI_URL ? `${STRAPI_URL}${u.startsWith("/") ? "" : "/"}${u}` : u;
    return { url: abs, alt: alt1 };
  }

  // néha már "attributes" nélkül jön
  const url2 = input?.url;
  const alt2 = input?.alternativeText || input?.name;
  if (typeof url2 === "string" && url2.trim()) {
    const u = url2.trim();
    const abs = /^https?:\/\//i.test(u) ? u : STRAPI_URL ? `${STRAPI_URL}${u.startsWith("/") ? "" : "/"}${u}` : u;
    return { url: abs, alt: alt2 };
  }

  return {};
}

function resolvePlanBackground(plan: Plan): { url?: string; alt?: string } {
  // próbálkozási sorrend
  const candidates = [
    plan.background,
    plan.cover,
    plan.image,
    plan.heroImage,
    (plan as any)?.backgroundImage,
    (plan as any)?.bg,
    (plan as any)?.thumbnail,
    plan.imageSrc, // string fallback
  ];

  for (const c of candidates) {
    const { url, alt } = resolveMediaUrl(c);
    if (url) return { url, alt: alt || plan.imageAlt || plan.name };
  }
  return { alt: plan.imageAlt || plan.name };
}

const PER_SESSION_LABELS = {
  hu: "/ alkalom",
  en: "/ session",
  de: "/ Sitzung",
} as const;

const FEATURED_LABELS = {
  hu: "Kiemelt",
  en: "Featured",
  de: "Hervorgehoben",
} as const;

function resolveDurationLabel(plan: Plan, locale: "hu" | "en" | "de"): string | null {
  const raw =
    plan.durationLabel ??
    (plan as any)?.duration_label ??
    plan.duration ??
    plan.minutes ??
    plan.time ??
    (plan as any)?.durationMinutes ??
    (plan as any)?.duration_minutes ??
    null;

  if (raw == null) return null;

  if (typeof raw === "string") {
    const s = raw.trim();
    return s ? s : null;
  }

  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.round(raw);
    if (locale === "hu") return `${n} perc`;
    if (locale === "de") return `${n} Min.`;
    return `${n} min`;
  }

  return null;
}

/* ────────────────────────────────────────────────────────────────────────────
   Tokenek (Figma kártya) — módosítva:
   - üveg panel a tartalom mögé (alul leér, nincs bottom padding)
   - CTA gomb zöld bordere leszedve (hard override: border-transparent + !ring-0)
   - Kiemelt pill áttetszőbb + üveges
   - kártya szélesség picit bővítve (ha kell)
────────────────────────────────────────────────────────────────────────────── */
const t = {
  page: "bg-white",
  heading: "mx-auto text-neutral-950 tracking-tight",
  sub: "text-neutral-700",
  icon: "text-breaker-bay-700",

  card:
    "relative h-full overflow-hidden rounded-2xl border border-neutral-200/60 shadow-[0_18px_60px_rgba(0,0,0,0.18)]",
  // ha kell egy kicsit több hely:
  mediaWrap: "relative w-full aspect-[4/5] min-h-[520px] mx-auto",

  overlay: "absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10",

  // ÁTTETSZŐBB + ÜVEG "Kiemelt"
  topPill:
    "inline-flex items-center rounded-full bg-white/60 text-[#057C80] px-3 py-1 text-xs font-semibold ring-1 ring-inset ring-white/40 backdrop-blur-xl shadow-[0_6px_18px_rgba(0,0,0,0.12)]",

  title: "text-white font-semibold tracking-tight text-[20px] leading-snug",

  pillRow: "mt-3 flex flex-wrap items-center gap-2",
  pill:
    "inline-flex items-center gap-2 rounded-full bg-white/12 ring-1 ring-inset ring-white px-3 py-1.5 text-sm text-white backdrop-blur-md",

  perkText: "text-sm font-medium text-white/95",
  perkIcon: "mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-[#057C80] grid place-items-center",

  // ÜVEG PANEL A TARTALOM MÖGÉ — alul LEÉR, ezért bottom padding: 0
  contentGlass:
    "absolute inset-x-0 bottom-0 z-0 rounded-[26px] bg-white/12 backdrop-blur-sm ring-1 ring-inset ring-white/20 shadow-[0_18px_40px_rgba(0,0,0,0.18)]",

  // CTA konténer
  ctaBar: "my-4 bg-white/95 backdrop-blur-xl shadow-[0_18px_40px_rgba(0,0,0,0.18)] rounded-xl",
};

/* ────────────────────────────────────────────────────────────────────────────
   Animáció
────────────────────────────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/* ────────────────────────────────────────────────────────────────────────────
   Pricing
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
      <div className="px-2 md:px-6 pb-24 md:pb-28 lg:pb-32">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mx-auto text-left">
              {plans.map((plan, i) => (
                <motion.div
                  key={`${plan.name}-${i}`}
                  initial={{ opacity: 0, y: 12, scale: 0.995 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.04 }}
                >
                  <Card plan={plan} locale={locale as any} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

    </section>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   Egyféle kártya (Figma) — módosítva a kéréseid szerint
────────────────────────────────────────────────────────────────────────────── */
const Card: React.FC<{ plan: Plan; locale: "hu" | "en" | "de" }> = ({ plan, locale }) => {
  const isFeatured = !!plan.featured;
  const hasPrice = typeof plan.price === "number" && !Number.isNaN(plan.price);
  const priceStr = hasPrice ? plan.price!.toLocaleString("hu-HU") : "";
  const badgeText = (plan.badgeLabel ?? "").trim();

  const perSession = PER_SESSION_LABELS[locale] ?? PER_SESSION_LABELS.hu;
  const featuredLabel = FEATURED_LABELS[locale] ?? FEATURED_LABELS.hu;

  const duration = resolveDurationLabel(plan, locale);
  const bg = resolvePlanBackground(plan);

  const resolvedHref = ctaHref(locale, plan.CTA);
  const rawPath = String(plan.CTA?.href || plan.CTA?.URL || "");
  const isExternal = /^https?:\/\//i.test(rawPath);
  const explicitTarget = plan.CTA?.target;
  const explicitNewTab = (plan.CTA && ((plan.CTA as any).newTab === true)) || false;
  const openInNewTab = explicitTarget === "_blank" || explicitTarget === true || explicitNewTab || isExternal;
  const relAttr = openInNewTab ? "noopener" : undefined;

  const showTopPill = isFeatured || badgeText.length > 0;
  const topPillLabel = badgeText || featuredLabel;

  const pricePillText = hasPrice ? `${priceStr} Ft ${perSession}` : null;
  const ctaText = (plan.CTA?.text || "").trim();

  return (
    <article className={t.card}>
      <div className={t.mediaWrap}>
        {/* háttérkép */}
        {bg.url ? (
          <img
            src={bg.url}
            alt={bg.alt || plan.name}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-200" />
        )}

        {/* overlay */}
        <div className={t.overlay} />

        {/* top-right pill */}
        {showTopPill ? (
          <div className="absolute top-4 right-4 z-20">
            <span className={t.topPill}>{topPillLabel}</span>
          </div>
        ) : null}

        {/* content (panel + content) */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end">
          {/* ÜVEG panel a tartalom mögé:
              - oldal/fent kap paddingot
              - ALUL leér, nincs bottom padding */}
          <div className="relative mx-5  px-2 pt-5 pb-0">
            <div className={cn(t.contentGlass, "top-0")} />

            {/* tartalom a panel fölött */}
            <div className="relative z-10">
              <h3 className={t.title}>{plan.name}</h3>

              <div className={t.pillRow}>
                {pricePillText ? <span className={t.pill}>{pricePillText}</span> : null}

                {duration ? (
                  <span className={t.pill}>
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/12 ring-1 ring-inset ring-white/15">
                      <IconClock className="h-3.5 w-3.5 text-white" />
                    </span>
                    {duration}
                  </span>
                ) : null}
              </div>

              <ul className="mt-4 grid gap-2.5">
                {plan.perks?.slice(0, 6).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className={t.perkIcon}>
                      <IconCheck className="h-3.5 w-3.5 [stroke-width:3px] text-white" />
                    </span>
                    <p className={t.perkText}>{getPerkText(feature)}</p>
                  </li>
                ))}
              </ul>

              {/* CTA bar: alul leér, ezért NINCS külön bottom padding; a bar maga ad belsőt */}
              {plan.CTA && (
                <div className="mt-5 pb-0">
                  {openInNewTab ? (
                    <a href={resolvedHref} target="_blank" rel={relAttr} className="block w-full">
                      <div className={t.ctaBar}>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full rounded-xl bg-transparent",
                            // HARD OVERRIDE: zöld border/ring OFF
                            "!border-transparent !ring-0 !ring-offset-0 focus:!ring-0 focus-visible:!ring-0",
                            // ha a Button belül is borderel:
                            "[&_*]:!ring-0"
                          )}
                        >
                          <span className="inline-flex items-center gap-2 text-[#057C80] font-semibold">
                            <Calendar className="h-5 w-5" />
                            {ctaText ||
                              (locale === "hu"
                                ? "Időpontfoglalás"
                                : locale === "de"
                                ? "Termin buchen"
                                : "Book appointment")}
                          </span>
                        </Button>
                      </div>
                    </a>
                  ) : (
                    <Link href={resolvedHref} className="block w-full">
                      <div className={t.ctaBar}>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full rounded-xl bg-transparent",
                            "!border-transparent !ring-0 !ring-offset-0 focus:!ring-0 focus-visible:!ring-0",
                            "[&_*]:!ring-0"
                          )}
                        >
                          <span className="inline-flex items-center gap-2 text-[#057C80] font-semibold">
                            <Calendar className="h-5 w-5" />
                            {ctaText ||
                              (locale === "hu"
                                ? "Időpontfoglalás"
                                : locale === "de"
                                ? "Termin buchen"
                                : "Book appointment")}
                          </span>
                        </Button>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ALUL teljesen leér: ezért nincs itt plusz p-5 */}
        </div>
      </div>
    </article>
  );
};
