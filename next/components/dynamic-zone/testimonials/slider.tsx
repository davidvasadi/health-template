"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { StrapiImage } from "@/components/ui/strapi-image";

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" aria-hidden>
      <path d="M8.5 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

/** Strapi base URL (client oldalon csak NEXT_PUBLIC_!) */
const STRAPI_URL = (process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337").replace(/\/$/, "");

function toAbs(u?: string | null) {
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const path = u.startsWith("/") ? u : `/${u}`;
  return `${STRAPI_URL}${path}`;
}

/* ──────────────────────────────────────────────────────────────
  Strapi v5 safe getterek
────────────────────────────────────────────────────────────── */

function getDocumentId(t: any): string | null {
  return t?.documentId ?? t?.attributes?.documentId ?? null;
}
function getLocale(t: any): string | null {
  return t?.locale ?? t?.attributes?.locale ?? null;
}
function getText(t: any): string {
  return t?.text ?? t?.attributes?.text ?? "";
}
function getUser(t: any): any {
  return t?.user ?? t?.attributes?.user ?? null;
}
function getUserFirstName(t: any): string {
  const u = getUser(t);
  return u?.firstname ?? u?.attributes?.firstname ?? "";
}
function getUserLastName(t: any): string {
  const u = getUser(t);
  return u?.lastname ?? u?.attributes?.lastname ?? "";
}
function getUserJob(t: any): string {
  const u = getUser(t);
  return u?.job ?? u?.attributes?.job ?? "";
}
function getVideoUrl(t: any): string | null {
  return (
    t?.video?.url ??
    t?.attributes?.video?.url ??
    t?.video?.data?.attributes?.url ??
    t?.attributes?.video?.data?.attributes?.url ??
    null
  );
}
function getUserImageUrl(t: any): string | null {
  return (
    t?.user?.image?.url ??
    t?.attributes?.user?.image?.url ??
    t?.user?.image?.data?.attributes?.url ??
    t?.attributes?.user?.image?.data?.attributes?.url ??
    null
  );
}

/**
 * ✅ Poster URL getter – Strapi-ban mező: `poster` (Media)
 * (hagyva alternatív nevekkel, ha átnevezed)
 */
function getPosterUrl(t: any): string | null {
  return (
    t?.poster?.url ??
    t?.attributes?.poster?.url ??
    t?.poster?.data?.attributes?.url ??
    t?.attributes?.poster?.data?.attributes?.url ??
    t?.video_poster?.url ??
    t?.attributes?.video_poster?.url ??
    t?.video_poster?.data?.attributes?.url ??
    t?.attributes?.video_poster?.data?.attributes?.url ??
    t?.poster_image?.url ??
    t?.attributes?.poster_image?.url ??
    t?.poster_image?.data?.attributes?.url ??
    t?.attributes?.poster_image?.data?.attributes?.url ??
    t?.posterImage?.url ??
    t?.attributes?.posterImage?.url ??
    t?.posterImage?.data?.attributes?.url ??
    t?.attributes?.posterImage?.data?.attributes?.url ??
    null
  );
}

/** ✅ Strapi v5 hydrate: populate=* */
async function fetchTestimonialHydrated(documentId: string, locale?: string | null) {
  const qs = new URLSearchParams();
  qs.set("populate", "*");
  if (locale) qs.set("locale", locale);

  const url = `${STRAPI_URL}/api/testimonials/${documentId}?${qs.toString()}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Strapi ${res.status} — ${text || "Request failed"}`);
  }

  const json = await res.json();
  return json?.data ?? null;
}

