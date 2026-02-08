// /components/dynamic-zone/practices.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

/* ──────────────────────────────────────────────────────────────
  Types (csak ami kell: name, image, practices count)
────────────────────────────────────────────────────────────── */

type ButtonData = {
  text?: string | null;
  URL?: string | null;
  href?: string | null;
  target?: string | null;
  newTab?: boolean | null;
  variant?: string | null;
};

type CategoryLike = {
  id?: number;
  slug?: string | null;

  // ✅ innen kell a cím
  name?: string | null;

  // ✅ innen kell a kép
  image?: any;

  // ✅ innen kell a darabszám (relation)
  practices?: any;
};

type PracticesBlockData = {
  __component?: string;

  badge_label?: string | null;
  heading?: string | null;

  // Strapi-nál nálad sub_heading a mezőnév (képen)
  sub_heading?: string | null;
  subheading?: string | null;

  button?: ButtonData | ButtonData[] | null;

  // ✅ relation Categories-hez
  categories?: any; // array vagy {data:[...]}
};

/* ──────────────────────────────────────────────────────────────
  Config
────────────────────────────────────────────────────────────── */

const BRAND = "#057C80";

const PRACTICES_BASE: Record<string, string> = {
  hu: "gyakorlatok",
  en: "practices",
  de: "praktiken",
};

const COUNT_LABEL: Record<string, string> = {
  hu: "GYAKORLAT",
  en: "EXERCISES",
  de: "ÜBUNGEN",
};

const STRAPI = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  process.env.STRAPI_URL ||
  ""
).replace(/\/$/, "");

/* ──────────────────────────────────────────────────────────────
  Strapi v4/v5 normalize helpers
────────────────────────────────────────────────────────────── */

const attrs = (x: any) => x?.attributes ?? x ?? {};

function relArray(rel: any): any[] {
  const d = rel?.data ?? rel;
  return Array.isArray(d) ? d : [];
}

function mediaUrl(media: any): string | null {
  if (!media) return null;
  const m = attrs(media?.data ?? media);

  const url =
    m?.url ??
    m?.formats?.large?.url ??
    m?.formats?.medium?.url ??
    m?.formats?.small?.url ??
    m?.formats?.thumbnail?.url ??
    null;

  if (!url) return null;

  if (typeof url === "string" && url.startsWith("http")) return url;
  if (typeof url === "string" && url.startsWith("/") && STRAPI) return `${STRAPI}${url}`;

  return typeof url === "string" ? url : null;
}

function normalizeButton(btn?: ButtonData | ButtonData[] | null): ButtonData | null {
  if (!btn) return null;
  if (Array.isArray(btn)) return btn[0] ?? null;
  return btn;
}

function normalizeCategories(input: any): CategoryLike[] {
  return relArray(input).map((x) => {
    if (x?.attributes) return { id: x.id, documentId: x.documentId, ...x.attributes };
    return attrs(x);
  });
}

