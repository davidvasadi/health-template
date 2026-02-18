// next/app/voucher-orders/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** ──────────────────────────────────────────────────────────────
 *  Egyszerű IP alapú rate limit (memóriában, 1 perc / 10 kérés)
 *  ──────────────────────────────────────────────────────────── */
const RATE = { windowMs: 60_000, max: 10 };
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
 *  Body olvasás: JSON támogatás (a flow JSON-t küld)
 *  ──────────────────────────────────────────────────────────── */
async function readBody(req: NextRequest): Promise<Record<string, any>> {
  return (await req.json().catch(() => ({}))) as any;
}

/** ──────────────────────────────────────────────────────────────
 *  Strapi base + endpoint
 *  ──────────────────────────────────────────────────────────── */
function strapiBase() {
  // fontos: ne legyen a végén /api, mert mi tesszük hozzá
  return (
    process.env.STRAPI_URL ||
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:1337"
  )
    .replace(/\/$/, "")
    .replace(/\/api$/, "");
}

const ENDPOINT = "/api/voucher-orders";

/** ──────────────────────────────────────────────────────────────
 *  POST /voucher-orders  -> Strapi POST /api/voucher-orders
 *  ──────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const ip = ipFrom(req);
    if (isLimited(ip)) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const body = await readBody(req);

    // Várjuk ezt:
    // { data: { name, email, message, voucher } }
    const data = body?.data ?? body;

    const name = String(data?.name ?? "").trim();
    const email = String(data?.email ?? "").trim();
    const message = String(data?.message ?? "").trim();
    const voucher = data?.voucher;

    if (!name) {
      return NextResponse.json({ ok: false, error: "missing_name" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "missing_or_invalid_email" }, { status: 400 });
    }
    if (!voucher) {
      return NextResponse.json({ ok: false, error: "missing_voucher" }, { status: 400 });
    }

    const base = strapiBase();
    const url = `${base}${ENDPOINT}`;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = validToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    // Ha nálatok a relation V5-ben connect-et vár, itt át tudjuk alakítani:
    // voucher: { connect: [voucher] }
    const payload = {
      data: {
        name,
        email,
        message,
        voucher, // ha kell: { connect: [voucher] }
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error("[voucher-orders] Strapi error", res.status, url, text);
      return NextResponse.json(
        {
          ok: false,
          error: "strapi_save_failed",
          details: { status: res.status, url, response: text?.slice(0, 2000) },
        },
        { status: 502 }
      );
    }

    // Visszaadjuk a Strapi JSON-t, hogy a front ugyanúgy tudja createdKey-t kinyerni
    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch (e: any) {
    console.error("[/voucher-orders] error:", e?.message || e);
    return NextResponse.json(
      { ok: false, error: "save_failed", message: String(e?.message || "") },
      { status: 500 }
    );
  }
}

/** ──────────────────────────────────────────────────────────────
 *  GET /voucher-orders?...  -> Strapi GET /api/voucher-orders?...
 *  (a flow második fetch-éhez kell)
 *  ──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const base = strapiBase();
    const url = new URL(req.url);

    const target = `${base}${ENDPOINT}${url.search ?? ""}`;

    const headers: Record<string, string> = {};
    const token = validToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(target, { method: "GET", headers, cache: "no-store" });
    const text = await res.text().catch(() => "");

    if (!res.ok) {
      console.error("[voucher-orders] Strapi GET error", res.status, target, text);
      return NextResponse.json(
        { ok: false, error: "strapi_fetch_failed", details: { status: res.status } },
        { status: 502 }
      );
    }

    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch (e: any) {
    console.error("[/voucher-orders GET] error:", e?.message || e);
    return NextResponse.json(
      { ok: false, error: "fetch_failed", message: String(e?.message || "") },
      { status: 500 }
    );
  }
}
