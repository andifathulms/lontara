import { INVENTORY, CONSONANT_BY_CHAR, VOWEL_SIGN_BY_CHAR, PUNCTUATION_BY_CHAR, isBuginese } from '@/lib/rules/inventory'
import type { Consonant, VowelSign } from '@/lib/rules/inventory'
import { rule } from '@/lib/rules/loader'
import type { AmbiguityClass } from '@/lib/rules/schema'
import { span, type Span } from './trace'

/**
 * CV syllable structure, in both directions.
 *
 * The Latin side implements `latin.syllable.segment` — maximal onset, derived
 * from the absence of a virama. Nothing about which onsets or vowels exist is
 * written here: both come from `inventory.json`, so adding a letter to the
 * inventory changes the segmenter without touching this file.
 */

export const GLOTTAL = "'"

/** Onsets longest-first, so `mp` wins over `m` and `nyc` over `ny`. */
const ONSETS: readonly string[] = INVENTORY.consonants
  .map((c) => c.onset)
  .filter((o) => o.length > 0)
  .sort((a, b) => b.length - a.length)

/**
 * The inherent vowel plus every vowel sign's Latin value, longest-first.
 *
 * `ae` sorting before `a` is a consequence of the provisional romanisation of
 * U+1A1B BUGINESE VOWEL SIGN AE, which is taken from the Unicode character
 * name and not from a Bugis Latin orthography. See
 * `openQuestions.vowel-sign-ae` — until that is settled, an input `ae` is read
 * as the single sign rather than as `a` followed by `e`.
 */
const VOWELS: readonly string[] = [
  INVENTORY.inherentVowel.latin,
  ...INVENTORY.vowelSigns.map((v) => v.latin),
].sort((a, b) => b.length - a.length)

/**
 * The nasal and second components of the four written prenasal clusters —
 * `ngk`, `mp`, `nr`, `nyc`. Derived from `inventory.consonants[prenasal]` and
 * nothing else, which bounds the claim exactly: `lontara.prenasal.drop` fires
 * only where the inventory itself evidences the pattern. No phonological set is
 * asserted here, because this repo cannot cite one.
 */
const PRENASAL_NASALS: ReadonlySet<string> = new Set(
  INVENTORY.consonants
    .filter((c) => c.prenasal)
    .map((c) => ONSETS.find((o) => c.onset.startsWith(o) && o !== c.onset) ?? '')
    .filter((o) => o.length > 0),
)

const PRENASAL_SECONDS: ReadonlySet<string> = new Set(
  INVENTORY.consonants
    .filter((c) => c.prenasal)
    .map((c) => {
      const nasal = ONSETS.find((o) => c.onset.startsWith(o) && o !== c.onset)
      return nasal ? c.onset.slice(nasal.length) : ''
    })
    .filter((o) => o.length > 0),
)

export type LatinUnit =
  /** A written (C)V unit. `onset` is empty for a vowel carried by U+1A15. */
  | { readonly kind: 'syllable'; readonly onset: string; readonly vowel: string; readonly span: Span }
  /** A consonant closing a syllable. The script cannot write it. */
  | { readonly kind: 'final'; readonly consonant: string; readonly span: Span }
  /** The glottal stop. The script cannot write it. */
  | { readonly kind: 'glottal'; readonly span: Span }
  /** Anything the rule set has nothing to say about. Never silently dropped. */
  | { readonly kind: 'unhandled'; readonly text: string; readonly span: Span }

export type LatinSegmentation = {
  readonly units: readonly LatinUnit[]
  readonly ruleId: string
}

function matchAt(clusters: readonly string[], at: number, candidates: readonly string[]): string | null {
  for (const candidate of candidates) {
    const chars = Array.from(candidate)
    if (chars.every((ch, k) => clusters[at + k] === ch)) return candidate
  }
  return null
}

/**
 * `latin.syllable.segment` — maximal onset. At each position: take the longest
 * onset that is followed by a vowel and emit a syllable; failing that, a bare
 * vowel is a syllable with an empty onset; failing that, the longest onset
 * present is a syllable-final consonant.
 */
