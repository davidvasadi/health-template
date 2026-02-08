"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ProductItems } from "@/components/products/product-items";

const PRODUCT_BASE: Record<string, string> = {
  hu: "szolgaltatasok",
  en: "products",
  de: "leistungen",
};

function unwrap(x: any) {
  return x?.attributes ?? x;
}

/** Strapi v5 képek lehetnek: images: []  VAGY images: { data: [] } */
function normalizeImagesField(product: any): any[] {
  const x = unwrap(product);
  const imgs = x?.images;

  if (Array.isArray(imgs)) return imgs.map(unwrap);

  const data = imgs?.data;
  if (Array.isArray(data)) return data.map(unwrap);

  return [];
}

/** Van-e ténylegesen használható kép URL */
function hasAnyImage(product: any): boolean {
  const imgs = normalizeImagesField(product);
  const img0 = imgs[0];
  if (!img0) return false;

  return Boolean(
    img0?.formats?.medium?.url ||
      img0?.formats?.small?.url ||
      img0?.formats?.thumbnail?.url ||
      img0?.url
  );
}

/** API base: ha nincs env a kliensben, essünk vissza same-origin /api-ra */
function getApiBase(): string {
  const raw = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    ""
  ).replace(/\/$/, "");

  if (!raw) return "/api";
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

/** Strapi $in filter stabilan: filters[slug][$in][0]=a ... */
function buildProductsUrl(apiBase: string, locale: string, slugs: string[]) {
  const params = new URLSearchParams();
  params.set("locale", locale);
  params.set("populate", "images");
  params.set("pagination[pageSize]", "100");

  slugs.forEach((slug, i) => {
    params.set(`filters[slug][$in][${i}]`, slug);
  });

  return `${apiBase}/products?${params.toString()}`;
}

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
  const [safeProducts, setSafeProducts] = useState<any[]>(() =>
    Array.isArray(products) ? products : []
  );

  useEffect(() => {
    const list = Array.isArray(products) ? products : [];
    setSafeProducts(list);

    // csak azok, ahol tényleg nincs kép
    const missingSlugs = list
      .map(unwrap)
      .filter((p) => p?.slug)
      .filter((p) => !hasAnyImage(p))
      .map((p) => String(p.slug).trim())
      .filter(Boolean);

    const uniq = Array.from(new Set(missingSlugs));
    if (uniq.length === 0) return;

    const apiBase = getApiBase();
    const url = buildProductsUrl(apiBase, locale, uniq);

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store", signal: controller.signal });
        if (!res.ok) return;

        const json = await res.json();
        const fetched = (json?.data ?? json ?? []).map(unwrap);

        // merge slug alapján (images normalizálva!)
        setSafeProducts((prev) => {
          const prevList = Array.isArray(prev) ? prev.map(unwrap) : [];
          const bySlug = new Map<string, any>();

          for (const p of prevList) {
            if (!p?.slug) continue;
            bySlug.set(String(p.slug), p);
          }

          for (const fp of fetched) {
            const slug = fp?.slug ? String(fp.slug) : "";
            if (!slug) continue;

            const cur = bySlug.get(slug) ?? fp;
            const images = normalizeImagesField(fp);
            bySlug.set(slug, { ...cur, ...fp, images: images.length ? images : cur.images });
          }

          return Array.from(bySlug.values());
        });
      } catch {
        // szándékosan csendben
      }
    })();

    return () => controller.abort();
  }, [products, locale]);

  const finalProducts = useMemo(() => safeProducts ?? [], [safeProducts]);

  return (
    <div className="mt-10">
      <ProductItems
        heading={heading}
        sub_heading={sub_heading}
        products={finalProducts}
        locale={locale}
        baseSlug={baseSlug}
      />
    </div>
  );
};
