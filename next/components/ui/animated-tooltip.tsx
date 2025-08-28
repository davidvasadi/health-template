"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, MotionConfig } from "framer-motion";
import { StrapiImage } from "@/components/ui/strapi-image";

type Item = {
  id: number;
  firstname: string;
  lastname: string;
  job?: string;
  image: { url: string; alternativeText?: string } | any;
};

type Props = {
  items: Item[];
  autoplay?: boolean;
  autoplayMs?: number;
  neighbors?: 1 | 2;
};

const mod = (n: number, m: number) => ((n % m) + m) % m;
const circularOffset = (from: number, to: number, len: number) => {
  const raw = to - from;
  const wrapped = ((raw + len / 2) % len) - len / 2;
  return wrapped;
};

export const AnimatedTooltip: React.FC<Props> = ({
  items,
  autoplay = true,
  autoplayMs = 3600,
  neighbors = 1,
}) => {
  // ⬇️ hooks MINDIG lefutnak
  const data = useMemo(() => (Array.isArray(items) ? items.filter(Boolean) : []), [items]);
  const hasData = data.length > 0;

  const [index, setIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Mobil detektálás
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const up = () => setIsMobile(mq.matches);
    up();
    mq.addEventListener?.("change", up);
    return () => mq.removeEventListener?.("change", up);
  }, []);

  // Autoplay
  useEffect(() => {
    if (!autoplay || data.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % data.length), autoplayMs);
    return () => clearInterval(t);
  }, [autoplay, autoplayMs, data.length]);

  // Drag (hook: useMotionValue) – mindig meghívjuk
  const dragX = useMotionValue(0);
  const dragThreshold = 80;
  const onDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (info.offset.x < -dragThreshold) setIndex((i) => (i + 1) % data.length);
    else if (info.offset.x > dragThreshold) setIndex((i) => (i - 1 + data.length) % data.length);
  };

  const effNeighbors = isMobile ? 1 : neighbors;

  const slots = useMemo(() => {
    if (!hasData) return [];
    const arr: number[] = [];
    for (let o = -effNeighbors; o <= effNeighbors; o++) arr.push(mod(index + o, data.length));
    return arr;
  }, [index, data.length, effNeighbors, hasData]);

  // ⬇️ „early return” CSAK A VÉGÉN
  if (!hasData) return null;

  return (
    <MotionConfig transition={{ type: "spring", stiffness: 230, damping: 26, mass: 0.9 }}>
      <div className="relative w-full">
        <div className="relative mx-auto w-full max-w-6xl">
          <div className="relative h-[68vh] md:h-[54vh] [contain:layout_paint_style]">
            <div
              className="absolute inset-0 perspective-[1100px] flex items-center justify-center z-20"
              aria-roledescription="coverflow"
              style={{ touchAction: "pan-y" }}
            >
              {slots.map((i) => {
                const item = data[i];
                const alt =
                  item?.image?.alternativeText ||
                  `${item?.firstname ?? ""} ${item?.lastname ?? ""}`.trim() ||
                  "image";

                const offset = circularOffset(index, i, data.length);
                const isCenter = offset === 0;

                const baseX = (isMobile ? 180 : 220) * offset;
                const rotY =
                  isMobile
                    ? -20 * Math.sign(offset) * Math.min(Math.abs(offset), 1)
                    : -34 * Math.sign(offset) * Math.min(Math.abs(offset), 1);
                const scaleSide = isMobile ? 0.9 : 0.88;
                const scale = isCenter ? 1 : scaleSide;
                const z = (effNeighbors - Math.abs(offset)) * 10;

                const sideFxMobile = isCenter ? "" : "opacity-80";
                const sideFxDesktop = isCenter ? "" : "saturate-[0.95] brightness-[0.98]";

                return (
                  <motion.div
                    key={item?.id ?? i}
                    className="absolute transform-gpu"
                    style={{ zIndex: 100 + z, transformStyle: "preserve-3d" }}
                    initial={{ opacity: 0.01, x: baseX, rotateY: rotY, scale }}
                    animate={{ opacity: 1, x: baseX, rotateY: rotY, scale }}
                    exit={{ opacity: 0 }}
                    whileHover={isCenter ? { scale: 1.015 } : {}}
                  >
                    <motion.div
                      className={[
                        "w-[88vw] max-w-[560px] aspect-[4/5]",
                        "md:w-[48vw] md:max-w-[500px] md:aspect-[16/10]",
                        "relative rounded-2xl overflow-hidden bg-neutral-900 ring-1 ring-neutral-300/40 shadow-lg select-none transform-gpu",
                        isMobile ? sideFxMobile : sideFxDesktop,
                      ].join(" ")}
                      drag={isCenter ? "x" : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragMomentum={false}
                      dragElastic={0.12}
                      onDragEnd={onDragEnd}
                      style={{ x: isCenter ? dragX : undefined }}
                      role="button"
                      aria-label={isCenter ? "Lapozás: húzd balra/jobbra" : `Ugrás ehhez: ${item.firstname} ${item.lastname}`}
                      onClick={() => {
                        if (!isCenter) setIndex(i);
                      }}
                    >
                      <div
                        className="relative h-full w-full rounded-inherit overflow-hidden transform-gpu"
                        style={{
                          WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                        }}
                      >
                        <StrapiImage
                          src={item?.image?.url}
                          alt={alt}
                          width={isCenter ? 1400 : 1000}
                          height={isCenter ? (isMobile ? 1400 : 900) : (isMobile ? 1100 : 700)}
                          className="h-full w-full object-cover rounded-[inherit]"
                          decoding="async"
                          loading={isCenter ? "eager" : "lazy"}
                          draggable={false}
                        />
                      </div>

                      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-white/10" />
                      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-black/10 via-transparent to-black/30" />

                      <div className="absolute left-3 right-3 bottom-3 flex justify-start">
                        <div className="inline-flex max-w-[92%] items-center gap-2 rounded-xl bg-white/80 px-3 py-1.5 text-neutral-900 backdrop-blur-[2px] shadow-sm">
                          <span className="inline-flex items-center gap-2 text-[13px] md:text-sm font-semibold">
                            <span className="inline-block h-2 w-2 rounded-full bg-breaker-bay-600" />
                            {item.firstname} {item.lastname}
                          </span>
                          {item?.job && <span className="text-xs opacity-80">• {item.job}</span>}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {data.length > 1 && (
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                {data.map((_, i) => {
                  const active = i === index;
                  return (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      aria-label={`Ugrás a ${i + 1}. elemre`}
                      className={["h-1.5 rounded-full transition-all", active ? "w-6 bg-neutral-900" : "w-1.5 bg-neutral-300 hover:bg-neutral-400"].join(" ")}
                    />
                  );
                })}
              </div>
            )}

            <button
              className="absolute inset-y-0 left-0 w-1/2 md:w-1/4 z-40"
              aria-label="Előző"
              onClick={() => setIndex((i) => (i - 1 + data.length) % data.length)}
            />
            <button
              className="absolute inset-y-0 right-0 w-1/2 md:w-1/4 z-40"
              aria-label="Következő"
              onClick={() => setIndex((i) => (i + 1) % data.length)}
            />
          </div>
        </div>
      </div>
    </MotionConfig>
  );
};
