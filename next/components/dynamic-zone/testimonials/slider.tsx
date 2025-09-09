"use client";

import React, { useEffect, useMemo, useRef, useState, memo } from "react";
import { Transition } from "@headlessui/react";
import { SparklesCore } from "@/components/ui/sparkles";
import { StrapiImage } from "@/components/ui/strapi-image";

/**
 * TestimonialsSlider — olvasásra csábító, nyugodt blokk
 * -----------------------------------------------------
 * • Max 3 kiemelt vélemény (large type, sor-köz kényelmes)
 * • Stabil autoplay (funkcionális setState → nincs "stale closure")
 * • Finom díszítés (Sparkles), fehér háttérhez illő ringek
 * • HeadlessUI Transition a váltáshoz (zajmentes anim osztályokkal)
 *
 * Megjegyzés: szándékosan kerüljük a „custom ease-[cubic-bezier(...)]” utilityt,
 * hogy ne kapj TW „ambiguous class” warningot buildkor.
 */
export const TestimonialsSlider = ({ testimonials }: { testimonials: any[] }) => {
  // ——— HOOKS (mindig, feltétel nélkül!) ———
  // Aktív index + autorotate flag
  const [active, setActive] = useState(0);
  const [autorotate, setAutorotate] = useState(true);

  // A váltások közbeni magasságstabilitáshoz wrapper ref
  const testimonialsRef = useRef<HTMLDivElement>(null);

  // Pontosan 3 elemet kérünk a „kiemelt” sávba (ha van)
  const sliced = useMemo(
    () => (Array.isArray(testimonials) ? testimonials.slice(0, 3) : []),
    [testimonials]
  );

  // ——— AUTOPLAY ———
  useEffect(() => {
    if (!autorotate || sliced.length <= 1) return;
    const t = setInterval(() => {
      // funkcionális frissítés → mindig a legutóbbi state-ből számol
      setActive((prev) => (prev + 1 === sliced.length ? 0 : prev + 1));
    }, 7000);
    return () => clearInterval(t);
  }, [autorotate, sliced.length]);

  // ——— MAGASSÁG FIX ———
  // Ha az idézetek hossza eltér, a Transition miatt „ugrálhatna” a magasság — ezt simítjuk.
  const heightFix = () => {
    if (testimonialsRef.current?.parentElement) {
      testimonialsRef.current.parentElement.style.height = `${testimonialsRef.current.clientHeight}px`;
    }
  };
  useEffect(() => {
    heightFix();
    const vis = () => document.visibilityState === "visible" && heightFix();
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, []);

  // Ha nincs adat, nem renderelünk semmit (hookok már lefutottak)
  if (sliced.length === 0) return null;

  return (
    <section className="bg-white">
      <div className="max-w-3xl mx-auto relative z-30 h-80">
        <div className="relative pb-12 md:pb-20">
          {/* Finom particles-díszítés — Breaker Bay akcent */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-2 -z-10 w-80 h-20 -mt-6">
            <MemoizedSparklesCore
              id="testimonials-particles"
              background="transparent"
              minSize={0.4}
              maxSize={1}
              particleDensity={90}
              className="w-full h-full"
              particleColor="#5CB7AE" // Breaker Bay
            />
          </div>

          {/* Portré halo (maszkolt, világos témához) */}
          <div className="text-center">
            <div className="relative h-40 [mask-image:_linear-gradient(0deg,transparent,#FFFFFF_32%,#FFFFFF)] md:[mask-image:_linear-gradient(0deg,transparent,#FFFFFF_42%,#FFFFFF)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[480px] h-[480px] -z-10 pointer-events-none before:rounded-full rounded-full before:absolute before:inset-0 before:bg-gradient-to-b before:from-[#5CB7AE]/12 before:to-transparent before:to-20% after:rounded-full after:absolute after:inset-0 after:bg-white after:m-px before:-z-20 after:-z-20">
                {sliced.map((item: any, index: number) => (
                  <Transition
                    key={index}
                    show={active === index}
                    // Belépés: enyhe jobbról-balra mozgás + áttűnés
                    enter="transition ease-out duration-700 order-first"
                    enterFrom="opacity-0 -translate-x-5"
                    enterTo="opacity-100 translate-x-0"
                    // Kilépés: fordított irány, rövidebb idő
                    leave="transition ease-in duration-500"
                    leaveFrom="opacity-100 translate-x-0"
                    leaveTo="opacity-0 translate-x-5"
                    beforeEnter={() => heightFix()}
                  >
                    <div className="absolute inset-0 h-full -z-10">
                      <StrapiImage
                        className="relative top-11 left-1/2 -translate-x-1/2 rounded-full ring-2 ring-neutral-200"
                        src={item?.user?.image?.url}
                        width={56}
                        height={56}
                        alt={`${item?.user?.firstname ?? ""} ${item?.user?.lastname ?? ""}`}
                      />
                    </div>
                  </Transition>
                ))}
              </div>
            </div>

            {/* Idézet (nagyobb sortáv, kényelmes olvasás) */}
            <div className="mb-10 transition-all duration-150 delay-150 ease-out px-8 sm:px-6">
              <div className="relative flex flex-col" ref={testimonialsRef}>
                {sliced.map((item: any, index: number) => (
                  <Transition
                    key={index}
                    show={active === index}
                    enter="transition ease-out duration-500 order-first"
                    enterFrom="opacity-0 -translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-300 absolute"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                    beforeEnter={() => heightFix()}
                  >
                    <div className="text-base md:text-xl font-semibold text-neutral-900 leading-relaxed">
                      {item?.text}
                    </div>
                  </Transition>
                ))}
              </div>
            </div>

            {/* Választó gombok (pill) — olvasható, könnyű kontrasztok */}
            <div className="flex flex-wrap justify-center -m-1.5 px-8 sm:px-6">
              {sliced.map((item: any, index: number) => {
                const isActive = active === index;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setActive(index);
                      setAutorotate(false); // user interakció → állítsuk meg az autoplay-t
                    }}
                    className={`px-3 py-1.5 rounded-full m-1.5 text-xs transition duration-150 border
                      ${
                        isActive
                          ? "border-[#5CB7AE] text-neutral-900 bg-[#5CB7AE]/10"
                          : "border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50"
                      }`}
                    aria-label={`Váltás: ${item?.user?.firstname ?? ""} ${item?.user?.lastname ?? ""}`}
                  >
                    <span className="relative">
                      <span className="font-bold">
                        {(item?.user?.firstname ?? "") + " " + (item?.user?.lastname ?? "")}
                      </span>{" "}
                      <br className="block sm:hidden" />
                      <span className="text-neutral-400 hidden sm:inline-block">•</span>{" "}
                      <span className="hidden sm:inline-block">{item?.user?.job}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// A Particles komponens memózása: ne rendereljen feleslegesen
const MemoizedSparklesCore = memo(SparklesCore);
