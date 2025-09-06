"use client";
/**
 * MobileNavbar
 * - Mobilon: a fix header üveg/blur háttere az első rendernél is látszik (villanásmentes).
 * - Desktop/Tablet: a háttér csak scroll (80px) után jelenik meg (animált).
 * - Overlay mindig mountolva (csak opacity + pointer-events vált), panel középre igazítva.
 * - Minden szín Tailwind-ből jön (nincs beégetett palette/inline style).
 */

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Link } from "next-view-transitions";
import { useMotionValueEvent, useScroll, motion, AnimatePresence } from "framer-motion";
import { IoIosMenu, IoIosClose } from "react-icons/io";
import { Button } from "@/components/elements/button";
import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "../locale-switcher";

/* ──────────────────────────────────────────────────────────────────────────────
   Min. CSS: csak a CTA "sheen" effekt (nincs benne brand szín)
   ────────────────────────────────────────────────────────────────────────────── */
const MobileNavCSS = () => (
  <style jsx global>{`
    .btn-glass { position: relative; overflow: hidden; }
    .btn-glass::after{
      content:"";
      position:absolute; inset: -10% auto -10% -40%;
      width: 40%;
      transform: skewX(-18deg) translateX(-120%);
      background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.22), rgba(255,255,255,0));
      filter: blur(4px);
      transition: transform .7s ease, opacity .7s ease;
      opacity: 0; pointer-events: none;
    }
    .btn-glass:hover::after, .btn-glass:focus-visible::after{
      transform: skewX(-18deg) translateX(260%);
      opacity: .85;
    }
    @media (prefers-reduced-motion: reduce){
      .btn-glass::after{ transition:none; transform:none; display:none; }
    }

    /* ikonszínek öröklik a szövegszínt */
    .mobile-navbar-scope svg { color: currentColor; }
    .mobile-navbar-scope svg [fill]:not([fill="none"]) { fill: currentColor; }
    .mobile-navbar-scope svg [stroke]:not([stroke="none"]) { stroke: currentColor; }
  `}</style>
);

type Props = {
  leftNavbarItems: { URL: string; text: string; target?: string; children?: { URL: string; text: string }[] }[];
  rightNavbarItems: { URL: string; text: string; target?: string }[];
  logo: any;
  locale: string;
};

