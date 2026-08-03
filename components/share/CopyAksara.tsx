'use client'

import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { useCopy } from '@/components/share/useCopy'
import { eyebrow } from '@/components/chrome/eyebrow'

/**
 * Take the Lontara with you.
 *
 * The designer and the signmaker in PRD §5 are here for exactly one thing: a
 * short correct string they can carry to a workshop. Until now the tool would
 * produce it and give them no way to lift it off the page except selecting
 * aksara by hand on a phone.
 *
 * A refusal is reported rather than swallowed. Someone who believes they
 * copied a name and did not could carve the wrong thing, and the failure is
 * silent by default — `navigator.clipboard` needs a secure context and can be
 * denied outright. The aksara stays selectable above and the codepoints stay
 * below, so there is always a way through.
 */
export function CopyAksara({ locale, text }: { locale: Locale; text: string }) {
  const copy = getCopy(locale)
  const [state, run] = useCopy(text)

  if (text === '') return null

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={run}
        className={`min-h-[36px] border border-gold/50 px-3 py-1 hover:bg-gold/10 ${eyebrow('gold', 'sm')}`}
      >
        {state === 'copied' ? copy.share.copied : copy.share.copyAksara}
      </button>

      {/* Announced, not just recoloured — the button's own label does not
          change on refusal, and a failed copy is the case that matters. */}
      <p role="status" aria-live="polite" className="text-sm text-lontar/75">
        {state === 'refused' ? copy.share.copyRefused : ''}
      </p>
    </div>
  )
}
