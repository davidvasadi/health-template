"use client";

import React from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useSlugContext } from "@/app/context/SlugContext";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const { state } = useSlugContext();
  const { localizedSlugs } = state as { localizedSlugs: Record<string, string> };

  const pathname = usePathname() || "";
  const segments = pathname.split("/");

  // --- LOGIKA VÁLTOZATLAN ---
  const generateLocalizedPath = (locale: string): string => {
    if (!pathname) return `/${locale}`;
    if (segments.length <= 2) return `/${locale}`;
    if (localizedSlugs[locale]) {
      segments[1] = locale;
      segments[segments.length - 1] = localizedSlugs[locale];
      return segments.join("/");
    }
    segments[1] = locale;
    return segments.join("/");
  };
  // --- /LOGIKA VÁLTOZATLAN ---

  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);

  const PANEL_WIDTH = 35; // px – kért szélesség
  const [pos, setPos] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const updatePos = React.useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    const left = Math.max(margin, Math.min(rect.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - margin));
    const top = Math.min(rect.bottom + 6, window.innerHeight - margin);
    setPos({ top, left });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    updatePos();
    const onScroll = () => setOpen(false);
    const onResize = () => updatePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePos]);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!btnRef.current) return;
      const target = e.target as Node;
      if (btnRef.current.contains(target)) return;
      const panel = document.getElementById("locale-panel");
      if (panel && panel.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const label = currentLocale; // kisbetűs

  return (
    <>
      {/* Trigger – 60px széles, sötét alap */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          "w-[35px] h-7 rounded-md text-xs font-medium",
          "flex items-center justify-center",
          "bg-breaker-bay-950 text-breaker-bay-50",
          "hover:bg-breaker-bay-900 transition-colors"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
      </button>

      {/* Dropdown a body-ban – 60px széles, üveges sötét panel */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          !pathname.includes("/products/") ? (
            <div
              id="locale-panel"
              role="menu"
              aria-label="Choose language"
              style={{ position: "fixed", top: pos.top, left: pos.left, width: PANEL_WIDTH, zIndex: 9999 }}
              className={cn(
                "rounded-md p-1",
                "backdrop-blur-md bg-breaker-bay-950/90",
                "shadow-[0_16px_40px_-18px_rgba(0,159,163,0.30)]",
                "animate-[dropdown_120ms_ease-out]"
              )}
              onClick={() => setOpen(false)}
            >
              {Object.keys(localizedSlugs).map((locale) => {
                const href = generateLocalizedPath(locale);
                const active = locale === currentLocale;
                return (
                  <Link key={locale} href={href} prefetch={false} role="menuitem" className="block">
                    <div
                      className={cn(
                        "h-7 w-full rounded-[6px] px-0.5 text-xs",
                        "flex items-center justify-center",
                        active
                          ? "bg-breaker-bay-900 text-breaker-bay-50"
                          : "text-breaker-bay-50/90 hover:bg-breaker-bay-900/70 hover:text-breaker-bay-50",
                        "transition-colors"
                      )}
                    >
                      {locale}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : null,
          document.body
        )}
    </>
  );
}

/* opcionális anim (globals.css):
@keyframes dropdown {
  0% { opacity: 0; transform: translateY(6px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
*/
