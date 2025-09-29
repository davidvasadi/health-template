"use client";

import React, { useEffect, useMemo, useRef, useState, memo } from "react";
import { Transition } from "@headlessui/react";
import { SparklesCore } from "@/components/ui/sparkles";
import { StrapiImage } from "@/components/ui/strapi-image";

export const TestimonialsSlider = ({ testimonials }: { testimonials: any[] }) => {
  const [active, setActive] = useState(0);
  const [autorotate, setAutorotate] = useState(true);

  const testimonialsRef = useRef<HTMLDivElement>(null);

  const sliced = useMemo(
    () => (Array.isArray(testimonials) ? testimonials.slice(0, 3) : []),
    [testimonials]
  );

  useEffect(() => {
    if (!autorotate || sliced.length <= 1) return;
    const t = setInterval(() => {
      setActive((prev) => (prev + 1 === sliced.length ? 0 : prev + 1));
    }, 7000);
    return () => clearInterval(t);
  }, [autorotate, sliced.length]);

  // >>> FIX: minHeight-et állítunk, ne vágja le a hosszabb idézetet és ne csússzon rá az alatta lévő gombsorra
  const heightFix = () => {
    if (testimonialsRef.current?.parentElement) {
      const parent = testimonialsRef.current.parentElement as HTMLElement;
      parent.style.minHeight = `${testimonialsRef.current.clientHeight}px`;
    }
  };
  useEffect(() => {
    heightFix();
    const vis = () => document.visibilityState === "visible" && heightFix();
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, []);

  if (sliced.length === 0) return null;

  return (
    <section className="bg-white">
      {/* rugalmas minimum, hogy hosszú idézetnél se legyen összeérés */}
      <div className="max-w-3xl mx-auto relative z-30 min-h-[20rem]">
        <div className="relative pb-12 md:pb-20">
          <div className="absolute left-1/2 -translate-x-1/2 -top-2 -z-10 w-80 h-20 -mt-6">
            <MemoizedSparklesCore
              id="testimonials-particles"
              background="transparent"
              minSize={0.4}
              maxSize={1}
              particleDensity={90}
              className="w-full h-full"
              particleColor="#5CB7AE"
            />
          </div>

          <div className="text-center space-y-6 md:space-y-8">
            {/* Portré/halo blokk (fix magasság, így nem csúszik le) */}
            <div className="relative h-40 [mask-image:_linear-gradient(0deg,transparent,#FFFFFF_32%,#FFFFFF)] md:[mask-image:_linear-gradient(0deg,transparent,#FFFFFF_42%,#FFFFFF)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[480px] h-[480px] -z-10 pointer-events-none before:rounded-full rounded-full before:absolute before:inset-0 before:bg-gradient-to-b before:from-[#5CB7AE]/12 before:to-transparent before:to-20% after:rounded-full after:absolute after:inset-0 after:bg-white after:m-px before:-z-20 after:-z-20">
                {sliced.map((item: any, index: number) => (
                  <Transition
                    key={index}
                    show={active === index}
                    enter="transition ease-out duration-700 order-first"
                    enterFrom="opacity-0 -translate-x-5"
                    enterTo="opacity-100 translate-x-0"
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

            {/* Idézetek konténer — >>> FIX: overflow-hidden, hogy a kilépő réteg ne lógjon rá az alatta lévő vezérlőkre */}
            <div className="mb-10 transition-all duration-150 delay-150 ease-out px-8 sm:px-6">
              <div className="relative flex flex-col overflow-hidden" ref={testimonialsRef}>
                {sliced.map((item: any, index: number) => (
                  <Transition
                    key={index}
                    show={active === index}
                    enter="transition ease-out duration-500 order-first"
                    enterFrom="opacity-0 -translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    // >>> FIX: absolute helyett absolute + inset-0, hogy a kilépő példány pont ugyanoda legyen pozicionálva
                    leave="transition ease-in duration-300 absolute inset-0"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                    beforeEnter={() => heightFix()}
                  >
                    <div className="text-base md:text-xl font-semibold text-neutral-900 leading-relaxed break-words text-pretty hyphens-auto">
                      {item?.text}
                    </div>
                  </Transition>
                ))}
              </div>
            </div>

            {/* Választó gombok */}
            <div className="flex flex-wrap justify-center -m-1.5 px-8 sm:px-6">
              {sliced.map((item: any, index: number) => {
                const isActive = active === index;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setActive(index);
                      setAutorotate(false);
                    }}
                    className={`px-3 py-1.5 rounded-full m-1.5 text-xs transition duration-150 border ${
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

const MemoizedSparklesCore = memo(SparklesCore);
