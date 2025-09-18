"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { consentUpdate } from "@/lib/analytics/gtag";

const KEY = "consent.choice.v1";

const T = {
  hu: {
    title: "Sütik",
    desc: "Analitika a javításhoz. A szükségesek mindig aktívak.",
    more: "Részletek",
    accept: "Elfogadom",
    reject: "Csak szükségesek",
    close: "Bezárás",
  },
  en: {
    title: "Cookies",
    desc: "Analytics to improve. Essentials always on.",
    more: "Details",
    accept: "Accept",
    reject: "Essential only",
    close: "Close",
  },
  de: {
    title: "Cookies",
    desc: "Analyse zur Verbesserung. Notwendige immer aktiv.",
    more: "Details",
    accept: "Akzeptieren",
    reject: "Nur notwendige",
    close: "Schließen",
  },
} as const;

export default function CookieBanner({
  locale = "hu",
  privacyHref = `/${locale}/privacy`,
  corner = "right", // 'right' | 'left'
}: {
  locale?: "hu" | "en" | "de";
  privacyHref?: string;
  corner?: "right" | "left";
}) {
  const [open, setOpen] = useState(false);
  const t = T[locale] ?? T.hu;

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (!saved) {
      setOpen(true);
    } else {
      consentUpdate(saved === "granted");
    }
  }, []);

  if (!open) return null;

  const decide = (granted: boolean) => {
    localStorage.setItem(KEY, granted ? "granted" : "denied");
    consentUpdate(granted);
    setOpen(false);
  };

  return (
    <div
      className={[
        "fixed z-[100]",
        "bottom-3 sm:bottom-4",
        corner === "left" ? "left-3 sm:left-4" : "right-3 sm:right-4",
      ].join(" ")}
      aria-live="polite"
    >
      <div className="w-[min(92vw,360px)] rounded-xl border border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.2)]">
        {/* felső sor: ikon, rövid szöveg, X */}
        <div className="flex items-start gap-3 p-3">
          {/* cookie ikon */}
          <div className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-neutral-100 ring-1 ring-neutral-200">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
              <path
                d="M12 2a5 5 0 0 0 5 5 3 3 0 0 0 3 3 7 7 0 1 1-14 0 3 3 0 0 0 3-3 5 5 0 0 0 3-5Z"
                fill="currentColor"
                className="text-breaker-bay-950"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs leading-snug text-neutral-800">
              <span className="font-semibold mr-1">{t.title}.</span>
              {t.desc}{" "}
              <Link href={privacyHref} className="underline underline-offset-2">
                {t.more}
              </Link>
              .
            </p>
          </div>

          {/* X = “csak szükségesek” */}
          <button
            type="button"
            aria-label={t.close}
            onClick={() => decide(false)}
            className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-300"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* gombok */}
        <div className="flex items-center justify-end gap-2 px-3 pb-3">
          <button
            type="button"
            onClick={() => decide(false)}
            className="px-2.5 py-1.5 text-xs rounded-md border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100"
          >
            {t.reject}
          </button>
          <button
            type="button"
            onClick={() => decide(true)}
            className="px-2.5 py-1.5 text-xs rounded-md bg-neutral-900 text-white hover:bg-neutral-800"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
