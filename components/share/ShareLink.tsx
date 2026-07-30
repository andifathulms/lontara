'use client'

import { useEffect, useState } from 'react'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { shareUrl } from '@/lib/share/hash'

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
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // In an effect, not during render: a static export is prerendered with no
    // location to read.
    setUrl(shareUrl(window.location.origin, window.location.pathname, value))
    setCopied(false)
  }, [value])

  if (value === '') return null

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // Refused, or no secure context. The URL below is still selectable.
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={onCopy}
        className="border border-gold/50 px-2 py-1 font-anotasi text-[11px] uppercase tracking-widest text-gold hover:bg-gold/10"
      >
        {copied ? copy.share.copied : copy.share.copyLink}
      </button>
      <code className="min-w-0 break-all font-anotasi text-[11px] text-lontar/45">{url}</code>
      <span className="font-anotasi text-[11px] text-lontar/35">{copy.share.fragmentNote}</span>
    </div>
  )
}
