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
import { AnimatedTooltip } from "@/components/ui/animated-tooltip"; // ⬅️ HA nincs ez a komponens a projektedben, kommentezd ki az importot és a használatát is!
import { Button } from "../elements/button";

/* ──────────────────────────────────────────────────────────────────────────────
   FormNextToSection — VÉGLEGES (dinamikus social a Strapi-ból)

   ✔ A social ikon/linkek a Strapi által adott struktúrából jönnek (propból VAGY section-ből).
   ✔ Külső hivatkozásokhoz <a> taget használunk (NEM <Link>!), így NEM nyúlunk az URL-hez.
   ✔ A mapsUrl is változtatás nélkül megy ki (ahogy a Strapi adja).
   ✔ A működéshez NEM kell kódot módosítanod a Strapi formátuma miatt: több fajta shape-et kezelünk.
   ────────────────────────────────────────────────────────────────────────────── */

/* ╔══════════════════════════════════════════════════════════════════════════╗
   ║ TÍPUSOK                                                                  ║
   ╚══════════════════════════════════════════════════════════════════════════╝ */

type FormInput = {
  // ⬇️ űrlap mező típusok; a Strapi "inputs" feldobhat bármit — ezért hagyunk "string"-et is
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
  mapsUrl?: string;             // ⬅️ Ezt VÁLTOZTATÁS NÉLKÜL használjuk (külső <a> tag)
  opening_hours?: OpeningHour[];
  opening_title?: string;
  phone_label?: string;
  mapsUrl_label?: string;
};

/** 
 * SOCIAL (Strapi) — tapasztalat alapján:
 * - "link" lehet objektum VAGY tömb
 * - az URL kulcs lehet: URL / url / href
 * - lehet wrapper "attributes" alatt is
 * - a label lehet az elem "label"-je, a link "text"-je stb.
 */
export type SocialLink = {
  icon?: string;   // opcionális, most nem használjuk, de később jól jöhet
  label?: string;
  link?:
    | { text?: string; url?: string; URL?: string; href?: string; target?: "_self" | "_blank"; variant?: "primary" | "secondary" | "link" }
    | Array<{ text?: string; url?: string; URL?: string; href?: string; target?: "_self" | "_blank"; variant?: "primary" | "secondary" | "link" }>;
  attributes?: {
    link?:
      | { text?: string; url?: string; URL?: string; href?: string; target?: "_self" | "_blank"; variant?: "primary" | "secondary" | "link" }
      | Array<{ text?: string; url?: string; URL?: string; href?: string; target?: "_self" | "_blank"; variant?: "primary" | "secondary" | "link" }>;
  };
};

/* ╔══════════════════════════════════════════════════════════════════════════╗
   ║ KOMPONENS                                                                ║
   ╚══════════════════════════════════════════════════════════════════════════╝ */

