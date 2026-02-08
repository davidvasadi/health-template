// components/dynamic-zone/experience.tsx
"use client";

/**
 * =========================================================
 * EXPERIENCE Dynamic Zone blokk (Strapi v5 + Next.js 14)
 * ---------------------------------------------------------
 * - A DynamicZoneManager így hívja:
 *   <Component key={componentData.id} {...componentData} locale={locale} />
 *   => Tehát a props közvetlenül a Strapi-ból jön.
 *
 * - A Strapi v5 Rich text (Blocks) gyakran Lexical wrapper formában jön:
 *   { root: { children: [...] } }
 *   A BlocksRenderer-nek viszont *array* kell, ezért kicsomagoljuk.
 *
 * - Framer Motion animációk:
 *   - fadeInUp / fadeIn, viewport trigger
 *   - enyhe parallax: heading/panel scroll progress alapján
 *   - hover lift kártyákon
 * =========================================================
 */

import React, { useMemo, useRef } from "react";
import Link from "next/link";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * Strapi hivatalos renderer a "Rich text (Blocks)" mezőhöz.
 * A `content` paraméternek Blocks tömbnek kell lennie.
 */
import { BlocksRenderer } from "@strapi/blocks-react-renderer";

import { Container } from "@/components/container";

/**
 * StrapiImage: a projekt saját komponense (Next/Image wrapper jelleggel).
 * getStrapiMedia: URL összeállítás Strapi media objectből.
 */
import { StrapiImage, getStrapiMedia } from "@/components/ui/strapi-image";

/**
 * React-icons: designhoz illeszkedő ikonok.
 */
import { FiTarget, FiDroplet, FiActivity, FiWind, FiArrowRight, FiCheck } from "react-icons/fi";

type Locale = "hu" | "en" | "de" | string;

// A Strapi Blocks JSON tartalmát nem típusolom túl szigorúan, mert több shape is jöhet.
type StrapiBlocksContent = any;
// Strapi Media is lehet többféle wrapperrel (data/attributes), ezért any.
type StrapiMedia = any;

/**
 * Button komponens típusa (Strapi-ban Button component mező).
 * - Nálad "URL" kulccsal szerepel (nagybetű), de fallbackből kezeljük a "url"-t is.
 */
interface ButtonData {
  text?: string | null;
  URL?: string | null;
  url?: string | null;
  variant?: string | null;
  target?: string | null; // pl. "_blank"
}

/**
 * BadgeItem: általános label+value pár (statok + alsó kártyák is ilyenek nálad).
 */
interface BadgeItem {
  id?: number;
  label?: string | null;
  value?: string | null;
}

/**
 * A jobb oldali nagy kártya (experience_card) Strapi komponensének típusa.
 * FIGYELEM: a rich text mező nálad el van írva: "introdution"
 */
interface ExperienceCardData {
  image?: StrapiMedia | null;
  image_title?: string | null;
  image_description?: string | null;

  badge_label?: string | null;
  heading?: string | null;

  // ✅ STRAPI mező: "introdution"
  introdution?: StrapiBlocksContent | null;

  button?: ButtonData | null;

  // ✅ stat sor itt van nálad: experience_card.experiences
  experiences?: BadgeItem[] | null;
}

/**
 * A teljes dynamic-zone Experience blokk props típusa.
 * Ez jön a Strapi Experience komponenstől.
 */
export interface ExperienceProps {
  id: number;
  __component?: string;
  locale: Locale;

  badge_label?: string | null;
  heading?: string | null;
  sub_heading?: string | null;

  experience_card?: ExperienceCardData | any;

  // fallback kompatibilitás (ha később átmozgatnád)
  introdution?: StrapiBlocksContent | null;
  button?: ButtonData | null;
  experiences?: BadgeItem[] | null;

  // alul a 3 kártya: label + value
  experience_cards?: BadgeItem[] | null;

  // Strapi gyakran ad extra mezőket, ezért engedjük:
  [key: string]: any;
}

/**
 * Design színek (Tailwind-ben sokszor inline hexet használunk a pixelpontosságért).
 */
const COLOR_TEAL = "#057C80";
const COLOR_BORDER = "#D1D5DB";
const COLOR_SOFT_TEAL = "#DEECEF";

