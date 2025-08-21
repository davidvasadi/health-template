import React from "react";
import { formatNumber } from "@/lib/utils";
import { Link } from "next-view-transitions";
import { Product } from "@/types/types";
import { StrapiImage } from "@/components/ui/strapi-image";

export const Featured = ({ products, locale }: { products: Product[]; locale: string }) => {
  return (
    <div className="py-20 bg-white">
      <h2 className="text-2xl md:text-4xl font-semibold text-breaker-bay-950 mb-2">
        Featured
      </h2>
      <p className="text-breaker-bay-800 text-lg mt-4 mb-10">
        Pick from our most popular collection
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
        <div className="md:col-span-2">
          <FeaturedItem product={products[0]} locale={locale} />
        </div>
        <div className="grid gap-1">
          <FeaturedItem product={products[1]} locale={locale} />
          <FeaturedItem product={products[2]} locale={locale} />
        </div>
      </div>
    </div>
  );
};

const FeaturedItem = ({ product, locale }: { product: Product; locale: string }) => {
  return (
    <Link
      href={`/${locale}/products/${product.slug}` as never}
      className="group border border-breaker-bay-100 rounded-2xl overflow-hidden relative block bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-breaker-bay-950/20 transition-all duration-200 z-30" />
      <div className="absolute text-sm top-4 right-3 md:top-6 md:right-6 z-40 rounded-full pr-1 pl-4 py-1 text-breaker-bay-950 font-medium flex gap-1 items-center bg-white/80 backdrop-blur-sm border border-breaker-bay-100 shadow-sm">
        <span className="whitespace-nowrap">{product.name}</span>
        <span className="bg-breaker-bay-600 text-white px-2 py-1 rounded-full font-semibold">
          ${formatNumber(product.price)}
        </span>
      </div>

      <StrapiImage
        src={product.images?.[0].url}
        alt={product.name}
        width={1000}
        height={1000}
        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </Link>
  );
};
