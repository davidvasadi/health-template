"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";
import { Button as UIButton } from "@/components/elements/button";
import { cn } from "@/lib/utils";
import { StrapiImage } from "@/components/ui/strapi-image";
import { Calendar } from "lucide-react";

import type { ButtonData, Locale, Team } from "./about";

/* ──────────────────────────────────────────────────────────────
  Rich text (Blocks) types
────────────────────────────────────────────────────────────── */

type RichTextNode = {
  type?: string;
  children?: Array<{ text?: string } & Record<string, any>>;
} & Record<string, any>;

type RichTextBlocks = RichTextNode[];

/* ──────────────────────────────────────────────────────────────
  Helpers
────────────────────────────────────────────────────────────── */

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

// multiple media -> url[]
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

// single media -> url (avatar-hoz)
function getSingleMediaUrl(media: any): string | "" {
  if (!media) return "";
  if (typeof media === "string") return media;

  const data = media?.data;

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const u = data?.attributes?.url ?? data?.url;
    return typeof u === "string" ? u : "";
  }

  const u = media?.attributes?.url ?? media?.url;
  return typeof u === "string" ? u : "";
}

function teamButtons(team?: Team): ButtonData[] {
  const raw = (team as any)?.button;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object") return [raw];
  return [];
}

function isMoreBtn(b?: ButtonData) {
  return (b?.text ?? "").toLowerCase().includes("bővebben");
}

function isBookingBtn(b?: ButtonData) {
  const t = (b?.text ?? "").toLowerCase();
  return t.includes("időpont") || t.includes("foglal");
}

// Rich text blocks -> plain text (gyors, SEO-safe, nincs HTML)
function richTextToPlainText(blocks?: RichTextBlocks): string {
  if (!blocks?.length) return "";

  const lines: string[] = [];

  for (const block of blocks) {
    const children = (block as any)?.children;
    if (Array.isArray(children)) {
      const text = children.map((c: any) => c?.text ?? "").join("");
      if (text.trim()) lines.push(text.trim());
    }
  }

  return lines.join("\n\n");
}

/* ──────────────────────────────────────────────────────────────
  UI bits
────────────────────────────────────────────────────────────── */

