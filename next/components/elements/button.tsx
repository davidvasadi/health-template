"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { LinkProps } from "next/link";

/**
 * ButtonProps
 * -------------------
 * - variant: a gomb stílusát határozza meg (simple, outline, primary, muted)
 * - as: HTML elem típusa vagy egy custom React komponens (pl. Link)
 * - className: további CSS osztályok, ha testreszabnánk
 * - children: gombon megjelenő tartalom
 * - href: ha Link gomb, ide kerül az URL
 * - onClick: kattintás esemény
 */
interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: "simple" | "outline" | "primary" | "muted";
  as?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
  href?: LinkProps["href"];
  onClick?: () => void;
}

/**
 * Button komponens
 * -------------------
 * - Modern, üveges hatású gomb a csontkovács weboldal stílusához
 * - Breaker Bay paletta + Apple-style frosted glass
 * - UX-barát méretek és hover/active animációk
 */
export const Button: React.FC<ButtonProps> = ({
  variant = "primary", // alapértelmezett stílus
  as: Tag = "button",  // alapértelmezett HTML elem
  className,
  children,
  ...props
}) => {
  /**
   * variantClass
   * -------------------
   * Minden gomb típushoz definiálunk egyedi stílust:
   * - simple: halvány, áttetsző, enyhe blur, light hover
   * - outline: átlátszó, keretes, hover background
   * - primary: fő szín, erős hover + shadow, üveges hatás
   * - muted: sötét, diszkrét, enyhe belső árnyék
   */
  const variantClass =
    variant === "simple"
      ? "bg-white/20 backdrop-blur-md text-breaker-bay-900 border border-breaker-bay-300 hover:bg-white/30 hover:shadow-md transition duration-300 font-medium rounded-lg px-5 py-1.5 flex items-center justify-center"
      : variant === "outline"
      ? "bg-transparent text-breaker-bay-900 border-2 border-breaker-bay-700 hover:bg-breaker-bay-50 hover:shadow-lg transition duration-300 font-medium rounded-lg px-5 py-1.5 flex items-center justify-center"
      : variant === "primary"
      ? "bg-breaker-bay-700 text-white backdrop-blur-md border border-breaker-bay-500 hover:bg-breaker-bay-600 hover:shadow-xl transition duration-300 font-semibold rounded-lg px-6 py-2 flex items-center justify-center"
      : variant === "muted"
      ? "bg-neutral-900 text-white/80 hover:bg-neutral-800/90 border border-neutral-700 hover:shadow-inner transition duration-300 font-medium rounded-2xl px-5 py-2.5 flex items-center justify-center"
      : "";

  return (
    /**
     * Tag: lehet <button>, <a>, <Link> vagy bármilyen React komponens
     * cn(): utility a CSS osztályok kombinálásához
     * focus-visible:ring: accessibility (keyboard focus jelzés)
     */
    <Tag
      className={cn(
        "relative z-10 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-breaker-bay-400/40",
        variantClass,
        className
      )}
      {...props}
    >
      {children ?? `Foglalás` /* alapértelmezett szöveg, ha nincs children */}
    </Tag>
  );
};
