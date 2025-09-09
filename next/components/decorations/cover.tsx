"use client"; 
import React from "react";
import { motion } from "framer-motion";

/*******************************************************************************************
 * COVER — Egy kiemelő doboz a szöveg körül
 * - A gyerek szöveget egy sötét (bg-neutral-900) hátteres, inline blokkba rakja
 * - Köré 4 kis animált fehér pötty kerül (CircleIcon), a sarkokban
 * - Így lesz „kiemelt badge” hatás
 *******************************************************************************************/
export const Cover = ({ children }: { children?: React.ReactNode }) => {
  return (
    // === A szöveg háttérdobozza ===
    <div className="relative inline-block  px-2 py-1">
      {/* A tényleges szöveg fehérrel */}
      <span className="text-breaker-bay-600">{children}</span>

      {/* 4 animált kör ikon, a doboz 4 sarkában elhelyezve */}
      <CircleIcon className="absolute -right-[2px] -top-[2px]" />
      <CircleIcon className="absolute -bottom-[2px] -right-[2px]" delay={0.4} />
      <CircleIcon className="absolute -left-[2px] -top-[2px]" delay={0.8} />
      <CircleIcon className="absolute -bottom-[2px] -left-[2px]" delay={1.6} />
    </div>
  );
};

/*******************************************************************************************
 * CIRCLEICON — Egy pici animált kör (pötty)
 * - motion.div: Framer Motion segítségével animáljuk az áttetszőséget
 * - Helyét az átadott className határozza meg (sarkokra téve)
 * - `delay` prop: fáziseltolással indítja az animációt (így nem egyszerre villognak)
 *******************************************************************************************/
export const CircleIcon = ({
  className,
  delay,
}: {
  className?: string;
  delay?: number;
}) => {
  return (
    <motion.div
      // KEZDŐ állapot: enyhén áttetsző (opacity 0.2)
      initial={{
        opacity: 0.2,
      }}
      // ANIMÁCIÓ: átlátszóság ciklikusan változik 0.2 → 0.5 → 0.2
      animate={{
        opacity: [0.2, 0.5, 0.2],
      }}
      // ANIMÁCIÓ BEÁLLÍTÁSOK:
      transition={{
        duration: 1,          // 1 másodperces ciklus
        delay: delay ?? 0,    // ha van megadott delay, akkor késleltetve indul
        repeat: Infinity,     // végtelen ismétlés
        repeatType: "reverse",// oda-vissza ismétlés (ping-pong hatás)
        ease: "linear",       // lineáris sebességgel változik
        repeatDelay: delay,   // késleltetés az ismétlések közt is
      }}
      // MEGJELENÉS: 2x2 px kör (rounded-full), fehér színnel
      className={`pointer-events-none h-2 w-2 rounded-full bg-breaker-bay-800 opacity-20 ${className}`}
    ></motion.div>
  );
};
