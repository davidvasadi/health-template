"use client";

import { useState, useRef, useEffect, memo } from "react";
import { Transition } from "@headlessui/react";
import { SparklesCore } from "../../ui/sparkles";
import { cn } from "@/lib/utils";
import { StrapiImage } from "@/components/ui/strapi-image";

export const TestimonialsSlider = ({ testimonials }: { testimonials: any[] }) => {
  const [active, setActive] = useState<number>(0);
  const [autorotate, setAutorotate] = useState<boolean>(true);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  const slicedTestimonials = testimonials.slice(0, 3);

  useEffect(() => {
    if (!autorotate) return;
    const interval = setInterval(() => {
      setActive(
        active + 1 === slicedTestimonials.length ? 0 : (active) => active + 1
      );
    }, 7000);
    return () => clearInterval(interval);
  }, [active, autorotate, slicedTestimonials.length]);

  const heightFix = () => {
    if (testimonialsRef.current && testimonialsRef.current.parentElement)
      testimonialsRef.current.parentElement.style.height = `${testimonialsRef.current.clientHeight}px`;
  };

  useEffect(() => {
    heightFix();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        heightFix();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <section className="bg-white">
      <div className="max-w-3xl mx-auto relative z-30 h-80">
        <div className="relative pb-12 md:pb-20">
          {/* Particles animation */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-2 -z-10 w-80 h-20 -mt-6">
            <MemoizedSparklesCore
              id="new-particles"
              background="transparent"
              minSize={0.4}
              maxSize={1}
              particleDensity={100}
              className="w-full h-full"
              particleColor="#0d5154" /* breaker-900 */
            />
          </div>

          {/* Carousel */}
          <div className="text-center">
            {/* Testimonial image halo */}
            <div className="relative h-40 [mask-image:_linear-gradient(0deg,transparent,#FFFFFF_30%,#FFFFFF)] md:[mask-image:_linear-gradient(0deg,transparent,#FFFFFF_40%,#FFFFFF)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[480px] h-[480px] -z-10 pointer-events-none before:rounded-full rounded-full before:absolute before:inset-0 before:bg-gradient-to-b before:from-[color:var(--breaker-200)]/30 before:to-transparent before:to-20% after:rounded-full after:absolute after:inset-0 after:bg-white after:m-px before:-z-20 after:-z-20">
                {slicedTestimonials.map((item: any, index: number) => (
                  <Transition
                    key={index}
                    show={active === index}
                    enter="transition ease-[cubic-bezier(0.68,-0.3,0.32,1)] duration-700 order-first"
                    enterFrom="opacity-0 -translate-x-20"
                    enterTo="opacity-100 translate-x-0"
                    leave="transition ease-[cubic-bezier(0.68,-0.3,0.32,1)] duration-700"
                    leaveFrom="opacity-100 translate-x-0"
                    leaveTo="opacity-0 translate-x-20"
                    beforeEnter={() => heightFix()}
                  >
                    <div className="absolute inset-0 h-full -z-10">
                      <StrapiImage
                        className="relative top-11 left-1/2 -translate-x-1/2 rounded-full ring-2 ring-[var(--breaker-200)]"
                        src={item.user.image.url}
                        width={56}
                        height={56}
                        alt={`${item.user.firstname} ${item.user.lastname}`}
                      />
                    </div>
                  </Transition>
                ))}
              </div>
            </div>

            {/* Text */}
            <div className="mb-10 transition-all duration-150 delay-300 ease-in-out px-8 sm:px-6">
              <div className="relative flex flex-col" ref={testimonialsRef}>
                {slicedTestimonials.map((item: any, index: number) => (
                  <Transition
                    key={index}
                    show={active === index}
                    enter="transition ease-in-out duration-500 delay-200 order-first"
                    enterFrom="opacity-0 -translate-x-4"
                    enterTo="opacity-100 translate-x-0"
                    leave="transition ease-out duration-300 delay-300 absolute"
                    leaveFrom="opacity-100 translate-x-0"
                    leaveTo="opacity-0 translate-x-4"
                    beforeEnter={() => heightFix()}
                  >
                    <div className="text-base md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[color:var(--breaker-800)] via-[color:var(--breaker-700)] to-[color:var(--breaker-800)]">
                      {item.text}
                    </div>
                  </Transition>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap justify-center -m-1.5 px-8 sm:px-6">
              {slicedTestimonials.map((item: any, index: number) => (
                <button
                  className={cn(
                    `px-3 py-1.5 rounded-full m-1.5 text-xs transition duration-150 ease-in-out
                     border
                     ${active === index
                      ? "border-[var(--breaker-500)] text-[var(--breaker-900)] bg-[var(--breaker-100)]"
                      : "border-[var(--breaker-200)] text-[var(--breaker-700)] bg-white hover:bg-[var(--breaker-50)]"
                     }`
                  )}
                  key={index}
                  onClick={() => {
                    setActive(index);
                    setAutorotate(false);
                  }}
                >
                  <span className="relative">
                    <span className="font-bold">
                      {item.user.firstname + " " + item.user.lastname}
                    </span>{" "}
                    <br className="block sm:hidden" />
                    <span className="text-[color:var(--breaker-400)] hidden sm:inline-block">•</span>{" "}
                    <span className="hidden sm:inline-block">
                      {item.user.job}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const MemoizedSparklesCore = memo(SparklesCore);