function isExternal(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

/* ──────────────────────────────────────────────────────────────
  Icons (inline SVG)
────────────────────────────────────────────────────────────── */

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 10.5V7.8A2.8 2.8 0 0 0 12.2 5H6.8A2.8 2.8 0 0 0 4 7.8v8.4A2.8 2.8 0 0 0 6.8 19h5.4A2.8 2.8 0 0 0 15 16.2v-2.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15 10.5 20 7.5v9l-5-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="m12 5 7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
  Card
────────────────────────────────────────────────────────────── */

function CategoryCard({
  href,
  title,
  countLabel,
  imageSrc,
  index,
  large, // ✅ csak ezért került bele
}: {
  href: string;
  title: string;
  countLabel?: string;
  imageSrc?: string | null;
  index: number;
  large?: boolean;
}) {
  // a design-ben a 3 kártya kicsit “lépcsőzik” (desktopon)
  const stagger =
    index === 0 ? "lg:translate-y-2" : index === 1 ? "lg:translate-y-6" : "lg:translate-y-0";

  return (
    <Link
      href={href}
      className={
        "group relative block overflow-hidden rounded-[26px] bg-white  " +
        "shadow-[0_40px_90px_-55px_rgba(0,0,0,0.55)] " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
        stagger
      }
    >
      <div className={["relative w-full", large ? "aspect-[16/10]" : "aspect-[3/4]"].join(" ")}>
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title || "Category"}
            fill
            sizes={large ? "(max-width: 1024px) 92vw, 520px" : "(max-width: 1024px) 45vw, 260px"}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-slate-100 text-xs font-semibold text-slate-500">
            Nincs kép
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
          <div className="relative p-4">
            <div className="text-sm font-semibold leading-snug text-white md:text-base">{title}</div>
            {countLabel ? (
              <div className="mt-1 text-[10px] font-extrabold tracking-[0.14em] text-white/75">{countLabel}</div>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ──────────────────────────────────────────────────────────────
  Component
────────────────────────────────────────────────────────────── */

export function Practices(props: any) {
  // manager így hívja: <Component {...componentData} locale={locale} />
  const data: PracticesBlockData = props;
  const locale: string = (props?.locale ?? "hu").toString().toLowerCase();

  const badge = (data?.badge_label ?? "").trim();
  const heading = (data?.heading ?? "").trim();
  const sub = (data?.sub_heading ?? data?.subheading ?? "").trim();

  const btn = normalizeButton(data?.button);
  const btnText = (btn?.text ?? "").trim();
  const btnHref = (btn?.URL ?? btn?.href ?? "").trim();
  const target = (btn?.newTab ? "_blank" : btn?.target) || undefined;

  const base = PRACTICES_BASE[locale] ?? "practices";
  const unit = COUNT_LABEL[locale] ?? "EXERCISES";

  const categories = normalizeCategories(data?.categories);

  const cardsAll = categories
    .map((c) => {
      const title = (c?.name ?? "").toString().trim();
      if (!title) return null;

      const count = relArray(c?.practices).length;
      const countLabel = count > 0 ? `${count} ${unit}` : "";

      const slug = (c?.slug ?? "").toString().trim();
      const href = slug ? `/${locale}/${base}?category=${encodeURIComponent(slug)}` : `/${locale}/${base}`;

      return {
        id: c?.id,
        title,
        countLabel,
        href,
        imageSrc: mediaUrl(c?.image),
      };
    })
    .filter(Boolean) as Array<{ id?: number; title: string; countLabel: string; href: string; imageSrc: string | null }>;

  const cardsDesktop = cardsAll.slice(0, 3);

  const buttonClass =
    "inline-flex items-center justify-center gap-3 rounded-2xl px-7 py-4 text-sm font-semibold " +
    "text-white shadow-[0_18px_44px_-18px_rgba(5,124,128,0.55)] transition " +
    "hover:brightness-110 active:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[34px] border border-slate-200/80 bg-white">
          {/* Background: finom, jobbra koncentrált */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                radial-gradient(720px 420px at 82% 34%, rgba(5,124,128,0.12), transparent 62%),
                radial-gradient(760px 460px at 88% 42%, rgba(0,0,0,0.06), transparent 64%),
                linear-gradient(90deg, #ffffff 0%, #ffffff 56%, #f3f5f6 100%)
              `,
            }}
          />

          <div className="relative grid items-center gap-10 p-6 md:gap-12 md:p-10 lg:grid-cols-2 lg:p-12">
            {/* LEFT */}
            <div className="max-w-xl">
              {badge ? (
                <div
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1  text-[10px] md:text-[11px] font-bold uppercase"
                  style={{
                    color: BRAND,
                    background: "rgba(5,124,128,0.08)",
                    border: "1px solid rgba(5,124,128,0.14)",
                  }}
                >
                  <VideoIcon className="shrink-0 w-4 h-4" />
                  <span className="whitespace-nowrap">{badge}</span>
                </div>
              ) : null}

              {heading ? (
                <h2 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                  {heading}
                </h2>
              ) : null}

              {sub ? (
                <p className="mt-4 sm:mt-5 max-w-[52ch] text-xs leading-relaxed text-slate-600 md:text-sm  break-words hyphens-auto">
                  {sub}
                </p>
              ) : null}

              {btnText && btnHref ? (
                isExternal(btnHref) ? (
                  <a
                    href={btnHref}
                    target={target}
                    rel={target === "_blank" ? "noreferrer noopener" : undefined}
                    className={buttonClass + " mt-8"}
                    style={{ background: BRAND }}
                  >
                    <span className="whitespace-nowrap">{btnText}</span>
                    <ArrowRightIcon className="shrink-0" />
                  </a>
                ) : (
                  <Link
                    href={btnHref}
                    target={target}
                    className={buttonClass + " mt-8 font-semibold tracking-[0.08em] sm:tracking-[0.12em]"}
                    style={{ background: BRAND }}
                  >
                    <span className="whitespace-nowrap">{btnText}</span>
                    <ArrowRightIcon className="shrink-0" />
                  </Link>
                )
              ) : null}
            </div>

            {/* RIGHT */}
            <div className="relative mx-auto w-full max-w-xl lg:mx-0">
              {cardsAll.length ? (
                <>
                  {/* ✅ MOBILE: 2 kicsi + 1 nagy (pont mint a képen) */}
                  <div className="lg:hidden">
                    <div className="grid grid-cols-2 gap-4">
                      {cardsAll[0] ? (
                        <CategoryCard
                          href={cardsAll[0].href}
                          title={cardsAll[0].title}
                          countLabel={cardsAll[0].countLabel}
                          imageSrc={cardsAll[0].imageSrc}
                          index={0}
                        />
                      ) : null}

                      {cardsAll[1] ? (
                        <CategoryCard
                          href={cardsAll[1].href}
                          title={cardsAll[1].title}
                          countLabel={cardsAll[1].countLabel}
                          imageSrc={cardsAll[1].imageSrc}
                          index={1}
                        />
                      ) : null}

                      {cardsAll[2] ? (
                        <div className="col-span-2">
                          <CategoryCard
                            href={cardsAll[2].href}
                            title={cardsAll[2].title}
                            countLabel={cardsAll[2].countLabel}
                            imageSrc={cardsAll[2].imageSrc}
                            index={2}
                            large
                          />
                        </div>
                      ) : null}

                      {/* ha több van, menjen tovább 2 oszlopban */}
                      {cardsAll.slice(3).map((c, i) => (
                        <CategoryCard
                          key={`${c.id ?? i}`}
                          href={c.href}
                          title={c.title}
                          countLabel={c.countLabel}
                          imageSrc={c.imageSrc}
                          index={i + 3}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Desktop: fix 3 kártya */}
                  <div className="hidden lg:block">
                    <div className="grid grid-cols-3 gap-6">
                      {cardsDesktop.map((c, i) => (
                        <CategoryCard
                          key={`${c.id ?? i}`}
                          href={c.href}
                          title={c.title}
                          countLabel={c.countLabel}
                          imageSrc={c.imageSrc}
                          index={i}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white/70 text-sm font-semibold text-slate-500">
                  Nincs kategória kiválasztva a Strapi-ban.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
