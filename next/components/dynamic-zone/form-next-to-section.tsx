"use client";

import StarBackground from "@/components/decorations/star-background";
import ShootingStars from "@/components/decorations/shooting-star";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";

import Link from "next/link";
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandX,
} from "@tabler/icons-react";

import { Button } from "../elements/button";

export function FormNextToSection({
  heading,
  sub_heading,
  form,
  section,
  social_media_icon_links,
}: {
  heading: string;
  sub_heading: string;
  form: any;
  section: any;
  social_media_icon_links: any;
}) {
  const socials = [
    {
      title: "twitter",
      href: "https://twitter.com/strapijs",
      icon: <IconBrandX className="h-5 w-5 text-breaker-bay-600 hover:text-breaker-bay-800 transition-colors" />,
    },
    {
      title: "github",
      href: "https://github.com/strapi",
      icon: <IconBrandGithub className="h-5 w-5 text-breaker-bay-600 hover:text-breaker-bay-800 transition-colors" />,
    },
    {
      title: "linkedin",
      href: "https://linkedin.com/strapi",
      icon: <IconBrandLinkedin className="h-5 w-5 text-breaker-bay-600 hover:text-breaker-bay-800 transition-colors" />,
    },
  ];

  return (
    <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 relative overflow-hidden bg-white">
      {/* LEFT */}
      <div className="flex relative z-20 items-center w-full justify-center px-4 py-4 lg:py-40 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <div>
            <h1 className="mt-8 text-2xl font-bold leading-9 tracking-tight text-breaker-bay-900">
              {heading}
            </h1>
            <p className="mt-4 text-neutral-600 text-sm max-w-sm">
              {sub_heading}
            </p>
          </div>

          <div className="py-10">
            <div>
              <form className="space-y-4">
                {form &&
                  form?.inputs?.map((input: any, idx: number) => (
                    <div key={`${input?.name ?? "field"}-${idx}`}>
                      {input.type !== "submit" && (
                        <label
                          htmlFor={input?.name ?? `field-${idx}`}
                          className="block text-sm font-medium leading-6 text-neutral-700"
                        >
                          {input.name}
                        </label>
                      )}

                      <div className="mt-2">
                        {input.type === "textarea" ? (
                          <textarea
                            rows={5}
                            id={input?.name ?? `field-${idx}`}
                            placeholder={input.placeholder}
                            className="block w-full bg-white px-4 rounded-md border border-neutral-300 py-1.5 shadow-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-breaker-bay-400 focus:outline-none sm:text-sm sm:leading-6"
                          />
                        ) : input.type === "submit" ? (
                          <div>
                            <Button className="w-full mt-6 bg-breaker-bay-900 hover:bg-breaker-bay-600 text-white">
                              {input.name}
                            </Button>
                          </div>
                        ) : (
                          <input
                            id={input?.name ?? `field-${idx}`}
                            type={input.type}
                            placeholder={input.placeholder}
                            className="block w-full bg-white px-4 rounded-md border border-neutral-300 py-1.5 shadow-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-breaker-bay-400 focus:outline-none sm:text-sm sm:leading-6"
                          />
                        )}
                      </div>
                    </div>
                  ))}
              </form>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-4 py-4">
            {socials.map((social) => (
              <Link href={social.href} target="_blank" key={social.title} aria-label={social.title}>
                {social.icon}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="relative w-full z-20 hidden md:flex border-l border-neutral-200 overflow-hidden bg-neutral-50 items-center justify-center">
        <StarBackground />
        <ShootingStars />
        <div className="max-w-sm mx-auto">
          <div className="flex flex-row items-center justify-center mb-10 w-full">
            <AnimatedTooltip items={section.users} />
          </div>
          <p className="font-semibold text-xl text-center text-breaker-bay-800 text-balance">
            {section.heading}
          </p>
          <p className="font-normal text-base text-center text-neutral-600 mt-8 text-balance">
            {section.sub_heading}
          </p>
        </div>
      </div>
    </div>
  );
}
