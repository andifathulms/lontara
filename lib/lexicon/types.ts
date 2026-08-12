/**
 * Lexicon types and constants, with no Zod in sight.
 *
 * This exists so that `lib/engine/rank.ts` can import `ATTESTATION_WEIGHT` — a
 * five-line record — without dragging a schema validator into the browser.
 * `loader.ts` holds the schemas and asserts, at compile time, that they still
 * describe exactly these types.
 */

export const BANDS = ['core', 'common', 'uncommon', 'rare', 'unknown'] as const
export type FrequencyBand = (typeof BANDS)[number]

/**
 * What kind of claim an entry is. NOT frequency — how much is known about
 * whether the form is a Bugis word at all. Ordered weakest to strongest, and
 * the reader shows the difference rather than flattening it.
 */
export const ATTESTATIONS = ['corpus', 'dictionary', 'reviewer'] as const
export type Attestation = (typeof ATTESTATIONS)[number]

export const ATTESTATION_WEIGHT: Record<Attestation, number> = {
  corpus: 2,
  dictionary: 30,
  reviewer: 60,
}

export type Provenance = {
  source: string
  /** Page, headword number, revision id — enough to find the entry again. */
  locator: string
  licence: string
  licenceUrl?: string
  /** ISO date. Passed in as data, never read from a clock — the engine is pure. */
  retrieved: string
}

export type LexiconEntry = {
  id: string
  latin: string
  band: FrequencyBand
  attestation: Attestation
  /**
   * For reviewer verification only. NEVER rendered — transliteration is not
   * translation and the UI must not suggest the tool produces meaning
   * (invariant 16).
   */
  gloss?: string
  provenance: Provenance
}

export type Lexicon = {
  readonly version: string
  readonly entries: readonly LexiconEntry[]
  readonly bandWeight: (band: FrequencyBand) => number
  readonly isEmpty: boolean
}
