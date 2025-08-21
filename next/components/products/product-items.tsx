import React from "react";
import { Product } from "@/types/types";
import { formatNumber, truncate } from "@/lib/utils";
import { Link } from "next-view-transitions";
import { StrapiImage } from "@/components/ui/strapi-image";

export const ProductItems = ({
  heading = "Popular",
  sub_heading = "Recently rose to popularity",
  products,
  locale,
}: {
  heading?: string;
  sub_heading?: string;
  products: Product[];
  locale: string;
}) => {
  return (
    <div className="py-20 bg-white">
      <h2 className="text-2xl md:text-4xl font-semibold text-breaker-bay-950 mb-2">
        {heading}
      </h2>
      <p className="text-breaker-bay-800 text-lg mt-4 mb-10">
        {sub_heading}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductItem
            key={"regular-product-item" + product.id}
            product={product}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
};

const ProductItem = ({ product, locale }: { product: Product; locale: string }) => {
  return (
    <Link href={`/${locale}/products/${product.slug}` as never} className="group relative block">
      <div className="relative border border-breaker-bay-100 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-breaker-bay-950/20 transition-all duration-200 z-30" />
        <StrapiImage
          src={product?.images?.[0].url}
          alt={product.name}
          width={600}
          height={600}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center">
          <span className="text-breaker-bay-950 text-base font-medium">
            {product.name}
          </span>
          <span className="bg-breaker-bay-600 text-white shadow px-2 py-1 rounded-full text-xs font-semibold">
            ${formatNumber(product.price)}
          </span>
        </div>
        <p className="text-breaker-bay-800 text-sm mt-3">
          {truncate(product.description, 100)}
        </p>
      </div>
    </Link>
  );
};
