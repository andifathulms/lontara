import { enumerate } from '@/lib/engine/enumerate'
import { interpret } from '@/lib/engine/interpret'
import type { Lexicon } from '@/lib/lexicon/types'

/**
 * The return trip: given what the writer produced, which OTHER forms in the
 * lexicon are written the same way.
 *
 * Nothing is computed in a component (invariant 9), so the panel renders this
 * and does no work of its own.
 *
 * # Why this dedupes, and why the engine does not
 *
 * `enumerate` keys its readings on each entry's raw `latin`. The lexicon holds
 * `aba'` and `abaq` as separate entries and they are one word — `latin.glottal.q`
 * says so — so the raw keying lists both, and the panel would report two rival
 * forms where the script leaves one.
 *
 * The obvious fix is to key `enumerate` on the normalized form instead. That is
 * NOT done here, deliberately: it changes what the reader shows, and it breaks
 * `tests/enumerate/completeness.test.ts`, which asserts invariant 15 by
 * checking that the *raw* input (`goloq`, `MATA`, `va`) appears verbatim in the
 * reading set. Whether enumeration completeness means "the input string is in
 * the set" or "a form covering the input is in the set" is a real question
 * about the project's most important property, and it is the owner's to answer,
 * not a side effect of adding a panel to the writer.
 *
 * So the collapsing happens here, where it changes one panel and no invariant.
 * When that question is settled, this function is where the workaround comes
 * out.
 */

export type ReturnTrip = {
  /** Other forms written identically, canonical spelling, alphabetical. */
  readonly rivals: readonly string[]
  /** True when enumeration hit its cap — reported, never applied silently. */
  readonly capApplied: boolean
  readonly maxDepth: number
}

export function returnTrip(
  lontara: string,
  lexicon: Lexicon,
  /** The writer's own normalized input, so the user's form is not a rival to itself. */
  ownNormalized: string,
): ReturnTrip {
  if (lontara === '') {
    return { rivals: [], capApplied: false, maxDepth: 0 }
  }

  const result = enumerate(lontara, lexicon)

  const rivals = [
    ...new Set(
      result.readings
        // Collapse spelling variants onto the form the rule set considers
        // canonical, so one word never appears as two rivals.
        .map((reading) => interpret(reading.latin).input.normalized)
        .filter((latin) => latin !== ownNormalized),
    ),
  ].sort((a, b) => a.localeCompare(b))

  return {
    rivals,
    capApplied: result.cap.applied,
    maxDepth: result.cap.maxDepth,
  }
}
