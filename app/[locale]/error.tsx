'use client'

import { useEffect, useState } from 'react'
import { getCopy } from '@/lib/i18n/copy'
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n/locales'
import { eyebrow } from '@/components/chrome/eyebrow'
import { Page } from '@/components/chrome/Page'

/**
 * The outer net. `ToolErrorBoundary` (components/chrome/ToolErrorBoundary.tsx)
 * catches a crash inside `ReaderTool`/`WriterTool` specifically, so a tool
 * failure never reaches here; this exists for anything else under `[locale]`
 * — a page component itself, or chrome outside the tools.
 *
 * `error.tsx` is not given the route's `params`, so the locale is read from
 * the URL directly and falls back to the site default if it cannot be found,
 * the same fallback used elsewhere (e.g. `generateMetadata` on this layout).
 *
 * The parent layout (header, footer, skip link) stays mounted above this —
 * only the page content is replaced.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    console.error(error)
    const segment = window.location.pathname.split('/').find(isLocale)
    if (segment) setLocale(segment)
  }, [error])

  const copy = getCopy(locale)

  return (
    <Page>
      <div role="alert" className="space-y-4 border-l-4 border-sabbe bg-sabbe/10 px-4 py-4">
        <p className={eyebrow('sabbe')}>{copy.common.engineError.title}</p>
        <p className="max-w-measure text-sm text-lontar/85">{copy.common.engineError.body}</p>
        <button type="button" onClick={reset} className={`min-h-[36px] hover:underline ${eyebrow()}`}>
          {copy.common.engineError.reset}
        </button>
      </div>
    </Page>
  )
}
