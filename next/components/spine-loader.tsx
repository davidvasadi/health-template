"use client";
import React from "react";
import { motion } from "framer-motion";

/**
 * Finom, üvegkártyás loader egy mini "gerinccel".
 * - Könnyű SVG animáció (nincs extra lib)
 * - Átlátszó, üveges háttér, hogy passzoljon a Hero dizájnhoz
 */
const SpineLoader: React.FC = () => {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl px-6 py-5"
        style={{
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(10px) saturate(150%)",
          WebkitBackdropFilter: "blur(10px) saturate(150%)",
          boxShadow:
            "0 8px 22px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.22)",
        }}
        aria-label="Betöltés"
      >
        {/* Mini “gerinc” – 5 korong halvány torusszal, finom rotációval */}
        <motion.svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          role="img"
          aria-hidden="true"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 6, ease: "linear", repeat: Infinity }}
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const y = 30 + i * 14;
            const delay = i * 0.08;
            return (
              <g key={i}>
                <motion.ellipse
                  cx="60"
                  cy={y}
                  rx="16"
                  ry="7"
                  fill="#c7fffa"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay }}
                />
                <motion.ellipse
                  cx="60"
                  cy={y}
                  rx="20"
                  ry="2.5"
                  fill="#51f7f0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.0, 0.6, 0.0] }}
                  transition={{
                    duration: 1.1,
                    delay,
                    repeat: Infinity,
                    repeatType: "mirror",
                  }}
                />
              </g>
            );
          })}
        </motion.svg>

        <div
          className="mt-3 text-sm font-medium text-center"
          style={{ color: "var(--breaker-900)" }}
        >
          Betöltés…
        </div>
      </motion.div>
    </div>
  );
};

export default SpineLoader;
