"use client";

import React from "react";
import Marquee from "react-fast-marquee";
import { StrapiImage } from "@/components/ui/strapi-image";

/**
 * TestimonialsMarquee — két sorban gördülő „long read” kártyák
 */
export const TestimonialsMarquee = ({ testimonials }: { testimonials: any[] }) => {
  const levelOne = Array.isArray(testimonials) ? testimonials.slice(0, 8) : [];
  const levelTwo = Array.isArray(testimonials) ? testimonials.slice(8, 16) : [];

  if (levelOne.length === 0 && levelTwo.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto bg-white">
      {/* felső sáv */}
      <div className="flex h-full relative">
        <div className="h-full absolute w-20 left-0 inset-y-0 z-30 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        <div className="h-full absolute w-20 right-0 inset-y-0 z-30 bg-gradient-to-l from-white to-transparent pointer-events-none" />

        <Marquee pauseOnHover gradient={false} speed={24}>
          {levelOne.map((t: any, i: number) => (
            <Card key={`t1-${t?.id ?? i}`} className="max-w-xl min-h-[14rem] mx-4">
              <Quote>{t?.text}</Quote>
              <Author t={t} />
            </Card>
          ))}
        </Marquee>
      </div>

      {/* alsó sáv */}
      <div className="flex h-full relative mt-8">
        <div className="h-full absolute w-20 left-0 inset-y-0 z-30 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        <div className="h-full absolute w-20 right-0 inset-y-0 z-30 bg-gradient-to-l from-white to-transparent pointer-events-none" />

        <Marquee direction="right" pauseOnHover gradient={false} speed={22}>
          {levelTwo.map((t: any, i: number) => (
            <Card key={`t2-${t?.id ?? i}`} className="max-w-xl min-h-[14rem] mx-4">
              <Quote>{t?.text}</Quote>
              <Author t={t} />
            </Card>
          ))}
        </Marquee>
      </div>
    </div>
  );
};

const Author = ({ t }: { t: any }) => (
  <div className="flex gap-3 items-center mt-6">
    <StrapiImage
      src={t?.user?.image?.url}
      alt={`${t?.user?.firstname ?? ""} ${t?.user?.lastname ?? ""}`}
      width={44}
      height={44}
      className="rounded-full ring-2 ring-[#5CB7AE]/35"
    />
    <div className="flex flex-col">
      <p className="text-neutral-900 font-semibold">
        {(t?.user?.firstname ?? "")} {(t?.user?.lastname ?? "")}
      </p>
      <p className="text-neutral-600 text-sm break-words text-pretty hyphens-auto">
        {t?.user?.job}
      </p>
    </div>
  </div>
);

export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={`relative p-7 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-300
     before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[3px] before:rounded-full before:bg-[#5CB7AE]/25
     ${className ?? ""}`}
  >
    {children}
  </div>
);

export const Quote = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3 className={`text-[15px] leading-relaxed font-medium text-neutral-900 break-words text-pretty hyphens-auto ${className ?? ""}`}>
    {children}
  </h3>
);
