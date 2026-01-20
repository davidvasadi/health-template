// next/components/practices/single-practice/cards.ts

import { safeLower } from "./strapi";

type IconCardKey = "clock" | "difficult" | "type";

export function pickIconCards(cards: any[]) {
  const pick = (key: IconCardKey) => cards.find((x: any) => safeLower(x?.icon) === key);
  return { clock: pick("clock"), difficult: pick("difficult"), type: pick("type") };
}

export function difficultyTone(value?: string) {
  const v = safeLower(value).trim();
  const easy =
    v.includes("könny") || v.includes("konny") || v.includes("easy") || v.includes("begin") || v.includes("kezd");
  const mid =
    v.includes("közep") || v.includes("kozep") || v.includes("medium") || v.includes("moderat") || v.includes("halad");
  const hard =
    v.includes("nehéz") || v.includes("nehez") || v.includes("hard") || v.includes("advanced") || v.includes("pro");

  if (easy)
    return {
      chip: "bg-[rgba(5,124,128,0.14)] text-[rgba(4,90,92,1)] border-[rgba(5,124,128,0.22)]",
      dot: "bg-[rgba(5,124,128,0.9)]",
      icon: "text-[rgba(5,124,128,1)]",
    };
  if (mid)
    return {
      chip: "bg-black/5 text-neutral-800 border-black/10",
      dot: "bg-neutral-500",
      icon: "text-neutral-700",
    };
  if (hard)
    return {
      chip: "bg-black/8 text-neutral-900 border-black/12",
      dot: "bg-neutral-800",
      icon: "text-neutral-900",
    };
  return {
    chip: "bg-white text-neutral-800 border-black/10",
    dot: "bg-neutral-400",
    icon: "text-neutral-700",
  };
}
