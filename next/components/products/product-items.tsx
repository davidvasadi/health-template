"use client";

import React from "react";
import { Product } from "@/types/types";
import { formatNumber, truncate } from "@/lib/utils";
import { Link } from "next-view-transitions";
import { StrapiImage } from "@/components/ui/strapi-image";
import { motion } from "framer-motion";
import { strapiImage } from "@/lib/strapi/strapiImage";

const spring = { type: "spring" as const, stiffness: 520, damping: 30, mass: 0.7 };

/**
 * ✅ Strapi v5 / Document API media shape:
 * images: [
 *   { formats: { medium: { url }, thumbnail: { url } ... } }
 * ]
 *
 * Esetleg előfordulhat url is, de nálad a formats-os a biztos.
 */
function getProductImageUrl(p: any): string | null {
  const product = p?.attributes ?? p;
  const imgs = product?.images;

  if (!imgs) return null;

  // Ha már tömb (nálad ez van)
  if (Array.isArray(imgs) && imgs.length) {
    const img = imgs[0];
    return (
      img?.formats?.medium?.url ||
      img?.formats?.small?.url ||
      img?.formats?.thumbnail?.url ||
      img?.url || // fallback ha mégis van
      null
    );
  }

  // Ha valahol még v4-es lenne: images.data[0].attributes.url
  const v4 =
    imgs?.data?.[0]?.attributes?.url ||
    imgs?.data?.[0]?.url ||
    null;

  return v4;
}

export const ProductItems = ({
  heading = "Popular",
  sub_heading = "Recently rose to popularity",
  products,
  locale,
  baseSlug,
}: {
  heading?: string;
  sub_heading?: string;
  products: any[];
  locale: string;
  baseSlug: string;
}) => {
  const list = Array.isArray(products) ? products : [];
  if (!list.length) return null;

  return (
    <section className="py-16 md:py-20 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={spring}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl md:text-4xl font-semibold text-neutral-900 tracking-tight">
          {heading}
        </h2>
        <p className="text-neutral-600 text-base md:text-lg mt-3">
          {sub_heading}
        </p>
      </motion.div>

      <motion.div
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-10% 0% -10% 0%" }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      >
        {list.map((raw) => {
          const product = (raw as any)?.attributes ?? raw;
          return (
            <ProductItem
              key={"regular-product-item" + (product?.id ?? product?.slug ?? Math.random())}
              product={product as Product}
              raw={raw}
              locale={locale}
              baseSlug={baseSlug}
            />
          );
        })}
      </motion.div>
    </section>
  );
};

const ProductItem = ({
  product,
  raw,
  locale,
  baseSlug,
}: {
  product: Product;
  raw: any;
  locale: string;
  baseSlug: string;
}) => {
  const rel = getProductImageUrl(raw) || getProductImageUrl(product as any);
  const src = rel ? strapiImage(rel) : "";

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: spring },
      }}
    >
      <Link
        href={`/${locale}/${baseSlug}/${product.slug}` as never}
        className="group relative block"
      >
        <div
          className="
            relative rounded-3xl overflow-hidden bg-white ring-1
            ring-neutral-200 shadow-sm hover:shadow-lg
            transition-shadow aspect-[4/3]
          "
        >
          {src ? (
            <StrapiImage
              src={src}
              alt={product.name}
              width={900}
              height={700}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-neutral-100 text-sm text-neutral-500">
              Nincs kép
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 via-black/0 to-transparent" />
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center">
            <span className="text-neutral-900 text-base font-semibold">
              {product.name}
            </span>
            <span className="bg-[#057c80] w-[100px] text-center text-white shadow px-2 py-2 rounded-full text-xs font-semibold tabular-nums">
              HUF {formatNumber(product.price)}
            </span>
          </div>
          <p className="text-neutral-600 text-sm mt-2">
            {product.description ? truncate(product.description, 120) : ""}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};
