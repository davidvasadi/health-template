"use client";
/**
 * DesktopNavbar – glass + chip nav + Hero-azonos CTA-k CSILLANÁSSAL
 * ----------------------------------------------------------------------------
 * - Menüelemek chip stílusban (mint a nyelvváltó)
 * - CTA-k: Hero-val egyező üveg stílusok + sheen overlay hoverkor
 *   Sorrend: 1. = cta-accent, 2. = cta-primary (kiemelt), többi = cta-ghost
 * - Scroll után: semleges üveg háttér (nincs kékes tint / sheen a nav hátterén)
 * - Nav szövegszín fixen breaker-950; hoverkor világosodhat (Tailwind)
 */

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/elements/button";
import { NavbarItem } from "./navbar-item";
import {
  useMotionValueEvent,
  useScroll,
  motion,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { Link } from "next-view-transitions";
import { LocaleSwitcher } from "../locale-switcher";

/* ──────────────────────────────────────────────────────────────────────────────
   Paletta + scope + CTA (Hero-azonos) + SHEEN mixin (pseudo-element)
   ────────────────────────────────────────────────────────────────────────────── */
const NavCSS = () => (
  <style jsx global>{`
    :root{
      --breaker-50:#effefd;
      --breaker-100:#c7fffa;
      --breaker-200:#90fff6;
      --breaker-300:#51f7f0;
      --breaker-400:#1de4e2;
      --breaker-500:#04c8c8;
      --breaker-600:#009fa3;
      --breaker-700:#057c80;
      --breaker-800:#0a6165;
      --breaker-900:#0d5154;
      --breaker-950:#002e33;
    }

    /* Csak a konténer örökít színt (nincs !important, hogy a hover nyerjen) */
    .navbar-scope{ color: var(--nav-fg); }
    .navbar-scope .logo-title,
    .navbar-scope .site-name,
    .navbar-scope [data-logo-title]{ color: inherit; }
    .navbar-scope svg { color: inherit; }
    .navbar-scope svg [fill]:not([fill="none"]) { fill: currentColor; }
    .navbar-scope svg [stroke]:not([stroke="none"]) { stroke: currentColor; }

    /* Menü tipográfia */
    .navbar-scope .nav-links a,
    .navbar-scope .nav-links [role="link"]{
      font-weight: 500;
    }

    /* CTA-k – Hero-val egyező üveg stílusok (border nélkül) */
    .btn-2sm {
      position: relative;
      border-radius: 0.75rem; /* rounded-xl */
      padding-inline: 10px;
      padding-block: 10px;
      line-height: 1;
      transition: transform .18s ease, filter .18s ease, background-color .18s ease, color .18s ease, backdrop-filter .18s ease;
      overflow: hidden; /* a sheen csík a gombon belül maradjon */
      will-change: transform, filter, backdrop-filter;
    }

    /* Sheen mixin – finom csillanás hoverkor (Hero-hatás) */
    .btn-glass::after{
      content:"";
      position:absolute; inset: -10% auto -10% -40%;
      width: 40%; /* keskeny csík */
      transform: skewX(-18deg) translateX(-120%);
      background: linear-gradient(90deg,
        rgba(255,255,255,0.00) 0%,
        rgba(255,255,255,0.22) 45%,
        rgba(255,255,255,0.00) 100%);
      filter: blur(4px);
      transition: transform .7s ease, opacity .7s ease;
      opacity: .0;
      pointer-events: none;
    }
    .btn-glass:hover::after,
    .btn-glass:focus-visible::after{
      transform: skewX(-18deg) translateX(260%);
      opacity: .85;
    }
    /* Hover feedback – enyhe emelés + fényesítés + nagyobb blur */
    .btn-glass:hover,
    .btn-glass:focus-visible{
      transform: translateY(-1px);
      filter: brightness(1.08) saturate(1.05);
      backdrop-filter: blur(18px) saturate(175%);
      -webkit-backdrop-filter: blur(18px) saturate(175%);
      color: var(--breaker-50);
    }
    @media (prefers-reduced-motion: reduce){
      .btn-glass::after{ transition: none; transform: none; display:none; }
      .btn-glass:hover,.btn-glass:focus-visible{ transform:none; }
    }

    /* Konkrét CTA színrétegek (Hero-azonos) */
    .cta-primary{
      background: linear-gradient(180deg, rgba(29,228,226,0.18) 0%, rgba(4,200,200,0.12) 100%);
      backdrop-filter: blur(14px) saturate(160%);
      -webkit-backdrop-filter: blur(14px) saturate(160%);
      color: var(--breaker-950);
      box-shadow: none!important;
      border: none !important;
    }
    .cta-accent{
      background: linear-gradient(180deg, rgba(144,255,246,0.18) 0%, rgba(199,255,250,0.10) 100%);
      backdrop-filter: blur(14px) saturate(160%);
      -webkit-backdrop-filter: blur(14px) saturate(160%);
      color: var(--breaker-900);
      box-shadow: none!important;
      border-color: #c7fffa !important;

    }
    .cta-ghost{
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(10px) saturate(140%);
      -webkit-backdrop-filter: blur(10px) saturate(140%);
      color: var(--breaker-800);
      box-shadow: none!important;
    }
  `}</style>
);

/* ──────────────────────────────────────────────────────────────────────────────
   Típusok
   ────────────────────────────────────────────────────────────────────────────── */
type Props = {
  leftNavbarItems: { URL: string; text: string; target?: string }[];
  rightNavbarItems: { URL: string; text: string; target?: string }[];
  logo: any;
  locale: string;
};

/* ──────────────────────────────────────────────────────────────────────────────
   Komponens
   ────────────────────────────────────────────────────────────────────────────── */
export const DesktopNavbar = ({ leftNavbarItems, rightNavbarItems, logo, locale }: Props) => {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => setScrolled(value > 100));

  /* CTA sorrend: 1. = cta-accent, 2. = cta-primary (kiemelt), többi = cta-ghost */
  const ctaClass = useMemo(
    () => (i: number) => (i === 0 ? "cta-accent" : i === 1 ? "cta-primary" : "cta-ghost"),
    []
  );

  /* Nav szöveg színe (öröklődik, hover alatt a Tailwind világosít) */
  const NAV_FG = "var(--breaker-950)";

  /* Üveg rétegek – scroll után semleges glass (nincs kék tint) */
  const BASE_GLASS_BG = "rgba(255,255,255,0.18)";
  const BASE_BLUR = 12;
  const SCROLLED_GLASS_BG = "rgba(255,255,255,0.08)";
  const SCROLLED_BLUR = 16;

  /* Aktív menüpont (egyező vagy szülőútvonal) */
  const isActive = (href: string) => {
    const clean = href.replace(/\/+$/, "");
    const current = (pathname || "").replace(/\/+$/, "");
    return current === clean || current.startsWith(clean + "/");
  };

  /* Menü “chip” osztályok */
  const linkBase =
    "flex cursor-pointer items-center justify-center text-sm leading-[110%] rounded-md transition duration-200 select-none font-medium";
  const linkSize = "px-4 py-2 md:px-4 md:py-2"; // ← padding itt

  const getLinkClasses = (active: boolean) =>
    active
      ? cn(
          "bg-breaker-bay-950 text-breaker-bay-50",
          "shadow-[inset_0_1px_0_rgba(0,159,163,0.55)]",
          "hover:bg-breaker-bay-950/95 hover:text-white/90"
        )
      : cn(
          "text-breaker-bay-950",
          "hover:bg-breaker-bay-950 hover:text-breaker-bay-50/90",
          "hover:shadow-[inset_0_1px_0_rgba(0,159,163,0.45)]"
        );

  return (
    <>
      <NavCSS />

      <motion.nav
        /* minden felirat/ikon ezt örökli */
        style={{ ["--nav-fg" as any]: NAV_FG } as React.CSSProperties}
        className={cn(
          "navbar-scope w-full flex relative justify-between px-4 py-3 mx-auto",
          "rounded-2xl overflow-hidden",
          "transition-[width,transform,background] duration-300 ease-out"
        )}
        animate={{ width: scrolled ? "80%" : "100%" }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        aria-label="Primary Navigation"
      >
        {/* TOP: nagyon áttetsző üveg */}
        {!scrolled && (
          <div
            className="absolute inset-0 rounded-2xl -z-20"
            style={{
              background: BASE_GLASS_BG,
              backdropFilter: `blur(${BASE_BLUR}px) saturate(150%)`,
              WebkitBackdropFilter: `blur(${BASE_BLUR}px) saturate(150%)`,
            }}
            aria-hidden
          />
        )}

        {/* SCROLL UTÁN: SEMLEGES üveg – nincs kék glow/sheen */}
        <AnimatePresence>
          {scrolled && (
            <motion.div
              key="nav-glass-neutral"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.32 }}
              className="absolute inset-0 rounded-2xl -z-10"
              style={{
                background: SCROLLED_GLASS_BG,
                backdropFilter: `blur(${SCROLLED_BLUR}px) saturate(160%)`,
                WebkitBackdropFilter: `blur(${SCROLLED_BLUR}px) saturate(160%)`,
              }}
              aria-hidden
            />
          )}
        </AnimatePresence>

        {/* BAL: logó + menü (chip-stílus) */}
        <div className="flex flex-row gap-2 items-center">
          <Logo locale={locale} image={logo?.image} />
          <div className="nav-links flex items-center gap-1.5">
            {leftNavbarItems.map((item) => {
              const href = `/${locale}${item.URL}`;
              const active = isActive(href);
              return (
                <NavbarItem
                  key={item.text}
                  href={href as never}
                  target={item.target}
                  className={cn(linkBase, linkSize, getLinkClasses(active))}
                >
                  {item.text}
                </NavbarItem>
              );
            })}
          </div>
        </div>

        {/* JOBB: nyelvváltó + CTA-k (Hero-azonos, sheen-nel) */}
        <div className="flex space-x-2 items-center">
          <LocaleSwitcher currentLocale={locale} />
          {rightNavbarItems.map((item, index) => (
            <Button
              key={item.text}
              as={Link}
              href={`/${locale}${item.URL}`}
              className={cn("btn-xl btn-glass", ctaClass(index))}
              {...(item.target ? { target: item.target as "_blank" | "_self" } : {})}
            >
              {item.text}
            </Button>
          ))}
        </div>
      </motion.nav>
    </>
  );
};