function Dots({
  count,
  active,
  onSelect,
}: {
  count: number;
  active: number;
  onSelect: (idx: number) => void;
}) {
  if (count <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Kép: ${i + 1}`}
          className={cn(
            "grid place-items-center rounded-full transition",
            "focus:outline-none focus:ring-2 focus:ring-neutral-300/80",
            "h-4 w-4 hover:bg-neutral-100/70"
          )}
        >
          <span
            className={cn(
              "block h-2 rounded-full transition-all",
              i === active ? "w-6 bg-neutral-900" : "w-2 bg-neutral-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

const tok = {
  modal:
    "rounded-[28px] bg-white shadow-[0_20px_80px_rgba(0,0,0,0.22)] border border-neutral-200/60",
};

/* ──────────────────────────────────────────────────────────────
  TeamModal
────────────────────────────────────────────────────────────── */

export const TeamModal: React.FC<{
  open: boolean;
  onClose: () => void;
  locale: Locale;
  teams: Team[];
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
}> = ({ open, onClose, locale, teams, activeIndex, setActiveIndex }) => {
  const team = teams?.[activeIndex];

  const mediaUrls = useMemo(() => getAllMediaUrls(team?.media), [team?.media]);

  const avatarUrl = useMemo(() => {
    const a = getSingleMediaUrl((team as any)?.avatar);
    return a || mediaUrls?.[0] || "";
  }, [team, mediaUrls]);

  const [mediaIndex, setMediaIndex] = useState(0);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => setMediaIndex(0), [activeIndex]);

  const prevTeam = () => setActiveIndex((i) => (i - 1 + teams.length) % teams.length);
  const nextTeam = () => setActiveIndex((i) => (i + 1) % teams.length);

  const prevMedia = () => {
    const n = mediaUrls.length || 1;
    setMediaIndex((i) => (i - 1 + n) % n);
  };
  const nextMedia = () => {
    const n = mediaUrls.length || 1;
    setMediaIndex((i) => (i + 1) % n);
  };

  useEffect(() => {
    if (!open) return;

    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prevTeam();
      if (e.key === "ArrowRight") nextTeam();
    };

    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teams.length]);

  if (!open || !team) return null;

  const mainUrl = mediaUrls[mediaIndex] ?? mediaUrls[0] ?? avatarUrl;

  const btns = teamButtons(team);
  const booking = btns.find(isBookingBtn) ?? btns.find((b) => !isMoreBtn(b)) ?? btns[0];

  const bookingHref = booking ? resolveHref(locale, booking) : "#";
  const bookingExternal = isExternalHref(bookingHref);
  const bookingNewTab =
    booking?.target === "_blank" || booking?.target === true || booking?.newTab === true || bookingExternal;

  const labelSpecialist = locale === "de" ? "Fachkraft" : locale === "en" ? "Specialist" : "Szakember";

  // ✅ Rich text (Blocks) -> plain text string
  const longText = richTextToPlainText((team as any)?.long_description as RichTextBlocks | undefined);
  const bodyText = longText || team.short_description || "";

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        aria-label="Bezárás"
        className="absolute inset-0 bg-black/25 backdrop-blur-md"
      />

      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4 md:p-8">
        <div className={cn("relative w-full max-w-6xl", tok.modal, "max-h-[92dvh] overflow-hidden")}>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Bezárás"
            className={cn(
              "absolute right-5 top-5 sm:right-6 sm:top-6 z-30",
              "grid h-10 w-10 place-items-center rounded-full",
              "bg-white/70 backdrop-blur-xl border border-neutral-200/70",
              "shadow-[0_1px_0_rgba(0,0,0,0.03)]",
              "text-neutral-700 hover:text-neutral-900 hover:bg-white/85 transition",
              "focus:outline-none focus:ring-2 focus:ring-neutral-300/80"
            )}
          >
            <IconX className="h-5 w-5" />
          </button>

          <div className="max-h-[92dvh] overflow-y-auto overscroll-contain mt-10">
            <div className="px-6 sm:px-8 lg:px-10 pt-7 lg:pt-10">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                  {avatarUrl ? (
                    <StrapiImage
                      alt={team.name || "Avatar"}
                      src={avatarUrl}
                      width={160}
                      height={160}
                      className="h-14 w-14 object-cover object-top"
                    />
                  ) : null}
                </div>

                <div className="min-w-0">
                  <div className="text-xl tracking-tight text-neutral-950 truncate">{team.name ?? ""}</div>
                  <div className="mt-0.5 text-sm text-neutral-500 truncate">{team.job ?? ""}</div>
                </div>
              </div>

              <div className="mt-6 h-px w-full bg-neutral-200/70" />
            </div>

            <div className="px-6 sm:px-8 lg:px-10 pb-10 pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                <div className="lg:col-span-4">
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-2xl bg-neutral-50",
                      "border border-neutral-200/70",
                      "shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                    )}
                  >
                    <div className="relative w-full aspect-[4/3] lg:aspect-[3/4] group">
                      {mainUrl ? (
                        <StrapiImage
                          alt={team.name || "Team"}
                          src={mainUrl}
                          width={900}
                          height={900}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-200" />
                      )}

                      {mediaUrls.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={prevMedia}
                            aria-label="Előző kép"
                            title="Előző kép"
                            className={cn(
                              "absolute left-3 top-1/2 -translate-y-1/2 z-20 grid h-8 w-8 place-items-center rounded-full",
                              "bg-white/18 backdrop-blur-2xl border border-white/35",
                              "shadow-[0_8px_24px_rgba(0,0,0,0.10)]",
                              "hover:bg-white/28 transition active:scale-95",
                              "opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                            )}
                          >
                            <IconChevronLeft className="h-3.5 w-3.5 text-neutral-900/70" />
                          </button>

                          <button
                            type="button"
                            onClick={nextMedia}
                            aria-label="Következő kép"
                            title="Következő kép"
                            className={cn(
                              "absolute right-3 top-1/2 -translate-y-1/2 z-20 grid h-8 w-8 place-items-center rounded-full",
                              "bg-white/18 backdrop-blur-2xl border border-white/35",
                              "shadow-[0_8px_24px_rgba(0,0,0,0.10)]",
                              "hover:bg-white/28 transition active:scale-95",
                              "opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                            )}
                          >
                            <IconChevronRight className="h-3.5 w-3.5 text-neutral-900/70" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <Dots count={mediaUrls.length} active={mediaIndex} onSelect={setMediaIndex} />

                  <div className="mt-2">
                    {booking?.text ? (
                      bookingNewTab ? (
                        <a href={bookingHref} target="_blank" rel="noopener" className="inline-block">
                          <UIButton
                            variant={(booking.variant as any) || "primary"}
                            className="rounded-xl px-4 py-2 text-[14px] shadow-sm active:scale-[0.99] transition"
                          >
                            <Calendar className="mr-2 h-4 w-4 text-white" />
                            {booking.text}
                          </UIButton>
                        </a>
                      ) : (
                        <Link href={bookingHref} className="inline-block">
                          <UIButton
                            variant={(booking.variant as any) || "primary"}
                            className="rounded-xl px-4 py-2 text-[14px] shadow-sm active:scale-[0.99] transition"
                          >
                            <Calendar className="mr-2 h-4 w-4 text-white" />
                            {booking.text}
                          </UIButton>
                        </Link>
                      )
                    ) : null}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="text-xs uppercase tracking-wider text-neutral-500">{labelSpecialist}</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={prevTeam}
                        title="Előző csapattag"
                        className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 transition focus:outline-none focus:ring-2 focus:ring-neutral-300/80"
                        aria-label="Előző csapattag"
                      >
                        <IconChevronLeft className="h-4 w-4 text-neutral-700" />
                      </button>
                      <button
                        type="button"
                        onClick={nextTeam}
                        title="Következő csapattag"
                        className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 transition focus:outline-none focus:ring-2 focus:ring-neutral-300/80"
                        aria-label="Következő csapattag"
                      >
                        <IconChevronRight className="h-4 w-4 text-neutral-700" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <div className="rounded-2xl bg-neutral-50/60 border border-neutral-200/60 p-5 md:p-6">
                    <div
                      className={cn(
                        "max-w-[62ch]",
                        "text-[15px] md:text-[17px]",
                        "leading-[1.75]",
                        "text-neutral-600",
                        "whitespace-pre-line"
                      )}
                    >
                      {bodyText}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-8" />
          </div>
        </div>
      </div>
    </div>
  );
};
