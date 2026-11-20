// A Strapi-válasz karcsúsítása, MIELŐTT a böngészőbe kerül (2026-11-20).
//
// Miért: a deepPopulate middleware minden feltöltött kép TELJES leírását visszaadja (hash, ext, size,
// provider_metadata, 4–5 méretváltozat a saját hash/size/path adataival, létrehozás / módosítás ideje…). A dynamic
// zone szakaszai kliens-komponensek, ezért ez mind a HTML-be került (RSC payload): a főoldalon ~850 KB a 1,1 MB-ból.
// Ettől lassú a válasz (TTFB) és telefonon a betöltés.
//
// Mit hagyunk meg egy képen: amit a komponensek ténylegesen olvasnak — id, documentId, url, alternativeText, width,
// height, mime (videó / kép / pdf eldöntése), name, és a `formats` méretváltozatokból csak url / width / height.
// Minden NEM kép objektum (cikk, szolgáltatás, szakasz) érintetlen marad — pl. a blog `publishedAt`-ja kell.
const MEDIA_KEEP = new Set(["id", "documentId", "url", "alternativeText", "width", "height", "mime", "name", "formats"]);
const FORMAT_KEEP = new Set(["url", "width", "height"]);

/** Feltöltött fájl (Strapi upload) — innen ismerjük fel: van url, mime és hash. */
const isMedia = (o: Record<string, unknown>) => typeof o.url === "string" && typeof o.mime === "string" && "hash" in o;

function slimMedia(o: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(o)) {
    if (!MEDIA_KEEP.has(k)) continue;
    if (k === "formats" && o.formats && typeof o.formats === "object") {
      const f: Record<string, unknown> = {};
      for (const [size, v] of Object.entries(o.formats as Record<string, Record<string, unknown>>)) {
        if (!v || typeof v !== "object") continue;
        f[size] = Object.fromEntries(Object.entries(v).filter(([kk]) => FORMAT_KEEP.has(kk)));
      }
      out.formats = f;
    } else out[k] = o[k];
  }
  return out;
}

/** Rekurzívan végigmegy az adaton, és minden képet karcsúsít; minden mást változatlanul hagy. */
export function slimStrapi<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => slimStrapi(v)) as unknown as T;
  if (!value || typeof value !== "object") return value;
  const o = value as Record<string, unknown>;
  if (isMedia(o)) return slimMedia(o) as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) out[k] = slimStrapi(v);
  return out as T;
}
