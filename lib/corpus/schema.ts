/**
 * The corpus schema, kept apart from the data.
 *
 * `loader.ts` is imported by AttestedForms, a client component, so while the
 * schema lived beside the data every visitor downloaded Zod to re-validate a
 * file the extraction script and tests/corpus.test.ts already check.
 */
import { z } from 'zod'

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
export const PairSchema = z.object({
  lontara: z.string().regex(/^[ᨀ-᨟]+$/, 'the Lontara side must be pure aksara'),
  latin: z.string().min(1),
  occurrences: z.number().int().positive(),
  articles: z.array(z.string().min(1)).min(1),
})

export const CorpusSchema = z
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

/*
 * Cast, not parsed, at runtime.
 *
 * `pnpm build` runs `pnpm corpus:pairs, and tests/corpus.test.ts` before `next build` and it fails the deploy on
 * malformed data (PRD §8). Re-validating the same bytes in the browser bought a
 * guarantee already held and shipped Zod — 13.7 kB gzipped — to every visitor
 * to do it.
 *
 * The schema is untouched and still gates the build. It also still runs on this
 * exact file in tests/schemas.test.ts, so the check moved rather than
 * disappeared: if this data ever stops satisfying its schema, the suite goes red
 * before anything is built.
 */

export type AttestedPair = z.infer<typeof PairSchema>
export type Corpus = z.infer<typeof CorpusSchema>
