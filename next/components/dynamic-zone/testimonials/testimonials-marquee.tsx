"use client";
import { cn } from "@/lib/utils";
import Marquee from "react-fast-marquee";
import React from "react";
import { StrapiImage } from "@/components/ui/strapi-image";

export const TestimonialsMarquee = ({ testimonials }: { testimonials: any[] }) => {
  const levelOne = testimonials.slice(0, 8);
  const levelTwo = testimonials.slice(8, 16);

  return (
    <div className="max-w-7xl mx-auto bg-white">
      {/* Felső sáv */}
      <div className="flex h-full relative">
        {/* Fehér → átlátszó maszkolás a széleken (fehér háttérhez igazítva) */}
        <div className="h-full absolute w-20 left-0 inset-y-0 z-30 bg-gradient-to-r from-white to-transparent" />
        <div className="h-full absolute w-20 right-0 inset-y-0 z-30 bg-gradient-to-l from-white to-transparent" />
        <Marquee pauseOnHover>
          {levelOne.map((t: any, i: number) => (
            <Card key={`t1-${t.id}-${i}`} className="max-w-xl h-56 mx-4">
              <Quote>{t?.text}</Quote>
              <Author t={t} />
            </Card>
          ))}
        </Marquee>
      </div>

      {/* Alsó sáv */}
      <div className="flex h-full relative mt-8">
        <div className="h-full absolute w-20 left-0 inset-y-0 z-30 bg-gradient-to-r from-white to-transparent" />
        <div className="h-full absolute w-20 right-0 inset-y-0 z-30 bg-gradient-to-l from-white to-transparent" />
        <Marquee direction="right" speed={20} pauseOnHover>
          {levelTwo.map((t: any, i: number) => (
            <Card key={`t2-${t.id}-${i}`} className="max-w-xl h-56 mx-4">
              <Quote>{t.text}</Quote>
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
      alt={`${t.user.firstname} ${t.user.lastname}`}
      width={44}
      height={44}
      className="rounded-full ring-2 ring-[var(--breaker-200)]"
    />
    <div className="flex flex-col">
      <p className="text-[var(--breaker-900)] font-semibold">
        {t.user.firstname} {t.user.lastname}
      </p>
      <p className="text-[var(--breaker-700)] text-sm">{t.user.job}</p>
    </div>
  </div>
);

/** Minimal + finom tech-vibe: fehér kártya, tiszta szegély, halk fényvonal felül */
export const Card = ({
  className,
  children,
}: { className?: string; children: React.ReactNode }) => (
  <div
    className={cn(
      "relative p-7 rounded-xl bg-white border border-[var(--breaker-200)] shadow-sm hover:shadow-md transition-shadow duration-300",
      // felső vékony „steril” fényvonal
      "before:absolute before:top-0 before:left-0 before:h-0.5 before:w-full before:bg-gradient-to-r before:from-[var(--breaker-300)] before:via-[var(--breaker-400)] before:to-[var(--breaker-300)]",
      className
    )}
  >
    {children}
  </div>
);

export const Quote = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h3
    className={cn(
      "text-[15px] leading-relaxed font-medium text-[var(--breaker-950)]",
      "pl-5 relative",
      // halvány függőleges vonal (orvosi/klinika vibe)
      "before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-[var(--breaker-100)]",
      className
    )}
  >
    {children}
  </h3>
);
