"use client";

import React from "react";
import Marquee from "react-fast-marquee";
import { StrapiImage } from "@/components/ui/strapi-image";

/**
 * TestimonialsMarquee — két sorban gördülő „long read” kártyák
 * ------------------------------------------------------------
 * • Fehér kártyák hajszál-szegéllyel, bal oldali Breaker Bay sávval
 * • Oldalsó fehér → átlátszó fade, hogy a scroll ne „ütközzön”
 * • Visszafogott sebességek (24 / 22), hogy maradjon olvasható
 */
export const TestimonialsMarquee = ({ testimonials }: { testimonials: any[] }) => {
  // Stabil védelem: csak tömb és legalább 1 elem esetén renderelünk
  const levelOne = Array.isArray(testimonials) ? testimonials.slice(0, 8) : [];
  const levelTwo = Array.isArray(testimonials) ? testimonials.slice(8, 16) : [];

  if (levelOne.length === 0 && levelTwo.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto bg-white">
      {/* Felső sáv — balról jobbra gördül */}
      <div className="flex h-full relative">
        {/* Fehér → átlátszó szélek (vizuális „maszk”) */}
        <div className="h-full absolute w-20 left-0 inset-y-0 z-30 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        <div className="h-full absolute w-20 right-0 inset-y-0 z-30 bg-gradient-to-l from-white to-transparent pointer-events-none" />

        <Marquee pauseOnHover gradient={false} speed={24}>
          {levelOne.map((t: any, i: number) => (
            <Card key={`t1-${t?.id ?? i}`} className="max-w-xl h-56 mx-4">
              <Quote>{t?.text}</Quote>
              <Author t={t} />
            </Card>
          ))}
        </Marquee>
      </div>

      {/* Alsó sáv — jobbról balra gördül (kontraszt az iránnyal) */}
      <div className="flex h-full relative mt-8">
        <div className="h-full absolute w-20 left-0 inset-y-0 z-30 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        <div className="h-full absolute w-20 right-0 inset-y-0 z-30 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        <Marquee direction="right" pauseOnHover gradient={false} speed={22}>
          {levelTwo.map((t: any, i: number) => (
            <Card key={`t2-${t?.id ?? i}`} className="max-w-xl h-56 mx-4">
              <Quote>{t?.text}</Quote>
              <Author t={t} />
            </Card>
          ))}
        </Marquee>
      </div>
    </div>
  );
};

/** Szerző blokk — avatar, név, pozíció (tördelésbiztos) */
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
      <p className="text-neutral-600 text-sm">{t?.user?.job}</p>
    </div>
  </div>
);

/** Kártya — letisztult fehér, bal oldali Breaker Bay „gerinc” sávval */
export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={
      `relative p-7 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-300
       before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[3px] before:rounded-full before:bg-[#5CB7AE]/25
       ${className ?? ""}`
    }
  >
    {children}
  </div>
);

/** Idézet tipó — közepes betű, kényelmes sortáv (long-read barát) */
export const Quote = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3 className={`text-[15px] leading-relaxed font-medium text-neutral-900 ${className ?? ""}`}>
    {children}
  </h3>
);
