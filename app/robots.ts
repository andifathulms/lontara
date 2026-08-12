import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/paths'

/**
 * robots.txt, which the site did not have.
 *
 * Nothing was blocking crawlers — the absence was simply an absence — but it
 * is also the only conventional place to point at the sitemap, and a project
 * page on a shared host benefits from saying plainly that all of it is
 * crawlable rather than leaving that to be inferred.
 *
 * Everything is allowed. There is no user content, no search results, no
 * generated permutations to keep out of an index: fourteen static pages and a
 * URL fragment that is never sent to a server in the first place.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${SITE_URL}sitemap.xml`,
  }
}
