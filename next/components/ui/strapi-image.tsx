import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import { ComponentProps, useEffect, useMemo, useRef, useState } from "react";

interface StrapiImageProps extends Omit<ComponentProps<typeof Image>, "src" | "alt"> {
  src: string;
  alt: string | null;

  // videó finomhangolás (nem kell mindenhol átírni)
  poster?: string | null;
  controls?: boolean; // ha valahol explicit akarod
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  preload?: "none" | "metadata" | "auto";

  pauseOnHide?: boolean; // default: true
}

const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".m4v"] as const;

function isVideoUrl(url: string) {
  const u = url.toLowerCase().split("?")[0];
  return VIDEO_EXTS.some((ext) => u.endsWith(ext));
}

function isLikelyThumb(className?: string, width?: unknown, height?: unknown) {
  const w = typeof width === "number" ? width : undefined;
  const h = typeof height === "number" ? height : undefined;
  const smallBySize = !!w && !!h && w <= 260 && h <= 260;

  const cn = className ?? "";
  const smallByClass = /\b(w|h)-(10|12|14|16|18|20|24|28|32)\b/.test(cn);

  return smallBySize || smallByClass;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function getStrapiMedia(url: string | null) {
  const strapiURL = process.env.NEXT_PUBLIC_API_URL ?? "";
  if (url == null) return null;
  if (url.startsWith("data:")) return url;
  if (url.startsWith("http") || url.startsWith("//")) return url;

  const hasDocument = typeof document !== "undefined";

  if (url.startsWith("/")) {
    if (!strapiURL && hasDocument && document.location.host.endsWith(".strapidemo.com")) {
      return `https://${document.location.host.replace("client-", "api-")}${url}`;
    }
    return strapiURL + url;
  }

  return strapiURL + url;
}

function PlayIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
      className="translate-x-[1px]"
    >
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

export function StrapiImage({
  src,
  alt,
  className,
  poster,
  controls,
  muted,
  loop,
  playsInline,
  preload,
  pauseOnHide = true,
  ...rest
}: Readonly<StrapiImageProps>) {
  noStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const mediaUrl = useMemo(() => getStrapiMedia(src), [src]);
  if (!mediaUrl) return null;

  const isVideo = isVideoUrl(mediaUrl);
  const thumb = isLikelyThumb(className, (rest as any).width, (rest as any).height);

  // main videónál: csak akkor tekintjük “elindítottnak”, ha a video tényleg play state-be kerül
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isVideo) return;

    const v = videoRef.current;
    if (!v) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
    };
  }, [isVideo, mediaUrl]);

  // tab váltáskor pause
  useEffect(() => {
    if (!pauseOnHide || !isVideo) return;

    const onVisibility = () => {
      if (document.hidden) {
        const v = videoRef.current;
        if (v) {
          try {
            v.pause();
          } catch {}
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pauseOnHide, isVideo]);

  // media váltás / unmount: stop + reset
  useEffect(() => {
    return () => {
      const v = videoRef.current;
      if (v) {
        try {
          v.pause();
          v.currentTime = 0;
        } catch {}
      }
      setIsPlaying(false);
    };
  }, [mediaUrl]);

  if (!isVideo) {
    return (
      <Image
        src={mediaUrl}
        alt={alt ?? ""}
        className={className}
        {...rest}
      />
    );
  }

  const posterUrl = poster ? getStrapiMedia(poster) : null;

  // Thumbnail:
  // - legyen passzív, sose legyen controls, sose induljon el kattintásra
  // Main:
  // - controls csak akkor jelenjen meg, ha már elindult (vagy explicit bekapcsoltad)
  const showControls = controls ?? (!thumb && isPlaying);

  // Külön play gomb: ez a “senior” megoldás a glitch ellen
  const handlePlayClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const v = videoRef.current;
    if (!v) return;

    try {
      await v.play();
      // isPlaying-et a "play" event fogja true-ra állítani
    } catch {
      // ha autoplay policy miatt nem megy, legalább legyenek controls
      // (itt hagyjuk, mert a user úgyis rákattint majd a natív play-re)
    }
  };

  // Wrapper: overflow-hidden, hogy overlay sose vágódjon le
  return (
    <span
      className={cx(
        "relative block overflow-hidden",
        // ha a className ad roundot, ok; ha nem, adunk finomat
        !/\brounded-/.test(className ?? "") && "rounded-2xl",
        className
      )}
    >
      <video
        ref={videoRef}
        className={cx(
          "h-full w-full object-cover",
          // thumbnailnél ne fogja meg a clicket (a parent gomb kezeli)
          thumb && "pointer-events-none"
        )}
        controls={showControls}
        muted={muted ?? (thumb ? true : undefined)}
        loop={loop}
        playsInline={playsInline ?? true}
        preload={preload ?? "metadata"}
        poster={posterUrl ?? undefined}
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        tabIndex={thumb ? -1 : 0}
        aria-hidden={thumb ? true : undefined}
      >
        <source src={mediaUrl} />
      </video>

      {/* THUMB overlay: mindig látható, sose vágódik */}
      {thumb && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 grid place-items-center"
        >
          <span className="rounded-full bg-black/40 p-2 shadow-sm">
            <PlayIcon size={18} />
          </span>
        </span>
      )}

      {/* MAIN overlay: csak ha nem játszik – dedikált gombbal */}
      {!thumb && !isPlaying && (
        <button
          type="button"
          onClick={handlePlayClick}
          className="absolute inset-0 grid place-items-center bg-black/0 transition hover:bg-black/10 focus-visible:bg-black/10"
          aria-label="Videó lejátszása"
        >
          <span className="rounded-full bg-black/40 p-4 shadow-sm backdrop-blur-[2px]">
            <PlayIcon size={26} />
          </span>
        </button>
      )}
    </span>
  );
}
