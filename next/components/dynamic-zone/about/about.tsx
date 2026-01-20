"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRightIcon, Calendar, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Container } from "@/components/container";
import { Heading } from "@/components/elements/heading";
import { Subheading } from "@/components/elements/subheading";

import { TeamModal } from "./team";

/* ────────────────────────────────────────────────────────────────────────────
  Types
────────────────────────────────────────────────────────────────────────────── */

export type Locale = "hu" | "en" | "de";

export type ButtonData = {
  id?: number;
  text?: string;
  URL?: string;
  href?: string;
  variant?: "simple" | "outline" | "primary" | "muted";
  target?: string | boolean;
  newTab?: boolean;
};

// Strapi Rich Text (Blocks)
export type RichTextNode = {
  type?: string;
  children?: Array<{ text?: string } & Record<string, any>>;
} & Record<string, any>;

export type RichTextBlocks = RichTextNode[];

export type Team = {
  id: number;
  name?: string;
  job?: string;
  short_description?: string;
  long_description?: RichTextBlocks;
  badge_label?: string | null;
  heading?: string;
  avatar?: any;
  media?: any;
  button?: ButtonData[] | ButtonData;
};

export type HeadingComponent = {
  badge_label?: string;
  heading?: string;
  sub_heading?: string;
  description?: string;
  image?: any;
};

export type Perk = { id?: number; text?: string } | Record<string, any>;

export type ListComponent = {
  list_title?: string;
  span?: Perk[];
  story_title?: string;
  story_description?: string;
};

export type AboutProps = {
  id: number;
  __component: "dynamic-zone.about";
  locale: Locale;

  heading?: HeadingComponent;
  list?: ListComponent;

  story_title?: string;
  story_description?: string;

  logo?: any;

  teams?: Team[] | { data?: Array<{ id: number; attributes?: any }> };
};

/* ────────────────────────────────────────────────────────────────
  Anim tokens
──────────────────────────────────────────────────────────────── */

const t = {
  heading: "text-neutral-950 tracking-tight text-4xl md:text-7xl font-semibold",
  sub: "text-left text-neutral-500 text-lg md:text-xl",
};

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

/* ────────────────────────────────────────────────────────────────
  i18n copy + robust matching (HU/EN/DE)
──────────────────────────────────────────────────────────────── */

const COPY = {
  hu: {
    badge: "A csapat arcai",
    more: "Bővebben",
    bookingFallback: "Időpontfoglalás",
  },
  en: {
    badge: "Meet the team",
    more: "Learn more",
    bookingFallback: "Book an appointment",
  },
  de: {
    badge: "Team-Porträt",
    more: "Mehr erfahren",
    bookingFallback: "Termin buchen",
  },
} as const;

function getCopy(locale: Locale) {
  return (COPY as any)[locale] ?? COPY.hu;
}