/**
 * Framer anim tokenek (ugyanaz a hangulat, mint az About komponensben).
 */
const fadeInUp = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

const fadeIn = {
  hidden: { opacity: 0, filter: "blur(4px)" },
  show: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.55, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.02 } },
};

/**
 * classNames helper:
 * - Összefűz több className stringet úgy, hogy a falsy értékeket kidobja.
 * - Alternatíva a clsx/cn, de itt nem hozunk be új libet.
 */
function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * unwrapAttributes:
 * Strapi v5-ben sokszor így kapsz adatot:
 * - { data: { attributes: {...} } }
 * vagy
 * - { attributes: {...} }
 * Ez a helper "kicsomagolja" és visszaadja a tényleges objektumot.
 */
function unwrapAttributes<T = any>(value: any): T | null {
  if (!value) return null;
  if (value?.data?.attributes) return value.data.attributes as T;
  if (value?.attributes) return value.attributes as T;
  return value as T;
}

/**
 * resolveMediaUrl:
 * - A Strapi media objectből kiolvassa az URL-t.
 * - Először megpróbálja a getStrapiMedia helperrel.
 * - Ha az nem ad vissza stringet, fallbackből próbál URL mezőket.
 */
function resolveMediaUrl(media?: any): string | null {
  const unwrapped = unwrapAttributes<any>(media) ?? media;
  if (!unwrapped) return null;

  try {
    const maybe = getStrapiMedia?.(unwrapped);
    if (typeof maybe === "string" && maybe) return maybe;
  } catch {
    // ha getStrapiMedia dobna, nem állunk fejre
  }

  const url =
    unwrapped?.url ??
    unwrapped?.data?.attributes?.url ??
    unwrapped?.data?.url ??
    unwrapped?.attributes?.url ??
    null;

  return typeof url === "string" && url ? url : null;
}

/**
 * normalizeHref:
 * - A Strapi-ban a gomb URL-ja lehet:
 *   "/szolgaltatasok" (belső)
 *   "https://..." (külső)
 * - Itt automatikusan előtagoljuk a locale-t a belső URL-ekhez:
 *   "/hu/..." "/en/..." stb.
 */
function normalizeHref(href?: string | null, locale?: string) {
  const raw = (href ?? "").trim();
  if (!raw) return "";
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("mailto:") || raw.startsWith("tel:")) return raw;

  if (raw.startsWith("/")) {
    const lang = (locale ?? "").trim();
    if (!lang) return raw;
    const prefix = `/${lang}`;
    if (raw === prefix || raw.startsWith(prefix + "/")) return raw;
    return `${prefix}${raw}`;
  }

  const lang = (locale ?? "").trim();
  if (!lang) return `/${raw}`;
  return `/${lang}/${raw}`.replace(/\/+/g, "/");
}

/**
 * splitHeadingForAmpersand:
 * - Design szerint a heading 2 sorban törik:
 * - Ha a heading tartalmaz "&"-t, ott kettévágjuk.
 * - Különben egy sorban rendereljük.
 */
function splitHeadingForAmpersand(heading?: string | null) {
  const cleanHeading = (heading ?? "").trim();
  if (!cleanHeading) return { line1: "", line2: "" };

  const token = " & ";
  if (cleanHeading.includes(token)) {
    const parts = cleanHeading.split(token);
    const before = (parts.shift() ?? "").trim();
    const after = parts.join(token).trim();
    return { line1: `${before} &`, line2: after };
  }

  const ampIndex = cleanHeading.indexOf("&");
  if (ampIndex > 0) {
    const before = cleanHeading.slice(0, ampIndex).trimEnd();
    const after = cleanHeading.slice(ampIndex + 1).trimStart();
    return { line1: `${before} &`, line2: after };
  }

  return { line1: cleanHeading, line2: "" };
}

/**
 * pickSmallCardIcon:
 * - Az alsó 3 kártyához választ ikont a label alapján.
 * - String includes mapping + fallback.
 */
