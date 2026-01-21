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

// Strapi v5 media: images[0].formats.*.url
function hasAnyImage(p: any): boolean {
  const x = unwrap(p);
  const imgs = x?.images;
  if (!Array.isArray(imgs) || imgs.length === 0) return false;
  const img0 = imgs[0];
  return Boolean(
    img0?.formats?.medium?.url ||
      img0?.formats?.small?.url ||
      img0?.formats?.thumbnail?.url ||
      img0?.url
  );
}

function getApiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  if (!raw) return ""; // ha nincs env, nem fetch-elünk

  // ha már /api-val végződik
  if (raw.endsWith("/api")) return raw;
  return `${raw}/api`;
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
  const [safeProducts, setSafeProducts] = useState<any[]>(products ?? []);

  useEffect(() => {
    const list = Array.isArray(products) ? products : [];
    setSafeProducts(list);

    // csak azokat kérjük le, amiknél tényleg nincs kép adat
    const missing = list
      .map(unwrap)
      .filter((p) => p?.slug)
      .filter((p) => !hasAnyImage(p))
      .map((p) => p.slug);

    const uniq = Array.from(new Set(missing));
    if (uniq.length === 0) return;

    const api = getApiBase();
    if (!api) return;

    // Strapi filter: filters[slug][$in]=a,b,c
    const inList = encodeURIComponent(uniq.join(","));
    const url = `${api}/products?locale=${encodeURIComponent(
      locale
    )}&populate=images&filters[slug][$in]=${inList}&pagination[pageSize]=100`;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;

        const json = await res.json();

        // Strapi lehet {data:[...]} vagy már tömb
        const fetched = (json?.data ?? json ?? []).map(unwrap);

        if (cancelled) return;

        // merge slug alapján
        setSafeProducts((prev) => {
          const prevList = Array.isArray(prev) ? prev.map(unwrap) : [];
          const bySlug = new Map<string, any>();
          for (const p of prevList) if (p?.slug) bySlug.set(p.slug, p);

          for (const fp of fetched) {
            if (fp?.slug) {
              const cur = bySlug.get(fp.slug) ?? fp;
              // fp.images jön a populate-ból -> felülírjuk
              bySlug.set(fp.slug, { ...cur, ...fp, images: fp.images ?? cur.images });
            }
          }
          return Array.from(bySlug.values());
        });
      } catch {
        // szándékosan csendben
      }
    })();

    return () => {
      cancelled = true;
    };
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
