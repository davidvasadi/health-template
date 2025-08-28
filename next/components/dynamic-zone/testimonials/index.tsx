"use client";
import React from "react";
import { TestimonialsSlider } from "./slider";
import { TestimonialsMarquee } from "./testimonials-marquee";
import { FeatureIconContainer } from "../features/feature-icon-container";
import { Heading } from "../../elements/heading";
import { Subheading } from "../../elements/subheading";
import { TbLocationBolt } from "react-icons/tb";
import { AmbientColor } from "../../decorations/ambient-color";

export const Testimonials = ({
  heading,
  sub_heading,
  testimonials,
}: {
  heading: string;
  sub_heading: string;
  testimonials: any[];
}) => {
  return (
    <div className="relative bg-white">
      <AmbientColor />

      {/* Fejléc: minimal + orvosi ikon finom keretben */}
      <div className="pb-16 text-center">
        <FeatureIconContainer className="mx-auto flex h-12 w-12 items-center justify-center  bg-white text-[var(--breaker-700)]  shadow-sm">
          <TbLocationBolt className="h-6 w-6" />
        </FeatureIconContainer>

        <Heading className="pt-4 text-[var(--breaker-950)]">{heading}</Heading>
        <Subheading className="text-[var(--breaker-700)] mt-1">
          {sub_heading}
        </Subheading>
      </div>

      {testimonials && (
        <div className="relative md:py-16 pb-16">
          <TestimonialsSlider testimonials={testimonials} />
          {/* Marquee külön fehér szakaszban, visszafogott elválasztóval */}
          <div className="h-full w-full mt-16 bg-white">
            <div className="max-w-7xl mx-auto px-4">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--breaker-200)] to-transparent mb-8" />
            </div>
            <TestimonialsMarquee testimonials={testimonials} />
          </div>
        </div>
      )}
    </div>
  );
};
