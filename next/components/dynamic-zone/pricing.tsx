"use client";

import React, { useMemo, useState } from "react";
import { Container } from "@/components/container";
import { FeatureIconContainer } from "./features/feature-icon-container";
import { Heading } from "@/components/elements/heading";
import { Subheading } from "@/components/elements/subheading";
import { IconCheck, IconPlus, IconReceipt2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/elements/button";

// ----- Types (Strapi-dinamika változatlan) -----
type Perks = { [key: string]: string };
type CTA = { [key: string]: string };
type Plan = {
  name: string;
  price: number;
  perks: Perks[];
  additional_perks: Perks[];
  description: string;
  number: string;
  featured?: boolean;
  CTA?: CTA | undefined;
};

// ----- Public API (változatlan) -----
export const Pricing = ({
  heading,
  sub_heading,
  plans,
}: {
  heading: string;
  sub_heading: string;
  plans: Plan[];
}) => {
  const onClick = (plan: Plan) => {
    // Strapi-hoz kötött logika itt kapcsolódhat – érintetlen
    console.log("click", plan);
  };

  return (
    <section className="pt-28 md:pt-36 bg-white">
      <Container>
        <FeatureIconContainer className="mx-auto flex justify-center items-center bg-white ring-1 ring-breaker-bay-200/70 shadow-none">
          <IconReceipt2 className="h-6 w-6 text-breaker-bay-700" />
        </FeatureIconContainer>

        <Heading as="h2" className="pt-4 text-breaker-bay-950">
          {heading}
        </Heading>
        <Subheading className="max-w-3xl mx-auto text-breaker-bay-900/75">
          {sub_heading}
        </Subheading>

        {/* Mobil nézet – egyszerű, letisztult, snap-es carousel */}
        <div className="lg:hidden -mx-4 px-4 pt-10">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-1">
            {plans.map((plan) => (
              <div key={plan.name} className="w-[85%] shrink-0 snap-center">
                <Card plan={plan} onClick={() => onClick(plan)} minimal />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop rács – tiszta, levegős elrendezés (max 2 kártya egymás mellett) */}
        <div className="hidden lg:grid grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-6 max-w-5xl mx-auto pt-12">
          {plans.map((plan) => (
            <Card key={plan.name} plan={plan} onClick={() => onClick(plan)} />
          ))}
        </div>
      </Container>
    </section>
  );
};

// ----- Card -----
const Card = ({
  plan,
  onClick,
  minimal = false,
}: {
  plan: Plan;
  onClick: () => void;
  minimal?: boolean;
}) => {
  const isFeatured = !!plan.featured;
  const primaryLimit = 4; // alapból 4 fő jellemző

  return (
    <article
      className={cn(
        "group relative rounded-2xl border bg-white",
        "border-breaker-bay-200/70 shadow-sm hover:shadow-md transition",
        isFeatured && "border-breaker-bay-600/80",
        minimal && "h-full"
      )}
    >
      <div className="p-5 md:p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-breaker-bay-950">{plan.name}</h3>
            {plan.description ? (
              <p className="mt-1 text-sm text-breaker-bay-700/90">{plan.description}</p>
            ) : null}
          </div>

          {isFeatured && (
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-breaker-bay-800 bg-breaker-bay-100 ring-1 ring-inset ring-breaker-bay-300/60">
              Featured
            </span>
          )}
        </header>

        {/* Ár / CTA – egyszerű hierarchia */}
        <div className="mt-6 flex items-baseline gap-2">
          {plan.price ? (
            <>
              <span className="text-base font-semibold text-breaker-bay-700">$</span>
              <span className="text-4xl md:text-5xl font-bold tracking-tight text-breaker-bay-950">{plan.price}</span>
              <span className="text-sm md:text-base font-normal text-breaker-bay-900/70">/ launch</span>
            </>
          ) : (
            <span className="text-2xl md:text-3xl font-bold text-breaker-bay-950">{plan?.CTA?.text}</span>
          )}
        </div>

        <Button
          variant="outline"
          className={cn(
            "mt-6 w-full rounded-xl",
            isFeatured
              ? "bg-breaker-bay-600 text-white hover:bg-breaker-bay-700"
              : "bg-white text-breaker-bay-950 ring-1 ring-inset ring-breaker-bay-300/70 hover:bg-breaker-bay-50"
          )}
          onClick={onClick}
          aria-label={`Válaszd: ${plan.name}`}
        >
          {plan?.CTA?.text}
        </Button>

        {/* Fő jellemzők */}
        <div className="mt-6">
          <PerkList perks={plan.perks} limit={primaryLimit} />
        </div>

        {/* Extra jellemzők – diszkrét elválasztóval */}
        {plan.additional_perks?.length ? (
          <>
            <Divider />
            <PerkList perks={plan.additional_perks} additional />
          </>
        ) : null}
      </div>
    </article>
  );
};

// ----- PerkList (alapból 4 elem + egyszerű toggle) -----
const PerkList = ({
  perks,
  limit = 4,
  additional = false,
}: {
  perks: Perks[];
  limit?: number;
  additional?: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  const visible = useMemo(() => (expanded ? perks : perks.slice(0, limit)), [expanded, perks, limit]);
  const hasMore = perks.length > limit;

  return (
    <div>
      <ul className="grid gap-2.5">
        {visible.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2.5">
            <span
              className={cn(
                "mt-0.5 h-5 w-5 flex-shrink-0 rounded-full ring-1 ring-inset ring-breaker-bay-300/60 grid place-items-center",
                additional ? "bg-breaker-bay-600" : "bg-breaker-bay-700"
              )}
            >
              <IconCheck className="h-3.5 w-3.5 [stroke-width:3px] text-white" />
            </span>
            <p className="text-sm font-medium text-breaker-bay-950">{feature.text}</p>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((s) => !s)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-breaker-bay-800 hover:text-breaker-bay-900"
          aria-expanded={expanded}
        >
          <IconPlus className={cn("h-4 w-4 [stroke-width:3px] transition-transform", expanded ? "rotate-45" : "")}/>
          {expanded ? "Kevesebb" : "További részletek"}
        </button>
      )}
    </div>
  );
};

// ----- Divider (letisztult) -----
const Divider = () => (
  <div className="my-6 h-px w-full bg-breaker-bay-100" />
);
