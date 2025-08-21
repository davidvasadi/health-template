"use client";
import React, { useState } from "react";
import { Product } from "@/types/types";
import { motion } from "framer-motion";
import { StrapiImage } from "@/components/ui/strapi-image";
import { IconCheck } from "@tabler/icons-react";
import { cn, formatNumber } from "@/lib/utils";
import AddToCartModal from "@/components/products/modal";
import { useCart } from "@/context/cart-context";
import { strapiImage } from "@/lib/strapi/strapiImage";

export const SingleProduct = ({ product }: { product: Product }) => {
  const [activeThumbnail, setActiveThumbnail] = useState(strapiImage(product.images[0].url));
  const { addToCart } = useCart();

  return (
    <div className="bg-white p-4 md:p-10 rounded-2xl border border-breaker-bay-100 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <motion.div
            initial={{ x: 50 }}
            animate={{ x: 0 }}
            exit={{ x: 50 }}
            key={activeThumbnail}
            className="rounded-2xl relative overflow-hidden border border-breaker-bay-100 bg-white"
            transition={{ type: "spring", stiffness: 260, damping: 35 }}
          >
            <StrapiImage
              src={activeThumbnail}
              alt={product.name}
              width={600}
              height={600}
              className="rounded-2xl object-cover"
            />
          </motion.div>

          <div className="flex gap-3 justify-center items-center mt-4">
            {product.images &&
              product.images.map((image, index) => {
                const url = strapiImage(image.url);
                const isActive = activeThumbnail === url;
                return (
                  <button
                    onClick={() => setActiveThumbnail(url)}
                    key={"product-image" + index}
                    className={cn(
                      "h-20 w-20 rounded-xl border",
                      isActive
                        ? "border-breaker-bay-600 ring-2 ring-breaker-bay-400"
                        : "border-breaker-bay-200"
                    )}
                    style={{
                      backgroundImage: `url(${url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                    aria-label={`Show image ${index + 1}`}
                  />
                );
              })}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4 text-breaker-bay-950">
            {product.name}
          </h2>
          <p className="mb-6 bg-breaker-bay-600 text-white text-xs px-4 py-1 rounded-full w-fit font-semibold">
            ${formatNumber(product.price)}
          </p>
          <p className="text-base font-normal mb-6 text-breaker-bay-800">
            {product.description}
          </p>

          <Divider />

          <ul className="list-none mb-6 mt-6">
            {product.perks && product.perks.map((perk, index) => <Step key={index}>{perk.text}</Step>)}
          </ul>

          <h3 className="text-sm font-medium text-breaker-bay-800 mb-2">
            Available for
          </h3>
          <ul className="list-none flex gap-2 flex-wrap mb-6">
            {product.plans &&
              product.plans.map((plan, index) => (
                <li
                  key={index}
                  className="bg-breaker-bay-50 text-sm text-breaker-bay-950 px-3 py-1 rounded-full border border-breaker-bay-200"
                >
                  {plan.name}
                </li>
              ))}
          </ul>

          <h3 className="text-sm font-medium text-breaker-bay-800 mb-2">
            Categories
          </h3>
          <ul className="flex gap-2 flex-wrap mb-6">
            {product.categories &&
              product.categories?.map((category, idx) => (
                <li
                  key={`category-${idx}`}
                  className="bg-breaker-bay-50 text-sm text-breaker-bay-950 px-3 py-1 rounded-full border border-breaker-bay-200"
                >
                  {category.name}
                </li>
              ))}
          </ul>

          <AddToCartModal onClick={() => addToCart(product)} />
        </div>
      </div>
    </div>
  );
};

const Divider = () => {
  return (
    <div className="relative my-6">
      <div className="w-full h-px bg-breaker-bay-50" />
      <div className="w-full h-px bg-breaker-bay-200" />
    </div>
  );
};

const Step = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-start justify-start gap-2 my-3">
      <div className="h-5 w-5 rounded-full bg-breaker-bay-50 flex items-center justify-center flex-shrink-0 mt-0.5 border border-breaker-bay-200">
        <IconCheck className="h-3.5 w-3.5 [stroke-width:4px] text-breaker-bay-900" />
      </div>
      <div className="font-medium text-breaker-bay-950 text-sm">{children}</div>
    </div>
  );
};
