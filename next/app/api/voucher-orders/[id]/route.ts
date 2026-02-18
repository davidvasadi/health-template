// next/app/api/voucher-orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function validToken(): string | null {
  const t = (process.env.STRAPI_TOKEN ?? "").trim();
  if (!t) return null;
  if (/PASTE_YOUR_API_TOKEN/i.test(t)) return null;
  if (t.length < 20) return null;
  return t;
}

function strapiBase() {
  return (
    process.env.STRAPI_URL ||
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:1337"
  )
    .replace(/\/$/, "")
    .replace(/\/api$/, "");
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const base = strapiBase();
    const url = new URL(req.url);
    const id = encodeURIComponent(ctx.params.id);

    const target = `${base}/api/voucher-orders/${id}${url.search ?? ""}`;

    const headers: Record<string, string> = {};
    const token = validToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(target, { method: "GET", headers, cache: "no-store" });
    const text = await res.text().catch(() => "");

    if (!res.ok) {
      console.error("[voucher-orders/:id] Strapi GET error", res.status, target, text);
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
    console.error("[/api/voucher-orders/:id GET] error:", e?.message || e);
    return NextResponse.json(
      { ok: false, error: "fetch_failed", message: String(e?.message || "") },
      { status: 500 }
    );
  }
}
