// „Mit kezelünk?” — statikus szakasz a főoldalon (a vélemények elé), a tartalom: lib/shared/conditions.ts.
// Szerveroldali (nincs "use client"): a szöveg a nyers HTML-ben van, a keresők és az AI-keresők is látják.
// Kinézet: az oldal türkiz (breaker-bay) palettája — lágy háttér-foltok, üveges kártyák saját ikonnal, rámutatásra
// emelkedés; alul színes foglalás-sáv.
import {
  IconActivity,
  IconChevronRight,
  IconArrowsVertical,
  IconBodyScan,
  IconBolt,
  IconCircleDot,
  IconMassage,
  IconStethoscope,
  IconStretching,
  IconWalk,
} from "@tabler/icons-react";
import { Container } from "@/components/container";
import { Heading } from "@/components/elements/heading";
import { FeatureIconContainer } from "@/components/dynamic-zone/features/feature-icon-container";
import { BUSINESS } from "@/lib/shared/structured-data";
import { conditionsCopyFor, conditionsFor } from "@/lib/shared/conditions";

/** panasz → ikon (a lista azonosítói szerint, nyelvtől függetlenül) */
const ICON: Record<string, typeof IconBolt> = {
  isiasz: IconBolt,
  derekfajas: IconStretching,
  hatfajas: IconBodyScan,
  nyakfajas: IconMassage,
  idegbecsipodes: IconActivity,
  porckorongserv: IconCircleDot,
  gerincferdules: IconArrowsVertical,
  csipofajdalom: IconWalk,
};

export function TreatedConditions({ locale }: { locale: string }) {
  const items = conditionsFor(locale);
  const copy = conditionsCopyFor(locale);
  return (
    <section id="mit-kezelunk" aria-labelledby="mit-kezelunk-title" className="relative isolate overflow-hidden bg-white">
      {/* lágy türkiz háttér-foltok, mint a többi szakaszon */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -left-32 top-10 h-[30rem] w-[30rem] rounded-full blur-3xl"
          style={{ opacity: 0.3, background: "radial-gradient(closest-side, rgba(4,200,200,0.28), rgba(255,255,255,0))" }}
        />
        <div
          className="absolute -right-32 bottom-0 h-[32rem] w-[32rem] rounded-full blur-3xl"
          style={{ opacity: 0.28, background: "radial-gradient(closest-side, rgba(0,159,163,0.24), rgba(255,255,255,0))" }}
        />
      </div>

      <Container className="relative z-0 mx-auto max-w-7xl py-16 md:py-24">
        <FeatureIconContainer className="flex items-center justify-center">
          <IconStethoscope className="h-6 w-6 text-breaker-bay-950" />
        </FeatureIconContainer>
        <Heading id="mit-kezelunk-title" className="mx-auto pt-4 text-breaker-bay-950">
          {copy.heading}
        </Heading>
        <p className="mx-auto mt-4 max-w-3xl text-center text-sm text-breaker-bay-900/80 md:text-base">{copy.sub}</p>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {items.map((c) => {
            const Icon = ICON[c.id] ?? IconActivity;
            return (
              <li
                key={c.id}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white to-breaker-bay-50/70 p-6 shadow-[0_1px_2px_rgba(0,46,51,0.05)] ring-1 ring-breaker-bay-600/15 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(0,95,99,0.45)] hover:ring-breaker-bay-500/40"
              >
                {/* felső színcsík — rámutatva kitöltődik */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-breaker-bay-500 to-breaker-bay-300 transition-transform duration-500 group-hover:scale-x-100"
                />
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-breaker-bay-50 text-breaker-bay-700 ring-1 ring-breaker-bay-600/15 transition-colors duration-300 group-hover:bg-breaker-bay-600 group-hover:text-white">
                  <Icon className="h-5 w-5" stroke={1.8} />
                </span>
                <h3 className="mt-4 text-base font-semibold text-breaker-bay-950 md:text-lg">{c.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-breaker-bay-900/75">{c.text}</p>
              </li>
            );
          })}
        </ul>

        {/* alul: foglalás-sáv a megjegyzéssel */}
        <div className="mt-10 flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-r from-breaker-bay-700 to-breaker-bay-900 px-6 py-7 text-center shadow-[0_24px_50px_-24px_rgba(0,46,51,0.6)] md:flex-row md:justify-between md:px-10 md:text-left">
          <p className="max-w-2xl text-sm leading-relaxed text-white/85 md:text-base">{copy.note}</p>
          <a
            href={BUSINESS.bookingUrl}
            target="_blank"
            rel="noopener"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-breaker-bay-800 transition-transform duration-200 hover:scale-[1.03]"
          >
            {copy.cta}
            <IconChevronRight className="h-4 w-4" stroke={2.2} />
          </a>
        </div>
      </Container>
    </section>
  );
}
