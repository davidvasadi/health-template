"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MotionConfig, AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import Link from "next/link";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandTiktok,
  IconMapPin,
  IconPhone,
  IconClock,
  IconRoute,
  IconShieldCheck,
} from "@tabler/icons-react";
import { Button } from "../elements/button";

/**
 * FormNextToSection — top offset szinkron + STATIKUS LOKÁCIÓ PREVIEW
 * - Bal kártya nyúlás fix: section: items-start + kártya: self-start
 * - Adatvédelmi sor a social linkek után, ikon baseline-ra igazítva
 * - Lokáció kártya: kontrasztos Hívás/Útvonalterv gombok
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

  // Animations
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

  // Socials
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

  // Image
  const imgSrc: string | null =
    typeof section?.image === "string"
      ? section.image
      : Array.isArray(section?.images) && section.images.length > 0
      ? section.images[0]
      : null;

  // 3D tilt
  const [rx, setRx] = useState(0);
  const [ry, setRy] = useState(0);
  const [scale, setScale] = useState(1);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const maxX = 12;
    const maxY = 18;
    setRy(clamp((px - 0.5) * 2 * maxY, -maxY, maxY));
    setRx(clamp(-(py - 0.5) * 2 * maxX, -maxX, maxX));
    setScale(1.015);
  };
  const onLeave = () => {
    setRx(0);
    setRy(0);
    setScale(1);
  };

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

  // Reduced motion fallback
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

  // Statikus lokáció (preview)
  const staticLocation = {
    name: "Csontkovács Rendelő",
    streetAddress: "Fő utca 12.",
    city: "Budapest",
    postalCode: "1051",
    country: "HU",
    phone: "+36 30 123 4567",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=F%C5%91+utca+12%2C+Budapest",
    openingHours: [
      { label: "Hétfő–Péntek", value: "08:00–18:00" },
      { label: "Szombat", value: "09:00–13:00" },
      { label: "Vasárnap", value: "Zárva" },
    ],
  } as const;

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
      <div
        className="relative bg-white"
        style={
          {
            "--nav-h": "72px",
            "--content-top": "calc(var(--nav-h) + 2.5rem)",
          } as React.CSSProperties
        }
      >
        <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 gap-6 md:pt-[var(--content-top)]">
          {/* BAL: FORM kártya */}
          <section className="order-2 md:order-1 flex w-full justify-center items-start px-4 md:px-8 lg:px-16 pt-28 md:pt-0 pb-12">
            <AnimatePresence initial={false}>
              {mounted && (
                <motion.div
                  key="form-card"
                  variants={container}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  viewport={{ once: true, amount: 0.2 }}
                  className="self-start mx-auto w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-[0_10px_30px_-10px_rgba(16,24,40,0.15)] ring-1 ring-neutral-200/60"
                >
                  <motion.header variants={item}>
                    <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight text-breaker-bay-950">
                      {heading}
                    </h1>
                    <p className="mt-3 text-neutral-700 text-base leading-relaxed">{sub_heading}</p>

                    {/* Látható lokáció chip (statikus) */}
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-breaker-bay-50 text-breaker-bay-900 px-2.5 py-1 text-xs ring-1 ring-breaker-bay-200">
                      <IconMapPin className="h-3.5 w-3.5" />
                      {staticLocation.postalCode} {staticLocation.city} • {staticLocation.streetAddress}
                    </span>
                  </motion.header>

                  <motion.div className="pt-6" variants={item}>
                    {/* Generált űrlap */}
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
                                className="mt-1"
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
                      <motion.div
                        key={social.title}
                        className="group"
                        variants={socialItem}
                        whileHover={{ y: prefersReducedMotion ? 0 : -2 }}
                      >
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

                  {/* ➜ ADATVÉDELMI SOR A LINK-EK UTÁN — ikon baseline igazítás */}
                  <motion.div
                    variants={item}
                    className="mt-3 flex items-center justify-center gap-2 text-xs text-neutral-600"
                  >
                    <IconShieldCheck className="h-4 w-4 text-neutral-700" aria-hidden />
                    <span>
                      Adataidat bizalmasan kezeljük.{" "}
                      <Link
                        href="/adatvedelem"
                        className="underline underline-offset-2 hover:no-underline text-neutral-700"
                      >
                        Adatkezelési tájékoztató
                      </Link>
                    </span>
                  </motion.div>

                  {/* NINCS padding-top ezen a szövegen */}
                  <motion.p variants={item} className="text-center text-xs text-neutral-600">
                    Az időpontfoglalás nem jár kötelezettséggel.
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* JOBB: Sticky vizuális oszlop (AnimatedTooltip + heading + lokáció kártya + mockup) */}
          <aside className="order-1 md:order-2 w-full px-4 md:px-8 lg:px-16 pt-28 md:pt-0 pb-12 md:sticky md:self-start md:top-[var(--content-top)] z-20">
            {mounted && (
              <motion.div
                variants={rightIntro}
                initial="hidden"
                animate="show"
                viewport={{ once: true, amount: 0.25 }}
                className="w-full max-w-xl mx-auto text-center"
              >
                <div className="flex justify-center mb-5">
                  <AnimatedTooltip items={section?.users ?? []} />
                </div>

                <h2 className="font-semibold text-breaker-bay-800">EST 2021</h2>
                <h3 className="text-2xl md:text-3xl font-bold text-breaker-bay-900">{section?.heading}</h3>
                <p className="mt-3 text-base md:text-lg text-neutral-700 leading-relaxed">{section?.sub_heading}</p>

                {/* Lokáció kártya (statikus preview) */}
                <div className="mt-5 text-left">
                  <div className="rounded-2xl ring-1 ring-neutral-200/70 bg-white/80 backdrop-blur-sm p-4">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-neutral-200 bg-white">
                          <IconMapPin className="h-5 w-5 text-breaker-bay-900" />
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-neutral-900">
                          {staticLocation.name}
                        </div>
                        <address className="not-italic text-sm text-neutral-700 leading-relaxed">
                          {staticLocation.streetAddress}
                          <br />
                          {staticLocation.postalCode} {staticLocation.city}
                          {staticLocation.country ? `, ${staticLocation.country}` : ""}
                        </address>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <a
                            href={`tel:${staticLocation.phone.replace(/\s+/g, "")}`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ring-1 ring-neutral-200 bg-white
                                       text-neutral-800 hover:text-breaker-bay-900 hover:ring-breaker-bay-300"
                          >
                            <IconPhone className="h-4 w-4 text-neutral-800" />
                            <span className="font-medium">Hívás</span>
                          </a>

                          <Link
                            href={staticLocation.mapsUrl}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ring-1 ring-neutral-200 bg-white
                                       text-neutral-800 hover:text-breaker-bay-900 hover:ring-breaker-bay-300"
                          >
                            <IconRoute className="h-4 w-4 text-neutral-800" />
                            <span className="font-medium">Útvonalterv</span>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Nyitvatartás */}
                    <div className="mt-4 rounded-xl bg-neutral-50 p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-neutral-900">
                        <IconClock className="h-4 w-4" />
                        Nyitvatartás
                      </div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                        {staticLocation.openingHours.map((oh, i) => (
                          <div
                            key={`${oh.label}-${i}`}
                            className="flex justify-between text-sm text-neutral-700"
                          >
                            <span>{oh.label}</span>
                            <span className="font-medium">{oh.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3D mockup */}
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
                        {/* Blur háttér */}
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

                        {/* Talp-árnyék */}
                        <div
                          aria-hidden
                          className="pointer-events-none absolute -bottom-4 left-1/2 h-14 w-[70%] -translate-x-1/2 rounded-[50%] blur-2xl"
                          style={{
                            background:
                              "radial-gradient(ellipse at center, rgba(0,0,0,0.28), rgba(0,0,0,0) 70%)",
                          }}
                        />

                        {/* „Készülék” */}
                        <motion.div
                          className="relative mx-auto h-full w-[92%] md:w-[88%] rounded-[32px] ring-1 ring-white/40 bg-white/10 backdrop-blur-xl shadow-[0_30px_120px_-32px_rgba(0,0,0,0.55)] overflow-hidden"
                          style={{
                            transformStyle: "preserve-3d",
                            boxShadow:
                              "inset 0 0 0 1px rgba(255,255,255,0.25), 0 20px 60px -20px rgba(0,0,0,0.45)",
                          }}
                          animate={{ rotateX: rx, rotateY: ry, scale }}
                          transition={{ type: "spring", stiffness: 120, damping: 14, mass: 0.6 }}
                        >
                          {/* Fénytörő peremek */}
                          <div
                            aria-hidden
                            className="absolute inset-0 rounded-[32px] pointer-events-none"
                            style={{
                              boxShadow:
                                "inset 0 0 0 1px rgba(255,255,255,0.35), inset 0 0 40px rgba(255,255,255,0.08)",
                            }}
                          />
                          <div
                            aria-hidden
                            className="absolute inset-2 rounded-[26px] pointer-events-none"
                            style={{
                              boxShadow:
                                "inset 0 0 0 1px rgba(0,0,0,0.35), inset 0 -30px 60px rgba(0,0,0,0.35)",
                            }}
                          />

                          {/* Kijelző */}
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
                              style={{
                                transform: "translateZ(1px)",
                                filter: "saturate(1.06) contrast(1.04) brightness(1.02)",
                              }}
                            />
                            <div
                              aria-hidden
                              className="pointer-events-none absolute inset-0 mix-blend-screen opacity-[0.035]"
                              style={{
                                background:
                                  "repeating-linear-gradient(90deg, rgba(255,0,0,0.08) 0px, rgba(0,255,0,0.08) 1px, rgba(0,0,255,0.08) 2px, transparent 3px)",
                              }}
                            />
                            <div
                              aria-hidden
                              className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-[0.03]"
                              style={{
                                backgroundImage:
                                  "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.9) 1px, transparent 1.25px)",
                                backgroundSize: "8px 8px",
                              }}
                            />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/45 to-transparent" />
                          </div>

                          {/* Csillanás söprés */}
                          <motion.div
                            aria-hidden
                            className="pointer-events-none absolute inset-[2px] rounded-[30px] overflow-hidden"
                            initial={{ x: "-30%" }}
                            animate={{ x: "140%" }}
                            transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
                            style={{ transform: "translateZ(2px)" }}
                          >
                            <div
                              className="h-full w-[35%]"
                              style={{
                                background:
                                  "linear-gradient(75deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.25) 45%, rgba(0,0,0,0.0) 80%)",
                                filter: "blur(8px)",
                              }}
                            />
                          </motion.div>

                          {/* Reflexió */}
                          <div className="absolute -bottom-[18%] left-6 right-6 h-[18%] overflow-hidden rounded-b-[24px]">
                            <div
                              className="h-full w-full origin-top scale-y-[-1] opacity-30"
                              style={{
                                backgroundImage: `url(${imgSrc})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
                                WebkitMaskImage:
                                  "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
                                filter: "blur(2px)",
                                transform: "translateZ(0.5px)",
                              }}
                            />
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </aside>
        </div>
      </div>
    </MotionConfig>
  );
}
