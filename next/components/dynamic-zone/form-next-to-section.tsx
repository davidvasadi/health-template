"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MotionConfig, AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import Link from "next/link";
import { IconBrandFacebook, IconBrandInstagram, IconBrandTiktok } from "@tabler/icons-react";
import { Button } from "../elements/button";

/**
 * FormNextToSection — kommentelt, letisztított változat
 *
 * Főbb változtatások:
 * 1) **Jobb oldali top offset fix**: a sticky aside most md+ nézetben a `top: var(--nav-h)` értéket használja,
 *    és **eltávolítottuk a duplikált felső paddinget** (md:pt-0). Így nem csúszik le a jobb oldal a balhoz képest.
 * 2) Részletes kommentek minden blokkhoz.
 * 3) Kisebb takarítás: konzisztens animációs beállítások, egyértelműbb változónevek.
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
  // Mozgáscsökkentés OS szintű beállítás alapján
  const prefersReducedMotion = useReducedMotion();

  // Csak a mount után indítjuk a belépő animokat (hydration villanások elkerülése)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ——— Animációs beállítások ———
  const spring = useMemo(() => ({ type: "spring", stiffness: 160, damping: 22, mass: 0.65 }), []);
  const ease = [0.22, 1, 0.36, 1] as const;

  const container = {
    hidden: { opacity: 0, x: -36 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, staggerChildren: 0.1, delayChildren: 0.2, ease },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease } },
  } as const;

  const rightIntro = {
    hidden: { opacity: 0, x: 36, y: 8, filter: "blur(6px)" },
    show: { opacity: 1, x: 0, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease } },
  } as const;

  const socialItem = {
    hidden: { opacity: 0, scale: 0.9, y: 8 },
    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease } },
  } as const;

  // ——— Social ikonok (UI) ———
  const socials = [
    {
      title: "instagram",
      href: "https://instagram.com/strapijs",
      icon: (
        <IconBrandInstagram className="h-5 w-5 text-breaker-bay-700 group-hover:text-breaker-bay-900 transition-colors" />
      ),
    },
    {
      title: "tiktok",
      href: "https://tiktok.com/strapi",
      icon: (
        <IconBrandTiktok className="h-5 w-5 text-breaker-bay-700 group-hover:text-breaker-bay-900 transition-colors" />
      ),
    },
    {
      title: "facebook",
      href: "https://facebook.hu/strapi",
      icon: (
        <IconBrandFacebook className="h-5 w-5 text-breaker-bay-700 group-hover:text-breaker-bay-900 transition-colors" />
      ),
    },
  ];

  // ——— Dinamikus képforrás (egy darab kép) ———
  const imgSrc: string | null =
    typeof section?.image === "string"
      ? section.image
      : Array.isArray(section?.images) && section.images.length > 0
      ? section.images[0]
      : null;

  // ——— 3D tilt állapot és vezérlés ———
  const [rx, setRx] = useState(0); // rotateX
  const [ry, setRy] = useState(0); // rotateY
  const [scale, setScale] = useState(1);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1
    const py = (e.clientY - r.top) / r.height; // 0..1
    const maxX = 12; // rotateX limit
    const maxY = 18; // rotateY limit
    setRy(clamp((px - 0.5) * 2 * maxY, -maxY, maxY));
    setRx(clamp(-(py - 0.5) * 2 * maxX, -maxX, maxX));
    setScale(1.015);
  };
  const onLeave = () => {
    setRx(0);
    setRy(0);
    setScale(1);
  };

  // Pointer alapú "rázás" érzet (touch/mouse)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let down = false;
    let lx = 0;
    let ly = 0;

    const d = (e: PointerEvent) => {
      down = true;
      lx = e.clientX;
      ly = e.clientY;
      setScale(1.015);
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
    };
    const m = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      setRy((v) => clamp(v + dx * 0.15, -18, 18));
      setRx((v) => clamp(v - dy * 0.12, -12, 12));
    };
    const u = (e: PointerEvent) => {
      down = false;
      onLeave();
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
    };

    el.addEventListener("pointerdown", d);
    window.addEventListener("pointermove", m);
    window.addEventListener("pointerup", u);
    return () => {
      el.removeEventListener("pointerdown", d);
      window.removeEventListener("pointermove", m);
      window.removeEventListener("pointerup", u);
    };
  }, []);

  // ——— Reduced motion fallback komponens ———
  const Reduced = () =>
    imgSrc ? (
      <div className="relative h-[340px] md:h-[440px] lg:h-[540px] w-full overflow-hidden rounded-[2rem] ring-1 ring-neutral-200 bg-neutral-50">
        <motion.img
          key={imgSrc}
          src={imgSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
          draggable={false}
        />
      </div>
    ) : null;

  return (
    // Globális MotionConfig (reducedMotion támogatással)
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
      {/* A navigáció magasságát CSS változóban tartjuk, így a sticky aside egyszerűen referálhat rá */}
      <div className="relative bg-white" style={{ "--nav-h": "72px" } as React.CSSProperties}>
        {/* Két oszlop: bal űrlap, jobb vizuál/Team */}
        <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BAL: FORM kártya (változatlan tartalom, apró kommentekkel) */}
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
                    <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight text-breaker-bay-950">
                      {heading}
                    </h1>
                    <p className="mt-3 text-neutral-700 text-base leading-relaxed">{sub_heading}</p>
                  </motion.header>

                  <motion.div className="pt-6" variants={item}>
                    {/* Egyszerű generált űrlap — fokozatos belépéssel */}
                    <form className="space-y-4" noValidate>
                      {form?.inputs?.map((input: any, idx: number) => (
                        <motion.div key={`${input?.name ?? "field"}-${idx}`} variants={item}>
                          {input.type !== "submit" && (
                            <label
                              htmlFor={input?.name ?? `field-${idx}`}
                              className="block text-sm font-medium text-neutral-800"
                            >
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
                              <motion.div
                                whileHover={{ y: prefersReducedMotion ? 0 : -1 }}
                                whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
                              >
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

                  {/* Social ikon sor */}
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

          {/* JOBB: Sticky vizuális oszlop (AnimatedTooltip + heading + image mockup) */}
          {/*
            Top offset FIX (finomhangolva):
            - md+ nézetben a sticky aside teteje a nav alá + **2.5rem** kerül,
              hogy a bal oldali `pt-28` (7rem) paddinggal **pont egyvonalban** legyen.
            - Ha később változtatod a bal oldali top paddinget, ezt az értéket igazítsd a különbséghez.
          */}
          <aside
            className="order-1 md:order-2 w-full px-4 md:px-8 lg:px-16 pt-28 md:pt-0 pb-12 md:sticky md:self-start md:top-[calc(var(--nav-h)+2.5rem)] z-20"
          >
            {mounted && (
              <motion.div
                variants={rightIntro}
                initial="hidden"
                animate="show"
                viewport={{ once: true, amount: 0.25 }}
                className="w-full max-w-xl mx-auto text-center"
              >
                {/* Team rail (AnimatedTooltip) */}
                <div className="flex justify-center mb-5">
                  <AnimatedTooltip items={section?.users ?? []} />
                </div>

                {/* Szekció címek/lead */}
                <h2 className="font-semibold text-breaker-bay-800">EST 2021</h2>
                <h3 className="text-2xl md:text-3xl font-bold text-breaker-bay-900">{section?.heading}</h3>
                <p className="mt-3 text-base md:text-lg text-neutral-700 leading-relaxed">{section?.sub_heading}</p>

                {/* ——— 3D „üveg-telefon mockup” egyetlen képpel ——— */}
                {imgSrc && (
                  <div className="mt-6">
                    {prefersReducedMotion ? (
                      <Reduced />
                    ) : (
                      <motion.div
                        ref={wrapRef}
                        onMouseMove={onMove}
                        onMouseLeave={onLeave}
                        onTouchStart={() => setScale(1.015)}
                        onTouchEnd={onLeave}
                        className="relative h-[340px] md:h-[440px] lg:h-[540px] w-full select-none"
                        style={{ perspective: 1400 }}
                      >
                        {/* DOF háttér (erősen blur-ölt) */}
                        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden rounded-[2rem]">
                          <div
                            className="absolute inset-[-8%] blur-2xl scale-110 opacity-70"
                            style={{
                              backgroundImage: `url(${imgSrc})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              filter: "saturate(1.1) brightness(1.05) blur(28px)",
                              transform: "translateZ(0)",
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white/60" />
                        </div>

                        {/* talp árnyék a device alatt */}
                        <div
                          aria-hidden
                          className="pointer-events-none absolute -bottom-4 left-1/2 h-14 w-[70%] -translate-x-1/2 rounded-[50%] blur-2xl"
                          style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.28), rgba(0,0,0,0) 70%)" }}
                        />

                        {/* Üveg-peremes "készülék" */}
                        <motion.div
                          className="relative mx-auto h-full w-[92%] md:w-[88%] rounded-[32px] ring-1 ring-white/40 bg-white/10 backdrop-blur-xl shadow-[0_30px_120px_-32px_rgba(0,0,0,0.55)] overflow-hidden"
                          style={{ transformStyle: "preserve-3d", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25), 0 20px 60px -20px rgba(0,0,0,0.45)" }}
                          animate={{ rotateX: rx, rotateY: ry, scale }}
                          transition={{ type: "spring", stiffness: 120, damping: 14, mass: 0.6 }}
                        >
                          {/* külső fénylő perem */}
                          <div aria-hidden className="absolute inset-0 rounded-[32px] pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35), inset 0 0 40px rgba(255,255,255,0.08)" }} />
                          {/* belső edge árnyék */}
                          <div aria-hidden className="absolute inset-2 rounded-[26px] pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.35), inset 0 -30px 60px rgba(0,0,0,0.35)" }} />

                          {/* kijelző (éles kép) */}
                          <div className="absolute inset-3 rounded-[24px] overflow-hidden">
                            <motion.img
                              key={imgSrc}
                              src={imgSrc}
                              alt=""
                              className="h-full w-full object-cover will-change-transform"
                              initial={{ scale: 1.04 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 1.2, ease }}
                              draggable={false}
                              style={{ transform: "translateZ(1px)", filter: "saturate(1.06) contrast(1.04) brightness(1.02)" }}
                            />
                            {/* finom textúrák */}
                            <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-screen opacity-[0.035]" style={{ background: "repeating-linear-gradient(90deg, rgba(255,0,0,0.08) 0px, rgba(0,255,0,0.08) 1px, rgba(0,0,255,0.08) 2px, transparent 3px)" }} />
                            <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.9) 1px, transparent 1.25px)", backgroundSize: "8px 8px" }} />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/45 to-transparent" />
                          </div>

                          {/* csillanás söprés (loop) */}
                          <motion.div aria-hidden className="pointer-events-none absolute inset-[2px] rounded-[30px] overflow-hidden" initial={{ x: "-30%" }} animate={{ x: "140%" }} transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }} style={{ transform: "translateZ(2px)" }}>
                            <div className="h-full w-[35%]" style={{ background: "linear-gradient(75deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.25) 45%, rgba(0,0,0,0.0) 80%)", filter: "blur(8px)" }} />
                          </motion.div>

                          {/* kijelző alatti reflexió */}
                          <div className="absolute -bottom-[18%] left-6 right-6 h-[18%] overflow-hidden rounded-b-[24px]">
                            <div className="h-full w-full origin-top scale-y-[-1] opacity-30" style={{ backgroundImage: `url(${imgSrc})`, backgroundSize: "cover", backgroundPosition: "center", maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)", WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)", filter: "blur(2px)", transform: "translateZ(0.5px)" }} />
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>
                )}
                {/* ——— /3D mockup —— */}
              </motion.div>
            )}
          </aside>
        </div>
      </div>
    </MotionConfig>
  );
}
