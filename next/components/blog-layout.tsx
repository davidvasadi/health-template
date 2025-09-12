"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import { Container } from "./container";
import { Link } from "next-view-transitions";
import { format } from "date-fns";
import { StrapiImage } from "@/components/ui/strapi-image";
import DynamicZoneManager from "./dynamic-zone/manager";
import { Article } from "@/types/types";
import { motion } from "framer-motion";

const spring = { type: "spring" as const, stiffness: 520, damping: 30, mass: 0.7 };

function BackLinkSimple({ locale }: { locale: string }) {
  const labels: Record<string, string> = {
    hu: "Vissza",
    en: "Back",
    de: "Zurück",
  };

  const label = labels[locale] ?? labels.en; // fallback angolra
  const href = `/${locale}/blog`;

  return (
    <div className="flex items-center gap-2 px-2 py-4">
      <Link href={href} className="flex items-center gap-2 group" aria-label={label}>
        <IconArrowLeft className="h-4 w-4 text-neutral-900 group-hover:text-breaker-bay-700 transition-colors" />
        <span className="text-sm text-neutral-900 group-hover:text-breaker-bay-700 transition-colors">
          {label}
        </span>
      </Link>
    </div>
  );
}

export function BlogLayout({
  article,
  locale,
  children,
}: {
  article: Article;
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <Container className="mt-12 md:mt-16 lg:mt-24">
      {/* egyszerű, lokalizált vissza link */}
      <BackLinkSimple locale={locale} />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="rounded-3xl overflow-hidden ring-1 ring-neutral-200 bg-white"
      >
        {article?.image ? (
          <StrapiImage
            src={article.image.url}
            height={1200}
            width={2000}
            className="h-[36vh] min-h-[260px] w-full object-cover"
            alt={article.title}
          />
        ) : (
          <div className="h-[36vh] min-h-[260px] w-full bg-neutral-100" />
        )}
      </motion.div>

      <div className="mx-auto max-w-3xl">
        <header className="mt-8">
          <h1 className="text-neutral-900 text-3xl md:text-5xl font-semibold tracking-tight">
            {article.title}
          </h1>
          <p className="mt-3 text-neutral-500 text-sm">
            {article.publishedAt ? format(new Date(article.publishedAt), "MMMM dd, yyyy") : ""}
          </p>
          <div className="mt-3 flex gap-2 flex-wrap">
            {article.categories?.map((c, i) => (
              <span
                key={c.name + i}
                className="text-[11px] font-normal uppercase rounded-full bg-neutral-100 text-neutral-700 px-2 py-1"
              >
                {c.name}
              </span>
            ))}
          </div>
        </header>

        <article className="prose prose-neutral mt-8 md:mt-10 max-w-none text-[17px] leading-relaxed">
          {children}
        </article>

        {article?.dynamic_zone && (
          <div className="mt-10 md:mt-12">
            <DynamicZoneManager dynamicZone={article.dynamic_zone} locale={locale} />
          </div>
        )}
      </div>
    </Container>
  );
}
