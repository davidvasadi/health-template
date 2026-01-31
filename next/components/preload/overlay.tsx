"use client";

import React, {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Preload from "./preload";

type OverlayKind = "first" | "route" | "pop";
type OverlayStatus = "enter" | "exit" | "idle";

type UIState = {
  status: OverlayStatus;
  kind: OverlayKind;
  logoKey: number;
};

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const ENTER_SYNC_MS = 900;
const EXIT_SYNC_MS = 1400;

const TIMING = {
  enterMs: ENTER_SYNC_MS,
  exitMs: EXIT_SYNC_MS,

  panelEnterMs: 650,
  panelExitMs: EXIT_SYNC_MS,

  shellRevealMs: EXIT_SYNC_MS,

  firstHoldMs: 1150,
  routeHoldMs: 900,
  navTimeoutMs: 8000,
};

// ✅ NAV hamarabb indul (Safari “gondolkodás” ellen)
const NAV_GATE_MS = 240;
// ✅ ha Safari elnyeli a completion-t: biztosíték
const ENTER_FALLBACK_PAD_MS = 180;

/** ✅ NAV EVENT: mobil menü zárás stb. */
const ROUTE_OVERLAY_NAV_EVENT = "route-overlay:navigate";
function emitOverlayNavigate(kind: OverlayKind, href?: string | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ROUTE_OVERLAY_NAV_EVENT, { detail: { kind, href: href ?? null } }));
}

