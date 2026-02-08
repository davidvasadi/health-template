// components/dynamic-zone/vouchers.tsx
import Image from "next/image";
import Link from "next/link";

type ButtonData = {
  text?: string | null;
  URL?: string | null;
  href?: string | null;
  target?: string | null;
  newTab?: boolean | null;
  variant?: string | null; // fix "primary" kinézet
};

type VoucherLike = {
  id?: number;
  slug?: string | null;
  heading?: string | null;
  sub_heading?: string | null;
  image?: any;
  logo?: any;
  button?: any;
};

type VouchersBlockData = {
  __component?: string;

  badge_label?: string | null;
  heading?: string | null;
  subheading?: string | null;

  button?: ButtonData | ButtonData[] | null;

  info_label?: string | null;
  vouchers?: any; // relation (array vagy {data:[...]})
};

const BRAND = "#057C80";

const STRAPI = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  process.env.STRAPI_URL ||
  ""
).replace(/\/$/, "");

/* ──────────────────────────────────────────────────────────────
  Strapi v4/v5 normalizálás
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

function normalizeVouchers(input: any): VoucherLike[] {
  return relArray(input).map((x) => {
    if (x?.attributes) return { id: x.id, documentId: x.documentId, ...x.attributes };
    return attrs(x);
  });
}

/* ──────────────────────────────────────────────────────────────
  Heading kiemelés:
  "Lepje meg ... az {{egészség}} élményével!"
  -> {{...}} rész BRAND színű
────────────────────────────────────────────────────────────── */