export function FormNextToSection({
  heading,
  sub_heading,
  form,
  section,
  Location,
  social_media_icon_links, // ⬅️ ha propként adod át; ha nem, a section-ből olvassuk ki
}: {
  heading: string;
  sub_heading: string;
  form: { inputs?: FormInput[] } | any;
  section?: any;
  Location?: LocationType | null;
  social_media_icon_links?: SocialLink[] | SocialLink | null;
}) {
  /* ── Animáció beállítások ─────────────────────────────────────────────── */
  const prefersReducedMotion = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1] as const; // egységes easing görbe

  // Egyszerű "fade-up" variáns (általános belépő animáció)
  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
  } as const;

  // Social-ikonokhoz: a régi kód animációi (staggerelt belépés)
  const container = {
    hidden: { opacity: 0, x: -36 },
    show: { opacity: 1, x: 0, transition: { duration: 0.6, staggerChildren: 0.1, delayChildren: 0.2, ease } },
  } as const;
  const socialItem = {
    hidden: { opacity: 0, scale: 0.9, y: 8 },
    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease } },
  } as const;

  /* ── Képforrás meghatározás ─────────────────────────────────────────────
     - Elfogadunk egyszerű stringet (section.image)
     - VAGY tömböt (section.images[0])                                          */
  const imgSrc: string | null = useMemo(() => {
    if (typeof section?.image === "string" && section.image) return section.image;
    if (Array.isArray(section?.images) && section.images[0]) return section.images[0];
    return null;
  }, [section]);

  /* ── Location normalizálás ──────────────────────────────────────────────
     FIGYELEM: a mapsUrl-hez NEM nyúlunk hozzá — pont úgy megy ki, ahogy a Strapi adja */
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

  /* ── Egyszerű parallax / tilt a mockup képhez ───────────────────────────
     - Nem túl agresszív: kis rotáció és skálázás
     - Egér mozgásra reagál; touch-on nem szükséges extra logika              */
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
  const onLeave = () => {
    setRx(0);
    setRy(0);
    setScale(1);
  };

  /* ╔══════════════════════════════════════════════════════════════════════╗
     ║ SOCIAL — Strapi-ból DINAMIKUSAN                                      ║
     ║ - Forrás: prop social_media_icon_links VAGY section.social_...       ║
     ║ - A link lehet objektum vagy tömb; az URL kulcs lehet URL/url/href   ║
     ║ - A platformot (instagram/tiktok/facebook) név vagy URL alapján is   ║
     ║   felismerjük, és Tabler ikont rendelünk hozzá.                      ║
     ╚══════════════════════════════════════════════════════════════════════╝ */

  // Belső segéd típus (a sokféle Strapi alakhoz)
  type LinkLike = { text?: string; url?: string; URL?: string; href?: string; target?: string; label?: string; title?: string };

  // Kis util: ha valami lehet tömb vagy elem, ebből mindig tömb lesz
  const toArray = <T,>(v: T | T[] | null | undefined): T[] => (Array.isArray(v) ? v : v ? [v] : []);

  // Platform detektálás: label-ből vagy URL-ből (bővíthető, lásd: TODO)
  const detectPlatform = (label?: string, href?: string) => {
    const t = (label || "").toLowerCase();
    const h = (href || "").toLowerCase();
    if (t.includes("instagram") || h.includes("instagram.com")) return "instagram";
    if (t.includes("tiktok") || h.includes("tiktok.com")) return "tiktok";
    if (t.includes("facebook") || h.includes("facebook.com") || h.includes("fb.com")) return "facebook";
    return "unknown"; // ⬅️ Nem ismert: monogram fallback
  };

  // Ikon kiválasztás (Tabler Icons). Bővítheted: linkedin, youtube, stb.
  const iconFor = (platform: string) => {
    if (platform === "instagram") return <IconBrandInstagram className="h-5 w-5 text-breaker-bay-700 group-hover:text-breaker-bay-900 transition-colors" />;
    if (platform === "tiktok")    return <IconBrandTiktok    className="h-5 w-5 text-breaker-bay-700 group-hover:text-breaker-bay-900 transition-colors" />;
    if (platform === "facebook")  return <IconBrandFacebook  className="h-5 w-5 text-breaker-bay-700 group-hover:text-breaker-bay-900 transition-colors" />;
    return null; // ⬅️ ismeretlen: betű-monogram lesz a rendernél
  };

  // A Strapi-ból érkező social mező lelapítása egységes tömbbé
  const socials = useMemo(() => {
    // 1) forrás kiválasztása: prop > section
    const src = (social_media_icon_links ?? section?.social_media_icon_links) as SocialLink[] | SocialLink | undefined | null;
    const items = toArray(src);

    // 2) ide gyűjtjük az egységesített linkeket
    const flatLinks: { label?: string; href: string; target?: string }[] = [];

    // 3) bejárjuk a tételeket
    items.forEach((item) => {
      if (!item) return;

      // Preferált: item.link (objektum vagy tömb) — attributes alatt is lehet
      const linkField = (item as any).link ?? (item as any)?.attributes?.link;
      const links = toArray<LinkLike>(linkField);

      // Edge-case: ha valamiért közvetlenül az item-en van URL
      if (links.length === 0 && (item as any).url) {
        const href = ((item as any).URL ?? (item as any).url ?? (item as any).href) as string;
        if (href) flatLinks.push({ label: (item as any).label, href, target: (item as any).target });
      }

      // Normál eset: object(ek)ből kivesszük a szükséges mezőket
      links.forEach((l) => {
        const href = (l.URL ?? l.url ?? l.href) || "";
        const label = (l.text ?? (item as any).label) || "";
        if (!href) return; // URL nélkül nincs link
        flatLinks.push({ label, href, target: l.target });
      });
    });

    // 4) deduplikálás + ikon hozzárendelés
    const seen = new Set<string>();
    const out = flatLinks
      .filter((l) => !!l.href)
      .map((l) => {
        const platform = detectPlatform(l.label, l.href);
        return {
          key: `${(l.label || platform || "link").toLowerCase()}|${l.href}`, // dedupe kulcs
          label: l.label || platform || "link",
          href: l.href,                        // ⬅️ PONTOSAN a Strapi által adott URL — nincs „mókolás”
          target: l.target || "_blank",        // default target
          icon: iconFor(platform),             // Tabler ikon vagy null
        };
      })
      .filter((x) => {
        if (seen.has(x.key)) return false;
        seen.add(x.key);
        return true;
      });

    // DEBUG TIPP (fejlesztéskor hasznos): ha nem jön semmi, nézd meg a shape-et
    // if (process.env.NODE_ENV !== "production" && out.length === 0) {
    //   // eslint-disable-next-line no-console
    //   console.debug("[FormNextToSection] social raw →", src);
    // }

    return out;
  }, [social_media_icon_links, section?.social_media_icon_links]);

  /* ╔══════════════════════════════════════════════════════════════════════╗
     ║ RENDER                                                                ║
     ╚══════════════════════════════════════════════════════════════════════╝ */

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
      <div
        className="relative bg-white"
        style={
          {
            /* CSS változók: a sticky jobbos oszlop és a layout ezért igazodik a navigáció magasságához */
            // @ts-ignore
            "--nav-h": "72px",
            // @ts-ignore
            "--content-top": "calc(var(--nav-h) + 2.5rem)",
          } as React.CSSProperties
        }
      >
        <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 gap-6 md:pt-[var(--content-top)]">
          {/* ───────────────────────────── BAL: űrlap kártya ───────────────────────────── */}
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
                {/* ── Cím + alcím + (opcionális) hely chip ─────────────────────────── */}
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

                {/* ── Dinamikus űrlap mezők (Strapi "inputs") ────────────────────────
                    TIPP: Ha kell validálás/küldés, ezt a blokkot egészítsd ki onSubmit-tel. */}
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

                      // Alap input: text / email / tel / bármi más string
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

                {/* ── SOCIAL: Strapi-ból (dinamikus) ──────────────────────────────────
                    - Ha nincs adat, ez a blokk nem jelenik meg. */}
                {socials.length > 0 && (
                  <motion.div
                    variants={container}
                    className="flex items-center justify-center gap-4 pt-6"
                    aria-label="Közösségi média linkek"
                  >
                    {socials.map((s) => (
                      <motion.div
                        key={s.key}
                        className="group"
                        variants={socialItem}
                        whileHover={{ y: prefersReducedMotion ? 0 : -2 }}
                      >
                        {/* FONTOS: külső link → <a>, NEM <Link> (így az URL-hez nem nyúlunk) */}
                        <a
                          href={s.href}
                          target={s.target || "_blank"}
                          rel={s.target === "_blank" ? "noopener noreferrer" : undefined}
                          aria-label={s.label}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-neutral-200/70 bg-white/80 backdrop-blur-sm hover:ring-breaker-bay-300"
                        >
                          {s.icon ?? (
                            // Fallback ikon: monogram (két betű)
                            <span className="text-[11px] font-medium">
                              {(s.label || "?").slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </a>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* ── Adatvédelem / lábjegyzet ─────────────────────────────────────── */}
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

          {/* ───────────────────────────── JOBB: vizuális oszlop ───────────────────────────── */}
          <aside className="order-1 md:order-2 w-full px-4 md:px-8 lg:px-16 pt-28 md:pt-0 pb-12 md:sticky md:self-start md:top-[var(--content-top)] z-20">
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="w-full max-w-xl mx-auto text-center">
              {/* Opcionális tooltip (csapat/avatárok). HA nincs komponens, kommentezd ki. */}
              {Array.isArray(section?.users) && section.users.length > 0 && (
                <div className="flex justify-center mb-5">
                  <AnimatedTooltip items={section.users} />
                </div>
              )}

              <h2 className="font-semibold text-breaker-bay-800">EST 2021</h2>
              <h3 className="text-2xl md:text-3xl font-bold text-breaker-bay-900">{section?.heading}</h3>
              <p className="mt-3 text-base md:text-lg text-neutral-700 leading-relaxed">{section?.sub_heading}</p>

              {/* ── Lokáció kártya (mapsUrl-t változatlanul használjuk) ───────────── */}
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

                        {/* Hívás + Útvonalterv gombok */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {loc.phone && (
                            <a
                              href={`tel:${loc.phone.replace(/\s+/g, "")}`} // ⬅️ telefonszámot "tel:" sémával tesszük kattinthatóvá
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ring-1 ring-neutral-200 bg-white text-neutral-800 hover:text-breaker-bay-900 hover:ring-breaker-bay-300"
                            >
                              <IconPhone className="h-4 w-4 text-neutral-800" />
                              <span className="font-medium">{loc.phone_label}</span>
                            </a>
                          )}

                          {loc.mapsUrl && (
                            <a
                              href={loc.mapsUrl}                 // ⬅️ PONTOS Strapi URL (ha "www..." → tedd https://-re a Strapi-ban!)
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ring-1 ring-neutral-200 bg-white text-neutral-800 hover:text-breaker-bay-900 hover:ring-breaker-bay-300"
                            >
                              <IconRoute className="h-4 w-4 text-neutral-800" />
                              <span className="font-medium">{loc.mapsUrl_label}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Nyitvatartás lista */}
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

              {/* ── Mockup kép (parallax/tilt) ───────────────────────────────────── */}
              {imgSrc && (
                <div className="mt-6">
                  {prefersReducedMotion ? (
                    // Accessibility: ha a user csökkentett mozgást kér, csak fade-in
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
                    // Parallax/tilt konténer
                    <div
                      ref={wrapRef}
                      onMouseMove={onMove}
                      onMouseLeave={onLeave}
                      className="relative h-[340px] md:h-[440px] lg:h-[540px] w-full select-none"
                      style={{ perspective: 1200 }}
                    >
                      {/* Elmosott hátterű "glow" a mockup mögött */}
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

                      {/* "Eszköz" keret: finom 3D-hatás */}
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
                          {/* Alsó sötétítés, hogy a kép "ül" az alapon */}
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

/* ──────────────────────────────────────────────────────────────────────────────
   TODO / BŐVÍTÉSI PONTOK:
   - detectPlatform + iconFor: egészítsd ki LinkedIn, YouTube stb. támogatással.
     (Tabler ikonok: IconBrandLinkedin, IconBrandYoutube, stb.)
   - Form submit/validálás: add onSubmit-et a <form>-hoz, és kezeld a mezőket state-ben.
   - Ha a Strapi más shape-et ad socialra, nézd meg a konzolban (lásd a kommentelt debug sort),
     és illeszd be a fenti "lapítási" logikába.
   - mapsUrl: ha a Strapi "www..."-val adja, javasolt "https://..."-ra átírni a Strapi-ban.
     (Itt szándékosan nem "javítjuk ki" — kérésed szerint nem nyúlunk az URL-hez.)
   ────────────────────────────────────────────────────────────────────────────── */
