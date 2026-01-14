"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { ArrowRightIcon } from "lucide-react";

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
// Strapi Rich Text (Blocks) – minimál, de típusos
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
  long_description?: RichTextBlocks; // ✅ Rich text (Blocks)

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

// About.logo = relation to Logos (CT)
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

/* ────────────────────────────────────────────────────────────────────────────
  Tokens / Anim
────────────────────────────────────────────────────────────────────────────── */

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

/* ────────────────────────────────────────────────────────────────────────────
  Helpers
────────────────────────────────────────────────────────────────────────────── */

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
    if (input?.url || input?.formats) return input;
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

function isMoreBtn(b?: ButtonData) {
  return (b?.text ?? "").toLowerCase().includes("bővebben");
}
function isBookingBtn(b?: ButtonData) {
  const tt = (b?.text ?? "").toLowerCase();
  return tt.includes("időpont") || tt.includes("foglal");
}

/* ────────────────────────────────────────────────────────────────────────────
  Slider Motion
────────────────────────────────────────────────────────────────────────────── */

const slide = {
  initial: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? 24 : -24,
    scale: 0.985,
    filter: "blur(6px)",
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 420, damping: 38, mass: 0.9 },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -24 : 24,
    scale: 0.985,
    filter: "blur(6px)",
    transition: { duration: 0.18 },
  }),
};

/* ────────────────────────────────────────────────────────────────────────────
  Component
────────────────────────────────────────────────────────────────────────────── */

