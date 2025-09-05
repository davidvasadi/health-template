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
  // ⬇️ hooks MINDIG lefutnak (nincs early return a tetején)
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
    if (!hasProducts) return; // ⬅️ feltételt a hook *belső* logikájában kezeljük

    const prefersReduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>(".bb-slide");
      const headings = sections.map((s) => s.querySelector<HTMLElement>(".bb-heading"));
      const images = gsap.utils.toArray<HTMLElement>(".bb-overlay-image");
      const outerWrappers = gsap.utils.toArray<HTMLElement>(".bb-slide-outer");
      const innerWrappers = gsap.utils.toArray<HTMLElement>(".bb-slide-inner");
      const countNode = document.querySelector<HTMLElement>(".bb-count");
      const wrap = gsap.utils.wrap(0, sections.length);
      let animating = false;
      let index = 0;

      gsap.set([...sections, ...images, ...headings], { zIndex: 0, autoAlpha: 0 });
      sections[0] && gsap.set(sections[0], { zIndex: 2, autoAlpha: 1 });
      images[0] && gsap.set(images[0], { zIndex: 2, autoAlpha: 1 });
      headings[0] && gsap.set(headings[0], { autoAlpha: 1 });

      gsap.set(outerWrappers, { xPercent: 100 });
      gsap.set(innerWrappers, { xPercent: -100 });
      outerWrappers[0] && gsap.set(outerWrappers[0], { xPercent: 0 });
      innerWrappers[0] && gsap.set(innerWrappers[0], { xPercent: 0 });

      if (!prefersReduce) {
        const firstHeading = headings[0];
        const firstImage   = images[0];
        const firstCard    = sections[0]?.querySelector<HTMLElement>(".bb-card");
        const counterWrap  = countNode?.parentElement || undefined;

        if (firstHeading) gsap.set(firstHeading, { autoAlpha: 0, x: -40 });
        if (firstCard)    gsap.set(firstCard,    { autoAlpha: 0, x: -40 });
        const bottomGroup = [firstImage, counterWrap].filter(Boolean) as Element[];
        if (bottomGroup.length) gsap.set(bottomGroup, { autoAlpha: 0, y: 40 });

        const intro = gsap.timeline();
        intro.to([firstHeading, firstCard].filter(Boolean) as Element[], {
          autoAlpha: 1, x: 0, duration: 0.42, ease: "power3.out",
        }, 0);

        if (bottomGroup.length) {
          intro.to(bottomGroup, {
            autoAlpha: 1, y: 0, duration: 0.42, ease: "power3.out",
          }, 0.05);
        }
      }

      function gotoSection(newIndex: number, direction: number) {
        if (animating) return;
        animating = true;
        const prevIndex = index;
        newIndex = wrap(newIndex);

        const tl = gsap.timeline({
          defaults: { duration: spring.duration, ease: spring.ease },
          onComplete() { animating = false; },
        });

        gsap.set([...sections, ...images, ...headings], { zIndex: 0, autoAlpha: 0 });
        gsap.set([sections[index]!, images[newIndex]!, headings[index]!], { zIndex: 1, autoAlpha: 1 });
        gsap.set([sections[newIndex]!, images[index]!, headings[newIndex]!], { zIndex: 2, autoAlpha: 1 });

        const currentHeading = headings[index];
        const nextHeading = headings[newIndex];

        tl.call(() => {
          if (countNode) countNode.textContent = String(newIndex + 1).padStart(2, "0");
        }, undefined, 0.2)
          .fromTo(outerWrappers[newIndex]!, { xPercent: 100 * direction }, { xPercent: 0 }, 0)
          .fromTo(innerWrappers[newIndex]!, { xPercent: -100 * direction }, { xPercent: 0 }, 0);

        if (currentHeading) tl.to(currentHeading, { xPercent: 30 * direction }, 0);
        if (nextHeading) tl.fromTo(nextHeading, { xPercent: -30 * direction }, { xPercent: 0 }, 0);

        tl.fromTo(
          images[newIndex]!, { xPercent: 125 * direction, scaleX: 1.35, scaleY: 1.18 },
          { xPercent: 0, scaleX: 1, scaleY: 1, duration: 1 }, 0
        ).fromTo(
          images[index]!, { xPercent: 0, scaleX: 1, scaleY: 1 },
          { xPercent: -125 * direction, scaleX: 1.35, scaleY: 1.18 }, 0
        ).timeScale(0.9);

        const prevSection = sections[prevIndex];
        const prevHeading = headings[prevIndex];
        tl.set(prevHeading, { autoAlpha: 0 }).set(prevSection, { autoAlpha: 0 });

        index = newIndex;
        setCurrentIndex(index);
      }

      const obs = Observer.create({
        type: "wheel,touch,pointer",
        preventDefault: true,
        wheelSpeed: -1,
        onUp: () => gotoSection(index + 1, +1),
        onDown: () => gotoSection(index - 1, -1),
        tolerance: 10,
      });

      const onKey = (e: KeyboardEvent) => {
        if (["ArrowUp", "ArrowLeft"].includes(e.code)) gotoSection(index - 1, -1);
        if (["ArrowDown", "ArrowRight", "Space", "Enter"].includes(e.code)) gotoSection(index + 1, +1);
      };
      document.addEventListener("keydown", onKey);

      return () => {
        document.removeEventListener("keydown", onKey);
        obs?.kill();
      };
    }, rootRef);

    return () => ctx.revert();
  }, [products.length, hasProducts]);

  // ⬇️ „early return” CSAK A VÉGÉN
  if (!hasProducts) return null;

  return (
    <div
      ref={rootRef}
      style={navVars}
      className="relative w-full h-svh overflow-hidden bg-breaker-bay-50"
    >
      {/* SLIDES */}
      {products.map((p, i) => (
        <section key={p.id ?? i} className="bb-slide fixed inset-0">
          <div className="bb-slide-outer w-full h-full overflow-hidden">
            <div className="bb-slide-inner w-full h-full overflow-hidden">
              <div className="bb-slide-content absolute inset-0 flex items-start justify-center">
                <div className={`absolute inset-0 z-[1] ${slideBg[i % slideBg.length]}`} />
                <div
                  className={`absolute inset-0 z-[1] ${
                    i === 0 ? "opacity-[0.02]" : "opacity-[0.05]"
                  } [background-image:radial-gradient(#02393f_0.5px,transparent_0.5px)] [background-size:14px_14px]`}
                />

                <div
                  className="relative z-[2] mx-auto w-[100vw] max-w-[1200px] grid grid-cols-12 grid-rows-12 gap-4 px-4 md:px-8"
                  style={{
                    marginTop:
                      "calc(var(--nav-h, 120px) + env(safe-area-inset-top, 0px) + 12px)",
                    height:
                      "calc(100svh - (var(--nav-h, 120px) + env(safe-area-inset-top, 0px) + 24px))",
                  }}
                >
                  <h2 className="bb-heading col-span-12 row-start-1 row-end-2 self-end text-[clamp(1.35rem,5vw,3.25rem)] font-semibold text-breaker-bay-950 tracking-tight">
                    {p.name}
                  </h2>

                  <Link
                    href={`/${locale}/products/${p.slug}` as never}
                    aria-label={`${p.name} details`}
                    className="
                      bb-card
                      col-span-12 md:col-span-6
                      row-start-2 md:row-start-2
                      row-end-7 md:row-end-7
                      rounded-2xl
                      bg-white/40 backdrop-blur-2xl
                      ring-1 ring-white/40
                      shadow-[0_16px_48px_-18px_rgba(3,57,63,0.25)]
                      p-4 md:p-5 flex flex-col gap-3
                      transition hover:bg-white/50
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-breaker-bay-500
                    "
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-breaker-bay-950 text-base md:text-lg font-semibold tracking-tight">
                        {p.name}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-breaker-bay-300/60 bg-breaker-bay-600 text-white px-3 py-1 text-xs md:text-sm font-semibold shadow-sm">
                        HUF {formatNumber(p.price)}
                      </span>
                    </div>
                    {p.description ? (
                      <p className="text-neutral-800/90 text-sm md:text-base leading-relaxed">
                        {truncate(p.description, 200)}
                      </p>
                    ) : null}
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-2 rounded-xl bg-breaker-bay-700 text-white px-3.5 py-2 text-sm font-medium hover:bg-breaker-bay-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-breaker-bay-400 focus-visible:ring-offset-white  transition">
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

      {/* OVERLAY képek */}
      <section className="fixed inset-0 z-20 pointer-events-none">
        <div
          className="relative mx-auto w-[100vw] max-w-[1200px] grid grid-cols-12 grid-rows-12 gap-4 px-4 md:px-8"
          style={{
            marginTop:
              "calc(var(--nav-h, 120px) + env(safe-area-inset-top, 0px) + 12px)",
            height:
              "calc(100svh - (var(--nav-h, 120px) + env(safe-area-inset-top, 0px) + 24px))",
          }}
        >
          <div className="col-start-11 col-end-13 row-start-1 row-end-2 flex justify-end">
            <span className="relative inline-block text-right">
              <span className="bb-count inline-block leading-none text-[clamp(1.3rem,2.8vw,3rem)] font-semibold text-breaker-bay-900/75">
                {String(currentIndex + 1).padStart(2, "0")}
              </span>
              <i aria-hidden className="block h-[6px] bg-breaker-bay-600/60 rounded-full mt-1 w-full" />
            </span>
          </div>

          <figure
            className={[
              "relative overflow-hidden rounded-2xl ring-1 ring-breaker-bay-200/50 shadow-[0_18px_60px_-26px_rgba(3,57,63,0.2)]",
              "col-span-12 row-start-7 row-end-13",
              "md:col-span-12 md:col-start-7 md:row-start-6 md:row-end-13",
              "md:-translate-x-4 md:-translate-y-4",
            ].join(" ")}
          >
            <div className="aspect-[4/3] md:aspect-auto w-full h-full">
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
