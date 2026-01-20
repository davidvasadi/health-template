"use client";
import React from "react";
import { ProductItems } from "@/components/products/product-items";

const PRODUCT_BASE: Record<string, string> = {
  hu: "szolgaltatasok",
  en: "products",
  de: "leistungen",
};

export const RelatedProducts = ({
  heading,
  sub_heading,
  products,
  locale,
}: {
  heading: string;
  sub_heading: string;
  products: any[];
  locale: string;
}) => {
  const baseSlug = PRODUCT_BASE[locale] ?? "products";

  return (
    <div className="mt-10">
      <ProductItems
        heading={heading}
        sub_heading={sub_heading}
        products={products}
        locale={locale}
        baseSlug={baseSlug}
      />
    </div>
  );
};
