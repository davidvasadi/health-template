// next/components/products/single-product.tsx 
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IconCheck, IconArrowRight } from "@tabler/icons-react";
import { Product } from "@/types/types";
import { StrapiImage } from "@/components/ui/strapi-image";
import { cn, formatNumber } from "@/lib/utils";
import { strapiImage } from "@/lib/strapi/strapiImage";
import { Link } from "next-view-transitions";
import { Button } from "../elements/button";
import { usePathname } from "next/navigation";

const spring = { type: "spring" as const, stiffness: 520, damping: 32, mass: 0.7 };
const REVERSE_GALLERY = false;

type StrapiImg = {
  url: string;
  alternativeText?: string | null;
  name?: string | null;
  createdAt?: string | null;
  order?: number | null;
};

type ExtractedCTA = {
  href: string;
  text: string;
  target?: "_blank" | "_self";
  variant?: string;
};

/* ── belső linkek lokalizálása; http/https érintetlen ─────────────────────── */
function localizeHref(url?: string, locale?: string) {
  if (!url) return "#";
  if (/^https?:\/\//i.test(url)) return url; // külső
  const clean = url.startsWith("/") ? url : `/${url}`;
  if (!locale) return clean;
  if (clean.startsWith(`/${locale}/`) || clean === `/${locale}`) return clean;
  return `/${locale}${clean}`;
}

/* ── CTA kinyerése: product.button → dynamic_zone → fallback ──────────────── */
function extractCTA(product: any, locale?: string): ExtractedCTA {
  // 1) KÖZVETLEN 'button' komponens
  if (product?.button) {
    const href = localizeHref(product.button.URL, locale);
    const text = product.button.text || "Foglalás";
    const target = product.button.target === "_blank" ? "_blank" : "_self";
    const variant = product.button.variant || "primary";
    return { href, text, target, variant };
  }

  // 2) dynamic_zone (ha ott lenne)
  const dz = product?.dynamic_zone;
  if (Array.isArray(dz)) {
    const btn =
      dz.find((b: any) => b?.__component === "shared.button") ||
      dz.find((b: any) => typeof b?.__component === "string" && /button/i.test(b.__component));
    if (btn) {
      const href = localizeHref(btn.URL || btn.url || btn.href, locale);
      const text = btn.text || btn.label || btn.title || "Foglalás";
      const target = btn.target === "_blank" ? "_blank" : "_self";
      const variant = btn.variant || "primary";
      return { href: href || "#", text, target, variant };
    }
  }

  // 3) fallback: contact
  const fb = product?.slug ? `/contact?product=${encodeURIComponent(product.slug)}` : "/contact";
  return { href: localizeHref(fb, locale), text: "Foglalás", target: "_self", variant: "primary" };
}

/* ── CSAK a két felirat lokális fordítása ─────────────────────────────────── */
const Labels = {
  en: { availableFor: "Available for", categories: "Categories" },
  hu: { availableFor: "Elérhető", categories: "Kategóriák" },
  de: { availableFor: "Verfügbar für", categories: "Kategorien" },
} as const;

export const SingleProduct = ({ product, locale }: { product: Product; locale?: string }) => {
  const pathname = usePathname();
  const activeLocale =
    (locale as keyof typeof Labels) ??
    (pathname?.startsWith("/hu") ? "hu" : pathname?.startsWith("/de") ? "de" : "en");
  const t = Labels[activeLocale] || Labels.en;

  /* Galéria normalizálás */
  const images = useMemo(() => {
    const raw = (product.images ?? []).filter(Boolean) as unknown as StrapiImg[];
    const withIdx = raw.map((img, idx) => ({ ...img, _idx: idx, url: strapiImage(img.url) }));
    withIdx.sort((a: any, b: any) => {
      const ao = a.order ?? null, bo = b.order ?? null;
      if (ao != null && bo != null && ao !== bo) return ao - bo;
      const ac = a.createdAt ? Date.parse(a.createdAt) : null;
      const bc = b.createdAt ? Date.parse(b.createdAt) : null;
      if (ac != null && bc != null && ac !== bc) return ac - bc;
      return a._idx - b._idx;
    });
    if (REVERSE_GALLERY) withIdx.reverse();
    return withIdx;
  }, [product.images]);

  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => setActiveIndex(0), [images.length]);

  const active = images[activeIndex];
  const activeUrl = active?.url ?? "";

  const galleryEnter = { initial: { opacity: 0, x: -26 }, animate: { opacity: 1, x: 0 } };
  const contentEnter = { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 } };

  /* Dinamikus CTA a Strapi-ból */
  const cta = useMemo(() => extractCTA(product, activeLocale), [product, activeLocale]);

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-3 md:p-8 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* GALÉRIA */}
        <motion.div initial={galleryEnter.initial} animate={galleryEnter.animate} transition={spring} className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl ring-1 ring-neutral-200 bg-white">
            {activeUrl ? (
              <StrapiImage
                key={`image-${activeIndex}`}
                src={activeUrl}
                alt={active?.alternativeText || active?.name || product.name}
                width={1200}
                height={1200}
                className={cn("w-full h-auto object-cover", "md:hover:scale-[1.02] transition-transform duration-300 ease-out")}
              />
            ) : null}
            <div className="hidden md:flex absolute top-4 right-4 items-center gap-2 rounded-full bg-white/75 backdrop-blur-xl border border-neutral-200 px-3 py-1 shadow-sm">
              <span className="text-sm font-semibold text-neutral-900">{product.name}</span>
              <span className="text-xs font-bold text-white bg-breaker-bay-700 rounded-full px-2 py-1">
                HUF {formatNumber(product.price)}
              </span>
            </div>
          </div>

          {!!images.length && (
            <div className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <button
                  key={`product-thumb-${i}`}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Show image ${i + 1}`}
                  className={cn(
                    "relative h-14 w-14 md:h-20 md:w-20 rounded-xl overflow-hidden border transition-all",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-breaker-bay-500",
                    i === activeIndex ? "border-neutral-900 ring-2 ring-neutral-400" : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  <StrapiImage src={img.url} alt={img?.alternativeText || img?.name || `${product.name} thumbnail ${i + 1}`} width={160} height={160} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* TARTALOM */}
        <motion.div initial={contentEnter.initial} animate={contentEnter.animate} transition={spring} className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight">{product.name}</h1>

          <p className="md:hidden mt-3 mb-5 inline-flex items-center gap-2 border-none md:rounded-full bg-white/85 backdrop-blur border border-neutral-200 px-0 md:px-2 py-0 md:py-1 text-xs font-semibold text-neutral-900">
            <span className="rounded-full bg-breaker-bay-700 text-white px-2 py-1">HUF {formatNumber(product.price)}</span>
          </p>

          {!!product.description && <p className="text-base text-neutral-700 leading-relaxed mb-6">{product.description}</p>}

          <Divider />

          {!!product.perks?.length && (
            <ul className="list-none mb-6 mt-6 space-y-2">
              {product.perks.map((perk, idx) => (
                <Step key={`perk-${idx}`}>{perk.text}</Step>
              ))}
            </ul>
          )}

          {!!product.plans?.length && (
            <>
              <h3 className="text-sm font-medium text-neutral-700 mb-2">{t.availableFor}</h3>
              <ul className="flex gap-2 flex-wrap mb-6">
                {product.plans.map((plan, idx) => (
                  <li key={`plan-${idx}`} className="bg-neutral-50 text-sm text-neutral-900 px-3 py-1 rounded-full border border-neutral-200">
                    {plan.name}
                  </li>
                ))}
              </ul>
            </>
          )}

          {!!product.categories?.length && (
            <>
              <h3 className="text-sm font-medium text-neutral-700 mb-2">{t.categories}</h3>
              <ul className="flex gap-2 flex-wrap mb-6">
                {product.categories.map((category, idx) => (
                  <li key={`category-${idx}`} className="bg-neutral-50 text-sm text-neutral-900 px-3 py-1 rounded-full border border-neutral-200">
                    {category.name}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* DINAMIKUS CTA A STRAPI-BÓL */}
          <div className="mt-auto pt-2">
            <Button
              as={Link}
              href={cta.href as never}
              {...(cta.target === "_blank" ? { target: "_blank" as const } : {})}
              aria-label={cta.text}
              className="group inline-flex items-center gap-2 rounded-xl w-full text-white px-5 py-3 font-medium shadow-sm hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
            >
              {cta.text}
              <IconArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Divider = () => (
  <div className="relative my-6">
    <div className="w-full h-px bg-neutral-100" />
    <div className="w-full h-px bg-neutral-200" />
  </div>
);

const Step = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-2 my-2.5">
    <div className="h-5 w-5 rounded-full bg-neutral-50 flex items-center justify-center flex-shrink-0 mt-0.5 border border-neutral-200">
      <IconCheck className="h-3.5 w-3.5 [stroke-width:4px] text-neutral-900" />
    </div>
    <div className="font-medium text-neutral-900 text-sm">{children}</div>
  </div>
);

export default SingleProduct;
