// next/components/practices/single-practice/media.ts

import { absUrl, unwrapSingleMedia } from "./strapi";
import { LOGO_THUMB } from "./tokens";

export const isVideo = (m: any) => {
  const url = m?.url || "";
  const mime = m?.mime || "";
  return mime.startsWith("video/") || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
};

export const isImage = (m: any) => {
  const url = m?.url || "";
  const mime = m?.mime || "";
  return mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(url);
};

export const isPdf = (m: any) => {
  const url = m?.url || "";
  const mime = m?.mime || "";
  return mime === "application/pdf" || /\.pdf(\?|$)/i.test(url);
};

export type MediaKind = "video" | "image" | "pdf" | "file";

export function mediaKind(m: any): MediaKind {
  if (!m) return "file";
  if (isVideo(m)) return "video";
  if (isImage(m)) return "image";
  if (isPdf(m)) return "pdf";
  return "file";
}

// ✅ Requirement: videón "VIDEÓ"
export const thumbLabel = (k: MediaKind) =>
  k === "video" ? "VIDEÓ" : k === "image" ? "KÉP" : k === "pdf" ? "PDF" : "FÁJL";

/** keep token as-is, but make it usable in <img src> */
function normalizePublicAsset(src?: string) {
  const s = String(src ?? "").trim();
  if (!s) return "";
  if (s.startsWith("public/")) return `/${s.slice("public/".length)}`;
  return s;
}

function placeholderThumb() {
  // LOGO_THUMB = "public/logo.svg" -> "/logo.svg"
  const u = normalizePublicAsset(LOGO_THUMB);
  return u || "/logo.svg";
}

function pickBestFormatUrl(
  m: any,
  order: Array<"thumbnail" | "small" | "medium" | "large">
) {
  const formats = m?.formats;
  if (!formats || typeof formats !== "object") return "";
  for (const key of order) {
    const u = formats?.[key]?.url;
    if (u) return u;
  }
  return "";
}

function toImgSrc(url?: string) {
  const u = normalizePublicAsset(url);
  if (!u) return "";
  if (/^https?:\/\//i.test(u) || u.startsWith("data:") || u.startsWith("blob:")) return u;
  if (u.startsWith("/uploads") || u.includes("/uploads/")) return absUrl(u);
  if (u.startsWith("/")) return u; // site asset
  return u;
}

/**
 * ✅ Video poster resolver:
 * - videó itemhez: practice.video_poster (ha van) -> különben placeholder
 * - safety: p.practice.video_poster is
 */
function resolveVideoPoster(p: any, size: "thumb" | "hero") {
  const posterMedia =
    unwrapSingleMedia(p?.video_poster) || unwrapSingleMedia(p?.practice?.video_poster) || null;

  if (!posterMedia?.url) return placeholderThumb();

  const picked =
    size === "thumb"
      ? pickBestFormatUrl(posterMedia, ["small", "thumbnail", "medium", "large"]) || posterMedia.url
      : pickBestFormatUrl(posterMedia, ["large", "medium", "small", "thumbnail"]) || posterMedia.url;

  return toImgSrc(picked) || placeholderThumb();
}

/**
 * ✅ Hero poster:
 * - video: practice.video_poster
 * - image: own url/formats
 * - else: cover/image/heroImage if exists else placeholder
 */
export function resolvePosterUrl(p: any, active: any) {
  const k = mediaKind(active);

  if (k === "video") return resolveVideoPoster(p, "hero") || placeholderThumb();

  if (k === "image") {
    const picked =
      pickBestFormatUrl(active, ["large", "medium", "small", "thumbnail"]) || active?.url || "";
    return toImgSrc(picked) || placeholderThumb();
  }

  const cover = unwrapSingleMedia(p?.cover || p?.image || p?.heroImage || p?.practice?.cover) || null;
  if (cover?.url) {
    const picked =
      pickBestFormatUrl(cover, ["large", "medium", "small", "thumbnail"]) || cover.url;
    return toImgSrc(picked) || placeholderThumb();
  }

  return placeholderThumb();
}

/**
 * ✅ Gallery thumb:
 * - video: practice.video_poster (ha van) -> placeholder
 * - image: own formats/url
 * - pdf/file: hero fallback
 */
export function resolveThumbForMedia(p: any, m: any) {
  const k = mediaKind(m);

  if (k === "video") return resolveVideoPoster(p, "thumb") || placeholderThumb();

  if (k === "image") {
    const picked =
      pickBestFormatUrl(m, ["small", "thumbnail", "medium", "large"]) || m?.url || "";
    return toImgSrc(picked) || placeholderThumb();
  }

  return resolvePosterUrl(p, m) || placeholderThumb();
}
