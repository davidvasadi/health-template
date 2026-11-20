// Első-látogatás preloader (2026-11-20) — a régi RouteOverlay helyett.
//
// Korábban minden lapváltásnál megjelent egy fedőréteg (overlay.tsx): elkapta a kattintást, lezárta a görgetést, kézzel
// elrejtette és visszahozta az oldalt, és egy fehér takaró (ssr-preload-cover) addig az egész oldalt eltakarta, amíg a
// JavaScript le nem futott. Ettől szaggatott, a hero-kártya „ugrott”, és telefonon későn jelent meg a tartalom.
//
// Most: munkamenetenként EGYSZER, az első betöltéskor — tisztán CSS-animáció (ugyanaz a logó-rajzolás, aztán elhalványul),
// JavaScript nélkül, ezért az első pillanattól sima. Ha a látogató már látta (sessionStorage), egy apró, a preloader ELŐTT
// lefutó script az első rajzolás előtt kikapcsolja. Lapváltáskor nem jön elő — ott a [locale]/template.tsx lágy beúszása van.
// A stílus: app/globals.css (#tps-preloader).
import { PRELOAD_PATHS } from "./logo-paths";

const SEEN_SCRIPT = `try{if(sessionStorage.getItem('tps-preloaded')){document.documentElement.classList.add('tps-seen')}else{sessionStorage.setItem('tps-preloaded','1')}}catch(e){}`;

export function FirstVisitPreloader({ tagline = "The Place Studio" }: { tagline?: string }) {
  const teal = PRELOAD_PATHS.filter((p) => p.kind === "teal");
  const dark = PRELOAD_PATHS.filter((p) => p.kind === "dark");
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SEEN_SCRIPT }} />
      <div id="tps-preloader" aria-hidden="true">
        <svg viewBox="0 0 350 334" className="tps-pre-logo">
          <g className="tps-pre-float-a">
            {teal.map((p, i) => (
              <path key={`t${i}`} d={p.d} pathLength={1} fill="#057C80" stroke="#057C80" style={{ ["--d" as string]: `${i * 100}ms` }} />
            ))}
          </g>
          <g className="tps-pre-float-b">
            {dark.map((p, i) => (
              <path key={`d${i}`} d={p.d} pathLength={1} fill="#003133" stroke="#003133" style={{ ["--d" as string]: `${380 + i * 75}ms` }} />
            ))}
          </g>
        </svg>
        <div className="tps-pre-tagline">
          <p>{tagline}</p>
          <span />
        </div>
      </div>
    </>
  );
}