function fold(input?: string) {
  return String(input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isMoreBtn(_locale: Locale, b?: ButtonData) {
  const t = fold(b?.text);
  return (
    t.includes("bovebben") ||
    t.includes("learn more") ||
    t.includes("read more") ||
    t.includes("details") ||
    t.includes("mehr") ||
    t.includes("erfahren")
  );
}

function isBookingBtn(_locale: Locale, b?: ButtonData) {
  const t = fold(b?.text);
  return (
    t.includes("idopont") ||
    t.includes("foglal") ||
    t.includes("book") ||
    t.includes("booking") ||
    t.includes("appointment") ||
    t.includes("termin") ||
    t.includes("buch") ||
    t.includes("buchen")
  );
}

/* ────────────────────────────────────────────────────────────────
  Helpers
──────────────────────────────────────────────────────────────── */

function normalizeTeams(input: AboutProps["teams"]): Team[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;

  const data = input?.data ?? [];
  return data.map((x: any) => ({
    id: x.id,
    ...(x.attributes ?? {}),
  }));
}

function perkText(item: Perk) {
  if (!item) return "";
  if (typeof (item as any)?.text === "string") return String((item as any).text);
  if (typeof item === "object") {
    const v = Object.values(item)[0];
    return typeof v === "string" ? v : "";
  }
  return "";
}

function normalizeMedia(media: any) {
  if (!media) return null;
  if (media?.data?.attributes) return { id: media.data.id, ...media.data.attributes };
  if (media?.attributes) return { id: media.id, ...media.attributes };
  return media;
}

function pickStrapiUrl(media: any) {
  if (!media) return "";
  return (
    media?.formats?.large?.url ??
    media?.formats?.medium?.url ??
    media?.formats?.small?.url ??
    media?.url ??
    ""
  );
}

function toAbsoluteUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_API_URL || "";
  return `${base}${url}`;
}

function getAllMediaUrls(media: any): string[] {
  if (!media) return [];
  if (typeof media === "string") return [media];

  const data = media?.data;

  if (Array.isArray(data)) {
    return data
      .map((m: any) => m?.attributes?.url ?? m?.url)
      .filter((u: any) => typeof u === "string");
  }

  if (data && typeof data === "object") {
    const u = data?.attributes?.url ?? data?.url;
    return typeof u === "string" ? [u] : [];
  }

  if (Array.isArray(media)) {
    return media
      .map((m: any) => m?.attributes?.url ?? m?.url)
      .filter((u: any) => typeof u === "string");
  }

  if (typeof media?.url === "string") return [media.url];
  return [];
}

function getSingleMediaUrl(media: any): string {
  const m = normalizeMedia(media);
  const u = pickStrapiUrl(m);
  return u || "";
}

function extractFirstMediaObjectDeep(input: any, maxDepth = 6): any | null {
  if (!input || maxDepth <= 0) return null;

  if (typeof input === "object") {
    if ((input as any)?.url || (input as any)?.formats) return input;
  }

  if (input?.data) return extractFirstMediaObjectDeep(input.data, maxDepth - 1);
  if (input?.attributes) return extractFirstMediaObjectDeep(input.attributes, maxDepth - 1);

  const candidates = ["logo", "image", "media", "icon", "file", "avatar"];
  for (const k of candidates) {
    if (input?.[k]) {
      const found = extractFirstMediaObjectDeep(input[k], maxDepth - 1);
      if (found) return found;
    }
  }

  if (typeof input === "object") {
    for (const v of Object.values(input)) {
      const found = extractFirstMediaObjectDeep(v, maxDepth - 1);
      if (found) return found;
    }
  }

  return null;
}

function getAboutLogoUrl(aboutLogo: any): string {
  const mediaObj = extractFirstMediaObjectDeep(aboutLogo);
  const normalized = normalizeMedia(mediaObj);
  const u = pickStrapiUrl(normalized);
  return u || "";
}

function teamButtons(team?: Team): ButtonData[] {
  const raw = (team as any)?.button;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object") return [raw];
  return [];
}

function resolveHref(locale: Locale, btn?: ButtonData) {
  if (!btn) return "#";
  const path = String(btn.href || btn.URL || "").trim();
  if (!path) return "#";
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized}`.replace(/\/{2,}/g, "/");
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

/* ────────────────────────────────────────────────────────────────
  Team Card – screenshot style, desktop featured layout support
──────────────────────────────────────────────────────────────── */

type CardSize = "featured" | "secondary";

function TeamCard({
  team,
  locale,
  avatarUrl,
  portraitUrl,
  onMore,
  size,
}: {
  team: Team;
  locale: Locale;
  avatarUrl: string;
  portraitUrl: string;
  onMore: () => void;
  size: CardSize;
}) {
  const c = getCopy(locale);

  const btns = teamButtons(team);
  const booking =
    btns.find((b) => isBookingBtn(locale, b)) ??
    btns.find((b) => !isMoreBtn(locale, b)) ??
    btns[0];

  const bookingHref = booking ? resolveHref(locale, booking) : "#";
  const bookingExt = isExternalHref(bookingHref);
  const bookingNewTab =
    booking?.target === "_blank" || booking?.target === true || booking?.newTab === true || bookingExt;

  const bookingLabel = booking?.text ?? c.bookingFallback;

  const clamp3 =
    "overflow-hidden [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]";

  const imgH =
    size === "featured"
      ? "h-[220px] md:h-[250px] lg:h-[360px]"
      : "h-[220px] md:h-[250px] lg:h-[360px]";

  return (
    <motion.div
      className={cn(
        "w-full overflow-hidden rounded-[28px]",
        "border border-neutral-200 bg-white",
        "shadow-[0_18px_60px_rgba(0,0,0,0.10)]"
      )}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      {/* IMAGE */}
      <div className="relative">
        <div className={cn("relative w-full bg-neutral-100", imgH)}>
          {portraitUrl ? (
            <Image
              src={portraitUrl}
              alt={team?.name ?? "Team"}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 92vw, 520px"
            />
          ) : null}
        </div>

        {/* pill badge */}
        {team?.badge_label ? (
          <div
          className={cn(
            "absolute left-4 top-4 inline-flex items-center gap-2",
            "rounded-full px-3 py-1.5",
            "bg-white/85 backdrop-blur-2xl",
            "border border-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.10)]"
          )}
        >
          <span className="h-2 w-2 rounded-full bg-[#057C80]" />
          <span className="text-[13px] font-semibold text-neutral-800">{team.badge_label}</span>
        </div>
        ): null}
      </div>

      {/* BODY */}
      <div className={cn("p-5", size === "featured" ? "lg:p-6" : "lg:p-5")}>
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={team?.name ?? "Avatar"} fill className="object-cover object-top" />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[18px] font-semibold tracking-tight text-neutral-950 truncate">
              {team?.name ?? ""}
            </div>
            <div className="text-[14px] text-neutral-500 truncate">{team?.job ?? ""}</div>
          </div>

          <button
            type="button"
            onClick={onMore}
            aria-label={c.more}
            className={cn(
              "hidden sm:grid",
              "h-12 w-12 place-items-center rounded-full",
              "border border-neutral-200 bg-white",
              "shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
              "hover:bg-neutral-50 transition"
            )}
          >
            <ChevronRight className="h-5 w-5 text-neutral-800" />
          </button>
        </div>

        {team?.short_description ? (
          <p className={cn("mt-4 text-[15px] leading-relaxed text-neutral-700", clamp3)}>
            {team.short_description}
          </p>
        ) : null}

        {/* Bővebben above booking */}
        <button
          type="button"
          onClick={onMore}
          className="mt-4 group inline-flex items-center gap-2 text-sm font-semibold"
          style={{ color: "#057C80" }}
        >
          <span className="border-b border-transparent group-hover:border-black/20 transition">{c.more}</span>
          <ArrowRightIcon className="h-4 w-4 translate-x-0 group-hover:translate-x-0.5 transition" />
        </button>

        {booking ? (
          <div className="mt-3">
            {bookingNewTab ? (
              <a href={bookingHref} target="_blank" rel="noopener" className="inline-block w-full">
                <span
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2",
                    "rounded-xl px-4 py-3 text-[15px] font-semibold",
                    "bg-[#057C80] text-white",
                    "shadow-[0_12px_34px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_44px_rgba(0,0,0,0.14)]",
                    "active:scale-[0.99] transition"
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  {bookingLabel}
                </span>
              </a>
            ) : bookingExt ? (
              <a href={bookingHref} className="inline-block w-full">
                <span
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2",
                    "rounded-xl px-4 py-3 text-[15px] font-semibold",
                    "bg-[#057C80] text-white",
                    "shadow-[0_12px_34px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_44px_rgba(0,0,0,0.14)]",
                    "active:scale-[0.99] transition"
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  {bookingLabel}
                </span>
              </a>
            ) : (
              <Link href={bookingHref} className="inline-block w-full">
                <span
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2",
                    "rounded-xl px-4 py-3 text-[15px] font-semibold",
                    "bg-[#057C80] text-white",
                    "shadow-[0_12px_34px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_44px_rgba(0,0,0,0.14)]",
                    "active:scale-[0.99] transition"
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  {bookingLabel}
                </span>
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────
  Component
──────────────────────────────────────────────────────────────── */

export const About: React.FC<AboutProps> = (props) => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const yHeading = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : -26]);
  const yPanel = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : -44]);

  const heading = props.heading ?? {};
  const list = props.list ?? {};
  const teams = useMemo(() => normalizeTeams(props.teams), [props.teams]);

  const storyTitle =
    (list as any)?.story_title ??
    (list as any)?.storyTitle ??
    (props as any)?.story_title ??
    (props as any)?.storyTitle;

  const storyDescription =
    (list as any)?.story_description ??
    (list as any)?.storyDescription ??
    (props as any)?.story_description ??
    (props as any)?.storyDescription;

  const heroImage = useMemo(() => normalizeMedia(heading.image), [heading.image]);
  const heroSrc = heroImage ? toAbsoluteUrl(pickStrapiUrl(heroImage)) : "";

  const aboutLogoUrl = useMemo(() => {
    const u = getAboutLogoUrl(props.logo);
    return u ? toAbsoluteUrl(u) : "";
  }, [props.logo]);

  // modal
  const [open, setOpen] = useState(false);
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);

  const openMore = (idx: number) => {
    setActiveTeamIndex(idx);
    setOpen(true);
  };
  const close = () => setOpen(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") setActiveTeamIndex((i) => (i - 1 + teams.length) % teams.length);
      if (e.key === "ArrowRight") setActiveTeamIndex((i) => (i + 1) % teams.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, teams.length]);

  const indents = [
    "pl-0 sm:pl-0",
    "pl-3 sm:pl-10",
    "pl-6 sm:pl-20",
    "pl-9 sm:pl-32",
    "pl-12 sm:pl-44",
  ];

  const viewport = { once: true, amount: 0.20, margin: "0px 0px -10% 0px" as const };

  const teamAvatarAbs = (team?: Team) => {
    const u = getSingleMediaUrl((team as any)?.avatar);
    return u ? toAbsoluteUrl(u) : "";
  };

  const teamPortraitAbs = (team?: Team) => {
    const urls = getAllMediaUrls(team?.media);
    const main = urls[0] || "";
    const fallback = getSingleMediaUrl((team as any)?.avatar);
    const finalUrl = main || fallback || "";
    return finalUrl ? toAbsoluteUrl(finalUrl) : "";
  };

  return (
    <>
      <section ref={sectionRef} className={cn("relative isolate pt-28 md:pt-36")}>
        <Container>
          {/* HERO */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={fadeInUp}
            style={{ y: yHeading }}
            className="mt-8"
          >
            {heroImage && heroSrc ? (
              <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100">
                <div className="relative h-[320px] md:h-[420px] w-full">
                  <Image
                    src={heroSrc}
                    alt={heroImage?.alternativeText ?? heading.heading ?? "About image"}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent" />
                  <div className="relative z-10 h-full">
                    <div className="flex h-full items-center">
                      <div className="w-full max-w-xl px-6 py-8 md:px-10 md:py-12">
                        {heading.badge_label && (
                          <div className="mb-3 text-sm text-neutral-900">({heading.badge_label})</div>
                        )}
                        <Heading as="h2" className={cn("text-left", t.heading)}>
                          {heading.heading ?? "Ismerd meg csapatunkat"}
                        </Heading>
                        {heading.sub_heading && (
                          <Subheading className={cn("max-w-xl pt-6", t.sub)}>{heading.sub_heading}</Subheading>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>

          {/* BIG DESCRIPTION */}
          {heading.description && (
            <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={fadeInUp} style={{ y: yHeading }}>
              <p className="mt-10 lg:mt-16 text-2xl md:text-4xl text-neutral-600 leading-tight tracking-tight">
                {heading.description}
              </p>
            </motion.div>
          )}

          {/* LIST + STORY + TEAM wrapper */}
          <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={fadeIn} style={{ y: yPanel }} className="mt-10 lg:mt-20">
            <div className="grid grid-cols-1 gap-12">
              {/* LIST + STORY */}
              <div>
                <div className="grid grid-cols-12 gap-4 md:gap-10 items-start">
                  <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={fadeInUp} className="col-span-12 sm:col-span-3">
                    {list.list_title && (
                      <h3 className="text-xl md:text-3xl font-normal text-neutral-950 tracking-tight">
                        {list.list_title}
                      </h3>
                    )}
                  </motion.div>

                  <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={fadeInUp} className="col-span-12 sm:col-span-9 min-w-0">
                    {!!list.span?.length && (
                      <ul className="space-y-4">
                        {list.span.map((p, idx) => {
                          const text = perkText(p);
                          if (!text) return null;
                          const indentClass = indents[Math.min(idx, indents.length - 1)];
                          return (
                            <li key={(p as any)?.id ?? idx} className={cn("flex items-center min-w-0", indentClass)}>
                              <div className="h-px flex-1 bg-neutral-200" />
                              <span className="ml-3 sm:ml-4 shrink-0 bg-white pl-3 sm:pl-4 text-md md:text-2xl text-neutral-900 break-words">
                                {text}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </motion.div>
                </div>

                {(storyTitle || storyDescription) && (
                  <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={fadeInUp} className="mt-12">
                    {aboutLogoUrl ? (
                      <div className="flex justify-end shrink-0 my-10">
                        <div className="relative h-14 w-14 overflow-hidden">
                          <Image src={aboutLogoUrl} alt="Logo" fill className="object-contain p-2" />
                        </div>
                      </div>
                    ) : null}

                    {storyTitle && <h4 className="text-xl md:text-3xl text-neutral-950 my-10">{storyTitle}</h4>}

                    {storyDescription && (
                      <p className="mt-3 text-lg md:text-2xl text-neutral-700 whitespace-pre-line leading-relaxed">
                        {storyDescription}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>

              {/* TEAM – desktop: featured+secondary, mobile: 1 col */}
              <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={fadeInUp}>
                {!teams.length ? (
                  <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
                    Nincs még csapattag kiválasztva ehhez a blokkjhoz.
                  </div>
                ) : teams.length === 2 ? (
                  <div className="mx-auto  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    {teams.map((team, idx) => {
                      const isFirst = idx === 0;
                      return (
                        <div
                          key={team.id}
                          className={cn(
                            "w-full",
                            "flex justify-center lg:justify-start",
                            isFirst ? "lg:col-span-6 lg:pr-2" : "lg:col-span-6  "
                          )}
                        >
                          <TeamCard
                            team={team}
                            locale={props.locale}
                            avatarUrl={teamAvatarAbs(team)}
                            portraitUrl={teamPortraitAbs(team)}
                            onMore={() => openMore(idx)}
                            size="featured"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mx-auto  grid grid-cols-1 md:grid-cols-2 gap-6 place-items-center">
                    {teams.map((team, idx) => (
                      <div key={team.id} className="w-full flex justify-center">
                        <TeamCard
                          team={team}
                          locale={props.locale}
                          avatarUrl={teamAvatarAbs(team)}
                          portraitUrl={teamPortraitAbs(team)}
                          onMore={() => openMore(idx)}
                          size="featured"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </Container>
      </section>

      <TeamModal
        open={open}
        onClose={close}
        locale={props.locale}
        teams={teams}
        activeIndex={activeTeamIndex}
        setActiveIndex={setActiveTeamIndex}
      />
    </>
  );
};