function pickSmallCardIcon(label?: string | null) {
  const lower = (label ?? "").toLowerCase();

  if (lower.includes("köpöly") || lower.includes("kopoly")) return FiDroplet;
  if (lower.includes("klasszik") || lower.includes("classic") || lower.includes("techni")) return FiActivity;
  if (
    lower.includes("alternat") ||
    lower.includes("mozgáster") ||
    lower.includes("mozgaster") ||
    lower.includes("teráp")
  )
    return FiWind;

  return FiCheck;
}

/**
 * extractBlocksArray:
 * ---------------------------------------------------------
 * Strapi v5 Rich text (Blocks) több formában érkezhet.
 * A BlocksRenderer csak "array" contentet renderel.
 *
 * Tipikus Strapi v5 Lexical wrapper:
 *   { root: { children: [...] } }
 * => visszaadjuk: input.root.children
 *
 * Ha már eleve tömb:
 *   [ {type:'paragraph', children:[...] }, ... ]
 * => visszaadjuk: input
 *
 * Ha string JSON:
 * => megpróbáljuk parse-olni
 */
function extractBlocksArray(input: any): any[] | null {
  if (!input) return null;

  // 1) Ha már eleve tömb
  if (Array.isArray(input)) return input;

  // 2) Ha string (néha JSON string)
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;

    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
      try {
        const parsed = JSON.parse(trimmed);
        return extractBlocksArray(parsed);
      } catch {
        return null;
      }
    }

    return null;
  }

  // 3) Ha object
  if (typeof input === "object") {
    // ✅ Lexical wrapper
    if (input?.root && Array.isArray(input.root.children)) return input.root.children;

    // root/doc shape
    if ((input.type === "root" || input.type === "doc") && Array.isArray(input.children)) return input.children;

    // más lehetséges wrapper
    if (Array.isArray(input.content)) return input.content;
    if (Array.isArray(input.blocks)) return input.blocks;

    // single node -> tömbbé alakítjuk
    if (input.type && Array.isArray(input.children)) return [input];

    // wrapper data/attributes
    if (input.data || input.attributes) {
      const unwrapped = unwrapAttributes<any>(input);
      if (unwrapped && unwrapped !== input) return extractBlocksArray(unwrapped);
    }
  }

  return null;
}

// A projekted StrapiImage komponensét "általános" React komponensként használjuk.
const StrapiImg = StrapiImage as unknown as React.ComponentType<any>;

/**
 * =========================================================
 * EXPERIENCE komponens
 * =========================================================
 */
