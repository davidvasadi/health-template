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
    <section className="relative isolate overflow-hidden bg-white">
      {/* Felső finom seam-fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-16 md:h-24"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,0))",
        }}
      />

      {/* Háttér: két lágy mesh-blob */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-32 -left-24 h-[34rem] w-[34rem] blur-3xl"
          style={{
            opacity: 0.35,
            background:
              "radial-gradient(40% 45% at 40% 40%, rgba(4,200,200,0.25), rgba(81,247,240,0.12) 45%, rgba(255,255,255,0) 70%)",
            maskImage:
              "radial-gradient(60% 60% at 50% 50%, black 60%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(60% 60% at 50% 50%, black 60%, transparent 100%)",
          }}
        />
        <div
          className="absolute -bottom-40 -right-24 h-[36rem] w-[36rem] blur-3xl"
          style={{
            opacity: 0.32,
            background:
              "radial-gradient(42% 48% at 60% 60%, rgba(0,159,163,0.22), rgba(144,255,246,0.14) 46%, rgba(255,255,255,0) 72%)",
            maskImage:
              "radial-gradient(58% 58% at 50% 50%, black 62%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(58% 58% at 50% 50%, black 62%, transparent 100%)",
          }}
        />

        {/* FLOW-vonalak: a TELJES szekciót kitöltik (top-0, bottom-0) */}
        <svg
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 h-full w-[1100px] max-w-none opacity-70"
          viewBox="0 0 900 2400"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="flowStroke" x1="0" x2="1">
              <stop offset="0%" stopColor="rgba(0,159,163,0)" />
              <stop offset="50%" stopColor="rgba(0,159,163,0.45)" />
              <stop offset="100%" stopColor="rgba(0,159,163,0)" />
            </linearGradient>
          </defs>

          {/* 3 egymásba úszó görbe – végigérnek az aljáig */}
          <path
            d="M450 60 C 540 260, 360 520, 540 760 C 690 960, 360 1220, 540 1480 C 690 1680, 380 1960, 520 2220"
            fill="none"
            stroke="url(#flowStroke)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M420 100 C 560 300, 340 560, 500 820 C 680 1080, 340 1340, 520 1600 C 660 1820, 360 2060, 480 2300"
            fill="none"
            stroke="url(#flowStroke)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M480 40 C 600 240, 380 500, 560 740 C 640 980, 380 1240, 560 1500 C 640 1740, 400 2000, 520 2320"
            fill="none"
            stroke="url(#flowStroke)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </svg>

        {/* Alsó kifutó fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 md:h-16"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))",
          }}
        />
      </div>

      {/* Tartalom (egymás alatt) */}
      <Container className="py-20 md:py-28 max-w-7xl mx-auto relative z-0">
        <FeatureIconContainer className="flex justify-center items-center">
          <IconSettings className="h-6 w-6 text-breaker-bay-950" />
        </FeatureIconContainer>

        <Heading className="pt-4 text-breaker-bay-950">
          {heading}
        </Heading>

        <Subheading className="max-w-3xl mx-auto text-breaker-bay-900/80">
          {sub_heading}
        </Subheading>

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
