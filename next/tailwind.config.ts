// ==============================================
// TAILWIND TÍPUS IMPORT
// - Csak a típusokat húzzuk be, hogy kapjunk TS intellisense-t a configra
// ==============================================
import type { Config } from "tailwindcss";

// ==============================================
// TAILWIND INTERNAL: flattenColorPalette
// - A Tailwind belső segédje: a beágyazott színobjektumokat (pl. { breaker-bay: { 50,100,... }})
//   "ellapítja" 'breaker-bay-500' kulcsokra. Ezt használjuk később CSS változók generálásához.
// MEGJEGYZÉS: ez **belső** útvonal, Tailwind verzióváltásnál változhat.
// ==============================================
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

// ==============================================
// SVG → data:URI
// - A lenti egyedi utility-k (bg-grid, bg-dot, stb.) inline SVG-t generálnak háttérnek.
// - Ez a csomag az SVG-t data URI-vá alakítja, így közvetlenül CSS-ben használható.
// ==============================================
import svgToDataUri from "mini-svg-data-uri";

// ==============================================
// FŐ TAILWIND KONFIG
// ==============================================
const config: Config = {
  // ----------------------------------------------
  // CONTENT SCAN
  // - Tailwind itt keresi az osztályneveket.
  // - Ha új mappában használsz tailwind class-okat, vedd fel ide!
  // ----------------------------------------------
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      // ------------------------------------------
      // SZÍNEK
      // - Itt definiáltad a "breaker-bay" palettát.
      // - ÉRTÉKEK: CSS változókra mutatnak (pl. var(--color-breaker-bay-900)).
      //   Ezeket a változókat a globals.css-ben állítottad be => globálisan, build nélkül cserélhetők.
      // - Használat: bg-breaker-bay-900, text-breaker-bay-50, border-breaker-bay-700, stb.
      // ------------------------------------------
      colors: {
        'breaker-bay': {
          50:'#effefd',
          100:'#c7fffa',
          200:'#90fff6',
          300:'#51f7f0',
          400:'#1de4e2',
          500:'#04c8c8',
          600:'#009fa3',
          700:'#057c80',
          800:'#0a6165',
          900:'#0d5154',
          950:'#002e33',
        },

        // KIEGÉSZÍTŐ SZÍNEK / ALIASOK
        charcoal: "#08090A",
        lightblack: "#1C1C1C",

        // Világos, semleges szürke
        secondary: "#E6E6E6",

        // Alias egy Tailwind "neutral" értékre: a lenti plugin felrakja a --neutral-200 változót :root-ra
        // Így itt tudsz rá hivatkozni. Ha a neutral-200-at valaha cseréled, ez is követi.
        muted: "var(--neutral-200)",
      },

      // ------------------------------------------
      // ÁRNYÉKOK
      // - Egyedi árnyék stílusok a designhoz.
      // - Használat: shadow-derek, shadow-aceternity
      // ------------------------------------------
      boxShadow: {
        derek: `0px 0px 0px 1px rgb(0 0 0 / 0.06),
        0px 1px 1px -0.5px rgb(0 0 0 / 0.06),
        0px 3px 3px -1.5px rgb(0 0 0 / 0.06), 
        0px 6px 6px -3px rgb(0 0 0 / 0.06),
        0px 12px 12px -6px rgb(0 0 0 / 0.06),
        0px 24px 24px -12px rgb(0 0 0 / 0.06)`,
        aceternity: `0px 2px 3px -1px rgba(0,0,0,0.1), 0px 1px 0px 0px rgba(25,28,33,0.02), 0px 0px 0px 1px rgba(25,28,33,0.08)`,
      },

      // ------------------------------------------
      // HÁTTÉRKÉPEK (UTILITIES)
      // - Kényelmi gradient definíciók.
      // - Használat: bg-gradient-radial, bg-gradient-conic
      // ------------------------------------------
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },

      // ------------------------------------------
      // ANIMÁCIÓK ÉS KEYFRAME-EK
      // - Reusable animációk (pl. mozgatás, körkörös forgatás)
      // - Használat: animate-move, animate-spin-circle
      // ------------------------------------------
      animation: {
        move: "move 5s linear infinite",
        "spin-circle": "spin-circle 3s linear infinite",
      },
      keyframes: {
        move: {
          "0%": { transform: "translateX(-200px)" },
          "100%": { transform: "translateX(200px)" },
        },
        "spin-circle": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
    },
  },

  // ==============================================
  // PLUGINEK
  // - 1) tailwindcss-animate: kész anim osztályok (opacity in/out, accordion stb.)
  // - 2) @tailwindcss/typography: "prose" stílusok markdown/szövegtartalmakhoz
  // - 3) addVariablesForColors: SAJÁT PLUGIN lent — minden Tailwind színből CSS változót készít (:root-on)
  // - 4) Egyedi matchUtilities: bg-grid, bg-grid-small, bg-dot, bg-dot-thick, highlight
  //    → Ezek bármely Tailwind-színnel hívhatók, pl. bg-grid-breaker-bay-700
  // ==============================================
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),

    // --------------------------------------------
    // SAJÁT PLUGIN: Minden elérhető színt CSS változóként felveszünk a :root-ra.
    // Pl. --breaker-bay-500, --neutral-200 stb.
    // Előny: később hivatkozhatsz rájuk `var(--breaker-bay-500)` formában is, akár JS-ben/inline style-ban.
    // --------------------------------------------
    addVariablesForColors,

    // --------------------------------------------
    // EGYEDI UTILITY-GENERÁLÓ
    // - matchUtilities: színes SVG pattern-ek és highlight
    // - A `values` a backgroundColor palettából jön, így a teljes színkészlet használható.
    // Példa használatok:
    //   bg-grid-breaker-bay-700
    //   bg-grid-small-neutral-300
    //   bg-dot-breaker-bay-400
    //   bg-dot-thick-zinc-500
    //   highlight-breaker-bay-500
    // --------------------------------------------
    function ({ matchUtilities, theme }: any) {
      // --------- Rácsminta háttér (nagy és kicsi) + pötty minták ---------
      matchUtilities(
        {
          "bg-grid": (value: any) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          "bg-grid-small": (value: any) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="8" height="8" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          "bg-dot": (value: any) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none"><circle fill="${value}" id="pattern-circle" cx="10" cy="10" r="1.6257413380501518"></circle></svg>`
            )}")`,
          }),
          "bg-dot-thick": (value: any) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none"><circle fill="${value}" id="pattern-circle" cx="10" cy="10" r="2.5"></circle></svg>`
            )}")`,
          }),
        },
        // A `values` megadja, milyen színeket fogadjon el: itt a backgroundColor paletta (== colors).
        { values: flattenColorPalette(theme("backgroundColor")), type: "color" }
      );

      // --------- Highlight utility (belső 1px-es "fény" a tetején) ---------
      // Használat: pl. className="highlight-breaker-bay-400"
      matchUtilities(
        {
          highlight: (value: any) => ({
            boxShadow: `inset 0 1px 0 0 ${value}`,
          }),
        },
        { values: flattenColorPalette(theme("backgroundColor")), type: "color" }
      );
    },
  ],
};

// ==============================================
// SAJÁT PLUGIN: addVariablesForColors
// - ÖSSZES színt "ellapít", majd :root-ra CSS változóként felveszi.
// - Eredmény: pl. --breaker-bay-900: var(--color-breaker-bay-900)
//             --neutral-200: <konkrét hex vagy HSL a Tailwind alap palettából>
// - Így bárhol használhatod: style={{ color: "var(--breaker-bay-900)" }}
// ==============================================
function addVariablesForColors({ addBase, theme }: any) {
  // 1) Összes szín ellapítása: { 'zinc-900': '#0b0b0c', 'breaker-bay-500': 'var(--color-breaker-bay-500)', ... }
  let allColors = flattenColorPalette(theme("colors"));

  // 2) Ebből CSS változókat készítünk: { '--zinc-900': '#0b0b0c', '--breaker-bay-500': 'var(...)', ... }
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  // 3) :root-hoz adjuk, hogy mindenhol elérhető legyen
  addBase({
    ":root": newVars,
  });
}

export default config;
