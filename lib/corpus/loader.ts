import { z } from 'zod'
import corpusJson from '@/data/corpus/bugwiki-pairs.json'
import { interpret } from '@/lib/engine/interpret'

/**
 * Attested Lontara↔Latin pairs extracted from Bugis Wikipedia.
 *
 * What a pair claims, exactly: *this Lontara string and this Latin string were
 * written for each other by a Wikipedia contributor.* That is community
 * practice, and it is real evidence — it is not authority. `tests/reviewed/`
 * is where a reviewer's sign-off lives and it is still empty. Some of these
 * pairs are plainly wrong, and `tests/corpus.test.ts` names which and why.
 *
 * This is the honest material this project has for "here is real Bugis in
 * Lontara". It is not *pappaseng* and not Sureq Galigo: those need an edition
 * and a translator to credit, and inventing a line of either from general
 * knowledge is precisely the confident wrongness this repository exists to
 * avoid. When an edition can be cited, it belongs here beside this.
 */
const PairSchema = z.object({
  lontara: z.string().regex(/^[ᨀ-᨟]+$/, 'the Lontara side must be pure aksara'),
  latin: z.string().min(1),
  occurrences: z.number().int().positive(),
  articles: z.array(z.string().min(1)).min(1),
})

const CorpusSchema = z
  .object({
    provenance: z.object({
      source: z.string().min(1),
      dumpDate: z.string().regex(/^\d{8}$/),
      dumpUrl: z.string().url(),
      dumpSha256: z.string().regex(/^[0-9a-f]{64}$/),
      licence: z.string().min(1),
      licenceUrl: z.string().url().optional(),
      attribution: z.string().min(1),
    }),
    pairs: z.array(PairSchema),
  })
  .passthrough()

const CORPUS = CorpusSchema.parse(corpusJson)

export type AttestedPair = z.infer<typeof PairSchema>
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
