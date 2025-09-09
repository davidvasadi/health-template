import type { Viewport } from 'next'
import { Locale, i18n } from '@/i18n.config'
import './globals.css'
import { SlugProvider } from './context/SlugContext'

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#06b6d4' }],
}

export async function generateStaticParams() {
  // A mappa [locale], ezért itt is 'locale' kulcsot adunk vissza
  return i18n.locales.map((locale) => ({ locale }))
}

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: Locale } // ⬅︎ egyezzen a szegmenssel
}) {
  return (
    <html lang={params.locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SlugProvider>{children}</SlugProvider>
      </body>
    </html>
  )
}
