"use client";

/**
 * ============================================================================
 * CanvasRevealEffect — React + @react-three/fiber + Three.js
 * ============================================================================
 * CÉL
 *   Dinamikus, shader-alapú "dot matrix" (pontmátrix) effekt megjelenítése,
 *   amely időben feltárul (reveal) és animált opacitás/színek szerint rajzol.
 *
 * FŐ ELEMEK
 *   - CanvasRevealEffect: külvilág felé exportált, egyszerű API paraméterekkel.
 *   - DotMatrix: a fragment shaderhez szükséges uniformokat állítja elő.
 *   - Shader / ShaderMaterial: GLSL vertex+fragment shader futtatása, idő és
 *                             felbontás uniformok frissítése, FPS korlátozás.
 *
 * FŐ FUNKCIÓK / FEATUREK
 *   - Paraméterezhető animációs sebesség, opacitás-eloszlás és színpaletta.
 *   - Középre igazított (opcionális) pontmátrix raszter mind X, mind Y tengelyen.
 *   - @react-three/fiber Canvas-ben egy 2D-s, széltől-szélig plane-re renderel.
 *   - maxFps throttling a teljesítmény érdekében (mobilon/gyengébb gépen segít).
 *   - Opcionális sötét-szürke gradient overlay, ami a pontmátrix fölé kerül.
 *
 * KÖRNYEZETI KÖVETELMÉNYEK
 *   - React 18+, TypeScript
 *   - three, @react-three/fiber
 *
 * TIPPEK / BŐVÍTÉSEK
 *   - DPI/Retina: jelenleg u_resolution = size.width * 2, size.height * 2.
 *                 Ha precízebb kontroll kell, érdemes devicePixelRatio-t állítani
 *                 a Canvas-nál (pixelRatio) vagy itt számolni vele.
 *   - Reszponzív: a Canvas automatikusan kitölti a szülőt (absolute inset-0),
 *                 a containerClassName-nek megfelelően.
 *   - Teljesítmény: opacitás/szín uniformok állandó tömbök—ha gyakran változnak,
 *                   memoizálás szükséges (itt már van useMemo).
 * ============================================================================
 */

import { cn } from "@/lib/utils"; // Tailwind className merge helper
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * CanvasRevealEffect
 * - Befoglaló komponens, ami felépíti a layoutot és a paramétereket átadja a DotMatrix-nak.
 */
export const CanvasRevealEffect = ({
  animationSpeed = 0.4,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]], // Alap: cián árnyalat
  containerClassName,
  dotSize,
  showGradient = true,
}: {
  /**
   * Animáció sebességi szorzó:
   *  0.1 → lassabb, 1.0 → gyorsabb
   */
  animationSpeed?: number;
  /**
   * 10 elemű opacitás lista (0.0–1.0), random indexeléssel választott értékekhez.
   */
  opacities?: number[];
  /**
   * 1–3 RGB szín (0–255), amelyeket a shader 6 elemű palettává bont.
   * Példa: [[0,255,255],[255,0,128],[255,255,255]]
   */
  colors?: number[][];
  /**
   * Szülő konténer Tailwind osztályai.
   */
  containerClassName?: string;
  /**
   * Egy pont mérete (pixel). A raszter cella méretéhez képest értelmezett a shaderben.
   */
  dotSize?: number;
  /**
   * Ha igaz, egy sötétbe átmenetes overlay kerül a tetejére.
   */
  showGradient?: boolean;
}) => {
  return (
    <div className={cn("h-full relative bg-white w-full", containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors ?? [[0, 255, 255]]}
          dotSize={dotSize ?? 3}
          opacities={
            opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]
          }
          // Shader-kiegészítés: bejövő string a fragment shaderbe interpolálva.
          shader={`
              float animation_speed_factor = ${animationSpeed.toFixed(1)};
              // Középponttól mért távolság alapján késleltetett "felbukkanás"
              float intro_offset = distance(u_resolution / 2.0 / u_total_size, st2) * 0.01 + (random(st2) * 0.15);
              opacity *= step(intro_offset, u_time * animation_speed_factor);
              // Rövid túl-kiemelés az indulásnál (clamp 1.0–1.25 között)
              opacity *= clamp((1.0 - step(intro_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            `}
          center={["x", "y"]}
        />
      </div>
      {showGradient && (
        // Felső irányba kifakuló sötét overlay a vizuális mélységhez
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-[84%]" />
      )}
    </div>
  );
};

