// next/components/logo.tsx
import React from "react";
import { Link } from "next-view-transitions";
import { BlurImage } from "./blur-image";
import { strapiImage } from "@/lib/strapi/strapiImage";
import { Image } from "@/types/types";

export const Logo = ({
  image,
  locale,
  company,
}: {
  image?: Image | any;
  locale?: string;
  company?: string;
}) => {

  if (!image) return null;

  const imgUrl =
    image?.url ||
    image?.data?.attributes?.url ||
    image?.attributes?.url ||
    "";

  const imgAlt =
    image?.alternativeText ||
    image?.data?.attributes?.alternativeText ||
    image?.attributes?.alternativeText ||
    "logo";

const text = (company ?? "").replace(/\\n/g, "\n");
const [line1, line2] = text.split(/\r?\n/);

  return (
    <Link
      href={`/${locale || "hu"}`}
      className="font-normal flex space-x-2 items-center text-sm mr-4 text-black relative z-20"
    >
      <BlurImage
        src={strapiImage(imgUrl)}
        alt={imgAlt}
        width={200}
        height={200}
        className="h-10 w-10 rounded-xl "
      />

      
<span className="block text-left text-black font-thin leading-tight">
  {line1}
  {line2 ? (
    <>
      <br />
      <span className="font-semibold">{line2}</span>
    </>
  ) : null}
</span>

    </Link>
  );
};
