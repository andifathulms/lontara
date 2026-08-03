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

  const copy = getCopy(locale)

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col">
        {/* The nav is four links deep before the tool starts, and the reader's
            input is the thing a keyboard user actually came for. */}
        <a
          href="#isi"
          className="sr-only print:hidden focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:border-2 focus:border-gold focus:bg-grid focus:px-4 focus:py-2 focus:font-anotasi focus:text-anotasi focus:uppercase focus:tracking-widest focus:text-gold focus:no-underline"
        >
          {copy.common.skipToContent}
        </a>
        <SiteHeader locale={locale} />
        <main id="isi" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  )
}
