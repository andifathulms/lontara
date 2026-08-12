import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import '../globals.css'
import { isLocale, localeParams, type Locale } from '@/lib/i18n/locales'
import { getCopy } from '@/lib/i18n/copy'
import { SiteHeader } from '@/components/chrome/SiteHeader'
import { SiteFooter } from '@/components/chrome/SiteFooter'
import { asset, SITE_URL } from '@/lib/paths'

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
  const title = `${copy.siteName} — ${copy.tagline}`

  return {
    title: { default: title, template: `%s — ${copy.siteName}` },
    description: copy.tagline,
    applicationName: copy.siteName,
    authors: [{ name: 'Andi Fathul Mukminin Salahuddin' }],

    /*
     * Every one of these goes through `asset()`. Next does not prefix metadata
     * URLs with `basePath`, and the brand kit's suggested `/favicon.svg` would
     * resolve to andifathulms.github.io/favicon.svg — someone else's root, on a
     * project page. Silent 404s, and a tab with no icon.
     */
    icons: {
      icon: [
        { url: asset('/favicon.svg'), type: 'image/svg+xml' },
        { url: asset('/icon/lontara-icon-32.png'), sizes: '32x32', type: 'image/png' },
      ],
      apple: [{ url: asset('/icon/lontara-icon-180.png'), sizes: '180x180' }],
    },
    manifest: asset('/manifest.webmanifest'),

    /*
     * A crawler fetches the image from its own server, so this one URL has to
     * be absolute where the rest are basePath-relative. `metadataBase` makes
     * the relative path below resolve against the deployed origin.
     */
    metadataBase: new URL(SITE_URL),
    openGraph: {
      type: 'website',
      siteName: copy.siteName,
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      title,
      description: copy.tagline,
      images: [
        {
          url: 'social/lontara-og-1200x630.png',
          width: 1200,
          height: 630,
          // The mark and the wordmark. No aksara in the alt text — it would be
          // read aloud by a screen reader as whatever the fallback font makes
          // of it, which is nothing useful.
          alt: `${copy.siteName} — sulapa' eppa'`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: copy.tagline,
      images: ['social/lontara-og-1200x630.png'],
    },
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
      <head>
        {/*
          The only font on the site that blocks.
          `font-display: block` on the aksara face is deliberate (PRD §13):
          tofu reads as a broken app, so no-text beats wrong-text. The cost is
          that the hero's glyphs — the first characters of the script anyone
          sees, above the fold — stay invisible until the file lands, and
          nothing was telling the browser to want it early.

          It is 2,880 bytes. The three Latin faces are `swap` and deliberately
          not preloaded: they have a usable fallback, and preloading four fonts
          would put 65 kB ahead of the CSS to save nothing.

          `asset()` because Next does not prefix a hand-written href with
          basePath, and /fonts/... would resolve to someone else's root on a
          project page.
        */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href={asset('/fonts/noto-sans-buginese-subset.woff2')}
          crossOrigin="anonymous"
        />
      </head>
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
