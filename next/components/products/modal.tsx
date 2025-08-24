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
import { motion } from "framer-motion";

const spring = { type: "spring" as const, stiffness: 520, damping: 30, mass: 0.7 };

export default function AddToCartModal({ onClick }: { onClick: () => void }) {
  const { items, updateQuantity, getCartTotal, removeFromCart } = useCart();

  return (
    <Modal>
      <ModalTrigger
        onClick={onClick}
        className="mt-10 w-full inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-neutral-900 text-white px-4 py-2 font-medium shadow-sm hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
      >
        Foglalás
      </ModalTrigger>

      <ModalBody>
        <ModalContent>
          <h4 className="text-lg md:text-2xl text-neutral-900 font-bold text-center mb-8">
            Your cart
          </h4>

          {!items.length && (
            <p className="text-center text-neutral-600">
              Your cart is empty. Please add something.
            </p>
          )}

          {!!items.length && (
            <motion.div
              className="flex flex-col divide-y divide-neutral-200"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
            >
              {items.map((item, index) => (
                <motion.div
                  key={"purchased-item" + index}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    show: { opacity: 1, y: 0, transition: spring },
                  }}
                  className="flex gap-2 justify-between items-center py-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <StrapiImage
                      src={item.product?.images?.[0].url}
                      alt={item.product.name}
                      width={60}
                      height={60}
                      className="rounded-lg hidden md:block border border-neutral-200"
                    />
                    <span className="text-neutral-900 text-sm md:text-base font-medium truncate">
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
                      className="w-16 p-2 h-full rounded-md focus:outline-none bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-neutral-400 text-neutral-900 mr-3"
                      style={{ WebkitAppearance: "none", MozAppearance: "textfield" }}
                      aria-label={`Quantity for ${item.product.name}`}
                    />
                    <div className="text-neutral-900 text-sm font-medium w-20 text-right tabular-nums">
                      HUF {formatNumber(item.product.price)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="ml-2 p-2 rounded-md hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                      aria-label={`Remove ${item.product.name}`}
                    >
                      <IconTrash className="w-4 h-4 text-neutral-700" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </ModalContent>

        <ModalFooter className="gap-4 items-center">
          <div className="text-neutral-600">
            total amount{" "}
            <span className="font-bold text-neutral-900 tabular-nums">
              ${formatNumber(getCartTotal())}
            </span>
          </div>
          <button
            disabled={!items.length}
            className="bg-neutral-900 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm px-4 py-2 rounded-xl border border-neutral-200 shadow-sm hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-neutral-400 w-28 transition"
          >
            Buy now
          </button>
        </ModalFooter>
      </ModalBody>
    </Modal>
  );
}
