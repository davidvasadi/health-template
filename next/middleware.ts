import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { i18n } from "@/i18n.config";
import Negotiator from "negotiator";

const LOCALES = i18n.locales as unknown as string[];
const DEFAULT = (i18n.defaultLocale as unknown as string) || "hu";

function safeLocale(req: NextRequest): string {
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => (headers[k] = v));
  const preferred = new Negotiator({ headers }).languages(LOCALES);
  return preferred[0] || DEFAULT;
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const { pathname } = url;

  // technikai fájlok – root és lokalizált változatok is
  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    /^\/(robots\.txt|sitemap(?:-\w+)?\.xml|server-sitemap\.xml)$/i.test(pathname) ||
    /^\/(hu|en|de)\/(robots\.txt|sitemap(?:-\w+)?\.xml|server-sitemap\.xml)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // NEM GET/HEAD → ne nyúlj
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  // gyökér → /hu (308, SEO)
  if (pathname === "/" || pathname === "") {
    const clone = url.clone();
    clone.pathname = "/hu";
    return NextResponse.redirect(clone, 308);
  }

  // hiányzó locale prefix → redirect preferált nyelvre
  const missing = LOCALES.every((l) => !pathname.startsWith(`/${l}/`) && pathname !== `/${l}`);
  if (missing) {
    const locale = safeLocale(request);
    const clone = url.clone();
    clone.pathname = `/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
    return NextResponse.redirect(clone);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // minden tartalom, kivéve a technikai útvonalak
    "/((?!api|_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|sitemap-.*\\.xml|server-sitemap\\.xml).*)",
    // lokalizált technikai fájlok – explicit engedjük át
    "/:locale(hu|en|de)/(robots.txt|sitemap.xml|sitemap-:any*.xml|server-sitemap.xml)",
  ],
};
