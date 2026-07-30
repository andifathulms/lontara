import type { Lexicon, LexiconEntry, FrequencyBand } from '@/lib/lexicon/loader'
import type { AmbiguityClass } from '@/lib/rules/schema'

/**
 * Lexicon scoring for reading candidates. Frequency plus rule-based scoring,
 * fully inspectable — no ML (PRD §4). Every component of a score is named, so a
 * ranking can be argued with.
 */
export type ScoreComponent = {
  readonly label: string
  readonly value: number
  readonly why: string
}

export type Score = {
  readonly total: number
  readonly components: readonly ScoreComponent[]
}

/**
 * The skeleton reading — inherent vowel throughout, nothing recovered — scores
 * zero on purpose. It is what the script says and nothing more, so it must never
 * outrank an attested word.
 */
export const UNATTESTED_SCORE: Score = {
  total: 0,
  components: [
    {
      label: 'tidak terdaftar',
      value: 0,
      why: 'Bukan lema dalam leksikon. Ini rangka yang ditulis aksara, bukan kata yang diketahui.',
    },
  ],
}

export function scoreReading(
  entries: readonly LexiconEntry[],
  lexicon: Lexicon,
  classes: readonly AmbiguityClass[],
): Score {
  if (entries.length === 0) return UNATTESTED_SCORE

  const components: ScoreComponent[] = []

  const best = entries.reduce<LexiconEntry | null>((acc, e) => {
    if (!acc) return e
    return lexicon.bandWeight(e.band) > lexicon.bandWeight(acc.band) ? e : acc
  }, null)

  if (best) {
    components.push({
      label: `band ${best.band}`,
      value: lexicon.bandWeight(best.band),
      why: `Terdaftar dalam leksikon pada band frekuensi "${best.band}".`,
    })
  }

  if (entries.length > 1) {
    components.push({
      label: 'lema serupa',
      value: entries.length - 1,
      why: `${entries.length} lema berbeda memiliki ejaan Latin yang sama.`,
    })
  }

  /**
   * Fewer recovered pieces means less is being assumed. A reading that needs no
   * unwritten consonant at all is the one the script most directly supports, so
   * it edges ahead of an equally attested reading that needs several.
   */
  if (classes.length > 0) {
    components.push({
      label: 'pemulihan tak tertulis',
      value: -classes.length,
      why: `Bacaan ini memulihkan ${classes.length} hal yang tidak dituliskan aksara (${classes.join(', ')}).`,
    })
  }

  return {
    total: components.reduce((sum, c) => sum + c.value, 0),
    components,
  }
}

export function bandOf(entries: readonly LexiconEntry[], lexicon: Lexicon): FrequencyBand | null {
  if (entries.length === 0) return null
  // No initial value: `entries` is non-empty by the guard above, and supplying a
  // seed would mean inventing an entry to compare against.
  return entries.reduce((acc, e) =>
    lexicon.bandWeight(e.band) > lexicon.bandWeight(acc.band) ? e : acc,
  ).band
}
