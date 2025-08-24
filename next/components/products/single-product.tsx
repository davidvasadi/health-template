"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IconCheck } from "@tabler/icons-react";
import { Product } from "@/types/types";
import { StrapiImage } from "@/components/ui/strapi-image";
import AddToCartModal from "@/components/products/modal";
import { useCart } from "@/context/cart-context";
import { cn, formatNumber } from "@/lib/utils";
import { strapiImage } from "@/lib/strapi/strapiImage";

const spring = { type: "spring" as const, stiffness: 520, damping: 32, mass: 0.7 };

// ha a Strapi következetesen fordított sorrendben adná vissza a képeket, állítsd true-ra
const REVERSE_GALLERY = false;

type StrapiImg = {
  url: string;
  alternativeText?: string | null;
  name?: string | null;
  createdAt?: string | null;
  order?: number | null; // ha van ilyen meződ
};

export const SingleProduct = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();

  // 1) Normalizált, determinisztikusan rendezett képek (nem fognak “felcserélődni”)
  const images = useMemo(() => {
    const raw = (product.images ?? []).filter(Boolean) as unknown as StrapiImg[];

    const withIdx = raw.map((img, idx) => ({
      ...img,
      _idx: idx,
      url: strapiImage(img.url), // abszolút URL biztosítása
    }));

    withIdx.sort((a: any, b: any) => {
      const ao = a.order ?? null;
      const bo = b.order ?? null;
      if (ao != null && bo != null && ao !== bo) return ao - bo;

      const ac = a.createdAt ? Date.parse(a.createdAt) : null;
      const bc = b.createdAt ? Date.parse(b.createdAt) : null;
      if (ac != null && bc != null && ac !== bc) return ac - bc;

      return a._idx - b._idx; // fallback: eredeti sorrend
    });

    if (REVERSE_GALLERY) withIdx.reverse();
    return withIdx;
  }, [product.images]);

  // 2) Index-alapú state (stabil)
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => setActiveIndex(0), [images.length]);

  const active = images[activeIndex];
  const activeUrl = active?.url ?? "";

  // belépő animációk
  const galleryEnter = { initial: { opacity: 0, x: -26 }, animate: { opacity: 1, x: 0 } };
  const contentEnter = { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 } };

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-5 md:p-8 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* GALÉRIA */}
        <motion.div
          initial={galleryEnter.initial}
          animate={galleryEnter.animate}
          transition={spring}
          className="space-y-4"
        >
          {/* fő kép */}
          <div className="relative overflow-hidden rounded-2xl ring-1 ring-neutral-200 bg-white">
            {activeUrl ? (
              <StrapiImage
                key={`image-${activeIndex}`}
                src={activeUrl}
                alt={active?.alternativeText || active?.name || product.name}
                width={1200}
                height={1200}
                className={cn(
                  "w-full h-auto object-cover",
                  "md:hover:scale-[1.02] transition-transform duration-300 ease-out"
                )}
              />
            ) : null}

            {/* ár-pill a képen (desktop) */}
            <div className="hidden md:flex absolute top-4 right-4 items-center gap-2 rounded-full bg-white/75 backdrop-blur-xl border border-neutral-200 px-3 py-1 shadow-sm">
              <span className="text-sm font-semibold text-neutral-900">{product.name}</span>
              <span className="text-xs font-bold text-white bg-breaker-bay-700 rounded-full px-2 py-1">
                HUF {formatNumber(product.price)}
              </span>
            </div>
          </div>

          {/* thumbs */}
          {!!images.length && (
            <div className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <button
                  key={`product-thumb-${i}`}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Show image ${i + 1}`}
                  className={cn(
                    "relative h-20 w-20 rounded-xl overflow-hidden border transition-all",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-breaker-bay-500",
                    i === activeIndex
                      ? "border-neutral-900 ring-2 ring-neutral-400"
                      : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  <StrapiImage
                    src={img.url}
                    alt={img?.alternativeText || img?.name || `${product.name} thumbnail ${i + 1}`}
                    width={160}
                    height={160}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* TARTALOM */}
        <motion.div
          initial={contentEnter.initial}
          animate={contentEnter.animate}
          transition={spring}
          className="flex flex-col"
        >
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight">
            {product.name}
          </h1>

          {/* ár – üveg hatású pill (mobil) */}
          <p className="md:hidden mt-3 mb-5 inline-flex items-center gap-2 rounded-full bg-white/85 backdrop-blur border border-neutral-200 px-4 py-1 text-xs font-semibold text-neutral-900 shadow-sm">
            <span className="rounded-full bg-breaker-bay-700 text-white px-2 py-1">
              HUF {formatNumber(product.price)}
            </span>
          </p>

          {!!product.description && (
            <p className="text-base text-neutral-700 leading-relaxed mb-6">
              {product.description}
            </p>
          )}

          <Divider />

          {/* Perkek */}
          {!!product.perks?.length && (
            <ul className="list-none mb-6 mt-6 space-y-2">
              {product.perks.map((perk, idx) => (
                <Step key={`perk-${idx}`}>{perk.text}</Step>
              ))}
            </ul>
          )}

          {/* Tervek */}
          {!!product.plans?.length && (
            <>
              <h3 className="text-sm font-medium text-neutral-700 mb-2">Available for</h3>
              <ul className="flex gap-2 flex-wrap mb-6">
                {product.plans.map((plan, idx) => (
                  <li
                    key={`plan-${idx}`}
                    className="bg-neutral-50 text-sm text-neutral-900 px-3 py-1 rounded-full border border-neutral-200"
                  >
                    {plan.name}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Kategóriák */}
          {!!product.categories?.length && (
            <>
              <h3 className="text-sm font-medium text-neutral-700 mb-2">Categories</h3>
              <ul className="flex gap-2 flex-wrap mb-6">
                {product.categories.map((category, idx) => (
                  <li
                    key={`category-${idx}`}
                    className="bg-neutral-50 text-sm text-neutral-900 px-3 py-1 rounded-full border border-neutral-200"
                  >
                    {category.name}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* CTA */}
          <div className="mt-auto pt-2">
            {/* Ha akarod, átadhatsz className-t is a kontrasztos hoverhez */}
            <AddToCartModal onClick={() => addToCart(product)} />
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

// ✅ Legyen default export IS, hogy ne legyen “undefined” import
export default SingleProduct;
