import React from "react";
import { Logo } from "@/components/logo";
import { Link } from "next-view-transitions";

type FooterProps = {
  data: any;
  locale: string;
};

export const Footer = ({ data, locale }: FooterProps) => {
  return (
    <footer className="relative ">
      {/* Felső “hairline” fényvonal (finom, nem tolakodó) */}
      <div className="h-px w-full bg-gradient-to-r from-breaker-bay-300/0 via-breaker-bay-300/50 to-breaker-bay-300/0" />

      <div className="mx-auto max-w-7xl px-6 md:px-8 pt-16 pb-24">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-12 text-sm">
          {/* Bal oszlop: logó + leírás + credit */}
          <div className="max-w-md">
            {data?.logo?.image && (
              <div className="mb-6">
                <Logo image={data.logo.image} company={data.logo.company} />
              </div>
            )}

            {data?.description && (
              <p className="text-breaker-bay-950/90 leading-relaxed">
                {data.description}
              </p>
            )}

            {data?.copyright && (
              <p className="mt-3 text-breaker-bay-950/70">
                {data.copyright}
              </p>
            )}

            <div className="mt-8 space-y-1 text-breaker-bay-950/80">
              <div>
                Designed and Developed by{" "}
                <a
                  href="https://davelopment.hu"
                  className="font-semibold text-breaker-bay-700 hover:text-breaker-bay-800 transition-colors"
                >
                  [davelopment]®
                </a>
              </div>
              <div className="text-sm">
                built with{" "}
                <a
                  className="underline underline-offset-4 hover:text-breaker-bay-800 transition-colors"
                  href="https://strapi.io"
                >
                  Strapi
                </a>
                ,{" "}
                <a
                  className="underline underline-offset-4 hover:text-breaker-bay-800 transition-colors"
                  href="https://nextjs.org"
                >
                  Next.js
                </a>
                ,{" "}
                <a
                  className="underline underline-offset-4 hover:text-breaker-bay-800 transition-colors"
                  href="https://tailwindcss.com"
                >
                  Tailwind CSS
                </a>
                ,{" "}
                <a
                  className="underline underline-offset-4 hover:text-breaker-bay-800 transition-colors"
                  href="https://framer.com/motion"
                >
                  Motion
                </a>
                ,{" "}
                <a
                  className="underline underline-offset-4 hover:text-breaker-bay-800 transition-colors"
                  href="https://ui.aceternity.com"
                >
                  Aceternity UI
                </a>
              </div>
            </div>
          </div>

          {/* Jobb: link szekciók (3 oszlop) */}
<div className="grid grid-cols-3 gap-10 min-w-[260px]">
            <LinkSection links={data?.internal_links} locale={locale} />
            <LinkSection links={data?.policy_links} locale={locale} />
            <LinkSection links={data?.social_media_links} locale={locale} />
          </div>
        </div>

        {/* Alsó finom hairline lezárás */}
        <div className="mt-14 h-px w-full bg-gradient-to-r from-transparent via-breaker-bay-300/40 to-transparent" />
      </div>
    </footer>
  );
};

const LinkSection = ({
  links = [],
  locale,
}: {
  links: { text: string; URL: string }[] | undefined;
  locale: string;
}) => {
  if (!links || links.length === 0) {
    return <div className="flex flex-col gap-3" />;
  }

  return (
    <div className="flex flex-col gap-3">
      {links.map((link) => {
        const isExternal = typeof link.URL === "string" && link.URL.startsWith("http");
        const href = isExternal ? link.URL : `/${locale}${link.URL}`;

        return (
          <Link
            key={link.text}
            href={href as any}
            className="relative inline-flex items-center gap-2 group transition-colors duration-200 text-breaker-bay-900 hover:text-breaker-bay-700"
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
          >
            <span className="translate-x-0 group-hover:translate-x-0.5 transition-transform duration-200">
              {link.text}
            </span>
            {/* apró akcent pont hoverkor */}
            <span
              aria-hidden
              className="h-1 w-1 rounded-full opacity-0 group-hover:opacity-90 transition-opacity duration-200 bg-breaker-bay-400"
            />
          </Link>
        );
      })}
    </div>
  );
};
