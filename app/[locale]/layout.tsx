import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import '../globals.css'
import { isLocale, localeParams, type Locale } from '@/lib/i18n/locales'
import { getCopy } from '@/lib/i18n/copy'
import { SiteHeader } from '@/components/chrome/SiteHeader'
import { SiteFooter } from '@/components/chrome/SiteFooter'

/**
 * `app/[locale]/layout.tsx` is the root layout — there is no `app/layout.tsx`,
 * so that `lang` can be set correctly per locale. The bare `/` is handled by
 * `public/index.html`, since a static export has no middleware to redirect with.
 */
export function generateStaticParams() {
  return localeParams()
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  const copy = getCopy(locale)
  return {
    title: { default: `${copy.siteName} — ${copy.tagline}`, template: `%s — ${copy.siteName}` },
    description: copy.tagline,
    applicationName: copy.siteName,
    authors: [{ name: 'Andi Fathul Mukminin Salahuddin' }],
  }
}

export const viewport: Viewport = {
  themeColor: '#1A1614',
  width: 'device-width',
  initialScale: 1,
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale

  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col">
        <SiteHeader locale={locale} />
        <main className="flex-1">{children}</main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  )
}
