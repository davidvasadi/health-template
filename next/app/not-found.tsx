// app/not-found.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  IconMapPinOff,
  IconArrowLeft,
  IconCreditCard,
  IconPhone,
} from "@tabler/icons-react";
import { Container } from "@/components/container";
import { FeatureIconContainer } from "@/components/dynamic-zone/features/feature-icon-container";
import { Heading } from "@/components/elements/heading";
import { Subheading } from "@/components/elements/subheading";
import { Button } from "@/components/elements/button";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────────
   i18n – minimál fordítás (hu/en/de)
────────────────────────────────────────────────────────────────────────────── */
type Locale = "hu" | "en" | "de";

const MSG: Record<
  Locale,
  {
    heading: string;
    sub: string;
    fun: string;
    backHome: string;
    viewPrices: string;
    contact: string;
    quick: { about: string; prices: string; faq: string };
    paths: { home: string; prices: string; contact: string; about: string; faq: string };
  }
> = {
  hu: {
    heading: "Az oldal nem található",
    sub: "A keresett oldal nem elérhető vagy átkerült. Nézd meg a kezdőlapot, az árakat, vagy vedd fel velünk a kapcsolatot.",
    fun: "Ne aggódj, néha az ízületek is elcsúsznak — mint ez az oldal. Segítünk visszatalálni.",
    backHome: "Vissza a főoldalra",
    viewPrices: "Árak megtekintése",
    contact: "Kapcsolat",
    quick: { about: "Bemutatkozás", prices: "Kezelés árak", faq: "Gyakori kérdések" },
    paths: { home: "/hu", prices: "/hu/arak", contact: "/hu/kapcsolat", about: "/hu/kapcsolat", faq: "/hu/gyik" },
  },
  en: {
    heading: "Page not found",
    sub: "The page you’re looking for isn’t available or has moved. Visit the homepage, see pricing, or contact us.",
    fun: "Don’t worry — sometimes joints slip out of place, just like this page. We’ll help you get back.",
    backHome: "Back to homepage",
    viewPrices: "View prices",
    contact: "Contact",
    quick: { about: "About", prices: "Pricing", faq: "FAQ" },
    paths: { home: "/en", prices: "/en/pricing", contact: "/en/contact", about: "/en/contact", faq: "/en/faq" },
  },
  de: {
    heading: "Seite nicht gefunden",
    sub: "Die gesuchte Seite ist nicht verfügbar oder wurde verschoben. Besuche die Startseite, sieh dir die Preise an oder kontaktiere uns.",
    fun: "Keine Sorge — manchmal verrutschen auch Gelenke — so wie diese Seite. Wir bringen dich wieder zurück.",
    backHome: "Zur Startseite",
    viewPrices: "Preise ansehen",
    contact: "Kontakt",
    quick: { about: "Über uns", prices: "Preise", faq: "FAQ" },
    paths: { home: "/de", prices: "/de/preise", contact: "/de/kontakt", about: "/de/kontakt", faq: "/de/faq" },
  },
};

function useLocale(): Locale {
  const pathname = usePathname() || "/";
  const first = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  if (first === "en") return "en";
  if (first === "de") return "de";
  return "hu";
}

/* ────────────────────────────────────────────────────────────────────────────
   CTA frame: egységes magasság/padding/lekerekítés + mobilon w-full
────────────────────────────────────────────────────────────────────────────── */
const CTA_FRAME =
  "inline-flex w-full sm:w-auto items-center justify-center h-11 px-4 md:px-5 rounded-lg whitespace-nowrap";

/* ────────────────────────────────────────────────────────────────────────────
   Komponens
────────────────────────────────────────────────────────────────────────────── */
export default function NotFound() {
  const locale = useLocale();
  const t = MSG[locale];

  return (
    <main className="relative isolate min-h-[70vh] overflow-hidden bg-white">
      {/* Lágy, lassan mozgó háttérkörök */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          aria-hidden
          className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-breaker-bay-50 blur-3xl"
          animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-breaker-bay-100/70 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 14, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent opacity-80" />
      </div>

      <Container className="flex min-h-[70vh] items-center justify-center py-20">
        <section
          className={cn(
            "w-full max-w-2xl rounded-lg border border-neutral-200/60 bg-white/55 shadow-[0_6px_24px_rgba(0,0,0,0.08),0_80px_140px_-80px_rgba(0,0,0,0.25)] supports-[backdrop-filter]:bg-white/40 backdrop-blur-2xl px-6 py-10 md:px-10 md:py-14 text-center"
          )}
        >
          {/* Logó – fix URL */}
          <Link href={t.paths.home} aria-label="Go to homepage" className="inline-flex items-center justify-center">
            <img
              src="/logo.svg"
              alt="Csontkovács Bence – logo"
              className="h-9 w-auto opacity-90 hover:opacity-100 transition-opacity"
              height={36}
            />
          </Link>

          {/* Lebegő fő ikon */}
          <motion.div
            className="mt-6"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <FeatureIconContainer className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg ring-1 ring-inset ring-breaker-bay-200 bg-white shadow-sm">
              <IconMapPinOff className="h-6 w-6 text-breaker-bay-800" />
            </FeatureIconContainer>
          </motion.div>

          {/* Cím + leírás */}
          <Heading as="h1" className="mt-5 text-neutral-950 tracking-tight">
            {t.heading}
          </Heading>

          <Subheading className="mt-3 text-neutral-700">{t.sub}</Subheading>

          {/* Barátságos kis üzenet */}
          <p className="mt-3 text-sm text-neutral-500">{t.fun}</p>

          {/* Hairline */}
          <div className="mx-auto mt-8 h-px w-40 bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

          {/* CTA-k – ikonokkal, mobilon egységes méret (w-full + h-11) */}
          <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:flex sm:flex-row sm:items-center sm:justify-center">
            <Link href={t.paths.home} className="w-full sm:w-auto">
              <Button variant="primary" className={CTA_FRAME}>
                <IconArrowLeft className="-ml-0.5 mr-2 h-4 w-4" />
                {t.backHome}
              </Button>
            </Link>

            <Link href={t.paths.prices} className="w-full sm:w-auto">
              <Button
                variant="muted"
                className={cn(CTA_FRAME, "ring-1 ring-inset ring-neutral-200")}
              >
                <IconCreditCard className="-ml-0.5 mr-2 h-4 w-4" />
                {t.viewPrices}
              </Button>
            </Link>

            <Link href={t.paths.contact} className="w-full sm:w-auto">
              <Button variant="outline" className={CTA_FRAME}>
                <IconPhone className="-ml-0.5 mr-2 h-4 w-4" />
                {t.contact}
              </Button>
            </Link>
          </div>

          {/* Gyors linkek */}
          <nav className="mt-6 text-sm text-neutral-600">
            <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <li>
                <Link
                  href={t.paths.about}
                  className="hover:text-neutral-900 underline underline-offset-4"
                >
                  {t.quick.about}
                </Link>
              </li>
              <li>
                <Link
                  href={t.paths.prices}
                  className="hover:text-neutral-900 underline underline-offset-4"
                >
                  {t.quick.prices}
                </Link>
              </li>
              <li>
                <Link
                  href={t.paths.faq}
                  className="hover:text-neutral-900 underline underline-offset-4"
                >
                  {t.quick.faq}
                </Link>
              </li>
            </ul>
          </nav>
        </section>
      </Container>
    </main>
  );
}
