// next/components/practices/single-practice/strapi.ts

import { strapiImage } from "@/lib/strapi/strapiImage";

export const get = (x: any) => x?.attributes ?? x;

export function unwrapArrayRel(rel: any) {
  const d = rel?.data ?? rel;
  if (!Array.isArray(d)) return [];
  return d.map((it: any) => get(it)).filter(Boolean);
}

export function unwrapSingleMedia(m: any) {
  const d = m?.data ?? m;
  const one = Array.isArray(d) ? d[0] : d;
  const v = get(one);
  return v && v?.url ? v : null;
}

export const absUrl = (url?: string) => (url ? strapiImage(url) : "");
export const norm = (s?: string) => (s ?? "").replace(/^\/|\/$/g, "");

export function localizeHref(url?: string, locale?: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const clean = url.startsWith("/") ? url : `/${url}`;
  if (!locale) return clean;
  if (clean.startsWith(`/${locale}/`) || clean === `/${locale}`) return clean;
  return `/${locale}${clean}`;
}

export const safeLower = (x: any) => String(x ?? "").toLowerCase();
