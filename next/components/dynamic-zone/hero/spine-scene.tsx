"use client";

// =========================================================
// SPINE SCENE — kiválasztva a hero.tsx-ből, hogy a WebGL/three.js
// réteg kliens-oldalon (ssr:false) töltődjön, miközben a Hero
// szöveges tartalma (H1, alcím, CTA-k) szerveroldalon renderelhető
// maradjon a keresőmotorok számára.
// =========================================================

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";

import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, PerformanceMonitor } from "@react-three/drei";

// =============================================
// Segédfüggvények — Görgetés
// =============================================
function useScrollProgress() {
  const ref = useRef(0);
  useEffect(() => {
    const calc = () => {
      const p = window.scrollY / Math.max(1, window.innerHeight);
      ref.current = Math.max(0, Math.min(1, p));
    };
    calc();
    window.addEventListener("scroll", calc, { passive: true });
    window.addEventListener("resize", calc);
    return () => {
      window.removeEventListener("scroll", calc);
      window.removeEventListener("resize", calc);
    };
  }, []);
  return ref;
}

// Safari detekt (egyszerű UA alapú)
function useIsSafari() {
  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent;
    const isSf = /Safari/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua);
    setIsSafari(isSf);
  }, []);
  return isSafari;
}

const Vertebra = React.memo(function Vertebra({
  y,
  scale,
  seg,
}: {
  y: number;
  scale: number;
  seg: { cyl: number; torusTubular: number; torusRadial: number; cone: number };
}) {
  return (
    <group position={[0, y, 0]} scale={[scale, scale, scale]}>
      <mesh castShadow={false} receiveShadow={false}>
        <cylinderGeometry args={[0.35, 0.4, 0.22, seg.cyl]} />
        <meshStandardMaterial metalness={0.18} roughness={0.35} color={"#c7fffa"} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <torusGeometry args={[0.34, 0.04, seg.torusRadial, seg.torusTubular]} />
        <meshStandardMaterial emissive={"#04c8c8"} emissiveIntensity={0.42} color={"#51f7f0"} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <torusGeometry args={[0.34, 0.04, seg.torusRadial, seg.torusTubular]} />
        <meshStandardMaterial emissive={"#04c8c8"} emissiveIntensity={0.42} color={"#51f7f0"} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.08, 0.5, seg.cone]} />
        <meshStandardMaterial color={"#90fff6"} metalness={0.1} roughness={0.5} />
      </mesh>
    </group>
  );
});

function SpineGroup() {
  const g = useRef<THREE.Group>(null!);
  const scroll = useScrollProgress();
  const isSafari = useIsSafari();

  const seg = useMemo(
    () =>
      isSafari ? { cyl: 32, torusTubular: 40, torusRadial: 18, cone: 16 } : { cyl: 48, torusTubular: 60, torusRadial: 24, cone: 24 },
    [isSafari]
  );

  const hiddenRef = useRef(false);
  useEffect(() => {
    const onVis = () => {
      hiddenRef.current = document.hidden;
    };
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useFrame((_, rawDelta) => {
    if (!g.current || hiddenRef.current) return;

    const delta = Math.min(rawDelta, 1 / 30);
    const p = scroll.current;
    const baseSpin = 0.18;
    const speed = baseSpin + p * 0.9;

    const targetRotX = -0.1 + p * 0.26;
    const targetPosY = 0.15 + p * 0.75;

    g.current.rotation.y += speed * delta;
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, targetRotX, 6, delta);
    g.current.position.y = THREE.MathUtils.damp(g.current.position.y, targetPosY, 6, delta);
  });

  const vertebrae = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ y: i * 0.35 - 2, s: 0.95 - i * 0.02 })), []);
  return <group ref={g}>{vertebrae.map((v, i) => <Vertebra key={i} y={v.y} scale={v.s} seg={seg} />)}</group>;
}

function ReadySignal({ onReady, once }: { onReady: () => void; once: React.MutableRefObject<boolean> }) {
  const cb = useRef(onReady);
  cb.current = onReady;
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    // két képkocka: az első rajzolás biztosan megtörtént, mire a belépő indul
    requestAnimationFrame(() => requestAnimationFrame(() => cb.current()));
  }, [once]);
  return null;
}

export default function SpineScene({
  onReady,
  dpr,
  setDpr,
  active = true,
}: {
  onReady: () => void;
  dpr: number | [number, number];
  setDpr: (d: [number, number]) => void;
  /** látszik-e a jelenet (hero.tsx, framer useInView) — ha nem, nem rajzol (nem fogyaszt processzort görgetés után) */
  active?: boolean;
}) {
  const createdOnce = useRef(false);

  return (
    <Canvas
      camera={{ position: [0, 0.5, 4.2], fov: 45 }}
      shadows={false}
      dpr={dpr}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: false,
      }}
      className="absolute inset-0 -z-10 pointer-events-none"
      onCreated={(state) => {
        state.gl.setClearColor(0x000000, 0);
      }}
      frameloop={active ? "always" : "never"}
    >
      {/* @ts-ignore */}
      <color attach="background" args={["transparent"]} />
      <Suspense fallback={null}>
        {/* Ugyanaz a stúdió-HDR, mint a preset="studio" (studio_small_03_1k.hdr, felére kicsinyítve: 1,6 MB → 0,4 MB; a
            fényerő azonos, a jelenet úgyis 256-os felbontásban használja) — pontosan ugyanaz a fény és csillogás —,
            de a SAJÁT domainről (public/hdri), nem a pmndrs külső CDN-jéről (2026-11-20). A jelenet az oldal betöltése után
            indul (hero.tsx), így ez a letöltés nem lassítja a megjelenést. */}
        <Environment files="/hdri/studio_small_03_512.hdr" resolution={256} />
        <Float floatIntensity={0.3} rotationIntensity={0.12} speed={0.6}>
          <SpineGroup />
        </Float>
        {/* „kész” jelzés csak akkor, ha a stúdió-fény (HDR) betöltött és a gerinc TÉNYLEG kirajzolódott — korábban már
            a vászon létrejöttekor szólt, a gerinc pedig csak a HDR letöltése után jelent meg, így később jött be,
            mint a hero-kártya (hero.tsx erre a jelzésre indítja a kártyát és a gerincet együtt) */}
        <ReadySignal onReady={onReady} once={createdOnce} />
      </Suspense>

      <PerformanceMonitor onDecline={() => setDpr([1, 1.25])} onIncline={() => setDpr([1, 1.8])} />
    </Canvas>
  );
}
