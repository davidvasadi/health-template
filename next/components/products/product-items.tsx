// next/components/products/product-items.tsx
"use client";

import React from "react";
import { Product } from "@/types/types";
import { formatNumber, truncate } from "@/lib/utils";
import { Link } from "next-view-transitions";
import { StrapiImage } from "@/components/ui/strapi-image";
import { motion } from "framer-motion";

const spring = { type: "spring" as const, stiffness: 520, damping: 30, mass: 0.7 };

export const ProductItems = ({
  heading = "Popular",
  sub_heading = "Recently rose to popularity",
  products,
  locale,
  baseSlug, // ✅ ÚJ
}: {
  heading?: string;
  sub_heading?: string;
  products: Product[];
  locale: string;
  baseSlug: string; // ✅ kötelező
}) => {
  if (!products?.length) return null;

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
        {products.map((product) => (
          <ProductItem
            key={"regular-product-item" + product.id}
            product={product}
            locale={locale}
            baseSlug={baseSlug}
          />
        ))}
      </motion.div>
    </section>
  );
};

const ProductItem = ({
  product,
  locale,
  baseSlug,
}: {
  product: Product;
  locale: string;
  baseSlug: string;
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: spring },
      }}
    >
      {/* ✅ Itt volt a hiba: /products/… → /{baseSlug}/… */}
      <Link href={`/${locale}/${baseSlug}/${product.slug}` as never} className="group relative block">
        <div className="relative rounded-3xl overflow-hidden bg-white ring-1 ring-neutral-200 shadow-sm hover:shadow-lg transition-shadow">
          <StrapiImage
            src={product?.images?.[0]?.url}
            alt={product.name}
            width={800}
            height={800}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 via-black/0 to-transparent" />
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center">
            <span className="text-neutral-900 text-base font-medium">
              {product.name}
            </span>
            <span className="bg-neutral-900 text-white shadow px-2 py-1 rounded-full text-xs font-semibold tabular-nums">
              HUF {formatNumber(product.price)}
            </span>
          </div>
          <p className="text-neutral-600 text-sm mt-2">
            {truncate(product.description, 100)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};
