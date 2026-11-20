// „Mit kezelünk” — a kezelt panaszok EGY helyen, mindhárom nyelven (2026-11-20).
// Ebből épül: a főoldal „Mit kezelünk” szakasza (components/sections/treated-conditions.tsx), a cég-blokk
// `knowsAbout` mezője (lib/shared/structured-data.ts) és az llms.txt „Mit kezelünk” része — így a látható oldal, a
// strukturált adat és az AI-keresőknek szánt összefoglaló mindig ugyanazt mondja.
// Statikus (nem a Strapiból jön), szándékosan: a tartalom ritkán változik, és a Google Ads céloldal-relevanciájához
// is kell (isiász, idegbecsípődés, kiropraktor szavak a főoldalon).
// FONTOS: nem orvosi ígéret — azt írjuk, miben segítünk és hogyan, nem azt, hogy „meggyógyítjuk”.

type Locale = "hu" | "en" | "de";

export type Condition = { id: string; name: string; text: string };

export const CONDITIONS: Record<Locale, Condition[]> = {
  hu: [
    { id: "isiasz", name: "Isiász", text: "Derékból a lábba sugárzó fájdalom esetén oldjuk a feszes izmokat és a gerinc körüli blokkokat, hogy csökkenjen az ideg terhelése." },
    { id: "derekfajas", name: "Derékfájás", text: "Ülőmunka, emelés vagy hirtelen mozdulat utáni derékfájdalomnál a medence és az ágyéki gerinc mozgását állítjuk helyre." },
    { id: "hatfajas", name: "Hátfájás", text: "A háti szakasz merevségét és a lapockák közötti feszülést kíméletes kimozgatással és kézi lazítással kezeljük." },
    { id: "nyakfajas", name: "Nyakfájás", text: "Képernyő előtti munka, rossz alvás vagy stressz okozta nyakmerevségnél és fejfájással járó feszülésnél segítünk." },
    { id: "idegbecsipodes", name: "Idegbecsípődés", text: "Hirtelen, éles fájdalomnál és mozgáskorlátozottságnál a beszorult terület fokozatos oldásával csökkentjük a panaszt." },
    { id: "porckorongserv", name: "Porckorongsérv", text: "Orvosi lelet ismeretében, kíméletes technikákkal és otthoni gyakorlatokkal segítjük a terhelés csökkentését." },
    { id: "gerincferdules", name: "Gerincferdülés", text: "A tartást befolyásoló izmok kiegyensúlyozására és a testtartás javítására személyre szabott tervet állítunk össze." },
    { id: "csipofajdalom", name: "Csípőfájdalom", text: "A csípő és a medence mozgásának javításával segítünk járás, ülés vagy sport közben jelentkező fájdalomnál." },
  ],
  en: [
    { id: "isiasz", name: "Sciatica", text: "For pain radiating from the lower back into the leg, we release tight muscles and joint restrictions around the spine to ease pressure on the nerve." },
    { id: "derekfajas", name: "Lower back pain", text: "After desk work, lifting or a sudden movement, we restore the mobility of the pelvis and lumbar spine." },
    { id: "hatfajas", name: "Back pain", text: "We treat stiffness in the mid-back and tension between the shoulder blades with gentle mobilisation and manual release." },
    { id: "nyakfajas", name: "Neck pain", text: "We help with neck stiffness and tension headaches caused by screen work, poor sleep or stress." },
    { id: "idegbecsipodes", name: "Pinched nerve", text: "For sudden sharp pain and limited movement, we gradually release the restricted area to reduce your symptoms." },
    { id: "porckorongserv", name: "Herniated disc", text: "Based on your medical findings, we use gentle techniques and home exercises to help reduce the load." },
    { id: "gerincferdules", name: "Scoliosis", text: "We create a personal plan to balance the muscles that affect your posture and to improve how you hold yourself." },
    { id: "csipofajdalom", name: "Hip pain", text: "By improving hip and pelvic mobility, we help with pain when walking, sitting or doing sport." },
  ],
  de: [
    { id: "isiasz", name: "Ischias", text: "Bei Schmerzen, die vom unteren Rücken ins Bein ausstrahlen, lösen wir verspannte Muskeln und Blockaden an der Wirbelsäule, um den Nerv zu entlasten." },
    { id: "derekfajas", name: "Kreuzschmerzen", text: "Nach Schreibtischarbeit, Heben oder einer plötzlichen Bewegung stellen wir die Beweglichkeit von Becken und Lendenwirbelsäule wieder her." },
    { id: "hatfajas", name: "Rückenschmerzen", text: "Steifheit im Brustwirbelbereich und Verspannungen zwischen den Schulterblättern behandeln wir mit sanfter Mobilisation und manueller Lockerung." },
    { id: "nyakfajas", name: "Nackenschmerzen", text: "Wir helfen bei Nackensteifheit und Spannungskopfschmerzen durch Bildschirmarbeit, schlechten Schlaf oder Stress." },
    { id: "idegbecsipodes", name: "Eingeklemmter Nerv", text: "Bei plötzlichem, stechendem Schmerz und eingeschränkter Bewegung lösen wir den blockierten Bereich schrittweise." },
    { id: "porckorongserv", name: "Bandscheibenvorfall", text: "Auf Grundlage Ihres ärztlichen Befunds helfen wir mit sanften Techniken und Übungen für zu Hause, die Belastung zu verringern." },
    { id: "gerincferdules", name: "Skoliose", text: "Wir erstellen einen persönlichen Plan, um die haltungsrelevanten Muskeln auszugleichen und Ihre Haltung zu verbessern." },
    { id: "csipofajdalom", name: "Hüftschmerzen", text: "Durch eine bessere Beweglichkeit von Hüfte und Becken helfen wir bei Schmerzen beim Gehen, Sitzen oder Sport." },
  ],
};

/** a szakasz feliratai — a kiropraktor szó a bevezetőben (Google Ads céloldal-relevancia, AI-keresők) */
export const CONDITIONS_COPY: Record<Locale, { heading: string; sub: string; note: string; cta: string }> = {
  hu: {
    heading: "Mit kezelünk?",
    sub: "Csontkovács- és kiropraktor-szemléletű kezeléseink a leggyakoribb mozgásszervi panaszoknál segítenek Budapesten, Újpesten.",
    note: "Az első alkalommal felmérjük az állapotodat. Ha orvosi kivizsgálás szükséges, jelezzük, és csak utána kezelünk.",
    cta: "Időpontfoglalás",
  },
  en: {
    heading: "What we treat",
    sub: "Our chiropractic treatments in Budapest (Újpest) help with the most common musculoskeletal complaints.",
    note: "At your first visit we assess your condition. If a medical examination is needed, we tell you and only treat afterwards.",
    cta: "Book an appointment",
  },
  de: {
    heading: "Was wir behandeln",
    sub: "Unsere chiropraktischen Behandlungen in Budapest (Újpest) helfen bei den häufigsten Beschwerden des Bewegungsapparats.",
    note: "Beim ersten Termin untersuchen wir Ihren Zustand. Ist eine ärztliche Abklärung nötig, sagen wir es Ihnen und behandeln erst danach.",
    cta: "Termin buchen",
  },
};

export const conditionsFor = (locale: string): Condition[] => CONDITIONS[(["hu", "en", "de"].includes(locale) ? locale : "hu") as Locale];
export const conditionsCopyFor = (locale: string) => CONDITIONS_COPY[(["hu", "en", "de"].includes(locale) ? locale : "hu") as Locale];
