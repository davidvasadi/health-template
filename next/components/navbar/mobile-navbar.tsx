"use client";
/**
 * MobileNavbar (fix)
 * - Header: továbbra is csak scroll után kap semleges glass hátteret + ring (változatlan)
 * - Megnyitott menü: NINCS border/ring, neutrális üveg overlay + panel
 * - Animáció: overlay fade, panel spring slide/fade — villanás nélkül
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
   Paletta + CTA glass + sheen (Hero/desktop egységes)
   ────────────────────────────────────────────────────────────────────────────── */
const MobileNavCSS = () => (
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

    .mobile-navbar-scope { color: var(--nav-fg); }
    .mobile-navbar-scope svg { color: inherit; }
    .mobile-navbar-scope svg [fill]:not([fill="none"]) { fill: currentColor; }
    .mobile-navbar-scope svg [stroke]:not([stroke="none"]) { stroke: currentColor; }

    /* CTA – glass + sheen (árnyék/border nélkül) */
    .btn-xl {
      position: relative;
      border-radius: 0.75rem;
      padding-inline: 14px;
      padding-block: 10px;
      line-height: 1;
      transition: transform .18s ease, filter .18s ease, background-color .18s ease, color .18s ease, backdrop-filter .18s ease;
      overflow: hidden;
      will-change: transform, filter, backdrop-filter;
      border: none; box-shadow: none;
    }
    .btn-glass::after{
      content:"";
      position:absolute; inset: -10% auto -10% -40%;
      width: 40%;
      transform: skewX(-18deg) translateX(-120%);
      background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.22), rgba(255,255,255,0));
      filter: blur(4px);
      transition: transform .7s ease, opacity .7s ease;
      opacity: .0; pointer-events: none;
    }
    .btn-glass:hover::after, .btn-glass:focus-visible::after{
      transform: skewX(-18deg) translateX(260%);
      opacity: .85;
    }
    .btn-glass:hover, .btn-glass:focus-visible{
      transform: translateY(-1px);
      filter: brightness(1.08) saturate(1.05);
      backdrop-filter: blur(18px) saturate(175%);
      -webkit-backdrop-filter: blur(18px) saturate(175%);
      color: var(--breaker-50);
    }
    @media (prefers-reduced-motion: reduce){
      .btn-glass::after{ transition:none; transform:none; display:none; }
      .btn-glass:hover,.btn-glass:focus-visible{ transform:none; }
    }
    .cta-primary{
      background: linear-gradient(180deg, rgba(29,228,226,0.18) 0%, rgba(4,200,200,0.12) 100%);
      backdrop-filter: blur(14px) saturate(160%);
      -webkit-backdrop-filter: blur(14px) saturate(160%);
      color: var(--breaker-950);
    }
    .cta-accent{
      background: linear-gradient(180deg, rgba(144,255,246,0.18) 0%, rgba(199,255,250,0.10) 100%);
      backdrop-filter: blur(14px) saturate(160%);
      -webkit-backdrop-filter: blur(14px) saturate(160%);
      color: var(--breaker-900);
    }
    .cta-ghost{
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(10px) saturate(140%);
      -webkit-backdrop-filter: blur(10px) saturate(140%);
      color: var(--breaker-800);
    }
  `}</style>
);

/* ──────────────────────────────────────────────────────────────────────────────
   Típusok
   ────────────────────────────────────────────────────────────────────────────── */
type Props = {
  leftNavbarItems: { URL: string; text: string; target?: string; children?: { URL: string; text: string }[] }[];
  rightNavbarItems: { URL: string; text: string; target?: string }[];
  logo: any;
  locale: string;
};

/* ──────────────────────────────────────────────────────────────────────────────
   Komponens
   ────────────────────────────────────────────────────────────────────────────── */
export const MobileNavbar = ({ leftNavbarItems, rightNavbarItems, logo, locale }: Props) => {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Header blur CSAK görgetésre
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 80));

  // ESC + scroll-lock nyitott menü esetén
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

  // CTA sorrend: 1. accent, 2. primary, többi ghost
  const ctaClass = useMemo(
    () => (i: number) => (i === 0 ? "cta-accent btn-glass" : i === 1 ? "cta-primary btn-glass" : "cta-ghost btn-glass"),
    []
  );

  // Aktív menüpont
  const isActive = (href: string) => {
    const clean = href.replace(/\/+$/, "");
    const current = (pathname || "").replace(/\/+$/, "");
    return current === clean || current.startsWith(clean + "/");
  };

  // Chip linkek (LocaleSwitcher minta)
  const chipBase =
    "flex items-center justify-start text-base leading-[110%] rounded-md transition duration-200 select-none font-medium";
  const chipPad = "px-4 py-2";
  const chipActive = "bg-breaker-bay-950 text-breaker-bay-50 shadow-[inset_0_1px_0_rgba(0,159,163,0.55)]";
  const chipIdle   = "text-breaker-bay-950 hover:bg-breaker-bay-950 hover:text-breaker-bay-50/90 hover:shadow-[inset_0_1px_0_rgba(0,159,163,0.45)]";

  const NAV_FG = "var(--breaker-950)";
  const SCROLLED_GLASS_BG = "rgba(255,255,255,0.10)";
  const SCROLLED_BLUR = 14;

  // Variánsok a villanásmentes animációhoz
  const overlayVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.22, ease: "easeOut" } },
    exit:    { opacity: 0, transition: { duration: 0.18, ease: "easeIn" } },
  };
  const panelVariants = {
    initial: { y: -12, opacity: 0, scale: 0.995 },
    animate: { y: 0,  opacity: 1, scale: 1, transition: { type: "spring", stiffness: 420, damping: 28, mass: 0.6 } },
    exit:    { y: -12, opacity: 0, scale: 0.995, transition: { duration: 0.18, ease: "easeIn" } },
  };

  return (
    <>
      <MobileNavCSS />

      {/* FIXED MOBIL HEADER – mx-3, rounded-2xl; csak scroll után glass + ring */}
      <div
        style={{ ["--nav-fg" as any]: NAV_FG } as React.CSSProperties}
        className={cn(
          "mobile-navbar-scope fixed top-0 left-0 right-0 z-50",
          "flex items-center justify-between",
          "mx-5 mt-[max(env(safe-area-inset-top),10px)] px-3 py-2",
          "rounded-xl",
          "transition-[background,backdrop-filter] duration-300"
        )}
      >
        <AnimatePresence>
          {scrolled && (
            <motion.div
              key="mobnav-glass"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 -z-10 rounded-2xl"
              style={{
                background: SCROLLED_GLASS_BG,
                backdropFilter: `blur(${SCROLLED_BLUR}px) saturate(150%)`,
                WebkitBackdropFilter: `blur(${SCROLLED_BLUR}px) saturate(150%)`,
                // RING a headeren marad scroll után
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
              }}
              aria-hidden
            />
          )}
        </AnimatePresence>

        <Logo locale={locale} image={logo?.image} />

        <div className="flex items-center gap-2">
          <LocaleSwitcher currentLocale={locale} />
          <button
            type="button"
            aria-label="Menü megnyitása"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--breaker-400)]/40 text-[color:var(--nav-fg)]"
          >
            <IoIosMenu className="h-7 w-7" />
          </button>
        </div>
      </div>

      {/* OVERLAY + PANEL – NINCS BORDER/RING; neutrális üveg; finom anim */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50"
          >
            {/* neutrális üveg overlay – katt a háttérre: zár */}
            <motion.div
              onClick={() => setOpen(false)}
              className="absolute inset-0 will-change-transform"
              variants={overlayVariants}
              style={{
                background: "rgba(255,255,255,0.06)",      // semleges, NINCS kék
                backdropFilter: "blur(12px) saturate(160%)",
                WebkitBackdropFilter: "blur(12px) saturate(160%)",
                // NINCS border/ring
              }}
            />

            {/* panel – mx-3, rounded-2xl, NINCS border/ring */}
            <motion.div
              variants={panelVariants}
              className="relative z-10 mx-3 mt-[calc(env(safe-area-inset-top)+72px)] rounded-2xl p-4"
              style={{
                background: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(24px) saturate(170%)",
                WebkitBackdropFilter: "blur(24px) saturate(170%)",
                // NINCS border/ring itt
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* fejléc: logo + close + nyelv */}
              <div className="flex items-center justify-between">
                <Logo locale={locale} image={logo?.image} />
                <div className="flex items-center gap-2">
                  <LocaleSwitcher currentLocale={locale} />
                  <button
                    type="button"
                    aria-label="Menü bezárása"
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--breaker-400)]/40 text-breaker-bay-950"
                  >
                    <IoIosClose className="h-8 w-8" />
                  </button>
                </div>
              </div>

              {/* linkek – chip stílus */}
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
                                "flex items-center justify-start text-base leading-[110%] rounded-md transition duration-200 select-none font-medium",
                                "px-4 py-2",
                                active
                                  ? "bg-breaker-bay-950 text-breaker-bay-50 shadow-[inset_0_1px_0_rgba(0,159,163,0.55)]"
                                  : "text-breaker-bay-950 hover:bg-breaker-bay-950 hover:text-breaker-bay-50/90 hover:shadow-[inset_0_1px_0_rgba(0,159,163,0.45)]"
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
                        "flex items-center justify-start text-base leading-[110%] rounded-md transition duration-200 select-none font-medium",
                        "px-4 py-2",
                        active
                          ? "bg-breaker-bay-950 text-breaker-bay-50 shadow-[inset_0_1px_0_rgba(0,159,163,0.55)]"
                          : "text-breaker-bay-950 hover:bg-breaker-bay-950 hover:text-breaker-bay-50/90 hover:shadow-[inset_0_1px_0_rgba(0,159,163,0.45)]"
                      )}
                    >
                      {navItem.text}
                    </Link>
                  );
                })}
              </nav>

              {/* CTA-k – accent → primary → ghost; glass + sheen */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {rightNavbarItems.map((item, index) => (
                  <Button
                    key={item.text}
                    as={Link}
                    href={`/${locale}${item.URL}`}
                    className={cn("btn-xl", ctaClass(index))}
                    {...(item.target ? { target: item.target as "_blank" | "_self" } : {})}
                    onClick={() => setOpen(false)}
                  >
                    {item.text}
                  </Button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
