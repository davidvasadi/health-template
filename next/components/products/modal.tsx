"use client";
import React from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "../ui/animated-modal";
import { useCart } from "@/context/cart-context";
import { formatNumber } from "@/lib/utils";
import { IconTrash } from "@tabler/icons-react";
import { StrapiImage } from "@/components/ui/strapi-image";

export default function AddToCartModal({ onClick }: { onClick: () => void }) {
  const { items, updateQuantity, getCartTotal, removeFromCart } = useCart();

  return (
    <Modal>
      <ModalTrigger
        onClick={onClick}
        className="mt-10 w-full inline-flex items-center justify-center rounded-xl border border-breaker-bay-200 bg-breaker-bay-600 text-white px-4 py-2 font-medium shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-breaker-bay-400"
      >
        Add to cart
      </ModalTrigger>

      <ModalBody>
        <ModalContent>
          <h4 className="text-lg md:text-2xl text-breaker-bay-950 font-bold text-center mb-8">
            Your cart
          </h4>

          {!items.length && (
            <p className="text-center text-breaker-bay-800">
              Your cart is empty. Please purchase something.
            </p>
          )}

          <div className="flex flex-col divide-y divide-breaker-bay-100">
            {items.map((item, index) => (
              <div
                key={"purchased-item" + index}
                className="flex gap-2 justify-between items-center py-4"
              >
                <div className="flex items-center gap-4">
                  <StrapiImage
                    src={item.product?.images?.[0].url}
                    alt={item.product.name}
                    width={60}
                    height={60}
                    className="rounded-lg hidden md:block border border-breaker-bay-100"
                  />
                  <span className="text-breaker-bay-950 text-sm md:text-base font-medium">
                    {item.product.name}
                  </span>
                </div>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value > 0) updateQuantity(item.product, value);
                    }}
                    min="1"
                    step="1"
                    className="w-16 p-2 h-full rounded-md focus:outline-none bg-breaker-bay-50 border border-breaker-bay-200 focus:ring-2 focus:ring-breaker-bay-400 text-breaker-bay-950 mr-4"
                    style={{ WebkitAppearance: "none", MozAppearance: "textfield" }}
                  />
                  <div className="text-breaker-bay-950 text-sm font-medium w-20">
                    ${formatNumber(item.product.price)}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="ml-2 p-2 rounded-md hover:bg-breaker-bay-50 focus:outline-none focus:ring-2 focus:ring-breaker-bay-400"
                    aria-label={`Remove ${item.product.name}`}
                  >
                    <IconTrash className="w-4 h-4 text-breaker-bay-900" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ModalContent>

        <ModalFooter className="gap-4 items-center">
          <div className="text-breaker-bay-800">
            total amount{" "}
            <span className="font-bold text-breaker-bay-950">
              ${formatNumber(getCartTotal())}
            </span>
          </div>
          <button
            disabled={!items.length}
            className="bg-breaker-bay-600 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm px-4 py-2 rounded-xl border border-breaker-bay-200 shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-breaker-bay-400 w-28"
          >
            Buy now
          </button>
        </ModalFooter>
      </ModalBody>
    </Modal>
  );
}
