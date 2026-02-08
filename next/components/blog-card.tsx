"use client";

import { Link } from "next-view-transitions";
import React from "react";
import Balancer from "react-wrap-balancer";
import { BlurImage } from "./blur-image";
import { truncate } from "@/lib/utils";
import { format } from "date-fns";
import { strapiImage } from "@/lib/strapi/strapiImage";
import { Article } from "@/types/types";
import { motion } from "framer-motion";

const spring = { type: "spring" as const, stiffness: 520, damping: 30, mass: 0.7 };

const Labels: Record<string, { read: string }> = {
  en: { read: "Read" },
  hu: { read: "Tovább" },
  de: { read: "Mehr" },
};

export const BlogCard = ({ article, locale }: { article: Article; locale: string }) => {
  const readLabel = Labels[locale]?.read || Labels.en.read;
  const href = `/${locale}/blog/${article.slug}`;

  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={spring} className="h-full">
      {/* OUTER CARD WRAPPER (képtől lefele kattintható !) */}
      <div
        className="
          group grid grid-cols-1 md:grid-rows-2 rounded-3xl overflow-hidden
          bg-white ring-1 ring-neutral-200 hover:ring-neutral-300
          transition-shadow shadow-sm hover:shadow-lg
          focus-within:outline-none focus-within:ring-2 focus-within:ring-breaker-bay-400/50
        "
      >
        {/* KÉP — NEM kattintható */}
        <div className="relative bg-neutral-100 md:h-full md:min-h-[300px] lg:min-h-[340px]">
          <div className="block md:hidden" aria-hidden style={{ paddingTop: "62.5%" }} />
          {article.image ? (
            <>
              <BlurImage
                src={strapiImage(article.image.url)}
                alt={article.title}
                width={1600}
                height={1000}
                className="
                  absolute inset-0 h-full w-full object-cover
                  transition-transform duration-300 group-hover:scale-[1.02]
                "
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent md:hidden" />
            </>
          ) : (
            <div className="absolute inset-0 bg-neutral-100" />
          )}
        </div>

        {/* TARTALOM — EZ kattintható */}
        <Link
          href={href}
          className="p-5 md:p-7 grid grid-rows-[auto_1fr_auto] gap-3 h-full outline-none"
          aria-label={`${article.title} – ${readLabel}`}
        >
          <div className="flex gap-1.5 flex-wrap">
            {article.categories?.map((c, i) => (
              <span
                key={c.name + i}
                className="text-[11px] font-semibold uppercase rounded-full bg-neutral-100 text-neutral-700 px-2 py-0.5 ring-1 ring-neutral-200"
              >
                {c.name}
              </span>
            ))}
          </div>

          <div className="min-w-0">
            <h3
              className="text-neutral-900 text-xl md:text-2xl font-bold tracking-tight leading-snug group-hover:text-breaker-bay-700 transition-colors"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical" as any,
                overflow: "hidden",
              }}
            >
              <Balancer>{article.title}</Balancer>
            </h3>

            {article.description ? (
              <p
                className="mt-2 text-neutral-600 text-sm md:text-base leading-relaxed"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical" as any,
                  overflow: "hidden",
                }}
              >
                {truncate(article.description, 220)}
              </p>
            ) : null}
          </div>

          <div className="mt-1 flex items-center gap-2 text-neutral-500 text-xs md:text-sm">
            <span>{article.publishedAt ? format(new Date(article.publishedAt), "MMMM dd, yyyy") : ""}</span>
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            <span className="relative inline-block">
              <span className="absolute -bottom-0.5 left-0 h-[2px] w-0 bg-neutral-700 transition-all duration-300 group-hover:w-full" />
              {readLabel}
            </span>
          </div>
        </Link>
      </div>
    </motion.div>
  );
};
