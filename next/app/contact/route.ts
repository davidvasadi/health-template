// app/contact/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // SSR/Node környezet

/** ──────────────────────────────────────────────────────────────
 *  Egyszerű IP alapú rate limit (memóriában, 1 perc / 5 kérés)
 *  Prodban tegyél elé reverse proxy (Nginx) X-Forwarded-For-ral
 *  ──────────────────────────────────────────────────────────── */
const RATE = { windowMs: 60_000, max: 5 };
const bucket = new Map<string, { count: number; ts: number }>();

function ipFrom(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
}
function isLimited(ip: string) {
  const now = Date.now();
  const prev = bucket.get(ip);
  if (!prev || now - prev.ts > RATE.windowMs) {
    bucket.set(ip, { count: 1, ts: now });
    return false;
  }
  prev.count++;
  return prev.count > RATE.max;
}

/** ──────────────────────────────────────────────────────────────
 *  Kulcskinyerés: ékezetek és kis/nagybetűk normalizálása
 *  (pl. név/Név/name → name, üzenet/üzenet/message → message, stb.)
 *  ──────────────────────────────────────────────────────────── */
function pickBasic(data: Record<string, any>) {
  const norm = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const lower = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [norm(k), v])
  );

  const name =
    lower.name || lower.nev || lower["full name"] || lower.fullname || null;

  const email = lower.email || lower.mail || null;

  const phone =
    lower.phone ||
    lower.telefon ||
    lower.tel ||
    lower.phonenumber ||
    lower.mobil ||
    null;

  const message =
    lower.message || lower.uzenet || lower["uzenet"] || lower.megjegyzes || lower.notes || null;

  return { name, email, phone, message };
}

/** ──────────────────────────────────────────────────────────────
 *  Mentés Strapi-ba
 *  - Mindig STRING-et küldünk (sose null) → Strapi validáció OK
 *  - Alapértelmezett URL: lokális Strapi, hogy kikerüljük az Nginx-et
 *  ──────────────────────────────────────────────────────────── */
async function saveToStrapi(fields: { name: any; email: any; phone: any; message: any }) {
  const base = (process.env.STRAPI_URL || "http://127.0.0.1:1337").replace(/\/$/, "");
  const endpoint = process.env.STRAPI_CONTACT_ENDPOINT || "/api/contacts";

  const data = {
    name: String(fields.name ?? ""),
    email: String(fields.email ?? ""),
    phone: String(fields.phone ?? ""),
    message: String(fields.message ?? ""),
  };

  const url = `${base}${endpoint}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
    // keepalive: true  // ha szeretnéd, de nem kötelező
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    // Részletes log, hogy azonnal lásd a gondot (status + body)
    console.error("[contact] Strapi error", res.status, url, text);
    throw new Error(`Strapi save failed ${res.status}`);
  }
  return text;
}

/** ──────────────────────────────────────────────────────────────
 *  POST /contact
 *  ──────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const ip = ipFrom(req);
    if (isLimited(ip)) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const data = await req.json().catch(() => ({}));

    // Honeypot (botok ellen): ha töltve, „sikeres” választ adunk
    if (data._hp) {
      return NextResponse.json({ ok: true, spam: true });
    }

    const { name, email, phone, message } = pickBasic(data);

    // Minimum kontaktkövetelmény: email VAGY telefon legyen
    if (!email && !phone) {
      return NextResponse.json(
        { ok: false, error: "Adj meg emailt vagy telefonszámot." },
        { status: 400 }
      );
    }

    // Tartalmi követelmény: legyen üzenet VAGY név
    if (!message && !name) {
      return NextResponse.json(
        { ok: false, error: "Hiányzik az üzenet vagy a név." },
        { status: 400 }
      );
    }

    // Strapi mentés (sose küldjünk null-t)
    await saveToStrapi({
      name: name ?? "",
      email: email ?? "",
      phone: phone ?? "",
      message: message ?? "",
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[/contact] error:", e?.message || e);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}

/** ──────────────────────────────────────────────────────────────
 *  (Opcionális) OPTIONS – ha valaha cross-originből hívnád
 *  Ugyanazon domainről nem kötelező.
 *  ──────────────────────────────────────────────────────────── */
// export function OPTIONS() {
//   return new NextResponse(null, {
//     status: 204,
//     headers: {
//       "Access-Control-Allow-Origin": "*",
//       "Access-Control-Allow-Methods": "POST, OPTIONS",
//       "Access-Control-Allow-Headers": "Content-Type, Authorization",
//     },
//   });
// }
