import { cn } from "@/lib/utils";
import { AnimationProps, MotionProps } from "framer-motion";
import React from "react";
import Balancer from "react-wrap-balancer";

export const Subheading = ({
  className,
  // alapból bekezdés (2026-11-20): korábban h2 volt, így minden alcím H2-ként került az oldal címsor-szerkezetébe
  // (a főoldalon 23 H2) — SEO-szempontból zavaros. Ha valahol tényleg címsor kell, `as="h2"`.
  as: Tag = "p",
  children,
  ...props
}: {
  className?: string;
  as?: any;
  children: any;
  props?: React.HTMLAttributes<HTMLHeadingElement | AnimationProps>;
} & MotionProps &
  React.HTMLAttributes<HTMLHeadingElement | AnimationProps>) => {
  return (
    <Tag
      className={cn(
        "text-sm md:text-base  max-w-4xl ",
        "text-breaker-bay-950  font-normal",
        className
      )}
    >
      <Balancer>{children}</Balancer>
    </Tag>
  );
};
