import corpusJson from '@/data/corpus/bugwiki-pairs.json'
import { interpret } from '@/lib/engine/interpret'
/* Type-only, so the schema module — and Zod with it — is erased from the
   bundle. See ./schema. */
import type { AttestedPair, Corpus } from './schema'

const CORPUS = corpusJson as unknown as Corpus

export type { AttestedPair } from './schema'
export const CORPUS_PROVENANCE = CORPUS.provenance

/**
 * A pair, plus whether this repository's rule set reproduces it.
 *
 * `agrees: false` is not a defect to hide — it is the most informative thing
 * on the page. It says either that the rule set is wrong or that attested
 * practice varies, and the reader is entitled to see which pairs are in that
 * state rather than being shown only the ones that flatter the tool.
 */
export type AttestedForm = AttestedPair & {
  readonly agrees: boolean
  /** What the rule set produces for `latin`, when that differs from `lontara`. */
  readonly produced: string
}

/**
 * Sorted by how often the form occurs, then by Latin so the order is total and
 * stable. Deterministic on purpose: the same build must produce the same list,
 * and there is no clock or RNG in this project to shuffle it with.
 */
export const ATTESTED_FORMS: readonly AttestedForm[] = CORPUS.pairs
  .map((pair) => {
    const produced = interpret(pair.latin).output.text
    return { ...pair, produced, agrees: produced === pair.lontara }
  })
  .sort((a, b) => b.occurrences - a.occurrences || a.latin.localeCompare(b.latin))

export const AGREEMENT = {
  total: ATTESTED_FORMS.length,
  agreeing: ATTESTED_FORMS.filter((f) => f.agrees).length,
} as const

/**
 * The sample the reader shows.
 *
 * Every disagreeing pair is included first, then the most frequent agreeing
 * ones fill the rest. Taking the top N by occurrence alone would have shown
 * twelve successes and no failures — the rule set happens to handle all the
 * commonest forms — which would have been a true list making a false
 * impression. A tool that only exhibits the cases it handles is claiming
 * something about itself it has not earned.
 *
 * Displayed in occurrence order regardless, so the failures are not paraded
 * either.
 */
export function attestedSample(limit: number): readonly AttestedForm[] {
  const disagreeing = ATTESTED_FORMS.filter((f) => !f.agrees)
  const agreeing = ATTESTED_FORMS.filter((f) => f.agrees)
  return [...disagreeing, ...agreeing]
    .slice(0, limit)
    .sort((a, b) => b.occurrences - a.occurrences || a.latin.localeCompare(b.latin))
}