function getUrlKey(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

function isSafariUA() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const vendor = navigator.vendor || "";
  const isApple = vendor.includes("Apple");
  const isCriOS = ua.includes("CriOS");
  const isFxiOS = ua.includes("FxiOS");
  return isApple && !isCriOS && !isFxiOS;
}

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/** iOS-safe scroll lock (body fixed) — ✅ unlock NEM scrolloz */
function createScrollLocker() {
  let locked = false;
  let savedY = 0;

  return {
    lock() {
      if (typeof window === "undefined" || locked) return;
      const html = document.documentElement;
      const body = document.body;

      locked = true;
      savedY = window.scrollY || window.pageYOffset || 0;

      const sw = window.innerWidth - html.clientWidth;
      if (sw > 0) body.style.paddingRight = `${sw}px`;

      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${savedY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
    },
    unlock() {
      if (typeof window === "undefined" || !locked) return;
      const html = document.documentElement;
      const body = document.body;

      locked = false;

      html.style.overflow = "";
      body.style.overflow = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.paddingRight = "";
    },
    getSavedY() {
      return savedY;
    },
  };
}

/** ENTER elején: ghost ellen */
function shellHideInstant(reduce: boolean, pullPx: number) {
  const el = document.getElementById("app-shell");
  if (!el) return;

  el.style.transition = "none";
  el.style.willChange = "opacity, transform";
  el.style.opacity = "0";

  if (!reduce) {
    el.style.transform = `translate3d(0, ${pullPx}px, 0)`;
    el.style.backfaceVisibility = "hidden";
    (el.style as any).WebkitBackfaceVisibility = "hidden";
  } else {
    el.style.transform = "";
  }

  requestAnimationFrame(() => {
    const el2 = document.getElementById("app-shell");
    if (!el2) return;
    el2.style.transition = "";
    el2.style.willChange = "";
  });
}

/** EXIT alatt: content “feljön” */
function shellRevealAnimated(reduce: boolean, ms: number, pullPx: number) {
  const el = document.getElementById("app-shell");
  if (!el) return;

  if (reduce || ms <= 0) {
    el.style.transition = "none";
    el.style.opacity = "1";
    el.style.transform = "";
    el.style.willChange = "";
    return;
  }

  el.style.willChange = "opacity, transform";
  el.style.transition = `opacity ${ms}ms cubic-bezier(${EASE.join(",")}), transform ${ms}ms cubic-bezier(${EASE.join(",")})`;

  if (!el.style.transform) {
    el.style.transform = `translate3d(0, ${pullPx}px, 0)`;
  }

  el.style.opacity = "1";
  el.style.transform = "translate3d(0, 0px, 0)";

  window.setTimeout(() => {
    const el2 = document.getElementById("app-shell");
    if (!el2) return;
    el2.style.transition = "";
    el2.style.transform = "";
    el2.style.willChange = "";
    el2.style.backfaceVisibility = "";
    (el2.style as any).WebkitBackfaceVisibility = "";
  }, ms + 90);
}

function removeShellInlineStyles() {
  const el = document.getElementById("app-shell");
  if (!el) return;
  el.style.transition = "";
  el.style.opacity = "";
  el.style.transform = "";
  el.style.willChange = "";
  el.style.backfaceVisibility = "";
  (el.style as any).WebkitBackfaceVisibility = "";
}

function shouldHandleAnchorClick(e: MouseEvent, a: HTMLAnchorElement) {
  if (e.defaultPrevented) return false;
  if (e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;

  if (a.hasAttribute("download")) return false;
  const target = (a.getAttribute("target") || "").toLowerCase();
  if (target && target !== "_self") return false;

  if (a.getAttribute("data-no-overlay") === "true") return false;

  const rawHref = a.getAttribute("href") || "";
  if (!rawHref) return false;
  if (rawHref.startsWith("#")) return false;
  if (/^(mailto:|tel:|javascript:)/i.test(rawHref)) return false;

  let url: URL;
  try {
    url = new URL(a.href, window.location.href);
  } catch {
    return false;
  }

  if (!(url.protocol === "http:" || url.protocol === "https:")) return false;
  if (url.origin !== window.location.origin) return false;

  const samePath = url.pathname === window.location.pathname && url.search === window.location.search;
  if (samePath && url.hash && url.hash !== window.location.hash) return false;

  const role = (a.getAttribute("role") || "").toLowerCase();
  if (role === "button") return false;
  if (a.getAttribute("aria-controls") !== null) return false;

  const current = window.location.pathname + window.location.search + window.location.hash;
  const next = url.pathname + url.search + url.hash;
  if (next === current) return false;

  if (a.closest?.('[data-no-overlay-root="true"]')) return false;

  return true;
}

export default function RouteOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const reduce = useReducedMotion();

  const safari = useMemo(() => isSafariUA(), []);
  const search = sp?.toString() ?? "";
  const urlKey = useMemo(() => getUrlKey(pathname, search), [pathname, search]);

  const enterMs = reduce ? 1 : TIMING.enterMs;
  const exitMs = reduce ? 1 : TIMING.exitMs;

  const panelEnterMs = reduce ? 1 : TIMING.panelEnterMs;
  const panelExitMs = reduce ? 1 : TIMING.panelExitMs;

  const shellRevealMs = reduce ? 0 : TIMING.shellRevealMs;

  const firstHoldMs = reduce ? 60 : TIMING.firstHoldMs;
  const routeHoldMs = reduce ? 0 : TIMING.routeHoldMs;

  const pullPx = reduce ? 0 : 22;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  const uiRef = useRef<UIState | null>(null);
  const [ui, setUI] = useState<UIState>(() => ({
    status: "enter",
    kind: "first",
    logoKey: 1,
  }));
  useEffect(() => {
    uiRef.current = ui;
  }, [ui]);

  const tokenRef = useRef(0);
  const busyRef = useRef(true);

  const enteredRef = useRef(false);
  const pendingExitRef = useRef(false);

  const pendingHrefRef = useRef<string | null>(null);
  const didNavigateTokenRef = useRef<number>(-1);

  const lastUrlRef = useRef(urlKey);
  const logoStartAtRef = useRef(0);

  const navTimeoutRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);

  const enterFallbackRef = useRef<number | null>(null);
  const navGateRef = useRef<number | null>(null);

  const ssrCoverRemovedRef = useRef(false);

  /** ✅ URL-key scroll mentés / restore (pop/back-hez) */
  const scrollPosRef = useRef<Map<string, number>>(new Map());
  const restoreScrollYRef = useRef<number>(0);

  const lockerRef = useRef<ReturnType<typeof createScrollLocker> | null>(null);
  if (!lockerRef.current && typeof window !== "undefined") {
    lockerRef.current = createScrollLocker();
  }

  /** ✅ browser scrollRestoration kikapcs */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = prev;
    };
  }, []);

  const primeBackdropInstant = useCallback(() => {
    const el = backdropRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.opacity = "1";
    requestAnimationFrame(() => {
      const el2 = backdropRef.current;
      if (!el2) return;
      el2.style.transition = "";
    });
  }, []);

  const showRoot = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    el.style.visibility = "visible";
    el.style.pointerEvents = "auto";
  }, []);

  const hideRoot = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    el.style.pointerEvents = "none";
    el.style.visibility = "hidden";
  }, []);

  const clearNavTimeout = useCallback(() => {
    if (navTimeoutRef.current) {
      window.clearTimeout(navTimeoutRef.current);
      navTimeoutRef.current = null;
    }
  }, []);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const clearEnterFallback = useCallback(() => {
    if (enterFallbackRef.current) {
      window.clearTimeout(enterFallbackRef.current);
      enterFallbackRef.current = null;
    }
  }, []);

  const clearNavGate = useCallback(() => {
    if (navGateRef.current) {
      window.clearTimeout(navGateRef.current);
      navGateRef.current = null;
    }
  }, []);

  const removeSsrCoverOnce = useCallback(() => {
    if (ssrCoverRemovedRef.current) return;
    const el = document.getElementById("ssr-preload-cover");
    if (el) el.remove();
    ssrCoverRemovedRef.current = true;
  }, []);

  /** Safari + unsupported: safe no-op VT */
  useEffect(() => {
    const d = document as any;
    const shouldPolyfill = safari || typeof d.startViewTransition !== "function";
    if (!shouldPolyfill) return;
    if (d.__vt_noop_installed) return;
    d.__vt_noop_installed = true;

    d.startViewTransition = (updateCallback: () => void | Promise<void>) => {
      let resolveFinished!: () => void;
      const finished = new Promise<void>((r) => (resolveFinished = r));
      Promise.resolve()
        .then(() => updateCallback?.())
        .then(
          () => resolveFinished(),
          () => resolveFinished()
        );
      return {
        finished,
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: () => resolveFinished(),
      };
    };
  }, [safari]);

  const doNavigateIfNeeded = useCallback(() => {
    const cur = uiRef.current;
    if (!cur) return;
    if (cur.kind !== "route") return;

    const href = pendingHrefRef.current;
    if (!href) return;

    const token = tokenRef.current;
    if (didNavigateTokenRef.current === token) return;

    didNavigateTokenRef.current = token;

    // ✅ FONTOS: scroll:false → nincs “később ugrás”
    startTransition(() => router.push(href, { scroll: false }));
  }, [router]);

  const beginExit = useCallback(() => {
    clearNavTimeout();
    clearHoldTimer();
    clearEnterFallback();
    clearNavGate();

    const cur = uiRef.current;
    if (!cur || cur.status === "exit" || cur.status === "idle") return;

    requestAnimationFrame(() => {
      shellRevealAnimated(!!reduce, shellRevealMs, pullPx);
    });

    setUI((s) => ({ ...s, status: "exit" }));
  }, [clearEnterFallback, clearHoldTimer, clearNavGate, clearNavTimeout, pullPx, reduce, shellRevealMs]);

  const finish = useCallback(() => {
    clearNavTimeout();
    clearHoldTimer();
    clearEnterFallback();
    clearNavGate();

    busyRef.current = false;
    enteredRef.current = false;
    pendingExitRef.current = false;
    pendingHrefRef.current = null;
    didNavigateTokenRef.current = -1;

    const y = restoreScrollYRef.current ?? 0;

    // ✅ scroll restore/top még az overlay alatt történjen (NO gagyi jump)
    requestAnimationFrame(() => {
      lockerRef.current?.unlock();

      requestAnimationFrame(() => {
        window.scrollTo(0, y);
        removeShellInlineStyles();
        hideRoot();
        setUI((s) => ({ ...s, status: "idle" }));
      });
    });
  }, [clearEnterFallback, clearHoldTimer, clearNavGate, clearNavTimeout, hideRoot]);

  const requestExit = useCallback(
    (kind: OverlayKind, forced = false) => {
      const cur = uiRef.current;
      if (!cur || cur.status === "idle" || cur.status === "exit") return;

      if (!enteredRef.current && !forced) {
        pendingExitRef.current = true;
        return;
      }

      const minHold = forced ? 0 : kind === "route" || kind === "pop" ? routeHoldMs : 0;
      const elapsed = now() - (logoStartAtRef.current || now());
      const wait = Math.max(0, minHold - elapsed);

      clearHoldTimer();
      holdTimerRef.current = window.setTimeout(() => beginExit(), wait);
    },
    [beginExit, clearHoldTimer, routeHoldMs]
  );

  const startOverlay = useCallback(
    (kind: OverlayKind, href?: string) => {
      // last click wins (és közben is zárjuk a menüt)
      if (busyRef.current) {
        if (kind === "route" && href) {
          pendingHrefRef.current = href;
          restoreScrollYRef.current = 0;
          emitOverlayNavigate("route", href);
        } else if (kind === "pop") {
          emitOverlayNavigate("pop", null);
        }
        return;
      }

      // ✅ current scroll mentése (pop/back restore-hoz)
      const currentKey = lastUrlRef.current;
      const currentScroll = typeof window !== "undefined" ? window.scrollY || 0 : 0;
      scrollPosRef.current.set(currentKey, currentScroll);

      // ✅ route/first: top, pop: majd URL-change-nél állítjuk pontosra
      restoreScrollYRef.current = kind === "route" || kind === "first" ? 0 : currentScroll;

      busyRef.current = true;
      enteredRef.current = false;
      pendingExitRef.current = false;

      const token = ++tokenRef.current;

      pendingHrefRef.current = kind === "route" && href ? href : null;
      didNavigateTokenRef.current = -1;

      if (kind !== "first") {
        emitOverlayNavigate(kind, pendingHrefRef.current);
      }

      // ✅ 0ms coverage: root + backdrop azonnal
      showRoot();
      primeBackdropInstant();

      // ✅ ghost/jump ellen: shell hide AZONNAL, majd route-nál AZONNAL top
      shellHideInstant(!!reduce, pullPx);
      if (kind === "route") {
        window.scrollTo(0, 0);
      }

      setUI({ status: "enter", kind, logoKey: token });

      requestAnimationFrame(() => {
        lockerRef.current?.lock();
      });

      clearNavTimeout();
      navTimeoutRef.current = window.setTimeout(() => {
        requestExit(kind, true);
      }, TIMING.navTimeoutMs);

      clearNavGate();
      if (!reduce && kind === "route") {
        navGateRef.current = window.setTimeout(() => {
          doNavigateIfNeeded();
        }, NAV_GATE_MS);
      }

      clearEnterFallback();
      enterFallbackRef.current = window.setTimeout(() => {
        const cur = uiRef.current;
        if (!cur) return;
        if (cur.status !== "enter") return;

        enteredRef.current = true;
        logoStartAtRef.current = now();
        removeSsrCoverOnce();

        doNavigateIfNeeded();

        if (pendingExitRef.current && (cur.kind === "route" || cur.kind === "pop")) {
          pendingExitRef.current = false;
          requestExit(cur.kind);
        }
      }, Math.max(enterMs + ENTER_FALLBACK_PAD_MS, 260));
    },
    [
      clearEnterFallback,
      clearNavGate,
      clearNavTimeout,
      doNavigateIfNeeded,
      enterMs,
      pullPx,
      primeBackdropInstant,
      reduce,
      removeSsrCoverOnce,
      requestExit,
      showRoot,
    ]
  );

  // FIRST LOAD
  useLayoutEffect(() => {
    restoreScrollYRef.current = 0;

    showRoot();
    primeBackdropInstant();
    shellHideInstant(!!reduce, pullPx);
    window.scrollTo(0, 0);

    requestAnimationFrame(() => {
      lockerRef.current?.lock();
    });

    clearNavTimeout();
    navTimeoutRef.current = window.setTimeout(() => {
      requestExit("first", true);
    }, TIMING.navTimeoutMs);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // POPSTATE
  useEffect(() => {
    const onPop = () => {
      if (busyRef.current) return;
      startOverlay("pop");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [startOverlay]);

  // URL change -> exit request + ✅ pop scroll target beállítás
  useEffect(() => {
    const prev = lastUrlRef.current;
    if (urlKey === prev) return;
    lastUrlRef.current = urlKey;

    const cur = uiRef.current;
    if (!cur) return;

    // ✅ új oldalra érkeztünk:
    // pop: restore, route: top
    if (cur.kind === "pop") {
      restoreScrollYRef.current = scrollPosRef.current.get(urlKey) ?? 0;
    } else {
      restoreScrollYRef.current = 0;
    }

    if (cur.status === "enter" && (cur.kind === "route" || cur.kind === "pop")) {
      requestExit(cur.kind);
    }
  }, [requestExit, urlKey]);

  // pointerdown: instant start
  useEffect(() => {
    const onPointerDownCapture = (e: PointerEvent) => {
      if (busyRef.current) return;
      if (e.button !== 0) return;
      if ((e as any).metaKey || (e as any).ctrlKey || (e as any).shiftKey || (e as any).altKey) return;

      const t = e.target as Element | null;
      if (!t) return;
      const a = t.closest?.("a") as HTMLAnchorElement | null;
      if (!a) return;

      const fakeMouse = {
        defaultPrevented: false,
        button: 0,
        metaKey: (e as any).metaKey,
        ctrlKey: (e as any).ctrlKey,
        shiftKey: (e as any).shiftKey,
        altKey: (e as any).altKey,
      } as unknown as MouseEvent;

      if (!shouldHandleAnchorClick(fakeMouse, a)) return;

      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }

      const href = url.pathname + url.search + url.hash;
      startOverlay("route", href);
    };

    document.addEventListener("pointerdown", onPointerDownCapture, true);
    return () => document.removeEventListener("pointerdown", onPointerDownCapture, true);
  }, [startOverlay]);

  // click capture: prevent default + last-wins
  useEffect(() => {
    const onClickCapture = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t) return;

      const a = t.closest?.("a") as HTMLAnchorElement | null;
      if (!a) return;

      if (!shouldHandleAnchorClick(e, a)) return;

      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }

      const href = url.pathname + url.search + url.hash;

      e.preventDefault();
      startOverlay("route", href);
    };

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, [startOverlay]);

  const rootVisible = ui.status !== "idle";

  const overlayY = ui.status === "enter" ? "0svh" : "-110svh";
  const overlayDuration = ((ui.status === "enter" ? enterMs : exitMs) / 1000) as number;

  // backdrop anim maradhat (de prime-oljuk azonnal startkor)
  const bgOpacity = ui.status === "enter" ? 1 : 0;
  const bgTransition =
    ui.status === "enter"
      ? { duration: Math.min(0.28, overlayDuration), ease: EASE }
      : { duration: 0.45, ease: EASE };

  const panelVariants = reduce
    ? { enter: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -12, scale: 1 } }
    : { enter: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -44, scale: 0.99 } };

  const panelTransition =
    ui.status === "enter"
      ? { duration: panelEnterMs / 1000, ease: EASE }
      : { duration: panelExitMs / 1000, ease: EASE };

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="fixed inset-0 z-[9999] h-[100svh] w-screen pointer-events-none [contain:layout_paint_size] [isolation:isolate]"
      style={{ visibility: rootVisible ? "visible" : "hidden" }}
    >
      {/* BACKDROP */}
      <motion.div
        ref={backdropRef}
        className="absolute inset-0 pointer-events-auto"
        initial={false}
        animate={{ opacity: bgOpacity }}
        transition={bgTransition}
      >
        <div className="absolute inset-0 bg-white" />
      </motion.div>

      {/* SHEET */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ y: "-110svh" }}
        animate={{ y: overlayY }}
        transition={{ duration: overlayDuration, ease: EASE }}
        style={{
          willChange: "transform",
          transform: "translate3d(0,0,0)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
        onAnimationComplete={() => {
          const cur = uiRef.current;
          if (!cur) return;

          if (cur.status === "enter") {
            removeSsrCoverOnce();
            enteredRef.current = true;
            logoStartAtRef.current = now();

            doNavigateIfNeeded();

            if (cur.kind === "first") {
              clearHoldTimer();
              holdTimerRef.current = window.setTimeout(() => requestExit("first", true), firstHoldMs);
            }

            if (pendingExitRef.current && (cur.kind === "route" || cur.kind === "pop")) {
              pendingExitRef.current = false;
              requestExit(cur.kind);
            }
          }

          if (cur.status === "exit") {
            finish();
          }
        }}
      >
        <div className="absolute inset-0 grid place-items-center px-6 pointer-events-none">
          <motion.div
            className={[
              "pointer-events-none select-none",
              "relative ",
            ].join(" ")}
            initial="exit"
            animate={ui.status === "enter" ? "enter" : "exit"}
            variants={panelVariants}
            transition={panelTransition}
            style={{ willChange: reduce ? undefined : "transform, opacity" }}
          >
            <Preload key={ui.logoKey} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
