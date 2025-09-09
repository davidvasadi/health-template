"use client";

import React, { useEffect, useMemo, useRef, useState, CSSProperties } from "react";
import { Link } from "next-view-transitions";
import { Product } from "@/types/types";
import { StrapiImage } from "@/components/ui/strapi-image";
import { formatNumber, truncate } from "@/lib/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Observer } from "gsap/Observer";

gsap.registerPlugin(ScrollTrigger, Observer);

const spring = { duration: 1, ease: "expo.inOut" as const };

export function Featured({
  products = [],
  locale,
}: {
  products: Product[];
  locale: string;
}) {
  const hasProducts = products?.length > 0;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slideBg = useMemo(
    () => [
      "bg-gradient-to-br from-white via-neutral-50 to-white",
      "bg-gradient-to-tl from-white via-neutral-100 to-white",
    ],
    []
  );

  const navVars = { ["--nav-h" as any]: "120px" } as CSSProperties;

  useEffect(() => {
    if (!hasProducts) return;

    const prefersReduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      // Egyetlen halmaz – GSAP stabil
      const sections = gsap.utils.toArray<HTMLElement>(".bb-slide");
      const headings = sections.map((s) => s.querySelector<HTMLElement>(".bb-heading"));
      const images = gsap.utils.toArray<HTMLElement>(".bb-overlay-image");
      const outerWrappers = gsap.utils.toArray<HTMLElement>(".bb-slide-outer");
      const innerWrappers = gsap.utils.toArray<HTMLElement>(".bb-slide-inner");
      const countNodes = () => Array.from(document.querySelectorAll<HTMLElement>(".bb-count"));

      const wrap = gsap.utils.wrap(0, sections.length);
      let animating = false;
      let index = 0;

      gsap.set([...sections, ...images, ...headings], { zIndex: 0, autoAlpha: 0 });
      sections[0] && gsap.set(sections[0], { zIndex: 2, autoAlpha: 1 });
      images[0] && gsap.set(images[0], { zIndex: 2, autoAlpha: 1 });
      // CÍM AZONNAL LÁTSZIK
      headings[0] && gsap.set(headings[0], { autoAlpha: 1 });

      gsap.set(outerWrappers, { xPercent: 100 });
      gsap.set(innerWrappers, { xPercent: -100 });
      outerWrappers[0] && gsap.set(outerWrappers[0], { xPercent: 0 });
      innerWrappers[0] && gsap.set(innerWrappers[0], { xPercent: 0 });

      if (!prefersReduce) {
        // csak a kártyát és az alsó elemeket animáljuk be finoman; a címet NEM rejtjük el
        const firstImage = images[0];
        const firstCard  = sections[0]?.querySelector<HTMLElement>(".bb-card");
        const counterWraps = countNodes().map(n => n.parentElement!).filter(Boolean);

        if (firstCard) gsap.set(firstCard, { autoAlpha: 0, x: -32 });
        const bottomGroup = [firstImage, ...counterWraps].filter(Boolean) as Element[];
        if (bottomGroup.length) gsap.set(bottomGroup, { autoAlpha: 0, y: 28 });

        const intro = gsap.timeline();
        if (firstCard) {
          intro.to(firstCard, { autoAlpha: 1, x: 0, duration: 0.42, ease: "power3.out" }, 0);
        }
        if (bottomGroup.length) {
          intro.to(bottomGroup, { autoAlpha: 1, y: 0, duration: 0.42, ease: "power3.out" }, 0.05);
        }
      }

      function gotoSection(newIndex: number, direction: number) {
        if (animating) return;
        animating = true;
        newIndex = wrap(newIndex);

        const tl = gsap.timeline({
          defaults: { duration: spring.duration, ease: spring.ease },
          onComplete() { animating = false; },
        });

        gsap.set([...sections, ...images, ...headings], { zIndex: 0, autoAlpha: 0 });
        gsap.set([sections[index]!, images[newIndex]!, headings[index]!], { zIndex: 1, autoAlpha: 1 });
        gsap.set([sections[newIndex]!, images[index]!, headings[newIndex]!], { zIndex: 2, autoAlpha: 1 });

        const nextHeading = headings[newIndex];

        tl.call(() => {
          countNodes().forEach(n => (n.textContent = String(newIndex + 1).padStart(2, "0")));
        }, undefined, 0.2)
          .fromTo(outerWrappers[newIndex]!, { xPercent: 100 * direction }, { xPercent: 0 }, 0)
          .fromTo(innerWrappers[newIndex]!, { xPercent: -100 * direction }, { xPercent: 0 }, 0);

        // a címet nem rejtem el – csak enyhe parallax
        if (nextHeading) tl.fromTo(nextHeading, { xPercent: -20 * direction }, { xPercent: 0 }, 0);

        tl.fromTo(
          images[newIndex]!, { xPercent: 125 * direction, scaleX: 1.35, scaleY: 1.18 },
          { xPercent: 0, scaleX: 1, scaleY: 1, duration: 1 }, 0
        ).fromTo(
          images[index]!, { xPercent: 0, scaleX: 1, scaleY: 1 },
          { xPercent: -125 * direction, scaleX: 1.35, scaleY: 1.18 }, 0
        ).timeScale(0.9);

        index = newIndex;
        setCurrentIndex(index);
      }

      // ⬇️ SCOPED OBSERVER: csak a komponens gyökerén figyelünk, nem globálisan
      const obs = Observer.create({
        target: rootRef.current, // << fontos!
        type: "wheel,touch,pointer",
        preventDefault: true,
        wheelSpeed: -1,
        onUp: () => gotoSection(index + 1, +1),
        onDown: () => gotoSection(index - 1, -1),
        tolerance: 10,
        ignore: "input,textarea,select,[contenteditable]"
      });

      const onKey = (e: KeyboardEvent) => {
        if (["ArrowUp", "ArrowLeft"].includes(e.code)) gotoSection(index - 1, -1);
        if (["ArrowDown", "ArrowRight", "Space", "Enter"].includes(e.code)) gotoSection(index + 1, +1);
      };
      document.addEventListener("keydown", onKey);

      // ⬇️ A context cleanupja meghívja ezt a belső cleanupot is, amikor ctx.revert() fut
      return () => {
        document.removeEventListener("keydown", onKey);
        obs?.kill();
      };
    }, rootRef);

    // ⬇️ EZ VOLT A HIÁNYZÓ LÉPÉS: takarítás unmountkor / route váltáskor
    return () => ctx.revert();
  }, [products.length, hasProducts]);

  if (!hasProducts) return null;

  return (
    <div ref={rootRef} style={navVars} className="relative w-full h-svh overflow-hidden bg-breaker-bay-50">
      {/* MOBIL SZÁMLÁLÓ – változatlan */}
      <div className="md:hidden pointer-events-none fixed right-3 top-[calc(var(--nav-h,100px)+env(safe-area-inset-top,0px))] z-40" aria-hidden>
        <span className="bb-count block leading-none text-[5rem] font-semibold tracking-tight text-breaker-bay-900/85">
          {String(currentIndex + 1).padStart(2, "0")}
        </span>
      </div>

      {/* SLIDES */}
      {products.map((p, i) => (
        <section key={p.id ?? i} className="bb-slide fixed inset-0">
          <div className="bb-slide-outer w-full h-full overflow-hidden">
            <div className="bb-slide-inner w-full h-full overflow-hidden">
              <div className="bb-slide-content absolute inset-0 flex items-start justify-center">
                {/* háttér */}
                <div className={`absolute inset-0 z-[1] ${slideBg[i % slideBg.length]}`} />
                <div className={`absolute inset-0 z-[1] ${i === 0 ? "opacity-[0.02]" : "opacity-[0.05]"} [background-image:radial-gradient(#02393f_0.5px,transparent_0.5px)] [background-size:14px_14px]`} />

                {/* FRONT GRID – desktop layout javítva; mobilhoz nem nyúlunk */}
                <div
                  className="relative z-[30] mx-auto w-[100vw] max-w-7xl grid grid-cols-12 grid-rows-12 gap-4 px-4 md:px-8"
                  style={{
                    marginTop: "calc(var(--nav-h, 120px) + env(safe-area-inset-top, 0px) + 12px)",
                    height: "calc(100svh - (var(--nav-h, 120px) + env(safe-area-inset-top, 0px) + 24px))",
                  }}
                >
                  {/* SOR 1: Title fent + Desktop Count a jobb szélre, díszcsíkkal */}
                  <div className="col-span-12 row-start-1 row-end-2 relative">
                    <h2
                      className="
                        bb-heading
                        max-w-[86%] md:max-w-none
                        break-words [hyphens:auto]
                        text-[clamp(1.05rem,6.2vw,2.2rem)] md:text-[clamp(1.6rem,5vw,3.25rem)]
                        leading-[1.05] font-semibold tracking-tight text-breaker-bay-950
                        md:pr-[220px]
                      "
                    >
                      {p.name}
                    </h2>

                    {/* Desktop COUNT – díszcsík a szám szélességére */}
                    <div className="hidden md:block absolute right-0 bottom-0">
                      <div className="inline-block text-right">
                        <span className="bb-count block leading-none text-[5rem] font-semibold tracking-tight text-breaker-bay-900/85">
                          {String(currentIndex + 1).padStart(2, "0")}
                        </span>
                        <i
                          aria-hidden
                          className="block mt-1 h-[6px] w-full rounded-full bg-gradient-to-r from-breaker-bay-600/80 to-breaker-bay-300/70 shadow-[inset_0_1px_0_rgba(255,255,255,.55)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CONTENT CARD – desktopon szélesebb (md:col-span-6), arányos; mobil változatlan */}
                  <Link
                    href={`/${locale}/products/${p.slug}` as never}
                    aria-label={`${p.name} details`}
                    className="
                      bb-card relative
                      col-span-12
                      row-start-9 row-end-13
                      md:col-span-5 md:col-start-1 md:row-start-4 md:row-end-10
                      rounded-2xl
                      bg-white/75 backdrop-blur-2xl backdrop-saturate-150
                      ring-1 ring-white/50
                      shadow-[0_16px_48px_-18px_rgba(3,57,63,0.28)]
                      p-4 md:p-6 flex flex-col gap-3
                      transition hover:bg-white/80
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-breaker-bay-500
                    "
                  >
                    {/* 1) ÁR – breaker-bay-900 */}
                    <span className="inline-flex items-baseline gap-1.5 self-start rounded-2xl bg-breaker-bay-900 text-white ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_10px_30px_-16px_rgba(0,0,0,.6)] px-3.5 py-1.5 leading-none">
                      <span className="text-[10px] uppercase tracking-[0.12em] text-white/70">HUF</span>
                      <span className="text-[17px] font-semibold text-white">{formatNumber(p.price)}</span>
                    </span>

                    {/* 2) SZÖVEG */}
                    {p.description ? (
                      <p className="text-neutral-900/90 text-[14px] md:text-base leading-snug md:leading-relaxed line-clamp-3 md:line-clamp-none">
                        {truncate(p.description, 180)}
                      </p>
                    ) : null}

                    {/* 3) CTA */}
                    <div>
                      <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-breaker-bay-800 text-white ring-1 ring-white/10 shadow-[0_10px_24px_-14px_rgba(3,57,63,.5)] px-4 py-3 text-[14px] md:text-sm font-medium hover:bg-breaker-bay-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-breaker-bay-400 focus-visible:ring-offset-white transition">
                        Tudnivalók
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M5 12h14M13 5l7 7-7 7" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* BACK LAYER – nagyobb kép, tényleg a tartalom mögött; sarka kilóg (translate + scale) */}
      <section className="fixed inset-0 z-10 pointer-events-none">
        <div
          className="relative mx-auto w-[100vw] max-w-7xl grid grid-cols-12 grid-rows-12 gap-4 px-4 md:px-8"
          style={{
            marginTop: "calc(var(--nav-h, 120px) + env(safe-area-inset-top, 0px) + 12px)",
            height: "calc(100svh - (var(--nav-h, 120px) + env(safe-area-inset-top, 0px) + 24px))",
          }}
        >
          <figure
            className="
              relative overflow-hidden rounded-2xl ring-1 ring-breaker-bay-200/50 shadow-[0_18px_60px_-26px_rgba(3,57,63,0.2)]
              col-span-12 row-start-2 row-end-9
              md:col-span-7 md:col-start-6 md:row-start-3 md:row-end-13
              md:-translate-x-4 md:-translate-y-4 md:scale-[1.035]
            "
          >
            <div className="w-full h-full">
              {products.map((p, i) => (
                <StrapiImage
                  key={p.id ?? i}
                  src={p.images?.[0]?.url}
                  alt={p.name}
                  width={1700}
                  height={1100}
                  className="bb-overlay-image absolute inset-0 h-full w-full object-cover"
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0)_45%,rgba(3,57,63,0.05)_100%)]" />
          </figure>
        </div>
      </section>
    </div>
  );
}

export default Featured;