export const About: React.FC<AboutProps> = (props) => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const prefersReduced = useReducedMotion();

  // csak finom parallax (nem “minden egyszerre jön be”)
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

  // slider + modal
  const [open, setOpen] = useState(false);
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const activeTeam = teams[activeTeamIndex];

  const goPrev = () => {
    if (!teams.length) return;
    setDirection(-1);
    setActiveTeamIndex((i) => (i - 1 + teams.length) % teams.length);
  };

  const goNext = () => {
    if (!teams.length) return;
    setDirection(1);
    setActiveTeamIndex((i) => (i + 1) % teams.length);
  };

  const openMore = () => setOpen(true);
  const close = () => setOpen(false);

  // ESC close + keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open && e.key === "Escape") close();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teams.length]);

  // booking button (a sliderben)
  const booking = useMemo(() => {
    const btns = teamButtons(activeTeam);
    return btns.find(isBookingBtn) ?? btns.find((b) => !isMoreBtn(b)) ?? btns[0];
  }, [activeTeam]);

  const bookingHref = booking ? resolveHref(props.locale, booking) : "#";
  const bookingExt = isExternalHref(bookingHref);
  const bookingNewTab =
    booking?.target === "_blank" || booking?.target === true || booking?.newTab === true || bookingExt;

  const avatarUrl = useMemo(() => {
    const u = getSingleMediaUrl((activeTeam as any)?.avatar);
    return u ? toAbsoluteUrl(u) : "";
  }, [activeTeam]);

  const portraitUrl = useMemo(() => {
    const urls = getAllMediaUrls(activeTeam?.media);
    const main = urls[0] || "";
    const fallback = getSingleMediaUrl((activeTeam as any)?.avatar);
    const finalUrl = main || fallback || "";
    return finalUrl ? toAbsoluteUrl(finalUrl) : "";
  }, [activeTeam]);

  // ✅ MOBILE SAFE INDENTS (behúzás megmarad, csak kisebb lépcsők mobilon)
  const indents = [
    "pl-0 sm:pl-0",
    "pl-3 sm:pl-10",
    "pl-6 sm:pl-20",
    "pl-9 sm:pl-32",
    "pl-12 sm:pl-44",
  ];

  // viewport anim beállítás (minden blokk akkor jön, amikor odaérsz)
  const viewport = { once: true, amount: 0.28, margin: "0px 0px -10% 0px" as const };

  return (
    <>
      <section ref={sectionRef} className={cn("relative isolate pt-28 md:pt-36")}>
        <Container>
          {/* HERO – külön anim (nem függ a többiektől) */}
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
                          <Subheading className={cn("max-w-xl pt-6", t.sub)}>
                            {heading.sub_heading}
                          </Subheading>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>

          {/* BIG DESCRIPTION – külön anim */}
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
                {/* ✅ MOBILE FIX: col-span-12 mobilon, sm-től osztjuk csak ketté */}
                <div className="grid grid-cols-12 gap-4 md:gap-10 items-start">
                  <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={fadeInUp} className="col-span-12 sm:col-span-3">
                    {list.list_title && (
                      <h3 className="text-base text-xl md:text-3xl font-normal text-neutral-950 tracking-tight">
                        {list.list_title}
                      </h3>
                    )}
                  </motion.div>

                  <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={viewport}
                    variants={fadeInUp}
                    className="col-span-12 sm:col-span-9 min-w-0"
                  >
                    {!!list.span?.length && (
                      <ul className="space-y-4">
                        {list.span.map((p, idx) => {
                          const text = perkText(p);
                          if (!text) return null;

                          const indentClass = indents[Math.min(idx, indents.length - 1)];

                          return (
                            <li
                              key={(p as any)?.id ?? idx}
                              className={cn("flex items-center min-w-0", indentClass)}
                            >
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
                    <div className="gap-6">
                      <div className="min-w-0">
                        {aboutLogoUrl ? (
                          <div className="flex justify-end shrink-0 my-10">
                            <div className="relative h-14 w-14 overflow-hidden">
                              <Image src={aboutLogoUrl} alt="Logo" fill className="object-contain p-2" />
                            </div>
                          </div>
                        ) : null}

                        {storyTitle && <h4 className="text-xl md:text-3xl text-neutral-950 my-10">{storyTitle}</h4>}
                      </div>
                    </div>

                    {storyDescription && (
                      <p className="mt-3 text-lg md:text-2xl text-neutral-700 whitespace-pre-line leading-relaxed">
                        {storyDescription}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>

              {/* TEAM SLIDER */}
              <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={fadeInUp}>
                {!teams.length ? (
                  <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
                    Nincs még csapattag kiválasztva ehhez a blokkjhoz.
                  </div>
                ) : (
                  <div className="relative">
                    <AnimatePresence mode="wait" custom={direction}>
                      <motion.div
                        key={activeTeam?.id}
                        custom={direction}
                        variants={slide}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className={cn(
                          "relative rounded-xl border border-neutral-200/70",
                          "bg-white/70 supports-[backdrop-filter]:bg-white/55 backdrop-blur-xl",
                          "shadow-[0_20px_70px_rgba(0,0,0,0.10)] ring-1 ring-inset ring-white/60"
                        )}
                        whileHover={{ y: prefersReduced ? 0 : -2, scale: prefersReduced ? 1 : 1.002 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      >
                        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/80 via-white/25 to-transparent" />
                        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-black/5" />

                        <div className="relative p-6 md:p-8">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            {/* LEFT */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-4">
                                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 shadow-sm ring-1 ring-inset ring-white/60">
                                  {avatarUrl ? (
                                    <Image
                                      src={avatarUrl}
                                      alt={activeTeam?.name ?? "Team"}
                                      fill
                                      className="object-cover object-top"
                                      priority
                                    />
                                  ) : null}
                                </div>

                                <div className="min-w-0">
                                  <div className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-950 truncate">
                                    {activeTeam?.name ?? "Name"}
                                  </div>
                                  <div className="text-sm md:text-base text-neutral-500 truncate">
                                    {activeTeam?.job ?? ""}
                                  </div>
                                </div>
                              </div>

                              <p className="mt-5 text-sm md:text-base text-neutral-700 leading-relaxed whitespace-pre-line max-w-2xl">
                                {activeTeam?.short_description ?? ""}
                              </p>

                              <div className="mt-6 flex flex-col gap-3 max-w-xs">
                                <button
                                  type="button"
                                  onClick={openMore}
                                  className="group inline-flex items-center gap-2 text-sm font-semibold"
                                  style={{ color: "#057C80" }}
                                >
                                  <span className="border-b border-transparent group-hover:border-black/20 transition">
                                    Bővebben
                                  </span>
                                  <ArrowRightIcon className="h-4 w-4 translate-x-0 group-hover:translate-x-0.5 transition" />
                                </button>

                                <div>
                                  {booking ? (
                                    bookingNewTab ? (
                                      <a
                                        href={bookingHref}
                                        target="_blank"
                                        rel="noopener"
                                        className={cn(
                                          "inline-flex w-full items-center justify-center",
                                          "rounded-lg px-5 py-3 text-sm md:text-base font-semibold",
                                          "bg-[#057C80] text-white",
                                          "shadow-[0_10px_30px_rgba(0,0,0,0.10)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)]",
                                          "active:scale-[0.99] transition"
                                        )}
                                      >
                                        {booking.text ?? "Időpontfoglalás"}
                                      </a>
                                    ) : (
                                      <a
                                        href={bookingHref}
                                        className={cn(
                                          "inline-flex w-full items-center justify-center",
                                          "rounded-lg px-5 py-3 text-sm md:text-base font-semibold",
                                          "bg-[#057C80] text-white",
                                          "shadow-[0_10px_30px_rgba(0,0,0,0.10)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)]",
                                          "active:scale-[0.99] transition"
                                        )}
                                      >
                                        {booking.text ?? "Időpontfoglalás"}
                                      </a>
                                    )
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {/* RIGHT portrait */}
                            <div className="shrink-0">
                              <div className="relative h-[140px] w-[140px] md:h-[250px] md:w-[250px] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 shadow-sm ring-1 ring-inset ring-white/70">
                                {portraitUrl ? (
                                  <Image
                                    src={portraitUrl}
                                    alt={activeTeam?.name ?? "Team"}
                                    fill
                                    className="object-cover object-top"
                                    priority
                                  />
                                ) : null}
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                              </div>
                            </div>
                          </div>

                          {/* footer */}
                          <div className="mt-7 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {teams.map((_, i) => {
                                const active = i === activeTeamIndex;
                                return (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                      if (i === activeTeamIndex) return;
                                      setDirection(i > activeTeamIndex ? 1 : -1);
                                      setActiveTeamIndex(i);
                                    }}
                                    aria-label={`Ugrás a(z) ${i + 1}. csapattagra`}
                                    className={cn(
                                      "relative h-2 rounded-full transition-all",
                                      active ? "w-7 bg-neutral-900" : "w-2 bg-neutral-300 hover:bg-neutral-400"
                                    )}
                                  />
                                );
                              })}
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={goPrev}
                                className="grid h-11 w-11 place-items-center rounded-full border border-neutral-200/70 bg-white/70 backdrop-blur hover:bg-white active:scale-[0.97] transition"
                                aria-label="Előző"
                              >
                                <IconChevronLeft className="h-5 w-5 text-neutral-800" />
                              </button>
                              <button
                                type="button"
                                onClick={goNext}
                                className="grid h-11 w-11 place-items-center rounded-full border border-neutral-200/70 bg-white/70 backdrop-blur hover:bg-white active:scale-[0.97] transition"
                                aria-label="Következő"
                              >
                                <IconChevronRight className="h-5 w-5 text-neutral-800" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Modal */}
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
