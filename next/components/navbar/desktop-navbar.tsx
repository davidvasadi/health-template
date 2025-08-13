"use client";
import { Logo } from "@/components/logo";
import { Button } from "@/components/elements/button";
import { NavbarItem } from "./navbar-item";
import {
  useMotionValueEvent,
  useScroll,
  motion,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Link } from "next-view-transitions";
import { LocaleSwitcher } from "../locale-switcher";

type Props = {
  leftNavbarItems: {
    URL: string;
    text: string;
    target?: string;
  }[];
  rightNavbarItems: {
    URL: string;
    text: string;
    target?: string;
  }[];
  logo: any;
  locale: string;
};

export const DesktopNavbar = ({ leftNavbarItems, rightNavbarItems, logo, locale }: Props) => {
  const { scrollY } = useScroll();
  const [showBackground, setShowBackground] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => {
    if (value > 100) {
      setShowBackground(true);
    } else {
      setShowBackground(false);
    }
  });

  return (
    <motion.div
      className={cn(
        "w-full flex relative justify-between px-4 py-3 mx-auto transition duration-200",
        "rounded-2xl overflow-hidden", // lágyabb kerekítés
        showBackground
          ? "text-breaker-bay-50 shadow-xl ring-1 ring-breaker-bay-400/20 backdrop-blur"
          : "text-breaker-bay-900"
      )}
      animate={{
        width: showBackground ? "80%" : "100%",
        // bg a 950-es mély tónussal; áttetsző marad, ha nincs háttér
        background: showBackground ? "#002e33" : "transparent",
      }}
      transition={{ duration: 0.4 }}
    >
      <AnimatePresence>
        {showBackground && (
          <motion.div
            key={String(showBackground)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className={cn(
              "absolute inset-0 h-full w-full pointer-events-none rounded-2xl",
              // enyhén áttetsző 900-as réteg + maszk a felső/alsó lágy átmenethez
              "bg-breaker-bay-900/80 [mask-image:linear-gradient(to_bottom,white,transparent,white)]"
            )}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-row gap-2 items-center">
        <Logo locale={locale} image={logo?.image} />
        <div className="flex items-center gap-1.5">
          {leftNavbarItems.map((item) => (
            <NavbarItem
              href={`/${locale}${item.URL}` as never}
              key={item.text}
              target={item.target}
            >
              {item.text}
            </NavbarItem>
          ))}
        </div>
      </div>

      <div className="flex space-x-2 items-center">
        <LocaleSwitcher currentLocale={locale} />
        {rightNavbarItems.map((item, index) => (
          <Button
            key={item.text}
            variant={index === rightNavbarItems.length - 1 ? "primary" : "simple"}
            as={Link}
            href={`/${locale}${item.URL}`}
            // finom fókuszgyűrű a palettából
            className="focus:outline-none focus:ring-2 focus:ring-breaker-bay-400/40"
          >
            {item.text}
          </Button>
        ))}
      </div>
    </motion.div>
  );
};
