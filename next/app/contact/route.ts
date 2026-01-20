// app/contact/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** ──────────────────────────────────────────────────────────────
 *  Egyszerű IP alapú rate limit (memóriában, 1 perc / 5 kérés)
 *  ──────────────────────────────────────────────────────────── */
const RATE = { windowMs: 60_000, max: 5 };
const bucket = new Map<string, { count: number; ts: number }>();

function ipFrom(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
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

/** ✅ Token only if valid (ne küldjünk placeholdert / rövid szemetet) */
function validToken(): string | null {
  const t = (process.env.STRAPI_TOKEN ?? "").trim();
  if (!t) return null;
  if (/PASTE_YOUR_API_TOKEN/i.test(t)) return null;
  if (t.length < 20) return null;
  return t;
}

/** ──────────────────────────────────────────────────────────────
 *  Kulcskinyerés: ékezet/kis-nagybetű normalizálás
 *  ──────────────────────────────────────────────────────────── */
function pickBasic(data: Record<string, any>) {
  const norm = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const lower = Object.fromEntries(Object.entries(data).map(([k, v]) => [norm(k), v]));

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
    lower.message ||
    lower.uzenet ||
    lower["uzenet"] ||
    lower.megjegyzes ||
    lower.notes ||
    null;

  return { name, email, phone, message };
}

/** ──────────────────────────────────────────────────────────────
 *  Body olvasás: JSON + formdata támogatás
 *  ──────────────────────────────────────────────────────────── */
async function readBody(req: NextRequest): Promise<Record<string, any>> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await req.json().catch(() => ({}))) as any;
  }

  if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
    const fd = await req.formData();
    const obj: Record<string, any> = {};
    fd.forEach((v, k) => (obj[k] = typeof v === "string" ? v.trim() : v));
    return obj;
  }

  return (await req.json().catch(() => ({}))) as any;
}

/** ──────────────────────────────────────────────────────────────
 *  Mentés Strapi-ba
 *  ──────────────────────────────────────────────────────────── */
async function saveToStrapi(fields: {
  name: any;
  email: any;
  phone: any;
  message: any;
}) {
  const base = (
    process.env.STRAPI_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:1337"
  ).replace(/\/$/, "");

  const rawEndpoint = process.env.STRAPI_CONTACT_ENDPOINT || "/api/contacts";
  const endpoint = rawEndpoint.startsWith("/") ? rawEndpoint : `/${rawEndpoint}`;

  const data = {
    name: String(fields.name ?? "").trim(),
    email: String(fields.email ?? "").trim(),
    phone: String(fields.phone ?? "").trim(),
    message: String(fields.message ?? "").trim(),
  };

  const url = `${base}${endpoint}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // ✅ csak akkor küldjük, ha tényleg valid
  const token = validToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ data }),
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    console.error("[contact] Strapi error", res.status, url, text);
    return { ok: false as const, status: res.status, url, text };
  }

  return { ok: true as const, status: res.status, url, text };
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

    const data = await readBody(req);

    // Honeypot
    if (typeof data._hp === "string" && data._hp.trim()) {
      return NextResponse.json({ ok: true, spam: true });
    }

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

    const result = await saveToStrapi({
      name: name ?? "",
      email: email ?? "",
      phone: phone ?? "",
      message: message ?? "",
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "strapi_save_failed",
          details: {
            status: result.status,
            url: result.url,
            response: result.text?.slice(0, 2000),
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[/contact] error:", e?.message || e);
    return NextResponse.json(
      { ok: false, error: "save_failed", message: String(e?.message || "") },
      { status: 500 }
    );
  }
}