export const MobileNavbar = ({ leftNavbarItems, rightNavbarItems, logo, locale }: Props) => {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* Scroll figyelés: desktop/tablet esetén 80px felett jelenjen meg az üveg háttér */
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 80));

  /* ESC zárás + scroll-lock nyitott menü esetén */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) {
      document.documentElement.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    }
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* CTA gombok osztályai (mind tailwind) — 0: accent, 1: primary, 2+: ghost */
  const ctaClass = useMemo(
    () => (i: number) =>
      cn(
        "btn-glass rounded-xl px-3 py-2 leading-none font-medium select-none",
        "transition-transform duration-200 will-change-transform hover:-translate-y-0.5",
        "backdrop-blur-lg backdrop-saturate-150",
        i === 0 && "bg-breaker-bay-100/20 text-breaker-bay-900 ",
        i === 1 && "bg-breaker-bay-300/20 text-breaker-bay-950 ",
        i > 1 && "bg-white/10 text-breaker-bay-800 dark:text-breaker-bay-200"
      ),
    []
  );

  /* Aktív menüpont detektálás (vég-/középső perjes egyezés is jó) */
  const isActive = (href: string) => {
    const clean = href.replace(/\/+$/, "");
    const current = (pathname || "").replace(/\/+$/, "");
    return current === clean || current.startsWith(clean + "/");
  };

  /* Panel animációk */
  const panelVariants = {
    initial: { y: -12, opacity: 0, scale: 0.995 },
    animate: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 420, damping: 28, mass: 0.6 } },
    exit: { y: -12, opacity: 0, scale: 0.995, transition: { duration: 0.18, ease: "easeIn" } },
  };

  return (
    <>
      <MobileNavCSS />

      {/* ───────────────────────── FIXED HEADER ───────────────────────── */}
      <div
        className={cn(
          "mobile-navbar-scope fixed top-0 left-0 right-0 z-50",
          "flex items-center justify-between",
          "mx-5 mt-[max(env(safe-area-inset-top),10px)] px-3 py-2",
          "rounded-xl",
          "text-breaker-bay-950",
          "transition-[background,backdrop-filter] duration-300"
        )}
      >
        {/* Mobil: statikus üveglap (azonnal látszik) */}
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 -z-10 rounded-2xl md:hidden",
            "bg-white/10 backdrop-blur-lg backdrop-saturate-150",
            "ring-1 ring-white/15"
          )}
        />

        {/* Desktop/Tablet: üveg csak ha scrolled === true (animációval) */}
        <AnimatePresence>
          {scrolled && (
            <motion.div
              key="mobnav-glass"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-hidden
              className={cn(
                "absolute inset-0 -z-10 rounded-2xl hidden md:block",
                "bg-white/10 backdrop-blur-lg backdrop-saturate-150",
                "ring-1 ring-white/15"
              )}
            />
          )}
        </AnimatePresence>

        {/* Bal: Logo */}
        <Logo locale={locale} image={logo?.image} />

        {/* Jobb: Nyelvváltó + Menü gomb */}
        <div className="flex items-center gap-2">
          <LocaleSwitcher currentLocale={locale} />
          <button
            type="button"
            aria-label="Menü megnyitása"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
            className={cn(
              "p-2 rounded-md",
              "focus:outline-none focus:ring-2 focus:ring-breaker-bay-400/40",
              "text-current"
            )}
          >
            <IoIosMenu className="h-7 w-7" />
          </button>
        </div>
      </div>

      {/* ───────────────────────── OVERLAY ─────────────────────────
          - Mindig mountolva: csak opacity és pointer-events váltása.
          - Kattintás az overlay-re: zárja a panelt. */}
      <motion.div
        id="mobile-menu-overlay"
        aria-hidden={!open}
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: open ? 0.22 : 0.18, ease: open ? "easeOut" : "easeIn" }}
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-50 transition-opacity",
          open ? "pointer-events-auto" : "pointer-events-none",
          "bg-white/10 backdrop-blur-md backdrop-saturate-150"
        )}
      />

      {/* ───────────────────────── PANEL ─────────────────────────
          - Középre igazított, eredeti szélesség (w-full + mx-3).
          - A wrapper pointer-events-none → overlay-re átereszt; a panel pointer-events-auto. */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
            <motion.div
              role="dialog"
              aria-modal="true"
              id="mobile-menu"
              key="mobile-panel"
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={cn(
                "w-full mx-3 rounded-2xl p-4 pointer-events-auto",
                "bg-white/10 backdrop-blur-2xl backdrop-saturate-150",
                "ring-1 ring-white/15"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Panel fej: logo + nyelv + close */}
              <div className="flex items-center justify-between">
                <Logo locale={locale} image={logo?.image} />
                <div className="flex items-center gap-2">
                  <LocaleSwitcher currentLocale={locale} />
                  <button
                    type="button"
                    aria-label="Menü bezárása"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "p-2 rounded-md",
                      "focus:outline-none focus:ring-2 focus:ring-breaker-bay-400/40",
                      "text-breaker-bay-950 "
                    )}
                  >
                    <IoIosClose className="h-8 w-8" />
                  </button>
                </div>
              </div>

              {/* Linkek: "chip" stílus — aktív route kiemelve */}
              <nav className="mt-4 flex flex-col gap-2">
                {leftNavbarItems.map((navItem) => {
                  if (navItem.children?.length) {
                    return (
                      <div key={navItem.text} className="flex flex-col gap-2">
                        {navItem.children.map((c) => {
                          const href = `/${locale}${c.URL}`;
                          const active = isActive(href);
                          return (
                            <Link
                              key={c.URL}
                              href={href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "flex items-center justify-start text-base leading-[110%] rounded-md",
                                "px-4 py-2 font-medium transition",
                                active
                                  ? "bg-breaker-bay-950 text-breaker-bay-50 shadow-[inset_0_1px_0_rgba(0,159,163,0.55)]"
                                  : "text-breaker-bay-950  hover:bg-breaker-bay-950 hover:text-breaker-bay-50/90 hover:shadow-[inset_0_1px_0_rgba(0,159,163,0.45)]"
                              )}
                            >
                              {c.text}
                            </Link>
                          );
                        })}
                      </div>
                    );
                  }
                  const href = `/${locale}${navItem.URL}`;
                  const active = isActive(href);
                  return (
                    <Link
                      key={navItem.URL}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center justify-start text-base leading-[110%] rounded-md",
                        "px-4 py-2 font-medium transition",
                        active
                          ? "bg-breaker-bay-950 text-breaker-bay-50 shadow-[inset_0_1px_0_rgba(0,159,163,0.55)]"
                          : "text-breaker-bay-950  hover:bg-breaker-bay-950 hover:text-breaker-bay-50/90 hover:shadow-[inset_0_1px_0_rgba(0,159,163,0.45)]"
                      )}
                    >
                      {navItem.text}
                    </Link>
                  );
                })}
              </nav>

              {/* CTA-k: tailwind-only + "sheen" (btn-glass) */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {rightNavbarItems.map((item, index) => (
                  <Button
                    key={item.text}
                    as={Link}
                    href={`/${locale}${item.URL}`}
                    className={ctaClass(index)}
                    {...(item.target ? { target: item.target as "_blank" | "_self" } : {})}
                    onClick={() => setOpen(false)}
                  >
                    {item.text}
                  </Button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