export const Experience = (props: ExperienceProps) => {
  const { locale, badge_label, heading, sub_heading } = props;

  /**
   * Framer: reduced motion figyelés (ha valaki kikapcsolta az animációt).
   */
  const prefersReduced = useReducedMotion();

  /**
   * Framer: scroll alapú finom parallax a szekción belül.
   * - sectionRef-re kötjük a scrollYProgress-t.
   */
  const sectionRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    // hasonló érzés, mint az About-ban:
    offset: ["start start", "end start"],
  });

  // heading enyhén "úszik" felfelé scrollnál (ha nem reduced)
  const yHeading = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : -26]);
  // panelek enyhén jobban "úsznak"
  const yPanel = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : -44]);

  /**
   * Strapi wrapper kicsomagolása:
   * ha experience_card valami data/attributes formában jönne.
   */
  const experienceCard = useMemo(
    () => unwrapAttributes<ExperienceCardData>(props.experience_card) ?? null,
    [props.experience_card]
  );

  /**
   * Heading tördelése "&" mentén
   */
  const { line1: headingLine1, line2: headingLine2 } = useMemo(() => splitHeadingForAmpersand(heading), [heading]);

  /**
   * Rich text forrás:
   * - Nálad a mező neve: "introdution"
   * - Elsődlegesen a cardban keressük
   * - fallback: top-level props.introdution
   */
  const richSource = experienceCard?.introdution ?? (props as any).introdution ?? null;

  /**
   * Kicsomagoljuk a Blocks array-t (Lexical wrapperből is).
   * Ha null, akkor nincs render.
   */
  const richBlocks = useMemo(() => extractBlocksArray(richSource), [richSource]);

  /**
   * Button forrás:
   * - experience_card.button vagy top-level button (fallback)
   */
  const buttonSource = experienceCard?.button ?? props.button ?? null;

  // szöveg
  const btnText = (buttonSource?.text ?? "").trim();
  // URL mező Strapi-ban: "URL" (nagybetű) -> fallbackből kezeljük a "url"-t is
  const btnHrefRaw = (buttonSource?.URL ?? buttonSource?.url ?? "").trim();
  // locale prefix + normalizálás
  const btnHref = normalizeHref(btnHrefRaw, String(locale ?? ""));
  // target pl. "_blank"
  const btnTarget = (buttonSource?.target ?? "").trim() || undefined;
  // variant: primary / secondary
  const btnVariant = (buttonSource?.variant ?? "primary").trim().toLowerCase();

  /**
   * Statok forrása:
   * - nálad: experience_card.experiences
   * - fallback: props.experiences
   */
  const statItems = useMemo(() => {
    const inside = experienceCard?.experiences;
    const fallback = props.experiences;
    const list = Array.isArray(inside) ? inside : Array.isArray(fallback) ? fallback : [];
    return list.filter(Boolean);
  }, [experienceCard?.experiences, props.experiences]);

  /**
   * Alsó 3 kártya (experience_cards) – ha van.
   */
  const smallCards = Array.isArray(props.experience_cards) ? props.experience_cards.filter(Boolean) : [];

  /**
   * Profil kép URL + alt:
   */
  const profileImageUrl = useMemo(() => resolveMediaUrl(experienceCard?.image), [experienceCard?.image]);
  const profileAlt = (experienceCard?.image_title ?? "Profile image") as string;

  /**
   * BlocksRenderer tipográfia mapping.
   * NOTE: A BlocksRenderer typingja néha szigorú, ezért `any`.
   */
  const blocks: any = {
    paragraph: ({ children }: any) => <p className="text-xl  text-[#4B5563] [&:not(:first-child)]:mt-4">{children}</p>,
    heading: ({ children, level }: any) => {
      // level clamp 1..6
      const safeLevel = typeof level === "number" ? Math.min(6, Math.max(1, level)) : 3;

      // Dinamikus tag: "h1".."h6"
      const Tag = (`h${safeLevel}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6");

      const sizeClass =
        safeLevel === 1 ? "text-2xl" : safeLevel === 2 ? "text-xl" : safeLevel === 3 ? "text-lg" : "text-base";

      return <Tag className={classNames("mt-6 font-semibold text-[#111827]", sizeClass)}>{children}</Tag>;
    },
    list: ({ children, format }: any) => {
      const isOrdered = format === "ordered";
      const ListTag = (isOrdered ? "ol" : "ul") as any;
      return (
        <ListTag
          className={classNames(
            "space-y-2 pl-5 text-[15px] leading-7 text-[#4B5563]",
            isOrdered ? "list-decimal" : "list-disc"
          )}
        >
          {children}
        </ListTag>
      );
    },
    // ⚠️ fontos: a helyes kulcs "list-item" (nem listItem)
    "list-item": ({ children }: any) => <li className="pl-1">{children}</li>,
    quote: ({ children }: any) => (
      <blockquote className="border-l-4 pl-4 text-[15px] italic text-[#4B5563]" style={{ borderColor: COLOR_BORDER }}>
        {children}
      </blockquote>
    ),
    link: ({ children, url }: any) => (
      <a
        href={url}
        className="font-semibold text-[#057C80] underline underline-offset-4"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
  };

  /**
   * Text módosítók:
   * - bold: teal kiemelés (design szerint a számok/kiemelések teal)
   */
  const modifiers: any = {
    bold: ({ children }: any) => (
      <strong className="font-semibold" style={{ color: COLOR_TEAL }}>
        {children}
      </strong>
    ),
    italic: ({ children }: any) => <em className="italic">{children}</em>,
    underline: ({ children }: any) => <u className="underline underline-offset-4">{children}</u>,
    strikethrough: ({ children }: any) => <s className="line-through">{children}</s>,
    code: ({ children }: any) => (
      <code className="rounded-md bg-black/5 px-1.5 py-0.5 font-mono text-[13px] text-[#111827]">{children}</code>
    ),
  };

  /**
   * Framer viewport beállítás:
   * - egyszer animáljon
   * - kicsit később triggereljen (margin alul negatív)
   */
  const viewport = useMemo(
    () => ({ once: true, amount: 0.2, margin: "0px 0px -10% 0px" as const }),
    []
  );

  /**
   * Hover lift anim (kártyáknak):
   * - reduced motion esetén kikapcsoljuk.
   */
  const hoverLift = prefersReduced ? undefined : { y: -2 };

  const hoverTransition = useMemo(() => ({ type: "spring", stiffness: 260, damping: 24 }), []);

  return (
    /**
     * Külső section:
     * - fehér háttér
     * - felső/alsó padding a design alapján
     */
    <motion.section ref={sectionRef} className="bg-white py-14 sm:py-18 lg:py-24">
      <Container>
        {/* =========================================================
            1) FEJLÉC RÉSZ (anim: fadeInUp + parallax)
           ========================================================= */}
        <motion.div
          className="max-w-4xl"
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={fadeInUp}
          style={{ y: yHeading }}
        >
          {/* pill badge */}
          {!!badge_label && (
            <div className="inline-flex items-center gap-2 rounded-full bg-[#DEECEF]/70 px-3 py-1 text-[10px] font-semibold  text-[#057C80] uppercase">
              {/* kis ikon buborék a badge elején */}
              <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-[#057C80] text-white shadow-sm">
                <FiCheck className="h-2 w-2" />
              </span>
              <span>{badge_label}</span>
            </div>
          )}

          {/* nagy heading (2 sor) */}
          {(headingLine1 || headingLine2) && (
            <h2 className="mt-5 max-w-5xl bg-clip-text bg-gradient-to-b from-neutral-800 via-white to-white text-left text-neutral-950 tracking-tight text-4xl md:text-7xl font-semibold">
              {headingLine1} {headingLine2}
            </h2>
          )}

          {/* subheading */}
          {!!sub_heading && <p className="font-normal  pt-6 text-left text-neutral-500 text-lg md:text-xl">{sub_heading}</p>}
        </motion.div>

        {/* =========================================================
            2) FŐ KÉT OSZLOPOS RÉSZ
            - anim: fadeIn + staggerChildren + panel parallax
           ========================================================= */}
        <motion.div
          className="mt-10 lg:mt-12"
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={fadeIn}
          style={{ y: yPanel }}
        >
          <motion.div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-3" variants={stagger}>
            {/* --------------------------
                BAL: profil kép kártya
               -------------------------- */}
            <motion.div className="lg:col-span-4" variants={fadeInUp}>
              <motion.div
                className={classNames(
                  "relative overflow-hidden rounded-[24px] border bg-white",
                  "shadow-[0_18px_34px_rgba(0,0,0,0.10)]"
                )}
                style={{ borderColor: COLOR_BORDER }}
                whileHover={hoverLift}
                transition={hoverTransition}
              >
                {/* fix magasság (design) */}
                <div className="relative h-[420px] w-full sm:h-[460px] lg:h-[520px]">
                  {profileImageUrl ? (
                    <StrapiImg
                      src={profileImageUrl}
                      alt={profileAlt}
                      fill
                      sizes="(min-width: 1024px) 360px, 100vw"
                      className="object-cover"
                      priority={false}
                    />
                  ) : (
                    // fallback ha nincs kép
                    <div className="h-full w-full bg-black/5" />
                  )}

                  {/* alul gradient overlay, hogy a fehér szöveg olvasható legyen */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                  {/* képre ráültetett szöveg */}
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    {!!experienceCard?.image_title && (
                      <div className="text-[22px] font-semibold leading-tight text-white drop-shadow-sm">
                        {experienceCard.image_title}
                      </div>
                    )}
                    {!!experienceCard?.image_description && (
                      <div className="mt-1 text-[13px] font-medium text-white/80 drop-shadow-sm">
                        {experienceCard.image_description}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* --------------------------
                JOBB: nagy info kártya
               -------------------------- */}
            <motion.div className="lg:col-span-8" variants={fadeInUp}>
              <motion.div
                className={classNames(
                  "h-full rounded-[24px] border bg-white",
                  "shadow-[0_18px_34px_rgba(0,0,0,0.06)]"
                )}
                style={{ borderColor: COLOR_BORDER }}
                whileHover={hoverLift}
                transition={hoverTransition}
              >
                <div className="p-6 sm:p-8 lg:min-h-[520px]">
                  {/* fejléc sor: ikon + badge + cím */}
                  <div className="flex items-start gap-4 sm:gap-5">
                    {/* teal ikon tile */}
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                      style={{ backgroundColor: COLOR_TEAL }}
                      aria-hidden="true"
                    >
                      <FiTarget className="h-7 w-7" />
                    </div>

                    <div className="min-w-0">
                      {!!experienceCard?.badge_label && (
                        <div className="text-xs font-semibold leading-tight uppercase text-[#057C80]">
                          {experienceCard.badge_label}
                        </div>
                      )}
                      {!!experienceCard?.heading && (
                        <div className="mt-1 text-2xl font-semibold leading-tight text-[#111827] md:text-text-4xl">
                          {experienceCard.heading}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rich text: csak akkor rendereljük, ha tényleg tömböt kapunk */}
                  {Array.isArray(richBlocks) && richBlocks.length > 0 && (
                    <div className="mt-5">
                      <BlocksRenderer content={richBlocks as any} blocks={blocks} modifiers={modifiers} />
                    </div>
                  )}

                  {/* CTA gomb */}
                  {!!btnHref && !!btnText && (
                    <div className="mt-6">
                      <Link
                        href={btnHref}
                        target={btnTarget}
                        rel={btnTarget === "_blank" ? "noopener noreferrer" : undefined}
                        className={classNames(
                          "inline-flex items-center justify-center gap-3 rounded-xl px-6 py-3 text-[14px] font-semibold transition",
                          btnVariant === "primary"
                            ? "text-white shadow-sm hover:opacity-95"
                            : "border bg-white text-[#111827] hover:bg-black/[0.02]"
                        )}
                        style={
                          btnVariant === "primary"
                            ? { backgroundColor: COLOR_TEAL }
                            : { borderColor: COLOR_BORDER as any }
                        }
                      >
                        <span>{btnText}</span>
                        <FiArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  )}

                  {/* elválasztó vonal a statok előtt */}
                  <div className="mt-8 h-px w-full" style={{ backgroundColor: COLOR_BORDER }} />

                  {/* statok: desktopon 4 oszlop, mobilon 2x2 */}
                  {statItems.length > 0 && (
                    <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
                      {statItems.slice(0, 4).map((stat, index) => {
                        const valueText = (stat?.value ?? "").toString();
                        const labelText = (stat?.label ?? "").toString();
                        return (
                          <div key={stat?.id ?? `${labelText}-${index}`} className="text-center">
                            <div
                              className="text-xl md:text-2xl font-semibold leading-tight"
                              style={{ color: COLOR_TEAL }}
                            >
                              {labelText}
                            </div>
                            <div className="mt-2 text-xs md:text-md font-semibold leading-tight  uppercase text-[#4B5563]">
                              {valueText}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* =========================================================
            3) ALSÓ 3 KÁRTYA
            - anim: stagger + fadeInUp + hover lift
           ========================================================= */}
        {smallCards.length > 0 && (
          <motion.div
            className="mt-3 grid grid-cols-1 gap-3 md:mt-3 md:grid-cols-3"
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={stagger}
          >
            {smallCards.slice(0, 3).map((cardItem, index) => {
              const Icon = pickSmallCardIcon(cardItem?.label);
              return (
                <motion.div
                  key={cardItem?.id ?? `${cardItem?.label ?? "card"}-${index}`}
                  variants={fadeInUp}
                  whileHover={hoverLift}
                  transition={hoverTransition}
                  className={classNames(
                    "rounded-[22px] border bg-white p-6 sm:p-7",
                    "shadow-[0_18px_30px_rgba(0,0,0,0.04)]"
                  )}
                  style={{ borderColor: COLOR_BORDER }}
                >
                  {/* kis ikon háttér: halvány teal */}
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: COLOR_SOFT_TEAL, color: COLOR_TEAL }}
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {!!cardItem?.label && <h3 className="mt-6 text-[20px] font-semibold leading-snug text-[#374151]">{cardItem.label}</h3>}

                  {!!cardItem?.value && <p className="mt-3 text-[15px] leading-7 text-[#4B5563]">{cardItem.value}</p>}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </Container>
    </motion.section>
  );
};
