'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo } from 'react'
import { returnTrip } from '@/lib/analysis/returnTrip'
import { LEXICON } from '@/lib/lexicon/loader'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { href } from '@/lib/paths'
import { encodeShareHash } from '@/lib/share/hash'
import { eyebrow } from '@/components/chrome/eyebrow'
import { Announce } from '@/components/chrome/Announce'

/**
 * The return trip. What a reader would see, for the aksara you just produced.
 *
 * The writer already declares what it discarded — `gemination was dropped
 * here`. What it never showed is the consequence: *whom you are now
 * indistinguishable from*. Someone about to cut a name into a signboard needs
 * that and cannot get it anywhere else in the app without retyping the aksara
 * into the reader by hand.
 *
 * This is also the one property the test suite cares about most made visible.
 * Invariant 15 asserts that a Latin form reappears in the enumeration of its own
 * Lontara — enumeration completeness — and until now that ran only in CI.
 *
 * # Why it defers
 *
 * `enumerate` inverts the writer over the whole lexicon: ~1,300 `interpret`
 * calls, about 29 ms on a laptop and several times that on the phone PRD §12
 * targets. Running it per keystroke would make the field itself lag, and the
 * field is the part that has to stay responsive. `useDeferredValue` is React
 * 18's answer to exactly this and costs no new dependency: typing stays on the
 * urgent path, this catches up behind it, and while it is behind the panel says
 * so rather than showing a count that belongs to a word you already changed.
 *
 * # What it must never say
 *
 * Forms only, never meanings (invariant 16). And absence is not evidence: a
 * form missing from this lexicon is missing from *Bugis Wikipedia*, which is
 * not the same as not being a Bugis word. The empty case says that rather than
 * congratulating the user on an unambiguous string.
 */
export function ReturnTrip({
  locale,
  normalizedLatin,
  lontara,
}: {
  locale: Locale
  /** The writer's own normalized input, so the user's form is not listed as a rival. */
  normalizedLatin: string
  lontara: string
}) {
  const copy = getCopy(locale)

  const deferred = useDeferredValue(lontara)
  const settling = deferred !== lontara

  const result = useMemo(
    () => returnTrip(deferred, LEXICON, normalizedLatin),
    [deferred, normalizedLatin],
  )
  const others = result.rivals

  /*
   * `aria-busy` used to sit on the wrapper below, which did nothing: it is only
   * meaningful on a live region or a widget container, and on a plain div it is
   * inert decoration. The dimming it paired with had no announced equivalent
   * either, so the rival count changed in silence.
   *
   * A real status message replaces it, and it is hoisted ABOVE the empty-input
   * return: a live region has to be in the DOM before its contents change, and
   * mounting it in the same commit that fills it is the standard way to get no
   * announcement at all.
   *
   * Deliberately not marked busy while settling — the deferred value means the
   * text arrives a beat later, and announcing "loading" for one frame is noise.
   */
  const announcement =
    lontara === '' || settling
      ? ''
      : others.length === 0
        ? copy.returnTrip.none
        : copy.returnTrip.others(others.length)

  if (lontara === '') {
    return (
      <>
        <Announce>{announcement}</Announce>
        <p className="text-sm text-lontar/65">{copy.writer.emptyState}</p>
      </>
    )
  }

  return (
    <div className={settling ? 'opacity-50' : undefined}>
      <Announce>{announcement}</Announce>

      {others.length === 0 ? (
        <>
          <p className="text-lontar/85">{copy.returnTrip.none}</p>
          <p className="mt-2 max-w-measure text-sm text-lontar/65">
            {copy.returnTrip.noneNote(LEXICON.entries.length)}
          </p>
        </>
      ) : (
        <>
          <p className={eyebrow('daun')}>{copy.returnTrip.others(others.length)}</p>

          {/* Forms only. Attaching a meaning to any of these would turn the
              writer into a dictionary, which is the confusion PRD §4 says
              users already arrive with. */}
          <p className="mt-2 text-lead text-lontar">
            {others.join(' · ')}
          </p>

          <p className="mt-2 max-w-measure text-sm text-lontar/75">{copy.returnTrip.othersNote}</p>
        </>
      )}

      {/* The cap is reported here for the same reason it is reported in the
          reader: PRD §6.1 allows a cap, never a silent one. */}
      {result.capApplied ? (
        <p className="mt-2 font-anotasi text-anotasi text-sabbe-ink">
          {copy.reader.capReported(result.maxDepth)}
        </p>
      ) : null}

      <p className="mt-3">
        <Link
          href={`${href(locale, 'baca')}${encodeShareHash(lontara)}`}
          className={`inline-block no-underline ${eyebrow()}`}
        >
          {copy.returnTrip.openInReader} →
        </Link>
      </p>
    </div>
  )
}
