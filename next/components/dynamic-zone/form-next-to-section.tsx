"use client";

import { useEffect, useMemo, useState } from "react";
import { MotionConfig, AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import Link from "next/link";
import { IconBrandGithub, IconBrandLinkedin, IconBrandX, IconBrandMeta,IconBrandFacebook,IconBrandInstagram,IconBrandTiktok } from "@tabler/icons-react";
import { Button } from "../elements/button";

/**
 * Tiszta, stabil betöltési animációk, amelyek nem törik a sticky-t és nem okoznak layout shiftet
 *
 * Fő változtatások:
 * 1) SSR → CSR villogás elkerülése: csak mount után indítjuk az animációt (mounted gate)
 * 2) Reduced motion jobb kezelése: MotionConfig + runtime check
 * 3) Stabil belépés: opacity + y helyett minimális translate + subtle blur, majd gyorsan elhagyjuk a filtert
 * 4) Egységes időzítés: container → item variánsok, viewport-onként egyszer (once: true)
 * 5) Sticky biztonság: továbbra sincs transform a sticky szülőkön; animáció csak az inner elemen
 */

export function FormNextToSection({
  heading,
  sub_heading,
  form,
  section,
}: {
  heading: string;
  sub_heading: string;
  form: any;
  section: any;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Finom, jól csillapított rugó fókusz/hover interakciókhoz (nem a belépéshez)
  const spring = useMemo(() => ({ type: "spring", stiffness: 160, damping: 22, mass: 0.65 }), []);

  // Egységes easing a belépésekhez (nem-spring)
  const ease = [0.22, 1, 0.36, 1] as const;

  // Parent → child stagger, viewport egyszeri aktiválással
  const container = {
    hidden: { opacity: 0, x: -36 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, staggerChildren: 0.1, delayChildren: 0.2, ease },
    },
  } as const;

  // Subtle, gyors fade + kis elmozdulás + blur, ami azonnal megszűnik
  const item = {
    hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.55, ease },
    },
  } as const;

  // Jobb oldali intro (sticky inner), rövidebb időzítéssel
  const rightIntro = {
    hidden: { opacity: 0, x: 36, y: 8, filter: "blur(6px)" },
    show: { opacity: 1, x: 0, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease } },
  } as const;

  // Közösségi ikonok belépése: kis scale pop-in
  const socialItem = {
    hidden: { opacity: 0, scale: 0.9, y: 8 },
    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease } },
  } as const;

  const socials = [
    { title: "instagram", href: "https://instagram.com/strapijs", icon: <IconBrandInstagram className="h-5 w-5 text-breaker-bay-700 group-hover:text-breaker-bay-900 transition-colors" /> },
    { title: "tiktok", href: "https://tiktok.com/strapi", icon: <IconBrandTiktok className="h-5 w-5 text-breaker-bay-700 group-hover:text-breaker-bay-900 transition-colors" /> },
    { title: "facebook", href: "https://facebook.hu/strapi", icon: <IconBrandFacebook className="h-5 w-5 text-breaker-bay-700 group-hover:text-breaker-bay-900 transition-colors" /> },
  ];

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
      {/* NAV magasság (pl. 64/72/80px) */}
      <div className="relative bg-white" style={{ "--nav-h": "72px" } as React.CSSProperties}>
        {/* Fontos: nincs overflow-hidden / transform az ősláncban → sticky OK */}
        <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BAL: FORM */}
          <section className="order-2 md:order-1 flex w-full justify-center px-4 md:px-8 lg:px-16 pt-28 pb-12">
            <AnimatePresence initial={false}>
              {mounted && (
                <motion.div
                  key="form-card"
                  variants={container}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  viewport={{ once: true, amount: 0.2 }}
                  className="mx-auto w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-[0_10px_30px_-10px_rgba(16,24,40,0.15)] ring-1 ring-neutral-200/60"
                >
                  <motion.header variants={item}>
                    <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight text-breaker-bay-950">{heading}</h1>
                    <p className="mt-3 text-neutral-700 text-base leading-relaxed">{sub_heading}</p>
                  </motion.header>

                  <motion.div className="pt-6" variants={item}>
                    <form className="space-y-4" noValidate>
                      {form?.inputs?.map((input: any, idx: number) => (
                        <motion.div key={`${input?.name ?? "field"}-${idx}`} variants={item}>
                          {input.type !== "submit" && (
                            <label htmlFor={input?.name ?? `field-${idx}`} className="block text-sm font-medium text-neutral-800">
                              {input.name}
                            </label>
                          )}
                          <div className="mt-2">
                            {input.type === "textarea" ? (
                              <motion.textarea
                                rows={4}
                                id={input?.name ?? `field-${idx}`}
                                placeholder={input.placeholder}
                                className="block w-full bg-white px-4 rounded-xl border border-neutral-300/80 py-3 shadow-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:ring-breaker-bay-300 focus:outline-none focus:border-breaker-bay-500 sm:text-sm"
                                whileFocus={{ scale: prefersReducedMotion ? 1 : 1.01 }}
                                transition={spring}
                              />
                            ) : input.type === "submit" ? (
                              <motion.div whileHover={{ y: prefersReducedMotion ? 0 : -1 }} whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}>
                                <Button className="w-full mt-4 bg-breaker-bay-900 hover:bg-breaker-bay-800 active:bg-breaker-bay-950 text-white h-11 rounded-xl shadow-[0_12px_24px_-12px] shadow-breaker-bay-900/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-breaker-bay-300">
                                  {input.name}
                                </Button>
                              </motion.div>
                            ) : (
                              <motion.input
                                id={input?.name ?? `field-${idx}`}
                                type={input.type}
                                placeholder={input.placeholder}
                                className="block w-full bg-white px-4 rounded-xl border border-neutral-300/80 py-3 shadow-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:ring-breaker-bay-300 focus:outline-none focus:border-breaker-bay-500 sm:text-sm"
                                whileFocus={{ scale: prefersReducedMotion ? 1 : 1.01 }}
                                transition={spring}
                              />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </form>
                  </motion.div>

                  <motion.div
                    variants={container}
                    className="flex items-center justify-center gap-4 pt-6"
                    aria-label="Közösségi média linkek"
                  >
                    {socials.map((social) => (
                      <motion.div key={social.title} className="group" variants={socialItem} whileHover={{ y: prefersReducedMotion ? 0 : -2 }}>
                        <Link
                          href={social.href}
                          target="_blank"
                          aria-label={social.title}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-neutral-200/70 bg-white/80 backdrop-blur-sm hover:ring-breaker-bay-300"
                        >
                          {social.icon}
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.p variants={item} className="pt-4 text-center text-xs text-neutral-600">
                    Az időpontfoglalás nem jár kötelezettséggel. Adataidat bizalmasan kezeljük.
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* JOBB: STICKY WRAPPER — semmi motion NINCS rajta! */}
          <aside
            className="order-1 md:order-2 w-full px-4 md:px-8 lg:px-16 pt-28 pb-12 md:sticky md:self-start z-20"
            style={{ top: "calc(var(--nav-h) + 0.75rem)" }}
          >
            {/* csak az inner kap motiont */}
            {mounted && (
              <motion.div
                variants={rightIntro}
                initial="hidden"
                animate="show"
                viewport={{ once: true, amount: 0.25 }}
                className="w-full max-w-xl mx-auto text-center"
              >
                <div className="flex justify-center mb-5">
                  <AnimatedTooltip items={section.users} />
                </div>

                <h2 className="font-semibold text-breaker-bay-800">EST 2021</h2>
                <h3 className="text-2xl md:text-3xl font-bold text-breaker-bay-900">{section.heading}</h3>
                <p className="mt-3 text-base md:text-lg text-neutral-700 leading-relaxed">{section.sub_heading}</p>
              </motion.div>
            )}
          </aside>
        </div>
      </div>
    </MotionConfig>
  );
}
