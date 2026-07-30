import { z } from 'zod'
import lexiconJson from '@/data/lexicon/entries.json'

/**
 * The curated Bugis wordlist. Modest and honest about coverage (PRD §6.4) —
 * 2,000 well-sourced entries beat 50,000 of unknown provenance, because the
 * ranking is only as trustworthy as the lexicon behind it.
 *
 * It currently holds zero entries. See data/lexicon/provenance.md; every path
 * through the reader is built to work, and to say what it cannot do, at size
 * zero.
 */
export const BANDS = ['core', 'common', 'uncommon', 'rare', 'unknown'] as const
export type FrequencyBand = (typeof BANDS)[number]

const ProvenanceSchema = z.object({
  source: z.string().min(1),
  /** Page, headword number, revision id — enough to find the entry again. */
  locator: z.string().min(1),
  licence: z.string().min(1),
  licenceUrl: z.string().url().optional(),
  /** ISO date. Passed in as data, never read from a clock — the engine is pure. */
  retrieved: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const LexiconEntrySchema = z.object({
  id: z.string().min(1),
  latin: z.string().min(1),
  band: z.enum(BANDS),
  /**
   * For reviewer verification only. NEVER rendered — transliteration is not
   * translation and the UI must not suggest the tool produces meaning
   * (invariant 16).
   */
  gloss: z.string().min(1).optional(),
  provenance: ProvenanceSchema,
})

export type LexiconEntry = z.infer<typeof LexiconEntrySchema>

export const LexiconSchema = z
  .object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    bands: z.record(
      z.enum(BANDS),
      z.object({ weight: z.number().int().positive(), description: z.string().min(1) }),
    ),
    entries: z.array(LexiconEntrySchema),
  })
  .passthrough()

export type Lexicon = {
  readonly version: string
  readonly entries: readonly LexiconEntry[]
  readonly bandWeight: (band: FrequencyBand) => number
  readonly isEmpty: boolean
}

const parsed = LexiconSchema.parse(lexiconJson)

function makeLexicon(data: z.infer<typeof LexiconSchema>): Lexicon {
  return {
    version: data.version,
    entries: data.entries,
    bandWeight: (band) => data.bands[band]?.weight ?? 0,
    isEmpty: data.entries.length === 0,
  }
}

export const LEXICON: Lexicon = makeLexicon(parsed)

/**
 * Build a lexicon from arbitrary data. The engine takes the lexicon as an
 * argument rather than importing the shipped one, so tests can supply a
 * fixture lexicon without the shipped data being involved (invariant 5 — no
 * module-level mutable state, and no hidden dependency on shipped data).
 */
export function lexiconFrom(data: unknown): Lexicon {
  return makeLexicon(LexiconSchema.parse(data))
}

export const EMPTY_LEXICON: Lexicon = lexiconFrom({
  version: '0.0.0',
  bands: { unknown: { weight: 1, description: 'none' } },
  entries: [],
})
