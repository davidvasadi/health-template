"use client";

import Image from "next/image";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

/** Blur → éles + finom scale-in */
export const BlurImage: React.FC<React.ComponentProps<typeof Image>> = (props) => {
  const [isLoading, setLoading] = useState(true);
  const { src, width, height, alt, ...rest } = props;

  return (
    <Image
      className={cn(
        "transition-[filter,transform] duration-300 will-change-transform",
        isLoading ? "blur-sm scale-[1.02]" : "blur-0 scale-100",
        props.className
      )}
      onLoad={() => setLoading(false)}
      src={src}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      alt={alt ?? "Image"}
      {...rest}
    />
  );
};
