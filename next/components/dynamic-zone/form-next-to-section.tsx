"use client";

import React, { useMemo, useRef, useState } from "react";
import { MotionConfig, AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { AnimatedTooltip } from "@/components/ui/animated-tooltip"; // ha nincs ilyen komponens, töröld ezt az importot és a használatát
import { Button } from "../elements/button";

/*************************************************
 * FormNextToSection — FINAL
 * - Új, letisztított szerkezet + egyszerű kommentek
 * - CSAK a social blokk van visszarakva a RÉGI, statikus verzióra
 * - A többi: az egyszerűsített (új) megoldás marad
 *************************************************/

/**************
 * Típusok
 **************/
type FormInput = {
  type: "text" | "email" | "tel" | "textarea" | "submit" | string;
  name?: string;
  placeholder?: string;
};

export type OpeningHour = { label: string; value: string };

export type LocationType = {
  name?: string;
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  mapsUrl?: string;
  opening_hours?: OpeningHour[];
  opening_title?: string;
  phone_label?: string;
  mapsUrl_label?: string;
};

/**************
 * Komponens
 **************/
export function FormNextToSection({
  heading,
  sub_heading,
  form,
  section,
  Location,
}: {
  heading: string;
  sub_heading: string;
  form: { inputs?: FormInput[] } | any;
  section?: any;
  Location?: LocationType | null;
}) {
  // Motion
  const prefersReducedMotion = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1] as const;
  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
  } as const;

  // CSAK a socialhoz: a régi kód animációi
  const container = {
    hidden: { opacity: 0, x: -36 },
    show: { opacity: 1, x: 0, transition: { duration: 0.6, staggerChildren: 0.1, delayChildren: 0.2, ease } },
  } as const;
  const socialItem = {
    hidden: { opacity: 0, scale: 0.9, y: 8 },
    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease } },
  } as const;

  // Képforrás
  const imgSrc: string | null = useMemo(() => {
    if (typeof section?.image === "string" && section.image) return section.image;
    if (Array.isArray(section?.images) && section.images[0]) return section.images[0];
    return null;
  }, [section]);

  // Lokáció normalizálás (új)
  const loc = useMemo(() => {
    if (!Location) return null;
    return {
      name: Location.name ?? "",
      streetAddress: Location.streetAddress ?? "",
      city: Location.city ?? "",
      postalCode: Location.postalCode ?? "",
      country: Location.country ?? "",
      phone: Location.phone ?? "",
      mapsUrl: Location.mapsUrl,
      opening_hours: Array.isArray(Location.opening_hours) ? Location.opening_hours : [],
      opening_title: Location.opening_title ?? "Nyitvatartás",
      phone_label: Location.phone_label ?? "Hívás",
      mapsUrl_label: Location.mapsUrl_label ?? "Útvonalterv",
    };
  }, [Location]);

  // Egyszerű parallax/tilt (új)
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [rx, setRx] = useState(0);
  const [ry, setRy] = useState(0);
  const [scale, setScale] = useState(1);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setRy((px - 0.5) * 20);
    setRx(-(py - 0.5) * 12);
    setScale(1.01);
  };
  const onLeave = () => { setRx(0); setRy(0); setScale(1); };

  // RÉGI: statikus social ikonok (változatlan logika)
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
  ] as const;

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
      <div
        className="relative bg-white"
        style={{
          // @ts-ignore — custom CSS változók
          "--nav-h": "72px",
          // @ts-ignore
          "--content-top": "calc(var(--nav-h) + 2.5rem)",
        }}
      >
        <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 gap-6 md:pt-[var(--content-top)]">
          {/* BAL: űrlap kártya (új) */}
          <section className="order-2 md:order-1 flex w-full justify-center items-start px-4 md:px-8 lg:px-16 pt-28 md:pt-0 pb-12">
            <AnimatePresence initial={false}>
              <motion.div
                key="form"
                variants={fadeUp}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="self-start mx-auto w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-[0_10px_30px_-10px_rgba(16,24,40,0.15)] ring-1 ring-neutral-200/60"
              >
                {/* Fejléc */}
                <div>
                  <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight text-breaker-bay-950">{heading}</h1>
                  <p className="mt-3 text-neutral-700 text-base leading-relaxed">{sub_heading}</p>
                  {loc && (
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-breaker-bay-50 text-breaker-bay-900 px-2.5 py-1 text-xs ring-1 ring-breaker-bay-200">
                      <IconMapPin className="h-3.5 w-3.5" />
                      {loc.postalCode} {loc.city} • {loc.streetAddress}
                    </span>
                  )}
                </div>

                {/* Dinamikus űrlap mezők */}
                <div className="pt-6">
                  <form className="space-y-4" noValidate>
                    {(form?.inputs as FormInput[] | undefined)?.map((input, idx) => {
                      const id = input?.name || `field-${idx}`;
                      if (input.type === "textarea") {
                        return (
                          <div key={id}>
                            <label htmlFor={id} className="block text-sm font-medium text-neutral-800">{input.name}</label>
                            <textarea
                              id={id}
                              rows={4}
                              placeholder={input.placeholder}
                              className="mt-2 block w-full bg-white px-4 rounded-xl border border-neutral-300/80 py-3 shadow-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:ring-breaker-bay-300 focus:outline-none focus:border-breaker-bay-500 sm:text-sm"
                            />
                          </div>
                        );
                      }
                      if (input.type === "submit") {
                        return (
                          <div key={id} className="pt-2">
                            <Button className="w-full mt-2 bg-breaker-bay-900 hover:bg-breaker-bay-800 active:bg-breaker-bay-950 text-white h-11 rounded-xl shadow-[0_12px_24px_-12px] shadow-breaker-bay-900/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-breaker-bay-300">
                              {input.name}
                            </Button>
                          </div>
                        );
                      }
                      return (
                        <div key={id}>
                          <label htmlFor={id} className="block text-sm font-medium text-neutral-800">{input.name}</label>
                          <input
                            id={id}
                            type={input.type}
                            placeholder={input.placeholder}
                            className="mt-2 block w-full bg-white px-4 rounded-xl border border-neutral-300/80 py-3 shadow-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:ring-breaker-bay-300 focus:outline-none focus:border-breaker-bay-500 sm:text-sm"
                          />
                        </div>
                      );
                    })}
                  </form>
                </div>

                {/* SOCIAL: Régi, statikus sor + régi animáció */}
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

                {/* Adatvédelem */}
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-neutral-600">
                  <IconShieldCheck className="h-4 w-4 text-neutral-700" aria-hidden />
                  <span>
                    Adataidat bizalmasan kezeljük.{" "}
                    <Link href="/adatvedelem" className="underline underline-offset-2 hover:no-underline text-neutral-700">
                      Adatkezelési tájékoztató
                    </Link>
                  </span>
                </div>
                <p className="text-center text-xs text-neutral-600">Az időpontfoglalás nem jár kötelezettséggel.</p>
              </motion.div>
            </AnimatePresence>
          </section>

          {/* JOBB: tartalom/visual (új) */}
          <aside className="order-1 md:order-2 w-full px-4 md:px-8 lg:px-16 pt-28 md:pt-0 pb-12 md:sticky md:self-start md:top-[var(--content-top)] z-20">
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="w-full max-w-xl mx-auto text-center">
              {Array.isArray(section?.users) && section.users.length > 0 && (
                <div className="flex justify-center mb-5">
                  <AnimatedTooltip items={section.users} />
                </div>
              )}
              <h2 className="font-semibold text-breaker-bay-800">EST 2021</h2>
              <h3 className="text-2xl md:text-3xl font-bold text-breaker-bay-900">{section?.heading}</h3>
              <p className="mt-3 text-base md:text-lg text-neutral-700 leading-relaxed">{section?.sub_heading}</p>

              {/* Lokáció kártya (új) */}
              {loc && (
                <div className="mt-5 text-left">
                  <div className="rounded-2xl ring-1 ring-neutral-200/70 bg-white/80 backdrop-blur-sm p-4">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-neutral-200 bg-white">
                        <IconMapPin className="h-5 w-5 text-breaker-bay-900" />
                      </span>
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{loc.name}</div>
                        <address className="not-italic text-sm text-neutral-700 leading-relaxed">
                          {loc.streetAddress}
                          <br />
                          {loc.postalCode} {loc.city}
                          {loc.country ? `, ${loc.country}` : ""}
                        </address>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {loc.phone && (
                            <a
                              href={`tel:${loc.phone.replace(/\s+/g, "")}`}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ring-1 ring-neutral-200 bg-white text-neutral-800 hover:text-breaker-bay-900 hover:ring-breaker-bay-300"
                            >
                              <IconPhone className="h-4 w-4 text-neutral-800" />
                              <span className="font-medium">{loc.phone_label}</span>
                            </a>
                          )}
                          {loc.mapsUrl && (
                            <Link
                              href={loc.mapsUrl}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ring-1 ring-neutral-200 bg-white text-neutral-800 hover:text-breaker-bay-900 hover:ring-breaker-bay-300"
                            >
                              <IconRoute className="h-4 w-4 text-neutral-800" />
                              <span className="font-medium">{loc.mapsUrl_label}</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {Array.isArray(loc.opening_hours) && loc.opening_hours.length > 0 && (
                      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-neutral-900">
                          <IconClock className="h-4 w-4" />
                          {loc.opening_title}
                        </div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                          {loc.opening_hours.map((oh, i) => (
                            <div key={`${oh.label}-${i}`} className="flex justify-between text-sm text-neutral-700">
                              <span>{oh.label}</span>
                              <span className="font-medium">{oh.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Kép (új, egyszerű parallax) */}
              {imgSrc && (
                <div className="mt-6">
                  {prefersReducedMotion ? (
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
                  ) : (
                    <div
                      ref={wrapRef}
                      onMouseMove={onMove}
                      onMouseLeave={onLeave}
                      className="relative h-[340px] md:h-[440px] lg:h-[540px] w-full select-none"
                      style={{ perspective: 1200 }}
                    >
                      {/* Blur háttér */}
                      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden rounded-[2rem]">
                        <div
                          className="absolute inset-[-8%] blur-2xl scale-110 opacity-70"
                          style={{
                            backgroundImage: `url(${imgSrc})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            filter: "saturate(1.05) brightness(1.03) blur(28px)",
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white/60" />
                      </div>
                      {/* "Eszköz" keret */}
                      <motion.div
                        className="relative mx-auto h-full w-[92%] md:w-[88%] rounded-[32px] ring-1 ring-white/40 bg-white/10 backdrop-blur-xl shadow-[0_30px_120px_-32px_rgba(0,0,0,0.55)] overflow-hidden"
                        style={{ transformStyle: "preserve-3d" }}
                        animate={{ rotateX: rx, rotateY: ry, scale }}
                        transition={{ type: "spring", stiffness: 120, damping: 14, mass: 0.6 }}
                      >
                        <div className="absolute inset-3 rounded-[24px] overflow-hidden">
                          <motion.img
                            key={imgSrc}
                            src={imgSrc}
                            alt=""
                            className="h-full w-full object-cover will-change-transform"
                            initial={{ scale: 1.04 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 1.0, ease }}
                            draggable={false}
                            style={{ transform: "translateZ(1px)", filter: "saturate(1.04) contrast(1.03) brightness(1.01)" }}
                          />
                          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/45 to-transparent" />
                        </div>
                      </motion.div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </aside>
        </div>
      </div>
    </MotionConfig>
  );
}