export function segmentLatin(clusters: readonly string[]): LatinSegmentation {
  const segmentRule = rule('latin.syllable.segment')
  const units: LatinUnit[] = []
  let i = 0

  while (i < clusters.length) {
    const here = clusters[i]
    if (here === undefined) break

    if (here === GLOTTAL) {
      units.push({ kind: 'glottal', span: span(i, i + 1) })
      i += 1
      continue
    }

    // Longest onset followed by a vowel.
    let matched = false
    for (const onset of ONSETS) {
      const chars = Array.from(onset)
      if (!chars.every((ch, k) => clusters[i + k] === ch)) continue
      const vowel = matchAt(clusters, i + chars.length, VOWELS)
      if (vowel === null) continue
      const length = chars.length + Array.from(vowel).length
      units.push({ kind: 'syllable', onset, vowel, span: span(i, i + length) })
      i += length
      matched = true
      break
    }
    if (matched) continue

    // A vowel with no onset — carried by U+1A15 BUGINESE LETTER A.
    const bareVowel = matchAt(clusters, i, VOWELS)
    if (bareVowel !== null) {
      const length = Array.from(bareVowel).length
      units.push({ kind: 'syllable', onset: '', vowel: bareVowel, span: span(i, i + length) })
      i += length
      continue
    }

    // A consonant that cannot begin a (C)V unit here: syllable-final.
    const finalConsonant = matchAt(clusters, i, ONSETS)
    if (finalConsonant !== null) {
      const length = Array.from(finalConsonant).length
      units.push({ kind: 'final', consonant: finalConsonant, span: span(i, i + length) })
      i += length
      continue
    }

    units.push({ kind: 'unhandled', text: here, span: span(i, i + 1) })
    i += 1
  }

  return { units, ruleId: segmentRule.id }
}

/**
 * Which loss rule accounts for a `final` unit, and therefore which ambiguity
 * class it belongs to. The order matches the `classify` stage priorities in
 * `rules.json`: gemination, then prenasal, then final.
 */
export function classifyFinal(
  units: readonly LatinUnit[],
  index: number,
): { ambiguityClass: AmbiguityClass; ruleId: string } {
  const unit = units[index]
  if (unit?.kind !== 'final') throw new Error(`unit ${index} is not a final consonant`)

  const next = units[index + 1]
  const nextOnset = next?.kind === 'syllable' ? next.onset : null

  if (nextOnset !== null && nextOnset === unit.consonant) {
    return { ambiguityClass: 'gemination', ruleId: rule('lontara.gemination.collapse').id }
  }

  if (
    nextOnset !== null &&
    PRENASAL_NASALS.has(unit.consonant) &&
    PRENASAL_SECONDS.has(nextOnset)
  ) {
    return { ambiguityClass: 'prenasal', ruleId: rule('lontara.prenasal.drop').id }
  }

  return { ambiguityClass: 'final', ruleId: rule('lontara.final.drop').id }
}

// ── Lontara side ─────────────────────────────────────────────────────────────

export type LontaraUnit =
  /** A consonant letter, with a vowel sign where one follows it. */
  | {
      readonly kind: 'syllable'
      readonly letter: Consonant
      readonly sign: VowelSign | null
      readonly span: Span
    }
  | { readonly kind: 'punctuation'; readonly codepoint: string; readonly span: Span }
  /** A vowel sign with no letter to attach to, or a character outside the block. */
  | { readonly kind: 'unhandled'; readonly text: string; readonly why: string; readonly span: Span }

export type LontaraSegmentation = {
  readonly units: readonly LontaraUnit[]
}

/**
 * Parse aksara into letter+sign units. A vowel sign is only ever consumed as
 * part of the letter before it — a stray sign is reported as unhandled rather
 * than attached to whatever happens to precede it.
 */
export function segmentLontara(clusters: readonly string[]): LontaraSegmentation {
  const units: LontaraUnit[] = []
  let i = 0

  while (i < clusters.length) {
    const cluster = clusters[i]
    if (cluster === undefined) break

    // Intl.Segmenter groups a letter with its combining marks, so a cluster may
    // already hold both. Read the cluster's own code points rather than assuming
    // one character per cluster.
    const chars = Array.from(cluster)
    const head = chars[0]
    if (head === undefined) {
      i += 1
      continue
    }

    const letter = CONSONANT_BY_CHAR.get(head)
    if (letter) {
      const attached = chars.slice(1).map((c) => VOWEL_SIGN_BY_CHAR.get(c) ?? null)
      let sign: VowelSign | null = attached.find((s): s is VowelSign => s !== null) ?? null
      let length = 1

      // A sign may also arrive as its own cluster.
      if (sign === null) {
        const next = clusters[i + 1]
        const nextSign = next ? VOWEL_SIGN_BY_CHAR.get(next) : undefined
        if (nextSign) {
          sign = nextSign
          length = 2
        }
      }

      units.push({ kind: 'syllable', letter, sign, span: span(i, i + length) })
      i += length
      continue
    }

    const punctuation = PUNCTUATION_BY_CHAR.get(head)
    if (punctuation) {
      units.push({
        kind: 'punctuation',
        codepoint: punctuation.codepoint,
        span: span(i, i + 1),
      })
      i += 1
      continue
    }

    const strandedSign = VOWEL_SIGN_BY_CHAR.get(head)
    units.push({
      kind: 'unhandled',
      text: cluster,
      why: strandedSign
        ? `${strandedSign.unicodeName} has no consonant letter to attach to.`
        : isBuginese(head)
          ? 'An unassigned code point in the Buginese block.'
          : 'Outside the Buginese block — this reader handles Lontara only.',
      span: span(i, i + 1),
    })
    i += 1
  }

  return { units }
}