/**
 * DotMatrixProps – a shaderhez szükséges vizuális paraméterek.
 */
interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number; // Rács cellamérete (pixelben) – minden cellában egy pont lehet
  dotSize?: number;   // A tényleges pont mérete a cellához viszonyítva
  shader?: string;    // Opcionális shader kiegészítés (GLSL), befüzi a fragment shaderbe
  center?: ("x" | "y")[]; // Középre igazítás tengelyenként
}

/**
 * DotMatrix
 * - A kapott színek/opacitások alapján uniform tömböket készít a shaderhez.
 * - Színpaletta normalizálása 0–1 közé, opacitások és méretek átadása.
 */
const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 4,
  dotSize = 2,
  shader = "",
  center = ["x", "y"],
}) => {
  // Uniformok előkészítése (memoizálva, hogy re-rendernél ne számoljuk újra feleslegesen)
  const uniforms = React.useMemo(() => {
    // 1–3 bemenő színt 6 elemű tömbbé ismétlünk/elosztunk
    let colorsArray = [
      colors[0],
      colors[0],
      colors[0],
      colors[0],
      colors[0],
      colors[0],
    ];
    if (colors.length === 2) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[1],
      ];
    } else if (colors.length === 3) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[2],
        colors[2],
      ];
    }

    return {
      u_colors: {
        // 0–255 → 0–1 normalizált RGB
        value: colorsArray.map((color) => [
          color[0] / 255,
          color[1] / 255,
          color[2] / 255,
        ]),
        type: "uniform3fv",
      },
      u_opacities: {
        value: opacities,
        type: "uniform1fv",
      },
      u_total_size: {
        value: totalSize,
        type: "uniform1f",
      },
      u_dot_size: {
        value: dotSize,
        type: "uniform1f",
      },
    };
  }, [colors, opacities, totalSize, dotSize]);

  return (
    <Shader
      source={`
        precision mediump float;
        in vec2 fragCoord;             // pixel-koordináta a teljes képernyőn

        uniform float u_time;          // eltelt idő (másodperc)
        uniform float u_opacities[10]; // opacitás szint lista (0–1)
        uniform vec3 u_colors[6];      // előkészített, ismételt színek
        uniform float u_total_size;    // raszter cella méret
        uniform float u_dot_size;      // pont méret (ugyanazon mértékegységben)
        uniform vec2 u_resolution;     // teljes felbontás (px)
        out vec4 fragColor;            // kimeneti szín

        // Aranymetszés konstans (randomhoz kapcsolódó képletben)
        float PHI = 1.61803398874989484820459;

        // Determinisztikus "random" két dimenziós vektor alapján
        float random(vec2 xy) {
            return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }

        // Lineáris átmapplés (helper) – itt nem használjuk, de hasznos lehet
        float map(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }

        void main() {
            vec2 st = fragCoord.xy; // pixel pozíció

            // Opcionális középre igazítás X/Y tengely mentén:
            ${
              center.includes("x")
                ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));"
                : ""
            }
            ${
              center.includes("y")
                ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));"
                : ""
            }

            float opacity = step(0.0, st.x);
            opacity *= step(0.0, st.y);

            // Cell index a raszteren belül (egész koordináták)
            vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

            // "Csempézett" zaj és véletlenítés a megjelenő opacitáshoz/színhez
            float frequency = 5.0;
            float show_offset = random(st2);
            float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency) + 1.0);

            // A 10 elemű opacitás listából indexelünk (0..9)
            opacity *= u_opacities[int(rand * 10.0)];

            // Pont kivágása a cella közepére: csak a cella bal-felső részében látszódjon a pont
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

            // Szín a 6 elemű palettából (0..5), random offset alapján
            vec3 color = u_colors[int(show_offset * 6.0)];

            // Ide fűzzük be a hívótól érkező shader-kiegészítést (pl. intro animáció)
            ${shader}

            // Pre-mult alpha: szín * alfa (jobb blendinghez)
            fragColor = vec4(color, opacity);
            fragColor.rgb *= fragColor.a;
        }`}
      uniforms={uniforms}
      maxFps={60}
    />
  );
};

// ============================================================================
// ShaderMaterial — egy testreszabott, FPS-korlátozott shader anyag
// ============================================================================

type Uniforms = {
  [key: string]: {
    value: number[] | number[][] | number;
    type: string; // "uniform1f" | "uniform1fv" | "uniform2f" | "uniform3f" | "uniform3fv"
  };
};

