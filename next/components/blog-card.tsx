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

/** --- BlogCard (horizontális, 2 oszlop) --- */
export const BlogCard = ({ article, locale }: { article: Article; locale: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={spring}
      viewport={{ once: true }}
    >
      <Link
        href={`/${locale}/blog/${article.slug}`}
        className="grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden bg-white ring-1 ring-neutral-200 hover:ring-neutral-300 transition-shadow shadow-sm hover:shadow-lg"
      >
        <div className="relative">
          {article.image ? (
            <BlurImage
              src={strapiImage(article.image.url)}
              alt={article.title}
              width={1200}
              height={900}
              className="h-full w-full object-cover transition-transform duration-400 hover:scale-[1.03]"
            />
          ) : (
            <div className="h-full min-h-56 bg-neutral-100" />
          )}
        </div>

        <div className="p-5 md:p-7">
          <div className="mb-2 flex gap-2 flex-wrap">
            {article.categories?.map((c, i) => (
              <span
                key={c.name + i}
                className="text-[11px] font-semibold uppercase rounded-full bg-neutral-100 text-neutral-700 px-2 py-1"
              >
                {c.name}
              </span>
            ))}
          </div>

          <h3 className="text-neutral-900 text-2xl font-bold tracking-tight">
            <Balancer>{article.title}</Balancer>
          </h3>

          <p className="mt-2 text-neutral-600">{truncate(article.description, 200)}</p>

          <div className="mt-4 flex items-center gap-2 text-neutral-500 text-xs">
            <span>{format(new Date(article.publishedAt), "MMMM dd, yyyy")}</span>
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            <span className="relative inline-block">
              <span className="absolute -bottom-0.5 left-0 h-[2px] w-0 bg-neutral-700 transition-all duration-300 group-hover:w-full" />
              Read
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

/** --- BlogCardVertical (függőleges kártya) --- */
export const BlogCardVertical = ({ article, locale }: { article: Article; locale: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={spring}
      viewport={{ once: true }}
    >
      <Link
        href={`/${locale}/blog/${article.slug}`}
        className="block rounded-3xl overflow-hidden bg-white ring-1 ring-neutral-200 hover:ring-neutral-300 transition-shadow shadow-sm hover:shadow-lg"
      >
        {/* kép */}
        <div className="relative">
          {article.image ? (
            <BlurImage
              src={strapiImage(article.image.url)}
              alt={article.title}
              width={1200}
              height={800}
              className="h-64 md:h-96 w-full object-cover transition-transform duration-400 hover:scale-[1.03]"
            />
          ) : (
            <div className="h-64 md:h-96 w-full bg-neutral-100" />
          )}
        </div>

        {/* tartalom */}
        <div className="p-5 md:p-7">
          <div className="mb-2 flex gap-2 flex-wrap">
            {article.categories?.map((c, i) => (
              <span
                key={c.name + i}
                className="text-[11px] font-semibold uppercase rounded-full bg-neutral-100 text-neutral-700 px-2 py-1"
              >
                {c.name}
              </span>
            ))}
          </div>

          <h3 className="text-neutral-900 text-xl md:text-2xl font-bold tracking-tight">
            <Balancer>{article.title}</Balancer>
          </h3>

          <p className="mt-2 text-neutral-600 text-sm md:text-base">
            {truncate(article.description, 200)}
          </p>

          <div className="mt-4 flex items-center gap-2 text-neutral-500 text-xs">
            <span>{format(new Date(article.publishedAt), "MMMM dd, yyyy")}</span>
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            <span className="relative inline-block">
              <span className="absolute -bottom-0.5 left-0 h-[2px] w-0 bg-neutral-700 transition-all duration-300 group-hover:w-full" />
              Read
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
