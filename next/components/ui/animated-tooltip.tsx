"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MotionConfig, motion, useMotionValue } from "framer-motion";
import { StrapiImage } from "@/components/ui/strapi-image";

// ————————————————————————————————————————————————————————————
// Típusok
// ————————————————————————————————————————————————————————————
type Item = {
  id: number;
  firstname: string;
  lastname: string;
  job?: string; // lehet rövid vagy hosszú leírás is
  image: { url: string; alternativeText?: string } | any;
};

export type AnimatedTooltipProps = {
  items: Item[];          // kötelező: kártyák adatai
  autoplay?: boolean;     // automatikus lapozás engedélyezése
  autoplayMs?: number;    // automatikus lapozás időzítése (ms)
  className?: string;     // külső wrapper extra class
  accentHex?: string;     // fókusz/dot szín (pl. márkaszín)
};

// ————————————————————————————————————————————————————————————
// Beállítások (Framer spring)
// ————————————————————————————————————————————————————————————
const spring = { type: "spring", stiffness: 260, damping: 28, mass: 0.9 } as const;

// ————————————————————————————————————————————————————————————
// Single-card carousel — SZÖVEG A KÉPEN BELÜL BALRA, DOTS ALATTA KÖZÉPEN
//  • Egyszerre pontosan 1 kép látszik
//  • Egérrel / touch-csal balra-jobbra húzható
//  • Alsó, sötét áttetsző információs sáv a képen BELÜL, balra igazítva
//  • A pager pöttyök a TARTALOM ALATT, a képen belül KÖZÉPRE igazítva
// ————————————————————————————————————————————————————————————
export const AnimatedTooltip: React.FC<AnimatedTooltipProps> = ({
  items,
  autoplay = true,
  autoplayMs = 3800,
  className,
  accentHex = "#0A84FF",
}) => {
  // ————————————————————————————————————————————————
  // FONTOS: a HOOKOK mindig ugyanabban a sorrendben fussanak!
  // Ezért MINDENT a komponens tetején hívunk meg, és a "guard"
  // (nincs adat → return null) csak EZEK UTÁN jön.
  // ————————————————————————————————————————————————

  // 1) Adatok normalizálása (üres elemek kiszűrése)
  const data = useMemo(() => (Array.isArray(items) ? items.filter(Boolean) : []), [items]);

  // 2) Állapotok — aktuális index + autoplay szüneteltető flag
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // 3) Drag — a kártya vízszintesen húzható (egér + touch)
  const dragX = useMotionValue(0);
  const onDragStart = () => setPaused(true);
  const onDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const dx = info.offset.x;
    const vx = info.velocity.x;
    const threshold = 64; // elhúzási küszöb
    if (data.length > 1) {
      if (dx < -threshold || vx < -500) setIndex((i) => (i + 1) % data.length);
      else if (dx > threshold || vx > 500) setIndex((i) => (i - 1 + data.length) % data.length);
    }
    dragX.set(0); // visszapattan középre
    setPaused(false);
  };

  // 4) Reszponzív méretezés — a kártya mérete a container szélességétől függ
  const stageRef = useRef<HTMLDivElement>(null);
  const [cardSize, setCardSize] = useState<{ w: number; h: number }>({ w: 720, h: 460 });
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const maxW = Math.min(w, 960);
      const isMobile = w < 640;
      const isTablet = w >= 640 && w < 1024;
      // szélesség: a containerhez igazítva (sapkával)
      const cw = isMobile
        ? Math.round(w * 0.94)
        : isTablet
          ? Math.round(Math.min(maxW, 860))
          : Math.round(Math.min(maxW, 820));
      // magasság: tablet magasabb, desktop laposabb
      const ratio = isMobile ? 1.15 : isTablet ? 0.74 : 0.58;
      const ch = Math.round(cw * ratio);
      setCardSize({ w: cw, h: ch });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 5) Autoplay — interakció közben szünetel
  useEffect(() => {
    if (!autoplay || paused || data.length <= 1) return;
    const t = setInterval(
      () => setIndex((i) => (i + 1) % data.length),
      Math.max(1600, autoplayMs)
    );
    return () => clearInterval(t);
  }, [autoplay, autoplayMs, paused, data.length]);

  // 6) Index-védelem — ha dinamikusan változik a tömb hossza
  useEffect(() => {
    if (data.length === 0) return;
    setIndex((i) => (i >= data.length ? data.length - 1 : i < 0 ? 0 : i));
  }, [data.length]);

  // ————————————————————————————————————————————————
  // GUARD: csak a HOOKOK után térünk vissza
  // ————————————————————————————————————————————————
  if (data.length === 0) {
    return null;
  }

  // 7) Aktuális elem — overlay szöveghez és alt-hoz
  const current = data[index];
  const name = `${current?.firstname ?? ""} ${current?.lastname ?? ""}`.trim();
  const alt = current?.image?.alternativeText || name || "image";

  return (
    <MotionConfig transition={spring}>
      <section className={"relative w-full " + (className ?? "")} aria-roledescription="carousel">
        {/* Tiszta háttér — a fotó kapja a fókuszt */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-white" />

        {/* STAGE: Kártya középen, benne a balra igazított tartalom + alatta középen pöttyök */}
        <div ref={stageRef} className="relative mx-auto w-full max-w-md px-4">
          <div className="relative flex justify-center py-6">
            {/* Egyetlen, drag-elhető kártya */}
            <motion.div
              className="relative overflow-hidden rounded-3xl shadow-[0_20px_60px_-24px_rgba(0,0,0,0.35)] bg-white/0 select-none"
              style={{ width: cardSize.w, height: cardSize.h, x: dragX }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.08}
              dragMomentum={false}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onPointerEnter={() => setPaused(true)}
              onPointerLeave={() => setPaused(false)}
            >
              {/* Fotó */}
              <StrapiImage
                src={current?.image?.url}
                alt={alt}
                width={1600}
                height={1000}
                className="h-full w-full object-cover"
                decoding="async"
                loading="eager"
                draggable={false}
              />

              {/* Finom felső highlight (sheen) — keret helyett */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/12 via-transparent to-transparent" />

              {/* ——————————————————————————————————
                  OVERLAY BLOKK A KÉPEN BELÜL
                  • Balra igazított tartalom
                  • Alatta pöttyök középen
                 —————————————————————————————————— */}
              <motion.div
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 34, mass: 0.9 }}
                className="absolute inset-x-0 bottom-0"
              >
                <div className="rounded-t-3xl bg-black/60 text-white backdrop-blur-sm ring-1 ring-white/15">
                  {/* Tartalom (balra) */}
                  <div className="px-4 md:px-5 pt-3 md:pt-4">
                    <h3 className="text-left text-[16px] md:text-[18px] font-semibold leading-snug tracking-[-0.01em] whitespace-normal break-words">
                      {name || ""}
                    </h3>

                    {current?.job && (
                      <div className="mt-1 flex items-start gap-2">
                        {/* bal oldali breaker-bay pötty
                           MEGJEGYZÉS: ha nincs Tailwind-ben definiálva a 'breaker-bay' skála,
                           vagyis a 'bg-breaker-bay-600' ismeretlen, cseréld HEX-re:
                           <span className="mt-[6px] inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#5CB7AE' }} />
                        */}
                        <span
                          className="mt-[6px] inline-block h-2 w-2 rounded-full bg-breaker-bay-600"
                          aria-hidden
                        />
                        {/* a leírás görgethető, ha hosszú */}
                        <div className="max-h-[40svh] overflow-y-auto pr-1">
                          <p className="text-left text-[13px] md:text-[14px] leading-snug text-white/85 whitespace-pre-wrap break-words">
                            {current.job}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pöttyök (középen, a tartalom alatt, még az overlaysávon belül) */}
                  {data.length > 1 && (
                    <div className="px-4 pb-3 md:pb-4">
                      <div className="flex justify-center">
                        <div className="flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1.5 backdrop-blur-sm ring-1 ring-white/15">
                          {data.map((_, iDot) => {
                            const active = iDot === index;
                            return (
                              <button
                                key={iDot}
                                onClick={() => setIndex(iDot)}
                                aria-label={`Ugrás a ${iDot + 1}. elemre`}
                                className="group relative h-4 w-4 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                              >
                                <span
                                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full transition-all ${
                                    active ? "bg-white scale-100" : "bg-white/60 scale-75 group-hover:scale-90"
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* SR live region — képernyőolvasónak frissül a cím/pozíció */}
          <p aria-live="polite" className="sr-only">
            {`${name}${current?.job ? ", " + current.job : ""}`}
          </p>
        </div>
      </section>
    </MotionConfig>
  );
};

export default AnimatedTooltip;
