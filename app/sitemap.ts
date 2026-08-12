import type { MetadataRoute } from 'next'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n/locales'
import { SITE_URL } from '@/lib/paths'

/**
 * The sitemap, generated from the route list rather than typed out.
 *
 * Fourteen URLs were reachable only by following links from the root, and the
 * root is a meta-refresh, which crawlers treat as a weak signal. PRD §14
 * already accepts that the *name* is undiscoverable; the routing did not need
 * to add to it.
 *
 * ROUTES is the one thing here that has to be maintained by hand — Next has no
 * way to enumerate statically-generated routes from inside a sitemap — so
 * tests/sitemap.test.ts walks `app/` and fails if a page exists that this list
 * does not name. A sitemap that silently omits a page is worse than none,
 * because it looks complete.
 *
 * `lastModified` is deliberately absent. It would have to come from a clock or
 * from git, and a date this file invents is a claim about content it cannot
 * check. Crawlers treat a wrong lastModified worse than a missing one.
 */
const ROUTES: readonly (readonly string[])[] = [
  [],
  ['baca'],
  ['tulis'],
  ['aksara'],
  ['aksara', 'serupa'],
  ['aksara', 'konformansi'],
  ['ejaan'],
]

/** `https://…/lontara/en/aksara/serupa/` */
function url(locale: string, segments: readonly string[]): string {
  const tail = segments.length > 0 ? `${segments.join('/')}/` : ''
  return `${SITE_URL}${locale}/${tail}`
}

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.flatMap((segments) =>
    LOCALES.map((locale) => ({
      url: url(locale, segments),
      // The same alternates the pages themselves declare, so a crawler is told
      // the two locales are one page from either direction.
      alternates: {
        languages: Object.fromEntries([
          ...LOCALES.map((l) => [l, url(l, segments)]),
          ['x-default', url(DEFAULT_LOCALE, segments)],
        ]),
      },
    })),
  )
}
