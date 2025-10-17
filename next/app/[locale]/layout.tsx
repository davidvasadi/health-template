// app/[locale]/layout.tsx
import React from 'react'
import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { generateMetadataObject } from '@/lib/shared/metadata'
import { Footer } from '@/components/footer'
import { Navbar } from '@/components/navbar'
import { CartProvider } from '@/context/cart-context'
import { ViewTransitions } from 'next-view-transitions'
import fetchContentType from '@/lib/strapi/fetchContentType'
import CookieBanner from '@/components/consent/cookie-banner'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400','500','600','700','800','900'],
})

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug?: string }
}): Promise<Metadata> {
  try {
    const pageData = await fetchContentType(
      'global',
      { filters: { locale: params.locale }, populate: 'seo.metaImage' },
      true
    )
    return generateMetadataObject(pageData?.seo)
  } catch {
    return generateMetadataObject({})
  }
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  let pageData: any = null
  try {
    pageData = await fetchContentType('global', { filters: { locale } }, true)
  } catch {
    pageData = null
  }

  return (
    <ViewTransitions>
      <CartProvider>
        <div className={inter.className}>
          {/* Ha nincs global → ne omoljon, csak ne rendereljük */}
          {pageData?.navbar ? <Navbar data={pageData.navbar} locale={locale} /> : null}

          {children}

          {pageData?.footer ? <Footer data={pageData.footer} locale={locale} /> : null}

          <CookieBanner locale={locale as 'hu' | 'en' | 'de'} privacyHref={`/${locale}/privacy`} />
        </div>
      </CartProvider>
    </ViewTransitions>
  )
}
