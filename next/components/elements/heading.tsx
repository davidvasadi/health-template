/**************************************************************
 * HEADING KOMPONENS — RUGALMAS, STÍLUSOLT CÍMSOR FRAMER-MOTIONNAL
 * - Tailwind CSS osztályokkal stílusoz
 * - 'size' prop alapján tipográfiai méretvariánsok
 * - 'as' prop: bármilyen HTML tag/komponenst renderel (pl. h1, h2, div)
 * - 'react-wrap-balancer': szebb több soros tördelés
 * - Framer Motion kompatibilitás (MotionProps átadás)
 **************************************************************/

import { cn } from "@/lib/utils"; // <-- **********************************************************
// 'cn' (className combiner): több class stringet okosan összefűz egységesen
// Pl. feltételes classoknál, ütközéseknél jól jön
// **********************************************************

import { AnimationProps, MotionProps } from "framer-motion"; // <-- *********
// A komponens felkészítése framer-motion propok fogadására (animációkhoz)
// *********

import React from "react";
import Balancer from "react-wrap-balancer"; // <-- ***********************************************
// A cím szövegét több sorban kiegyensúlyozza (balanced ragged lines),
// így esztétikusabb a sortördelés különböző viewportokon
// ***********************************************

export const Heading = ({
  className,
  as: Tag = "h2", // <-- **************************************************************
  // 'as' prop: megadhatod, milyen elemet rendereljen (alapértelmezetten 'h2')
  // Pl.: <Heading as="h1"> ... </Heading>
  // **************************************************************
  children,
  size = "md", // <-- **************************************************************
  // Méretvariáns: "sm" | "md" | "xl" | "2xl"
  // A tipográfiai skálát és line-height-ot befolyásolja
  // **************************************************************
  ...props
}: {
  className?: string;
  as?: any; // <-- **************************************************************
  // Enged bármilyen React elemet/komponenst (pl. "h1", "h2", "div", MotionComponent)
  // **************************************************************
  children: any; // <-- **************************************************************
  // A címsor tartalma (pl. szöveg, inline elemek)
  // **************************************************************
  size?: "sm" | "md" | "xl" | "2xl";
  props?: React.HTMLAttributes<HTMLHeadingElement | AnimationProps>;
} & MotionProps & // <-- ***********************************************************************
// Framer Motion propok támogatása (pl. initial, animate, transition)
// ***********************************************************************
  React.HTMLAttributes<HTMLHeadingElement | AnimationProps>) => {
  // ************************** MÉRET VARIÁNSOK TÉRKÉPE **************************
  const sizeVariants = {
    sm: "text-xl md:text-2xl md:leading-snug",
    md: "text-3xl md:text-4xl md:leading-tight",
    xl: "text-4xl md:text-6xl md:leading-none",
    "2xl": "text-5xl md:text-7xl md:leading-none",
  };
  // ******************************************************************************

  return (
    <Tag
      className={cn(
        // *********************** ALAP TIPOGRÁFIAI STÍLUSOK ***********************
        "text-3xl md:text-5xl md:leading-tight max-w-5xl mx-auto text-center tracking-tight",
        "font-medium",
        // Gradiens szöveg: a szöveg átszínezése háttér-gradienst használva
        "bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white",
        // *************************************************************************
        sizeVariants[size], // <-- Méretvariáns kiválasztása a 'size' alapján
        className // <-- Külsőleg átadott további classok hozzáfűzése
      )}
      {...props} // <-- ************************************************************
      // Minden egyéb HTML és/vagy Framer Motion prop továbbadása a renderelt <Tag>-nek
      // (pl. id, aria-*, onClick, initial, animate, transition, stb.)
      // ************************************************************
    >
      {/* ************************* KIEGYENSÚLYOZOTT TÖRDELÉS ************************* */}
      <Balancer>{children}</Balancer>
      {/* **************************************************************************** */}
    </Tag>
  );
};
