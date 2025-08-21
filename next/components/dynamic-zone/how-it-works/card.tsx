"use client";

import React, { MouseEvent as ReactMouseEvent, useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import Beam from "../../beam";

/* ───────────────── Palette + card effektek ───────────────── */
const PaletteCSS = () => (
  <style jsx global>{`
    :root{
      --breaker-50:#effefd; --breaker-100:#c7fffa; --breaker-200:#90fff6;
      --breaker-300:#51f7f0; --breaker-400:#1de4e2; --breaker-500:#04c8c8;
      --breaker-600:#009fa3; --breaker-700:#057c80; --breaker-800:#0a6165;
      --breaker-900:#0d5154; --breaker-950:#002e33;
    }
    .card-glass{
      position:relative; overflow:hidden; border-radius: 1rem;
      -webkit-backdrop-filter: blur(16px) saturate(165%);
      backdrop-filter: blur(16px) saturate(165%);
      transition: transform .22s ease, filter .22s ease;
      box-shadow: inset 0 0 0 1px rgba(0,159,163,0.18);
    }
    /* üveg sheen csík (finom) */
    .card-glass::after{
      content:""; position:absolute; inset:-10% auto -10% -35%;
      width:38%; transform: skewX(-18deg) translateX(-120%);
      background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.22), rgba(255,255,255,0));
      filter: blur(6px); opacity:0; pointer-events:none;
      transition: transform .7s ease, opacity .7s ease;
    }
    .card-glass:hover::after, .card-glass:focus-within::after{
      transform: skewX(-18deg) translateX(260%); opacity:.9;
    }
    /* címsor hover-underline */
    .hover-underline{ position: relative; }
    .hover-underline::after{
      content:""; position:absolute; left:0; right:40%; bottom:-8px; height:2px;
      background: linear-gradient(90deg, var(--breaker-600), var(--breaker-300));
      opacity:.0; transform-origin:left; transform:scaleX(.6);
      transition: transform .28s ease, opacity .28s ease; border-radius: 999px;
    }
    .hover-underline:hover::after{ opacity:.9; transform:scaleX(1); }
  `}</style>
);

/* ─────────── halvány csigolya watermark (kártya sarka) ─────────── */
const SpineWatermark = () => (
  <svg
    aria-hidden
    viewBox="0 0 120 160"
    className="absolute -z-10 right-2 bottom-2 w-24 h-32 opacity-25"
    style={{ filter: "blur(0.2px)" }}
  >
    <defs>
      <linearGradient id="vgrad" x1="0" x2="1">
        <stop offset="0%" stopColor="rgba(144,255,246,0.65)" />
        <stop offset="100%" stopColor="rgba(4,200,200,0.45)" />
      </linearGradient>
    </defs>
    <path
      d="M60 6 C 72 20, 48 36, 62 52 C 76 68, 46 84, 60 100 C 74 116, 50 132, 62 148"
      fill="none"
      stroke="url(#vgrad)"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.6"
    />
    {[18, 38, 58, 78, 98, 118, 138].map((y, i) => (
      <g key={y} transform={`translate(${60 + (i % 2 ? 4 : -3)}, ${y})`}>
        <ellipse rx="10" ry="6" fill="rgba(199,255,250,0.45)"/>
        <ellipse rx="8" ry="4.5" fill="rgba(255,255,255,0.6)" />
      </g>
    ))}
  </svg>
);

export const Card = ({
  title,
  description,
  index,
}: {
  title: string;
  description: string;
  index: number;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // kurzor-alapú enyhe 3D döntés
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: ReactMouseEvent<HTMLDivElement>) {
    const rect = currentTarget.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    mouseX.set(x); mouseY.set(y);
    const px = x / rect.width, py = y / rect.height;
    tiltX.set((0.5 - py) * 6);
    tiltY.set((px - 0.5) * 8);
  }

  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["end end", "start start"] });
  const width = useSpring(useTransform(scrollYProgress, [0, 0.2], [0, 300]), {
    stiffness: 500, damping: 90,
  });

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-4 max-w-4xl mx-auto py-20">
      <PaletteCSS />

      {/* nagy sorszám – fehér alapon kontrasztos */}
      <div className="relative">
        <p
          className="mt-8 font-extrabold leading-none tracking-tight text-[clamp(56px,10vw,120px)]"
          style={{
            color: "var(--breaker-900)",
            WebkitTextStroke: "1px rgba(0,46,51,0.15)",
            textShadow: "0 2px 10px rgba(0,46,51,0.08), 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          {String(index).padStart(2, "0")}
        </p>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-2 -left-6 right-[30%] rounded-r-full"
          style={{
            background: "linear-gradient(90deg, rgba(199,255,250,0.55), rgba(255,255,255,0))",
            filter: "blur(12px)",
          }}
        />
      </div>

      {/* progress hairline – Beam marad, palettás háttérrel */}
      <motion.div
        className="h-px w-full hidden md:block rounded-full mt-16 relative overflow-hidden"
        style={{
          width,
          background: "linear-gradient(90deg, rgba(144,255,246,0.55), rgba(4,200,200,0.65))",
        }}
      >
        <Beam className="top-0" />
      </motion.div>

      {/* kártya – világos üveg, teal ink, kurzor-fény NEM fekete */}
      <motion.div
        className="group p-8 card-glass relative z-40 col-span-2 hover:-translate-y-0.5"
        onMouseMove={handleMouseMove}
        style={{
          background: "rgba(255,255,255,0.75)",
          transform: useMotionTemplate`perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          willChange: "transform, filter",
        }}
      >
        {/* olvashatósági “ink” – halvány teal, nem sötét */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-2xl -z-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(46% 40% at 50% 42%, rgba(0,159,163,0.06), rgba(0,46,51,0.00) 65%)",
          }}
        />

        {/* kurzor-fény: palettás radial, SCREEN blend → nincs fekete */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                260px circle at ${mouseX}px ${mouseY}px,
                rgba(81,247,240,0.35) 0%,
                rgba(4,200,200,0.22) 38%,
                rgba(255,255,255,0) 70%
              )
            `,
            mixBlendMode: "screen",
            filter: "saturate(120%)",
          }}
        />

        {/* watermark csigolya */}
        <SpineWatermark />

        {/* tartalom */}
        <p className="text-xl font-semibold tracking-tight relative z-20 mt-2 hover-underline" style={{ color: "var(--breaker-950)" }}>
          {title}
        </p>
        <p className="text-[15px] leading-relaxed relative z-20 mt-3" style={{ color: "rgba(13,81,84,0.85)" }}>
          {description}
        </p>
      </motion.div>
    </div>
  );
};
