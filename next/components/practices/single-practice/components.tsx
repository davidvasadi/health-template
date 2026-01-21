"use client";

import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Link } from "next-view-transitions";
import { Button } from "@/components/elements/button";
import { cn } from "@/lib/utils";
import { StrapiImage } from "@/components/ui/strapi-image";
import {
  IconPlayerPlayFilled,
  IconCheck,
  IconShare2,
  IconClock,
  IconGauge,
  IconTools,
  IconTag,
  IconAlertTriangleFilled,
  IconCircleCheckFilled,
  IconCalendarEvent,
} from "@tabler/icons-react";

import { absUrl, unwrapSingleMedia } from "./strapi";
import {
  BRAND,
  focusRing,
  overlayGradient,
  softCard,
  mediaFrame,
  metaRow,
  radiusCard,
} from "./tokens";
import { mediaKind, resolvePosterUrl, resolveThumbForMedia } from "./media";
import { difficultyTone } from "./cards";
import { Blocks } from "./blocks";

/* ───────────────────────────────────────────────────────────────
  CategoryChipsRow (mobile under hero, hide on play)
─────────────────────────────────────────────────────────────── */

export function CategoryChipsRow({
  categories,
  hidden,
  variant = "mobile",
}: {
  categories: string[];
  hidden: boolean;
  variant?: "mobile" | "desktop";
}) {
  const reduce = useReducedMotion();
  const show = categories?.length > 0 && !hidden;

  const base =
    variant === "mobile"
      ? "lg:hidden flex items-center gap-2 overflow-x-auto hide-scrollbar whitespace-nowrap"
      : "hidden lg:flex items-center gap-2 flex-wrap";

  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.div
          key="chips"
          className={cn(base)}
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {categories.slice(0, 8).map((c) => (
            <span
              key={c}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5",
                "rounded-full border border-black/10 bg-white",
                "px-3 py-1 text-[12px] font-semibold text-neutral-900",
                "shadow-sm"
              )}
            >
              <IconTag className="h-4 w-4 text-[rgba(5,124,128,1)]" />
              {c}
            </span>
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ───────────────────────────────────────────────────────────────
  HeroMedia
  FIX:
  - video controls usable: all passive overlays pointer-events-none
  - video title only in pre-play overlay state (isOverlay===true)
  - chips on desktop also don't block taps
─────────────────────────────────────────────────────────────── */

export function HeroMedia({
  practice,
  active,
  title,
  categories,
  onPlayingChange,
}: {
  practice: any;
  active: any;
  title: string;
  categories: string[];
  onPlayingChange?: (playing: boolean) => void;
}) {
  const kind = mediaKind(active);
  const posterUrl = useMemo(
    () => resolvePosterUrl(practice, active),
    [practice, active]
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // video pre-play overlay state
  const [isOverlay, setIsOverlay] = useState(kind === "video");
  const [playing, setPlaying] = useState(false);

  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    setIsOverlay(kind === "video");
    setPlaying(false);
    onPlayingChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, active?.id]);

  const startVideo = useCallback(async () => {
    // user intent: start -> remove overlay, allow controls
    setIsOverlay(false);
    setPlaying(true);
    onPlayingChange?.(true);
    try {
      await videoRef.current?.play();
    } catch {
      // ignore
    }
  }, [onPlayingChange]);

  // Passive title overlay should NEVER block taps
  const titleOverlay = (
    <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6 pointer-events-none">
      <div
        className={cn(
          "inline-block max-w-[920px]",
          "rounded-2xl px-4 py-3 sm:px-5 sm:py-4",
          "bg-black/28 backdrop-blur-sm border border-white/10"
        )}
      >
        <div
          className="text-white font-extrabold tracking-tight leading-[1.05] text-3xl sm:text-4xl lg:text-5xl line-clamp-2"
          style={{ textShadow: "0 10px 30px rgba(0,0,0,0.55)" }}
        >
          {title}
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn(mediaFrame, "relative")}>
      <div className="relative aspect-[16/9] w-full">
        {!active ? (
          <div className="absolute inset-0 bg-white grid place-items-center">
            <div className="text-sm font-semibold text-neutral-900">
              Nincs média
            </div>
          </div>
        ) : null}

        {active && kind === "image" ? (
          <>
            <StrapiImage
              src={absUrl(active.url)}
              alt={active?.alternativeText || title}
              width={1800}
              height={1100}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />

            {/* ✅ passive overlay: never blocks taps */}
            <div
              className={cn("absolute inset-0 pointer-events-none", overlayGradient)}
            />

            {/* desktop chips can be on hero, but must not block taps */}
            <div className="hidden lg:block absolute left-6 top-6 right-6 pointer-events-none">
              <CategoryChipsRow
                categories={categories}
                hidden={false}
                variant="desktop"
              />
            </div>

            {titleOverlay}
          </>
        ) : null}

        {active && kind === "video" ? (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-fit"
              playsInline
              preload="metadata"
              poster={posterUrl || "https://csontkovacsbence.hu/uploads/logo_018c92a763.svg"}
              src={absUrl(active.url)}
              // controls MUST be available after starting
              controls={!isOverlay}
              onPlay={() => {
                setIsOverlay(false);
                setPlaying(true);
                onPlayingChange?.(true);
              }}
              onPause={() => {
                // paused: still allow controls show/hide, chips stay hidden
                setPlaying(false);
                onPlayingChange?.(false);
              }}
              onEnded={() => {
                setPlaying(false);
                onPlayingChange?.(false);
              }}
            />

            {/* ✅ passive overlay: never blocks taps (fixes toolbar usability) */}
            <div
              className={cn("absolute inset-0 pointer-events-none", overlayGradient)}
            />

            {/* desktop chips: hide when playing OR after started; also pointer-events-none */}
            <div className="hidden lg:block absolute left-6 top-6 right-6 pointer-events-none">
              <CategoryChipsRow
                categories={categories}
                hidden={playing || !isOverlay}
                variant="desktop"
              />
            </div>

            {/* ✅ TITLE: only pre-play overlay state.
                After start it NEVER comes back (so it won't cover controls). */}
            <AnimatePresence initial={false}>
              {isOverlay ? (
                <motion.div
                  key="heroTitle"
                  initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {titleOverlay}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* pre-play click overlay */}
            {isOverlay ? (
              <button
                type="button"
                onClick={startVideo}
                className={cn(
                  "absolute inset-0 z-10 grid place-items-center",
                  focusRing
                )}
                aria-label="Lejátszás"
              >
                <div
                  className={cn(
                    "h-20 w-20 rounded-full grid place-items-center",
                    "shadow-[0_22px_70px_rgba(0,0,0,0.35)]",
                    "border border-white/18 backdrop-blur-sm"
                  )}
                  style={{ backgroundColor: "rgba(5,124,128,0.92)" }}
                >
                  <IconPlayerPlayFilled className="h-10 w-10 text-white translate-x-[1px]" />
                </div>
              </button>
            ) : null}
          </>
        ) : null}

        {active && kind !== "image" && kind !== "video" ? (
          <div className="absolute inset-0 bg-white p-6">
            <div className="text-sm font-semibold text-neutral-900">Fájl</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
  PracticeStatsRows (shared)
─────────────────────────────────────────────────────────────── */

function PracticeStatsRows({
  duration,
  difficulty,
  type,
}: {
  duration?: { label: string; value: string };
  difficulty?: { label: string; value: string };
  type?: { label: string; value: string };
}) {
  const diffTone = useMemo(
    () => difficultyTone(difficulty?.value),
    [difficulty?.value]
  );

  return (
    <div className="mt-3 space-y-2.5">
      {duration?.value ? (
        <div className={metaRow}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-[rgba(5,124,128,0.10)] flex items-center justify-center border border-black/5">
              <IconClock className="h-5 w-5 text-[rgba(5,124,128,1)]" />
            </div>
            <div className="text-sm font-medium text-neutral-700">
              {duration.label}
            </div>
          </div>
          <div className="text-sm font-semibold text-neutral-900 tabular-nums">
            {duration.value}
          </div>
        </div>
      ) : null}

      {difficulty?.value ? (
        <div className={metaRow}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-9 w-9 rounded-2xl flex items-center justify-center border",
                diffTone.chip
              )}
            >
              <IconGauge className={cn("h-5 w-5", diffTone.icon)} />
            </div>
            <div className="text-sm font-medium text-neutral-700">
              {difficulty.label}
            </div>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border",
              diffTone.chip
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", diffTone.dot)} />
            {difficulty.value}
          </span>
        </div>
      ) : null}

      {type?.value ? (
        <div className={metaRow}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-[rgba(5,124,128,0.10)] flex items-center justify-center border border-black/5">
              <IconTools className="h-5 w-5 text-[rgba(5,124,128,1)]" />
            </div>
            <div className="text-sm font-medium text-neutral-700">
              {type.label}
            </div>
          </div>
          <div className="text-sm font-semibold text-neutral-900">
            {type.value}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
  PracticeStatsCard
─────────────────────────────────────────────────────────────── */

export function PracticeStatsCard({
  title,
  duration,
  difficulty,
  type,
}: {
  title: string;
  duration?: { label: string; value: string };
  difficulty?: { label: string; value: string };
  type?: { label: string; value: string };
}) {
  return (
    <div className={cn(softCard, "p-5")}>
      <div className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
        {title}
      </div>
      <PracticeStatsRows duration={duration} difficulty={difficulty} type={type} />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
  CTAGroup (wrap optional)
─────────────────────────────────────────────────────────────── */

export function CTAGroup({
  primaryHref,
  primaryText,
  shareLabel,
  onShare,
  wrap = true,
}: {
  primaryHref: string;
  primaryText: string;
  shareLabel: string;
  onShare: () => void;
  wrap?: boolean;
}) {
  const inner = (
    <div className="flex items-stretch gap-2">
      <Button
        as={Link}
        href={(primaryHref || "/") as never}
        className={cn(
          "flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white",
          "shadow-[0_18px_45px_rgba(5,124,128,0.22)]",
          "transition active:translate-y-[1px]",
          focusRing
        )}
        style={{ backgroundColor: BRAND }}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <IconCalendarEvent className="h-5 w-5" />
          {primaryText}
        </span>
      </Button>

      <button
        type="button"
        onClick={onShare}
        className={cn(
          "shrink-0 w-12 rounded-2xl border border-black/10 bg-white",
          "grid place-items-center text-neutral-900 hover:bg-neutral-50 transition",
          "shadow-sm",
          focusRing
        )}
        aria-label={shareLabel}
        title={shareLabel}
      >
        <IconShare2 className="h-5 w-5" />
      </button>
    </div>
  );

  if (!wrap) return inner;
  return <div className={cn(softCard, "p-4")}>{inner}</div>;
}

/* ───────────────────────────────────────────────────────────────
  MobileStatsCtaStack (ONE card: stats + divider + CTA)
─────────────────────────────────────────────────────────────── */

export function MobileStatsCtaStack({
  title,
  duration,
  difficulty,
  type,
  primaryHref,
  primaryText,
  shareLabel,
  onShare,
}: {
  title: string;
  duration?: { label: string; value: string };
  difficulty?: { label: string; value: string };
  type?: { label: string; value: string };
  primaryHref: string;
  primaryText: string;
  shareLabel: string;
  onShare: () => void;
}) {
  return (
    <div className={cn(softCard, "p-5")}>
      <div className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
        {title}
      </div>

      <PracticeStatsRows duration={duration} difficulty={difficulty} type={type} />

      <div className="mt-4 h-px bg-black/5" />

      <div className="mt-4">
        <CTAGroup
          primaryHref={primaryHref}
          primaryText={primaryText}
          shareLabel={shareLabel}
          onShare={onShare}
          wrap={false}
        />
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
  MediaGallery (no overlay text; play only; subtle selected)
─────────────────────────────────────────────────────────────── */

export function MediaGallery({
  title,
  media,
  practice,
  activeIndex,
  onSelect,
}: {
  title: string;
  media: any[];
  practice: any;
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  if (!media?.length || media.length <= 1) return null;

  return (
    <div className={cn(softCard, "p-5")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-neutral-900">{title}</div>
        <div className="text-xs font-medium text-neutral-500 tabular-nums">
          {media.length}
        </div>
      </div>

      <div className="mt-3 -mx-1 px-1">
        <div
          className={cn(
            "flex gap-2 overflow-x-auto hide-scrollbar pb-1",
            "lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0"
          )}
        >
          {media.map((m: any, i: number) => {
            const k = mediaKind(m);
            const isActive = i === activeIndex;
            const thumb = resolveThumbForMedia(practice, m);

            return (
              <button
                key={m?.id ?? i}
                type="button"
                onClick={() => onSelect(i)}
                className={cn(
                  "relative overflow-hidden border transition",
                  radiusCard,
                  "shrink-0 w-32 aspect-[16/10] lg:w-auto lg:aspect-[16/11]",
                  isActive
                    ? "border-[rgba(5,124,128,0.45)] shadow-sm"
                    : "border-black/10 hover:border-black/20"
                )}
                aria-label={`Media ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumb || "/logo.svg"}
                  alt={m?.alternativeText || m?.name || `Media ${i + 1}`}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />

                {k === "video" ? (
                  <div className="absolute inset-0 grid place-items-center pointer-events-none">
                    <div className="h-10 w-10 rounded-full bg-black/45 backdrop-blur border border-white/20 grid place-items-center">
                      <IconPlayerPlayFilled className="h-6 w-6 text-white translate-x-[1px]" />
                    </div>
                  </div>
                ) : null}

                {isActive ? (
                  <div className="absolute top-2 right-2 pointer-events-none">
                    <div className="h-6 w-6 rounded-full bg-white/92 backdrop-blur border border-black/10 grid place-items-center shadow-sm">
                      <IconCheck className="h-4 w-4 text-[rgba(5,124,128,1)]" />
                    </div>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
  ProDescriptionCard (read more/less; separate card)
─────────────────────────────────────────────────────────────── */

export function ProDescriptionCard({
  title,
  content,
  moreLabel = "Tovább",
  lessLabel = "Kevesebb",
  collapsedHeight = 240,
}: {
  title: string;
  content: any;
  moreLabel?: string;
  lessLabel?: string;
  collapsedHeight?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [canToggle, setCanToggle] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = el.scrollHeight;
    setCanToggle(h > collapsedHeight + 20);
  }, [content, collapsedHeight]);

  return (
    <div className={cn(softCard, "p-5")}>
      <div className="text-lg font-semibold tracking-tight text-neutral-900">
        {title}
      </div>

      <div className="mt-3 relative">
        <div
          ref={ref}
          style={!expanded ? { maxHeight: collapsedHeight } : undefined}
          className={cn(
            "prose prose-neutral max-w-none prose-p:leading-7 prose-p:text-[15px]",
            !expanded ? "overflow-hidden" : ""
          )}
        >
          <Blocks content={content} />
        </div>

        {!expanded && canToggle ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-white/0" />
        ) : null}
      </div>

      {canToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "mt-3 inline-flex items-center justify-center",
            "rounded-full px-4 py-2 text-sm font-semibold",
            "border border-black/10 bg-white hover:bg-neutral-50 transition",
            focusRing
          )}
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      ) : null}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
  StepsCard (modern stepper; separate card)
─────────────────────────────────────────────────────────────── */

function stepsToArray(steps: any): string[] {
  if (!steps) return [];

  if (typeof steps === "string") {
    return steps
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 24);
  }

  if (Array.isArray(steps)) {
    const out: string[] = [];
    for (const b of steps) {
      if (b?.type === "list") {
        for (const li of b?.children ?? []) {
          const t =
            (li?.children ?? [])
              .map((c: any) => c?.text)
              .filter(Boolean)
              .join("")
              .trim() || "";
          if (t) out.push(t);
        }
      }
    }
    return out.slice(0, 24);
  }

  return [];
}

export function StepsCard({ title, steps }: { title: string; steps: any }) {
  const items = useMemo(() => stepsToArray(steps), [steps]);

  return (
    <div className={cn(softCard, "p-5")}>
      <div className="text-lg font-semibold tracking-tight text-neutral-900">
        {title}
      </div>

      {items.length ? (
        <ol className="mt-4 relative">
          <div className="absolute left-[14px] top-1 bottom-1 w-px bg-black/10" />
          <div className="space-y-4">
            {items.map((txt, idx) => (
              <li key={idx} className="relative pl-10">
                <div
                  className={cn(
                    "absolute left-0 top-0",
                    "h-7 w-7 rounded-full grid place-items-center",
                    "border border-black/10 bg-white shadow-sm"
                  )}
                >
                  <span className="text-xs font-bold text-[rgba(5,124,128,1)] tabular-nums">
                    {idx + 1}
                  </span>
                </div>
                <div className="text-[15px] leading-7 text-neutral-800">
                  {txt}
                </div>
              </li>
            ))}
          </div>
        </ol>
      ) : (
        <div className="mt-3 prose prose-neutral max-w-none">
          <Blocks content={steps} />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
  PractitionerCard (object-top + verified/accent)
─────────────────────────────────────────────────────────────── */

function initials(name?: string) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return "•";
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

export function PractitionerCard({
  avatar,
  name,
  role,
  verified = true,
}: {
  avatar?: any;
  name?: string;
  role?: string;
  verified?: boolean;
}) {
  const img = unwrapSingleMedia(avatar);
  if (!name && !role && !img) return null;

  return (
    <div className={cn(softCard, "p-4 overflow-hidden relative")}>
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: BRAND }}
      />
      <div className="flex items-center gap-3 pl-2">
        <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-black/5 bg-neutral-50 flex items-center justify-center">
          {img?.url ? (
            <StrapiImage
              src={absUrl(img.url)}
              alt={img?.alternativeText || name || "Avatar"}
              width={96}
              height={96}
              className="h-full w-full object-cover object-top"
              loading="lazy"
            />
          ) : (
            <div className="text-sm font-semibold text-neutral-700">
              {initials(name)}
            </div>
          )}

          {verified ? (
            <div className="absolute -right-1 -bottom-1 h-6 w-6 rounded-full bg-white border border-black/10 grid place-items-center shadow-sm">
              <IconCircleCheckFilled className="h-4 w-4 text-[rgba(5,124,128,1)]" />
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          {name ? (
            <div className="text-sm font-semibold text-neutral-900 truncate">
              {name}
            </div>
          ) : null}
          {role ? (
            <div className="text-xs font-medium text-neutral-600 truncate">
              {role}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
  ImportantCallout
  FIX:
  - do NOT prefix anything (text is from Strapi, locale-aware)
  - only cleanup whitespace + remove wrapping quotes
─────────────────────────────────────────────────────────────── */

function cleanImportant(text: string) {
  let s = String(text ?? "").trim();
  if (!s) return "";
  // strip wrapping quotes (", “ ”)
  s = s.replace(/^[“"'\s]+/, "").replace(/[”"'\s]+$/, "");
  // normalize whitespace
  s = s.replace(/\s+/g, " ");
  return s;
}

export function ImportantCallout({
  label,
  text,
}: {
  label: string;
  text?: string;
}) {
  if (!text) return null;
  const body = cleanImportant(text);
  if (!body) return null;

  return (
    <div
      className={cn(
        radiusCard,
        "border border-amber-200/70 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,247,237,0.86))]",
        "shadow-[0_12px_30px_rgba(15,23,42,0.08)] overflow-hidden"
      )}
    >
      <div className="flex gap-3 p-4">
        <div className="h-10 w-10 rounded-2xl bg-amber-100 border border-amber-200 grid place-items-center shrink-0">
          <IconAlertTriangleFilled className="h-5 w-5 text-amber-800" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-wide text-amber-900 uppercase">
            {label}
          </div>
          <div className="mt-1 text-sm font-medium text-amber-950/90 leading-relaxed text-left">
            {body}
          </div>
        </div>
      </div>
    </div>
  );
}
