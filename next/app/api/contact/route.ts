// app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

// egyszerű rate limit (teszt alatt kiveheted)
const RATE = { windowMs: 60_000, max: 5 };
const bucket = new Map<string, { count: number; ts: number }>();
const ipFrom = (req: NextRequest) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
const isLimited = (ip: string) => {
  const now = Date.now(), prev = bucket.get(ip);
  if (!prev || now - prev.ts > RATE.windowMs) {
    bucket.set(ip, { count: 1, ts: now });
    return false;
  }
  prev.count++;
  return prev.count > RATE.max;
};

// ékezetbiztos kulcskinyerés
const pickBasic = (data: Record<string, any>) => {
  const norm = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const lower = Object.fromEntries(Object.entries(data).map(([k, v]) => [norm(k), v]));

  const name =
    lower.name || lower.nev || lower["full name"] || lower.fullname || null;
  const email = lower.email || lower.mail || null;
  const phone =
    lower.phone || lower.telefon || lower.tel || lower.phonenumber || lower.mobil || null;
  const message =
    lower.message || lower.uzenet || lower.üzenet || lower.megjegyzes || lower.notes || null;

  return { name, email, phone, message };
};

// → TOKEN NÉLKÜL mentünk (Public role)
async function saveToStrapi(fields: { name: any; email: any; phone: any; message: any }) {
  const base = (process.env.STRAPI_URL || "http://localhost:1337").replace(/\/$/, "");
  const endpoint = process.env.STRAPI_CONTACT_ENDPOINT || "/api/contacts";

  // CSAK a sémában létező mezőket küldjük!
  const res = await fetch(`${base}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // NINCS Authorization
    body: JSON.stringify({ data: fields }),
  });

  const body = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`Strapi save failed ${res.status}: ${body}`);
  }
  return body;
}

export async function POST(req: NextRequest) {
  try {
    const ip = ipFrom(req);
    if (isLimited(ip)) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const data = await req.json().catch(() => ({}));
    // honeypot
    if (data._hp) return NextResponse.json({ ok: true, spam: true });

    const { name, email, phone, message } = pickBasic(data);

    if (!email && !phone) {
      return NextResponse.json(
        { ok: false, error: "Adj meg emailt vagy telefonszámot." },
        { status: 400 }
      );
    }
    if (!message && !name) {
      return NextResponse.json(
        { ok: false, error: "Hiányzik az üzenet vagy a név." },
        { status: 400 }
      );
    }

    // Strapi-ba CSAK a létező mezők mennek (name, email, phone, message)
    await saveToStrapi({ name, email, phone, message });

    // (Később ide jöhet email küldés, most off)
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[/api/contact] error:", e?.message || e);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
