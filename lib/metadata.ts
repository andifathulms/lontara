import type { Metadata } from 'next'
import { getCopy } from '@/lib/i18n/copy'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/lib/i18n/locales'

/**
 * One place that turns a page's own copy into its metadata.
 *
 * Every inner page used to share as the site tagline. `generateMetadata` set
 * `title` and `description` per route but never `openGraph`, so the root
 * layout's block passed through untouched and all seven routes advertised one
 * description. Sharing the writer produced a preview about the site.
 *
 * The rule this exists to enforce: a page's title and description are the
 * strings the page itself renders, passed in once and fanned out to `<title>`,
 * `description`, Open Graph and Twitter together. Nothing here is written by
 * hand a second time, so nothing here can drift from the page.
 *
 * # URLs
 *
 * Every path is relative and carries NO leading slash. `metadataBase` is
 * `https://…/lontara/` — the deployed root including basePath — and a relative
 * `en/tulis/` resolves against it correctly, while `/en/tulis/` would resolve
 * to someone else's origin root and silently drop the basePath. That is the
 * same trap `asset()` exists for, one layer up.
 *
 * # hreflang
 *
 * `alternates.languages` is what emits it. The site has had two full locales
 * and nothing telling a search engine that `/id/tulis` and `/en/tulis` are the
 * same page. `x-default` points at the default locale, which is what the bare
 * root redirects to.
 */

/** `en/tulis/` — relative, trailing slash, no leading slash. */
function path(locale: Locale, segments: readonly string[]): string {
  const tail = segments.filter(Boolean).join('/')
  return tail ? `${locale}/${tail}/` : `${locale}/`
}

export function pageMetadata({
  locale,
  segments = [],
  title,
  description,
}: {
  locale: Locale
  /** Route segments below the locale, e.g. `['aksara', 'serupa']`. */
  segments?: readonly string[]
  /** The page's own heading. Omit on the home page, which is the site itself. */
  title?: string
  /** The page's own lead paragraph. */
  description: string
}): Metadata {
  const copy = getCopy(locale)
  const here = path(locale, segments)

  /*
   * `title` here is the bare page name; the root layout's template turns it
   * into "Tulis — Lontara". Open Graph has no template, so it gets the
   * composed form — otherwise a shared link would read just "Tulis".
   */
  const composed = title ? `${title} — ${copy.siteName}` : `${copy.siteName} — ${copy.tagline}`

  return {
    ...(title ? { title } : {}),
    description,
    alternates: {
      canonical: here,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, path(l, segments)])),
        'x-default': path(DEFAULT_LOCALE, segments),
      },
    },
    openGraph: {
      type: 'website',
      siteName: copy.siteName,
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      url: here,
      title: composed,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: composed,
      description,
    },
  }
}