const ShaderMaterial = ({
  source,
  uniforms,
  maxFps = 60,
}: {
  source: string;
  hovered?: boolean; // (nem használt, későbbi kiterjeszthetőség)
  maxFps?: number;   // cél FPS, a useFrame-ben korlátozzuk a frissítést
  uniforms: Uniforms;
}) => {
  const { size } = useThree(); // vászon aktuális mérete (px)
  const ref = useRef<THREE.Mesh>();
  let lastFrameTime = 0; // időbélyeg az FPS korlátozáshoz

  // Minden frame-ben frissítjük az u_time uniformot, maxFps szerint throttolva
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const timestamp = clock.getElapsedTime();
    if (timestamp - lastFrameTime < 1 / maxFps) {
      return; // kihagyjuk a frame-et, ha még nem telt el elég idő
    }
    lastFrameTime = timestamp;

    const material: any = ref.current.material;
    const timeLocation = material.uniforms.u_time;
    timeLocation.value = timestamp;
  });

  // Uniformok Three-hez igazítása (Vector2/3 stb.)
  // Megjegyzés: a getUniforms függvény referenciája stabil marad a lezárás miatt,
  // így a memo alatti dependency-vel (alább) használható; eslint lekorlátozva az eredetiben is.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getUniforms = () => {
    const preparedUniforms: any = {};

    for (const uniformName in uniforms) {
      const uniform: any = uniforms[uniformName];

      switch (uniform.type) {
        case "uniform1f":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1f" };
          break;
        case "uniform3f":
          preparedUniforms[uniformName] = {
            value: new THREE.Vector3().fromArray(uniform.value as number[]),
            type: "3f",
          };
          break;
        case "uniform1fv":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1fv" };
          break;
        case "uniform3fv":
          preparedUniforms[uniformName] = {
            value: (uniform.value as number[][]).map((v: number[]) =>
              new THREE.Vector3().fromArray(v)
            ),
            type: "3fv",
          };
          break;
        case "uniform2f":
          preparedUniforms[uniformName] = {
            value: new THREE.Vector2().fromArray(uniform.value as number[]),
            type: "2f",
          };
          break;
        default:
          console.error(`Invalid uniform type for '${uniformName}'.`);
          break;
      }
    }

    // Dinamikus uniformok hozzáadása (idő és felbontás)
    preparedUniforms["u_time"] = { value: 0, type: "1f" };
    preparedUniforms["u_resolution"] = {
      // Megjegyzés: *2 szorzó – retina/HiDPI hatás imitálása.
      // Ha pontos kontroll kell, használj size.width * devicePixelRatio-t vagy Canvas pixelRatio propot.
      value: new THREE.Vector2(size.width * 2, size.height * 2),
    };
    return preparedUniforms;
  };

  // Three.js ShaderMaterial összeállítása (GLSL3, custom blending a pre-multiplied alphához)
  const material = useMemo(() => {
    const materialObject = new THREE.ShaderMaterial({
      vertexShader: `
      precision mediump float;
      in vec2 coordinates;     // (nem használt attribútum – a planeGeometry pozícióit használjuk)
      uniform vec2 u_resolution;
      out vec2 fragCoord;      // fragment shadernek átadott képernyő-koordináta
      void main(){
        float x = position.x;
        float y = position.y;
        gl_Position = vec4(x, y, 0.0, 1.0); // teljes képernyős négyzet (NDC: -1..1)
        fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution; // NDC → pixel
        fragCoord.y = u_resolution.y - fragCoord.y; // Y tengely megfordítása (képernyő-koordináta)
      }
      `,
      fragmentShader: source,
      uniforms: getUniforms(),
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    });

    return materialObject;
    // FONTOS: ha getUniforms referenciája változik, a material újraépül. Itt a függvény
    // lokális és stabil marad, ezért dependency-ként használható.
  }, [source, getUniforms]);

  return (
    <mesh ref={ref as any}>
      {/* Lapos, teljes vásznat kitöltő kétszer-kétszeres négyzet */}
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

// ============================================================================
// Shader — @react-three/fiber Canvas wrapper a ShaderMaterial-hoz
// ============================================================================

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => {
  return (
    <Canvas className="absolute inset-0  h-full w-full">
      <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
    </Canvas>
  );
};

/**
 * ShaderProps – a Shader komponens API-ja
 */
interface ShaderProps {
  source: string; // GLSL fragment shader kód
  uniforms: {
    [key: string]: {
      value: number[] | number[][] | number;
      type: string;
    };
  };
  maxFps?: number; // FPS limitelés (alap: 60)
}
