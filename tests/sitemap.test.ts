import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import sitemap from '../app/sitemap'
import { LOCALES } from '@/lib/i18n/locales'
import { SITE_URL } from '@/lib/paths'

/**
 * The sitemap names every page, and no page it cannot serve.
 *
 * `app/sitemap.ts` keeps its route list by hand, because Next gives a sitemap
 * no way to enumerate the routes it generated. A list maintained by hand falls
 * behind, and a sitemap that silently omits a page is worse than no sitemap —
 * it looks complete. So the list is checked against the filesystem instead of
 * trusted.
 */

/** Every `page.tsx` under `app/[locale]/`, as route segments. */
function routesOnDisk(dir = 'app/[locale]', prefix: string[] = []): string[][] {
  const out: string[][] = []
  for (const entry of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(...routesOnDisk(`${dir}/${entry.name}`, [...prefix, entry.name]))
    else if (entry.name === 'page.tsx') out.push(prefix)
  }
  return out
}

const ON_DISK = routesOnDisk()
const ENTRIES = sitemap()

describe('the sitemap matches the app', () => {
  it('finds the routes on disk', () => {
    expect(ON_DISK.length).toBeGreaterThan(5)
  })

  it('lists every page, in every locale', () => {
    const listed = new Set(ENTRIES.map((e) => e.url))
    for (const segments of ON_DISK) {
      for (const locale of LOCALES) {
        const tail = segments.length > 0 ? `${segments.join('/')}/` : ''
        const expected = `${SITE_URL}${locale}/${tail}`
        expect(listed.has(expected), `sitemap is missing ${expected}`).toBe(true)
      }
    }
  })

  it('lists nothing that is not a page', () => {
    const onDisk = new Set(
      ON_DISK.flatMap((segments) =>
        LOCALES.map((locale) => {
          const tail = segments.length > 0 ? `${segments.join('/')}/` : ''
          return `${SITE_URL}${locale}/${tail}`
        }),
      ),
    )
    for (const entry of ENTRIES) {
      expect(onDisk.has(entry.url), `sitemap lists ${entry.url}, which is not a page`).toBe(true)
    }
  })

  it('gives every url an absolute https address under the deployed basePath', () => {
    for (const entry of ENTRIES) {
      expect(entry.url.startsWith(SITE_URL), `${entry.url} is not under ${SITE_URL}`).toBe(true)
      expect(entry.url.endsWith('/'), `${entry.url} has no trailing slash`).toBe(true)
    }
  })

  it('declares both locales plus x-default as alternates for each url', () => {
    for (const entry of ENTRIES) {
      const languages = entry.alternates?.languages ?? {}
      for (const locale of LOCALES) {
        expect(languages).toHaveProperty(locale)
      }
      expect(languages).toHaveProperty('x-default')
    }
  })

  it('claims no lastModified it cannot verify', () => {
    // A date invented here is a claim about content this file cannot check,
    // and crawlers treat a wrong lastModified worse than a missing one.
    for (const entry of ENTRIES) {
      expect(entry.lastModified).toBeUndefined()
    }
  })
})
