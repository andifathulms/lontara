import type { Locale } from './i18n/locales'

/**
 * `next/link` prepends `basePath` on its own, so hrefs here are basePath-free.
 * Anything that is NOT a Link — a raw `<a href>` to a static asset, a font URL,
 * an image — needs `asset()`.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export function href(locale: Locale, ...segments: string[]): string {
  const tail = segments.filter(Boolean).join('/')
  return tail ? `/${locale}/${tail}/` : `/${locale}/`
}

export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`
}

/** Must match the deployed repository — the footer "source" link is the whole
 *  of the project's auditability claim, and it 404s if this is wrong. */
export const REPOSITORY_URL = 'https://github.com/andifathulms/lontara'