export const TestimonialsSlider = ({
  testimonials,
  percentageValue = "100%",
  percentageLabel = "Vendég értékelés",
  reviewsValue = "+2K",
  reviewsLabel = "Vélemény",
}: {
  testimonials: any[];
  percentageValue?: string;
  percentageLabel?: string;
  reviewsValue?: string;
  reviewsLabel?: string;
}) => {
  const items = useMemo(() => (Array.isArray(testimonials) ? testimonials.filter(Boolean) : []), [testimonials]);

  const [active, setActive] = useState(0);
  const [autorotate, setAutorotate] = useState(true);

  // hydrate cache
  const [hydratedById, setHydratedById] = useState<Record<string, any>>({});
  const attemptedRef = useRef<Set<string>>(new Set());

  // video interaction state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [controlsOn, setControlsOn] = useState(false); // controls csak play katt után
  const [hasPlayed, setHasPlayed] = useState(false); // poster overlay csak az első play-ig

  useEffect(() => {
    if (!autorotate || items.length <= 1) return;
    const t = setInterval(() => setActive((p) => (p + 1 >= items.length ? 0 : p + 1)), 7000);
    return () => clearInterval(t);
  }, [autorotate, items.length]);

  useEffect(() => {
    if (active >= items.length) setActive(0);
  }, [active, items.length]);

  if (!items.length) return null;

  const base = items[active];
  const docId = getDocumentId(base);
  const locale = getLocale(base);

  const hydrated = docId ? hydratedById[docId] : null;

  // hydrate csak ha kell
  const baseHasVideo = !!getVideoUrl(base);
  const baseHasAvatar = !!getUserImageUrl(base);
  const baseHasPoster = !!getPosterUrl(base);

  useEffect(() => {
    if (!docId) return;
    if (hydratedById[docId]) return;
    if (attemptedRef.current.has(docId)) return;

    if (baseHasVideo && baseHasAvatar && baseHasPoster) return;

    attemptedRef.current.add(docId);

    let cancelled = false;
    fetchTestimonialHydrated(docId, locale)
      .then((full) => {
        if (cancelled || !full) return;
        setHydratedById((prev) => ({ ...prev, [docId]: full }));
      })
      .catch((err) => console.warn("TESTIMONIAL hydrate failed:", err));

    return () => {
      cancelled = true;
    };
  }, [docId, locale, baseHasVideo, baseHasAvatar, baseHasPoster, hydratedById]);

  // ✅ STABIL fallback: hydrated -> base
  const videoRel = getVideoUrl(hydrated) || getVideoUrl(base);
  const avatarRel = getUserImageUrl(hydrated) || getUserImageUrl(base);
  const posterRel = getPosterUrl(hydrated) || getPosterUrl(base);

  const videoSrc = toAbs(videoRel);
  const avatarSrc = toAbs(avatarRel);
  const posterSrc = toAbs(posterRel);

  const hasVideo = !!videoSrc;

  // slide/video váltáskor reset
  useEffect(() => {
    setControlsOn(false);
    setHasPlayed(false);
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch {}
    }
  }, [videoSrc, active]);

  const firstname = (getUserFirstName(hydrated) || getUserFirstName(base)).trim();
  const lastname = (getUserLastName(hydrated) || getUserLastName(base)).trim();
  const name = `${firstname} ${lastname}`.trim();

  const text = getText(hydrated) || getText(base);
  const job = getUserJob(hydrated) || getUserJob(base);

  // ✅ top avatars: md-től nagyobb + legutolsó legyen felül (zIndex nő i-vel)
  const avatars = useMemo(() => {
    return items
      .slice(0, 4)
      .map((t) => toAbs(getUserImageUrl(t)))
      .filter(Boolean) as string[];
  }, [items]);

  const prev = () => {
    setAutorotate(false);
    setActive((p) => (p - 1 < 0 ? items.length - 1 : p - 1));
  };

  const next = () => {
    setAutorotate(false);
    setActive((p) => (p + 1 >= items.length ? 0 : p + 1));
  };

  const startVideo = async () => {
    if (!videoSrc) return;
    setAutorotate(false);
    setControlsOn(true);

    const el = videoRef.current;
    if (!el) return;

    try {
      await el.play();
    } catch {
      // controls már látszik, user elindíthatja
    }
  };

  // badge + overlay csak koppintás előtt legyen
  const showBadge = !hasVideo || !controlsOn;
  const showPosterOverlay = hasVideo && !!posterSrc && !hasPlayed;

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ✅ mobilon még kisebb padding */}
        <div className="rounded-[28px] border border-[#D1D5DB] bg-white p-3 sm:p-7 lg:p-14">
          {/* ✅ mobilon kisebb gap */}
          <div className="grid gap-4 sm:gap-6 lg:gap-0 lg:grid-cols-[minmax(240px,330px)_120px_1fr] items-stretch">
            {/* BAL: videó / kép */}
            <div className="relative overflow-hidden rounded-[24px] border border-[#D1D5DB] bg-white">
              {/* ✅ mobilon kisebb min-height */}
              <div className="relative h-full min-h-[220px] sm:min-h-[360px] lg:min-h-[520px]">
                {hasVideo ? (
                  <>
                    {/* ✅ Video: object-fit = contain, poster külön overlay cover-rel */}
                    <video
                      ref={videoRef}
                      key={videoSrc!}
                      src={videoSrc!}
                      playsInline
                      preload="metadata"
                      controls={controlsOn}
                      poster={posterSrc ?? undefined}
                      className="absolute inset-0 h-full w-full object-contain bg-white"
                      onPlay={() => setHasPlayed(true)}
                    />

                    {/* ✅ Poster overlay (cover marad!) */}
                    {showPosterOverlay && (
                      <div className="absolute inset-0 pointer-events-none">
                        <StrapiImage
                          src={posterSrc!}
                          alt={name ? `${name} – videó poszter` : "Videó poszter"}
                          fill
                          sizes="(min-width: 1024px) 330px, 100vw"
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* ✅ Zöld play gomb középen (koppintás előtt) */}
                    {!controlsOn && (
                      <button
                        type="button"
                        onClick={startVideo}
                        className="absolute inset-0 grid place-items-center"
                        aria-label="Videó lejátszása"
                      >
                        <span className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-[#057C80] text-white grid place-items-center shadow-[0_12px_30px_rgba(0,0,0,0.25)] hover:opacity-95 active:opacity-90 transition">
                          <PlayIcon />
                        </span>
                      </button>
                    )}
                  </>
                ) : avatarSrc ? (
                  <StrapiImage
                    src={avatarSrc}
                    alt={name ? `${name} – fotó` : "Vélemény fotó"}
                    fill
                    sizes="(min-width: 1024px) 330px, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#F3F4F6]" />
                )}

                {/* ✅ finom alsó overlay a szöveghez (koppintás előtt) */}
                {showBadge && (
                  <div className="absolute inset-x-0 bottom-0 h-20 sm:h-28 bg-gradient-to-t from-black/35 via-black/10 to-transparent pointer-events-none" />
                )}

                {/* ✅ Százalék szöveg: mobilon még kisebb */}
                {showBadge && (
                  <div className="absolute left-4 bottom-4 sm:left-7 sm:bottom-7 pointer-events-none z-10">
                    <div className="text-white leading-none drop-shadow-sm">
                      <div className="text-3xl sm:text-6xl font-extrabold tracking-tight">{percentageValue}</div>
                      <div className="text-sm sm:text-xl font-medium opacity-95">{percentageLabel}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* üres sáv desktopon */}
            <div className="hidden lg:block" />

            {/* JOBB */}
            <div className="flex flex-col justify-between">
              {/* top row */}
              <div className="flex items-start justify-between gap-3 sm:gap-6">
                {/* ✅ top avatars: mobilon kisebb */}
                <div className="flex -space-x-4">
                  {avatars.map((src, i) => (
                    <div
                      key={`${src}-${i}`}
                      className="rounded-full ring-1 ring-[#D1D5DB] bg-white overflow-hidden h-12 w-12 md:h-16 md:w-16"
                      style={{ zIndex: i }} // ✅ last has highest z-index
                    >
                      <StrapiImage src={src} alt="Avatar" width={48} height={48} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>

                {/* ✅ címek mobilon még kisebbek */}
                <div className="text-right leading-none">
                  <div className="text-3xl sm:text-6xl font-extrabold tracking-tight text-[#4B5563]">{reviewsValue}</div>
                  <div className="text-2xl sm:text-5xl font-semibold tracking-tight text-[#057C80]">{reviewsLabel}</div>
                </div>
              </div>

              {/* ✅ leírás: mobilon kisebb + kevesebb padding */}
              <div className="mt-4 sm:mt-8 rounded-2xl border border-[#D1D5DB] bg-white p-3 sm:p-7">
                <p className="text-sm sm:text-xl leading-relaxed text-[#4B5563] font-semibold">{text}</p>
              </div>

              {/* bottom row */}
              <div className="mt-4 sm:mt-8 flex items-center gap-3">
                {/* bal: avatar + szöveg */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="rounded-full border border-[#D1D5DB] overflow-hidden bg-white flex-shrink-0 h-10 w-10 sm:h-14 sm:w-14">
                    {avatarSrc ? (
                      <StrapiImage src={avatarSrc} alt={name || "Szerző"} width={40} height={40} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-[#F3F4F6]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm sm:text-lg font-bold text-[#4B5563] truncate">{name || "—"}</div>
                    <div className="text-xs sm:text-base font-medium text-[#4B5563] opacity-80 truncate">{job}</div>
                  </div>
                </div>

                {/* jobbra: gombok (mobilon kisebbek) */}
                <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={prev}
                    className="grid place-items-center rounded-full border border-[#D1D5DB] text-[#4B5563] bg-white hover:bg-neutral-50 active:bg-neutral-100 transition h-9 w-9 sm:h-11 sm:w-11"
                    aria-label="Előző vélemény"
                  >
                    <ArrowLeftIcon />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="grid place-items-center rounded-full border border-[#D1D5DB] text-[#4B5563] bg-white hover:bg-neutral-50 active:bg-neutral-100 transition h-9 w-9 sm:h-11 sm:w-11"
                    aria-label="Következő vélemény"
                  >
                    <ArrowRightIcon />
                  </button>
                </div>
              </div>
            </div>
            {/* /JOBB */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSlider;