function renderAccentHeading(text?: string | null) {
  const t = (text ?? "").trim();
  if (!t) return null;

  const m = t.match(/^(.*)\{\{(.+?)\}\}(.*)$/);
  if (!m) return <>{t}</>;

  const [, a, b, c] = m;
  return (
    <>
      {a}
      <span style={{ color: BRAND }}>{b}</span>
      {c}
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
  Button helpers
────────────────────────────────────────────────────────────── */

function normalizeButton(btn?: ButtonData | ButtonData[] | null): ButtonData | null {
  if (!btn) return null;
  if (Array.isArray(btn)) return btn[0] ?? null;
  return btn;
}

function isExternal(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

/* ──────────────────────────────────────────────────────────────
  Icons (inline SVG – stabil, nem emoji)
────────────────────────────────────────────────────────────── */

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 7H2v5h20V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 22V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M12 7H7.5A2.5 2.5 0 1 1 10 4.5c0 1.38 2 2.5 2 2.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 7h4.5A2.5 2.5 0 1 0 14 4.5c0 1.38-2 2.5-2 2.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
  Stacked card (reszponzív)
────────────────────────────────────────────────────────────── */

function VoucherCard({
  src,
  alt,
  className,
  title,
  desc,
  showOverlay,
}: {
  src: string;
  alt: string;
  className: string;
  title?: string;
  desc?: string;
  showOverlay?: boolean;
}) {
  return (
    <div
      className={
        "relative overflow-hidden rounded-[22px] sm:rounded-[26px] bg-white ring-[5px] sm:ring-[7px] ring-white " +
        "shadow-[0_34px_80px_-52px_rgba(0,0,0,0.85)] sm:shadow-[0_40px_90px_-55px_rgba(0,0,0,0.85)] " +
        className
      }
    >
      <div className="relative aspect-[16/10] w-full">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 86vw, 560px"
          className="object-cover"
          priority={false}
        />
      </div>

      {showOverlay && (title || desc) ? (
        <>
          {desc ? (
            <div className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10">
              <div
                className="rounded-md px-3 py-1 text-[10px] sm:text-xs font-semibold text-white"
                style={{
                  background: BRAND,
                  boxShadow: "0 14px 30px -18px rgba(5,124,128,0.9)",
                }}
              >
                {desc}
              </div>
            </div>
          ) : null}

          {title ? (
            <div className="absolute inset-x-0 bottom-0">
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="relative p-4 sm:p-5">
                <div className="text-base sm:text-lg md:text-xl font-semibold leading-snug text-white">
                  {title}
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
  Component
────────────────────────────────────────────────────────────── */

export function Vouchers(props: any) {
  const data: VouchersBlockData = props;
  const locale: string = props?.locale ?? "hu";

  const badge = (data?.badge_label ?? "").trim();
  const heading = (data?.heading ?? "").trim();
  const subheading = (data?.subheading ?? "").trim();
  const infoLabel = (data?.info_label ?? "").trim();

  const btn = normalizeButton(data?.button);
  const btnText = (btn?.text ?? "").trim();
  const btnHref = (btn?.URL ?? btn?.href ?? "").trim();
  const target = (btn?.newTab ? "_blank" : btn?.target) || undefined;

  const vouchers = normalizeVouchers(data?.vouchers);

  const cards = vouchers
    .map((v) => ({
      id: v?.id,
      title: (v?.heading ?? "Voucher").toString(),
      desc: (v?.sub_heading ?? "").toString(),
      src: mediaUrl(v?.image),
    }))
    .filter((x) => !!x.src) as Array<{ id?: number; title: string; desc: string; src: string }>;

  const a11yLocale = locale?.toLowerCase?.() || "hu";

  // ✅ MOBILON kisebb tracking/padding → nem vágódik le a hosszú CTA
  const primaryBtnClass =
    "inline-flex items-center justify-center gap-2 sm:gap-3 rounded-2xl " +
    "px-5 sm:px-8 py-4 " +
    "text-[12px] sm:text-sm font-extrabold " +
    "tracking-[0.08em] sm:tracking-[0.12em] " +
    "text-white whitespace-nowrap select-none " +
    "shadow-[0_18px_44px_-18px_rgba(5,124,128,0.85)] transition hover:brightness-110 active:brightness-95 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[34px] border border-slate-200/80 bg-white">
          {/* BACKGROUND – jobbra koncentrált desktop; mobilon alul/jobbra finom */}
          <div
            className="pointer-events-none absolute inset-0 hidden lg:block"
            style={{
              background:
                `radial-gradient(560px 380px at 82% 30%, rgba(5,124,128,0.14), transparent 62%),
                 radial-gradient(760px 460px at 90% 42%, rgba(0,0,0,0.07), transparent 64%),
                 linear-gradient(90deg, #ffffff 0%, #ffffff 58%, #f3f5f6 100%)`,
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 lg:hidden"
            style={{
              background:
                `radial-gradient(520px 360px at 78% 80%, rgba(5,124,128,0.12), transparent 62%),
                 radial-gradient(640px 420px at 86% 90%, rgba(0,0,0,0.06), transparent 66%),
                 linear-gradient(180deg, #ffffff 0%, #ffffff 62%, #f3f5f6 100%)`,
            }}
          />

          <div className="relative grid items-center gap-8 p-5 sm:gap-10 sm:p-8 md:gap-12 md:p-10 lg:grid-cols-2 lg:p-12">
            {/* LEFT */}
            <div className="max-w-xl min-w-0">
              {badge ? (
                <div
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1  text-[10px] md:text-[11px] font-bold uppercase"
                  style={{
                    color: BRAND,
                    background: "rgba(5,124,128,0.08)",
                    border: "1px solid rgba(5,124,128,0.14)",
                  }}
                >
                  <GiftIcon className="shrink-0 w-4 h-4" />
                  <span className="whitespace-nowrap">{badge}</span>
                </div>
              ) : null}

              {/* ✅ break-words + hyphens-auto → nem vágódik le */}
              <h2
                className="mt-5 sm:mt-6 font-semibold tracking-tight text-slate-900 text-[30px] leading-[1.06] sm:text-4xl md:text-5xl break-words hyphens-auto"
                lang={a11yLocale}
              >
                {renderAccentHeading(heading)}
              </h2>

              {subheading ? (
                <p
                  className="mt-4 sm:mt-5 max-w-[52ch] text-xs leading-relaxed text-slate-600 md:text-sm break-words hyphens-auto"
                  lang={a11yLocale}
                >
                  {subheading}
                </p>
              ) : null}

              {/* ✅ MOBIL: egymás alá */}
              <div className="mt-6 sm:mt-8 flex flex-col items-start gap-2 sm:flex-row sm:items-center md:gap-3 min-w-0">
                {btnText && btnHref ? (
                  isExternal(btnHref) ? (
                    <a
                      href={btnHref}
                      target={target}
                      rel={target === "_blank" ? "noreferrer noopener" : undefined}
                      className={primaryBtnClass + " w-full sm:w-auto"}
                      style={{
                        background: BRAND,
                        border: "1px solid rgba(255,255,255,0.18)",
                      }}
                    >
                      <span className="whitespace-nowrap">{btnText}</span>
                      <ArrowRightIcon className="shrink-0" />
                    </a>
                  ) : (
                    <Link
                      href={btnHref}
                      target={target}
                      className={primaryBtnClass + " font-semibold"}
                      style={{
                        background: BRAND,
                        border: "1px solid rgba(255,255,255,0.18)",
                      }}
                    >
                      <span className="whitespace-nowrap">{btnText}</span>
                      <ArrowRightIcon className="shrink-0" />
                    </Link>
                  )
                ) : null}

                {infoLabel ? (
                  <div className="inline-flex items-center gap-1 whitespace-nowrap">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                      style={{ background: "rgba(5,124,128,0.10)", color: BRAND }}
                    >
                      <CheckIcon />
                    </span>
                    {/* ✅ mobilon kisebb tracking/font → nem lóg le */}
                    <span className="text-[10px] sm:text-xs font-semibold tracking-[0.10em] sm:tracking-[0.12em] uppercase text-slate-500">
                      {infoLabel}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* RIGHT */}
            <div className="relative mx-auto w-full max-w-[360px] sm:max-w-[520px] lg:mx-0 lg:max-w-xl">
              <div className="pointer-events-none absolute inset-0 -z-10 rounded-[28px] bg-black/[0.03]" />

              {cards.length ? (
                <div className="relative aspect-[16/10] w-full">
                  {cards[2] ? (
                    <div className="absolute left-[46%] top-[63%] w-[66%] -translate-x-1/2 -translate-y-1/2 opacity-70 sm:w-[70%] md:left-[44%] md:top-[66%] md:w-[64%]">
                      <VoucherCard
                        src={cards[2].src}
                        alt={cards[2].title}
                        title={cards[2].title}
                        desc={cards[2].desc}
                        showOverlay={false}
                        className="rotate-[8deg] sm:rotate-[10deg]"
                      />
                    </div>
                  ) : null}

                  {cards[1] ? (
                    <div className="absolute left-[56%] top-[60%] w-[74%] -translate-x-1/2 -translate-y-1/2 opacity-90 sm:w-[78%] md:left-[58%] md:top-[62%] md:w-[72%]">
                      <VoucherCard
                        src={cards[1].src}
                        alt={cards[1].title}
                        title={cards[1].title}
                        desc={cards[1].desc}
                        showOverlay={false}
                        className="rotate-[-5deg] sm:rotate-[-6deg]"
                      />
                    </div>
                  ) : null}

                  <div className="absolute left-1/2 top-1/2 w-[86%] -translate-x-1/2 -translate-y-1/2 sm:w-[88%] md:w-[82%]">
                    <VoucherCard
                      src={cards[0].src}
                      alt={cards[0].title}
                      title={cards[0].title}
                      desc={cards[0].desc}
                      showOverlay={true}
                      className="rotate-[2deg] sm:rotate-[3deg]"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white/70 text-sm font-semibold text-slate-500">
                  Nincs voucher kép beállítva a Strapi-ban.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
