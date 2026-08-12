'use client'

import { useEffect, useState } from 'react'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { shareUrl } from '@/lib/share/hash'
import { useCopy } from '@/components/share/useCopy'
import { eyebrow } from '@/components/chrome/eyebrow'
import { Announce } from '@/components/chrome/Announce'

/**
 * Copy a link to whatever is currently in the tool.
 *
 * The URL is shown as well as copied. `navigator.clipboard` needs a secure
 * context and can be refused outright, so the visible text is the fallback that
 * always works — someone can select it by hand.
 */
export function ShareLink({ locale, value }: { locale: Locale; value: string }) {
  const copy = getCopy(locale)
  const [url, setUrl] = useState('')
  const [state, onCopy] = useCopy(url)

  useEffect(() => {
    // In an effect, not during render: a static export is prerendered with no
    // location to read.
    setUrl(shareUrl(window.location.origin, window.location.pathname, value))
  }, [value])

  if (value === '') return null

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={onCopy}
        className={`border border-gold/50 px-2 py-1 hover:bg-gold/10 print:hidden ${eyebrow('gold', 'sm')}`}
      >
        {state === 'copied' ? copy.share.copied : copy.share.copyLink}
      </button>
      {/* CopyAksara has announced its outcome since it was written; this
          button only swapped its own label, which some screen readers
          re-announce and some do not. WCAG 4.1.3. */}
      <Announce>{state === 'copied' ? copy.share.copied : ''}</Announce>

      <code className="min-w-0 break-all font-anotasi text-anotasi text-lontar/65">{url}</code>
      <span className="font-anotasi text-anotasi text-lontar/65">{copy.share.fragmentNote}</span>
    </div>
  )
}
