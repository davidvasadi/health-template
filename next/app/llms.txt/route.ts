// llms.txt — az llmstxt.org szabvány szerint, hogy az LLM-alapú keresők
// (ChatGPT, Perplexity, Claude stb.) gyorsan megértsék, mit kínál a The Place Studio
// és hol találják a legfontosabb tartalmakat. A tények az oldal tartalmából és a
// strukturált adatokból (Chiropractor / MedicalBusiness JSON-LD) származnak.
export const dynamic = "force-static";

export async function GET() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://theplacestudio.hu").replace(/\/+$/, "");

  const content = `# The Place Studio

> Csontkovács és mozgásterápia Budapesten, Újpesten (IV. kerület). Személyre szabott, kombinált kezelések: csontkovácsolás (passzív kimozgatás, ízületi blokkok oldása), kézi és eszközös izomlazítás (köpölyözés), sport- és svédmasszázs. Online időpontfoglalással.

## Elérhetőség

- Cím: 1042 Budapest, József Attila utca 76–80. (bal szélső üzlethelyiség), Újpest
- Telefon: +36 30 319 6238
- Email: info@theplacestudio.hu
- Nyitvatartás: minden nap 9:00–20:30, időpontfoglalással
- [Online időpontfoglalás](https://theplacestudio.salonic.hu/)
- [Kapcsolat](${base}/hu/kapcsolat)
- [Térkép (Google Maps)](https://maps.app.goo.gl/GpPv9k9LBbrpRJfu9)

## Kezelések és árak

- [Szolgáltatások áttekintés](${base}/hu/szolgaltatasok)
- [Kombinált Terápia (csontkovács kezelés)](${base}/hu/szolgaltatasok/csontkovacs-kezeles-budapest-the-place-studio): 24 000 Ft. Csontkovácsolás (passzív kimozgatás), köpölyterápia és kézi lazítás egy kezelésben, a makacs feszültségek oldására.
- [Mozgásterápia (csontkovács kezelés)](${base}/hu/szolgaltatasok/csontkovacs-budapest-the-place-studio): 23 000 Ft. Ízületfókuszú kezelés: csontkovácsolás, ízületi blokkok oldása és kézi izomlazítás.
- [Sportmasszázs (izomregeneráció)](${base}/hu/szolgaltatasok/sportmasszazs-budapest-the-place-studio): 17 000 Ft. Mélyreható izomregeneráció, önállóan vagy a csontkovács kezelések között.
- [Svédmasszázs (frissítés és lazítás)](${base}/hu/szolgaltatasok/svedmasszazs-budapest-the-place-studio): 15 000 Ft.
- [Ajándékutalvány](${base}/hu/szolgaltatasok/ajandekutalvany-csontkovacs-masszazs-budapest): csontkovács kezelésekre és masszázsokra váltható be.
- [Árak](${base}/hu/arak)

## Csapat

- [Csapat és módszer](${base}/hu/csapat)
- Csonka Bence: alapító, masszőr, csontkovács, mozgásterapeuta, a The Place módszer megalkotója (több mint 20 egyedi technika, 15 év jóga- és harcművészeti gyakorlat).
- Oravecz András: masszőr, csontkovács.

## Gyakori kérdések

- [GYIK](${base}/hu/gyik): a kezelés menete, kinek ajánlott, miben más a The Place módszere.

## Blog

- [Blog](${base}/hu/blog): cikkek gerinc- és ízületi panaszokról, kezelésekről.
- [Legjobb csontkovács Budapesten: hogyan válaszd ki a számodra megfelelőt?](${base}/hu/blog/legjobb-csontkovacs-budapest)
- [Csontkovács Budapest árak 2026](${base}/hu/blog/csontkovacs-budapest-arak-2026)
- [Kinek ajánlott a csontkovács kezelés?](${base}/hu/blog/kinek-ajanlott-a-csontkovacs-kezeles)
- [Mi történik egy csontkovács kezelésen? Tévhitek és valóság](${base}/hu/blog/csontkovacs-kezeles-menete-tevhitek)
- [Derékfájás kezelése Budapesten](${base}/hu/blog/derekfajas-kezelese-budapest)
- [Isiász vagy lumbágó?](${base}/hu/blog/lumbago-isiasz-kezeles-budapest)
- [Becsípődött ideg a derékban](${base}/hu/blog/becsipodott-ideg-derekban-kezeles)
- [Nyakfájás ülőmunka miatt](${base}/hu/blog/nyakfajas-ulo-munka)
- [Migrén és szédülés: a nyakcsigolya szerepe](${base}/hu/blog/migren-szedules-nyaki-csigolya-okai)
- [Lapocka közti fájdalom](${base}/hu/blog/lapocka-kozti-fajdalom)
- [Vállfájdalom és beszűkült mozgás](${base}/hu/blog/befagyott-vall-csontkovacskezeles)
- [Mi az a sérv, és hogyan segíthet a kezelés?](${base}/hu/blog/mi-az-a-serv-kezelesi-lehetosegek)
- [Kyphosis: tünetei, okai és kezelése](${base}/hu/blog/kyphosis-tunetei-okai-kezelese)
- [A Bechterew-kór és a csontkovácsolás](${base}/hu/blog/bechterew-kor-reggeli-derekfajas-kezeles)
- [Mi az a köpölyözés?](${base}/hu/blog/mi-az-a-kopolyozes-es-miert-kombinalom-csontkovacs-kezelessel)
- [Masszázs és csontkovácsolás együtt](${base}/hu/blog/masszazs-es-csontkovacsolas-kombinacio)

## Otthoni gyakorlatok

- [Otthoni torna gyakorlatok](${base}/hu/otthoni-torna-gyakorlatok): videós nyújtó- és mobilizáló gyakorlatok a kezelések hatásának megőrzésére (nyak, lapocka, derék, csípő, boka).

## Nyelvek

- [Magyar](${base}/hu) · [English](${base}/en) · [Deutsch](${base}/de)
`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
