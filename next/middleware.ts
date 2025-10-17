import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { i18n } from '@/i18n.config'
import { match as matchLocale } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))
  // @ts-ignore
  const locales: string[] = i18n.locales
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages()
  return matchLocale(languages, locales, i18n.defaultLocale)
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const { pathname } = url

  // 1) tech fájlok gyökerében → ne lokalizáljuk
  if (/^\/(robots\.txt|sitemap(?:-\w+)?\.xml|server-sitemap\.xml)$/i.test(pathname)) {
    return NextResponse.next()
  }

  // 2) tech fájlok nyelvi prefixszel → rewrite a gyökerire
  const m = pathname.match(/^\/(hu|en|de)\/(robots\.txt|sitemap(?:-\w+)?\.xml|server-sitemap\.xml)$/i)
  if (m) {
    const clone = url.clone()
    clone.pathname = `/${m[2]}`
    return NextResponse.rewrite(clone)
  }

  // 3) hiányzó locale → redirect
  const missing = i18n.locales.every(
    (l) => !pathname.startsWith(`/${l}/`) && pathname !== `/${l}`
  )
  if (missing) {
    const locale = getLocale(request)
    const clone = url.clone()
    clone.pathname = `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`
    return NextResponse.redirect(clone)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|sitemap-.*\\.xml|server-sitemap\\.xml).*)',
    '/:locale(hu|en|de)/(robots.txt|sitemap.xml|sitemap-:any*.xml|server-sitemap.xml)',
  ],
}
