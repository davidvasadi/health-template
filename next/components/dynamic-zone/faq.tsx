"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Container } from "@/components/container";
import { Heading } from "@/components/elements/heading";
import { FeatureIconContainer } from "./features/feature-icon-container";
import { IconHelpHexagonFilled, IconLink, IconSearch } from "@tabler/icons-react";

type FaqItem = { question: string; answer: string };

export const FAQ = ({
  heading,
  sub_heading,
  faqs,
}: {
  heading: string;
  sub_heading: string;
  faqs: FaqItem[];
}) => {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* — Helpers — */
  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[\s\.:/]+/g, "-").replace(/[^\w-]/g, "").replace(/-+/g, "-");

  /* Szűrés kérdés + válasz alapján */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    );
  }, [faqs, query]);

  /* Összes nyit/zár */
  const openAll = () => {
    listRef.current?.querySelectorAll<HTMLDetailsElement>("details").forEach((d) => (d.open = true));
  };
  const closeAll = () => {
    listRef.current?.querySelectorAll<HTMLDetailsElement>("details").forEach((d) => (d.open = false));
  };

  /* Hash deep-link: #slug → automatikus nyitás + scroll */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.location.hash?.slice(1);
    if (!id) return;
    const target = document.getElementById(id) as HTMLDetailsElement | null;
    if (target) {
      target.open = true;
      setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    }
  }, []);

  /* Link másolás */
  const copyLink = async (id: string) => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1400);
    } catch {}
  };

  /* FAQPage JSON-LD */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <section className="bg-white">
      <Container className="flex flex-col items-center pb-20">
        {/* Fejléc blokk – semmi abszolút, semmi átlógás */}
        <div className="w-full max-w-5xl pt-10 md:pt-28">
          <div className="text-center">
            <FeatureIconContainer className="mx-auto flex items-center justify-center bg-white ring-1 ring-breaker-bay-300/40 shadow-none">
              <IconHelpHexagonFilled className="h-6 w-6 text-breaker-bay-700" />
            </FeatureIconContainer>

            {/* Cím: explicit NINCS text-decoration, nincs “fehér vonal” */}
            <Heading
              as="h1"
              className="mt-4 text-breaker-bay-950 no-underline decoration-transparent"
              style={{ textDecorationLine: "none" }}
            >
              {heading}
            </Heading>

            {sub_heading ? (
              <p className="mt-3 text-breaker-bay-900/75 max-w-2xl mx-auto">{sub_heading}</p>
            ) : null}
          </div>

          {/* Vezérlősáv – a cím ALATT külön sorban, jobb oldalra igazítva md+ */}
          <div className="mt-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
            {/* Kereső (chip-szerű) */}
            <label className="group relative flex items-center gap-2 rounded-md ring-1 ring-inset ring-breaker-bay-300/60 bg-white hover:bg-breaker-bay-50 transition-colors md:ml-auto">
              <IconSearch className="ml-2 h-4 w-4 text-breaker-bay-700/90" />
              <input
                type="search"
                placeholder="Keresés a kérdésekben"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="peer bg-transparent placeholder:text-breaker-bay-900/50 focus:outline-none text-sm px-1 py-1.5 pr-2 text-breaker-bay-950"
              />
            </label>

            <div className="flex items-center gap-2 md:ml-2">
              <button
                type="button"
                onClick={openAll}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-breaker-bay-950 bg-breaker-bay-50 hover:bg-breaker-bay-100 transition-colors ring-1 ring-inset ring-breaker-bay-300/60"
              >
                Összes megnyitása
              </button>
              <button
                type="button"
                onClick={closeAll}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-breaker-bay-950 bg-white hover:bg-breaker-bay-50 transition-colors ring-1 ring-inset ring-breaker-bay-300/60"
              >
                Összes bezárása
              </button>
            </div>
          </div>

          {/* Vékony leválasztó hairline CSAK a vezérlősáv alatt */}
          <div className="mt-6 h-px w-40 mx-auto bg-gradient-to-r from-transparent via-breaker-bay-300/50 to-transparent" />
        </div>

        {/* Lista */}
        <div ref={listRef} className="mt-8 w-full max-w-5xl space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-breaker-bay-300/60 bg-breaker-bay-50/40 text-breaker-bay-900/70 px-4 py-6 text-center">
              Nincs találat a(z) <span className="font-semibold">{query}</span> kifejezésre.
            </div>
          )}

          {filtered.map((faq, i) => {
            const id = slugify(faq.question);
            return (
              <details
                key={faq.question}
                id={id}
                className="group rounded-xl border border-breaker-bay-300/40 bg-white open:bg-breaker-bay-50/40 transition-colors"
              >
                <summary className="list-none cursor-pointer select-none px-5 py-4 md:px-6 md:py-5 flex items-start gap-4">
                  {/* Sorszám badge */}
                  <span className="mt-0.5 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-breaker-bay-50 text-breaker-bay-700 text-xs font-semibold ring-1 ring-breaker-bay-300/60">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>

                  <h4 className="flex-1 text-base md:text-lg font-semibold text-breaker-bay-900">
                    {faq.question}
                  </h4>

                  {/* Link másolása */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      copyLink(id);
                    }}
                    className="ml-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-breaker-bay-900/80 ring-1 ring-inset ring-breaker-bay-300/60 hover:bg-breaker-bay-50 transition-colors"
                    title="Link másolása"
                    aria-label="Link másolása"
                  >
                    <IconLink className="h-4 w-4" />
                  </button>

                  {/* Plus/Minus – CSS-ből */}
                  <span aria-hidden className="relative ml-1 mt-1 h-5 w-5 shrink-0 rounded-sm">
                    <span className="absolute left-1/2 top-1/2 h-[2px] w-4 -translate-x-1/2 -translate-y-1/2 bg-breaker-bay-700" />
                    <span className="absolute left-1/2 top-1/2 h-4 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-breaker-bay-700 transition-transform duration-200 group-open:rotate-90" />
                  </span>
                </summary>

                {copiedId === id && (
                  <div className="px-6 -mt-2 mb-1 text-xs text-breaker-bay-700/90">
                    Link kimásolva a vágólapra.
                  </div>
                )}

                <div className="faq-content grid transition-[grid-template-rows] duration-300 ease-out">
                  <div className="faq-inner overflow-hidden">
                    <div className="relative px-5 pb-5 md:px-6 md:pb-6">
                      {/* Bal akcent sáv */}
                      <span
                        aria-hidden
                        className="absolute inset-y-2 left-0 w-[3px] rounded-r-md bg-gradient-to-b from-breaker-bay-500 via-breaker-bay-400 to-transparent opacity-80"
                      />
                      <p className="pl-4 leading-relaxed text-breaker-bay-900/80">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </Container>

      {/* Lokális CSS – marker elrejtés + magasság anim */}
      <style jsx>{`
        .faq-content { display: grid; grid-template-rows: 0fr; }
        details[open] .faq-content { grid-template-rows: 1fr; }
        summary::-webkit-details-marker { display: none; }
      `}</style>

      {/* SEO JSON-LD */}
      <script
        type="application/ld+json"
        // @ts-ignore
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
};
