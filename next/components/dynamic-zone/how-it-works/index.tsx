"use client";

import React from "react";
import { Heading } from "../../elements/heading";
import { Subheading } from "../../elements/subheading";
import { Container } from "../../container";
import { FeatureIconContainer } from "../features/feature-icon-container";
import { IconSettings } from "@tabler/icons-react";
import { Card } from "./card";

export const HowItWorks = ({
  heading,
  sub_heading,
  steps,
}: {
  heading: string;
  sub_heading: string;
  steps: { title: string; description: string }[];
}) => {
  return (
    // nincs háttér-festés, semmi fehér „bevágás”
    <section className="relative bg-transparent">
      {/* ── Háttér: aurórák + pötty-rács + ÍVELT GERINC ── */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Aurórák – lágy perem, nem csinálnak szögletes sarkot */}
        <div
          className="absolute -top-24 -left-24 h-[42rem] w-[42rem] rounded-full blur-3xl"
          style={{
            opacity: 0.5,
            background:
              "radial-gradient(600px 400px at 30% 30%, rgba(81,247,240,0.24), rgba(4,200,200,0.12) 42%, rgba(255,255,255,0) 72%)",
            maskImage:
              "radial-gradient(60% 60% at 50% 50%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "radial-gradient(60% 60% at 50% 50%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div
          className="absolute -bottom-32 -right-24 h-[40rem] w-[40rem] rounded-full blur-3xl"
          style={{
            opacity: 0.46,
            background:
              "radial-gradient(560px 380px at 70% 60%, rgba(144,255,246,0.22), rgba(0,159,163,0.1) 44%, rgba(255,255,255,0) 72%)",
            maskImage:
              "radial-gradient(60% 60% at 50% 50%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "radial-gradient(60% 60% at 50% 50%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
          }}
        />

        {/* pötty-rács – finoman, hogy ne nyomja agyon a gerincet */}
        <div
          className="absolute inset-0 opacity-[0.08] text-breaker-bay-800"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 2px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* ÍVELT GERINC – előbb a „glow”, utána a fővonal, erősebb stroke */}
        <svg
          className="absolute left-1/2 -translate-x-1/2 top-10 h-[92%] w-[560px] max-w-[60vw]"
          viewBox="0 0 520 1600"
          aria-hidden
        >
          <defs>
            <linearGradient id="spineLine" x1="0" x2="1">
              <stop offset="0%" stopColor="rgba(0,159,163,0.0)" />
              <stop offset="50%" stopColor="rgba(0,159,163,0.6)" />
              <stop offset="100%" stopColor="rgba(0,159,163,0.0)" />
            </linearGradient>
            <radialGradient id="disc" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(199,255,250,0.95)" />
              <stop offset="100%" stopColor="rgba(199,255,250,0.22)" />
            </radialGradient>
          </defs>

          {/* halvány alávonal (glow) a kontrasztért */}
          <path
            d="M260 40 C 320 160, 210 300, 280 440 C 350 580, 210 740, 270 880 C 330 1020, 220 1160, 280 1320"
            fill="none"
            stroke="rgba(0,159,163,0.18)"
            strokeWidth="7"
            strokeLinecap="round"
            style={{ filter: "blur(6px)" }}
          />

          {/* fő „gerinc” vonal */}
          <path
            d="M260 40 C 320 160, 210 300, 280 440 C 350 580, 210 740, 270 880 C 330 1020, 220 1160, 280 1320"
            fill="none"
            stroke="url(#spineLine)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* „csigolyák” */}
          {Array.from({ length: 12 }).map((_, i) => {
            const y = 120 + i * 110;
            const x = 260 + (i % 2 ? 18 : -14);
            const rx = Math.max(20, 40 - i * 1.2);
            const ry = Math.max(12, 25 - i * 1.0);
            return (
              <g key={i} transform={`translate(${x}, ${y})`} opacity={0.95}>
                <ellipse
                  rx={rx + 6}
                  ry={ry + 4}
                  fill="rgba(0,159,163,0.12)"
                  style={{ filter: "blur(6px)" }}
                />
                <ellipse rx={rx} ry={ry} fill="url(#disc)" />
                <ellipse rx={rx - 8} ry={ry - 5} fill="rgba(255,255,255,0.8)" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Tartalom ── */}
      <Container className="py-20 md:py-28 max-w-7xl mx-auto relative z-10">
        {/* SEMMI fehér háttér – így nincs „fehér sarok” */}
        <FeatureIconContainer className="flex justify-center items-center overflow-hidden">
          <IconSettings className="h-6 w-6 text-breaker-bay-950" />
        </FeatureIconContainer>

        <Heading className="pt-4 text-breaker-bay-950">
          {heading}
        </Heading>

        <Subheading className="max-w-3xl mx-auto text-breaker-bay-900/80">
          {sub_heading}
        </Subheading>

        {/* MINDEN EGYMÁS ALATT – nincs grid, csak függőleges lista */}
        <div className="mt-8 space-y-6">
          {steps?.map((item, index) => (
            <Card
              key={`card-${index}`}
              title={item.title}
              description={item.description}
              index={index + 1}
            />
          ))}
        </div>
      </Container>
    </section>
  );
};
