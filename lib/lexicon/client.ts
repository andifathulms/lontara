import compactJson from '@/data/lexicon/compact.json'
import type { Attestation, FrequencyBand, Lexicon, LexiconEntry } from './loader'

/**
 * The lexicon as the browser gets it.
 *
 * `loader.ts` is the auditable one: it reads `entries.json`, one provenance
 * record per entry, and validates the whole thing with Zod. That is the right
 * shape for a reviewer and for `pnpm lexicon:validate`, and the wrong shape to
 * send down a phone connection — measured, 70% of it is provenance, and three
 * of provenance's four fields hold a single distinct value repeated 1,323
 * times.
 *
 * This reads the compact projection instead and rebuilds the same
 * `LexiconEntry` objects from it. Nothing is dropped and nothing is invented:
 * the constants come back out of the shared record, the locator out of the
 * pool, and the reading tree renders exactly what it did before.
 *
 * # No Zod here, on purpose
 *
 * `pnpm build` runs `lexicon:validate` before `next build`, and
 * `lexicon:compact` re-parses `entries.json` through the schema on the way to
 * producing this file. So the data has been validated twice before it is
 * bundled, and validating it a third time in the browser cost 4.7ms of the main
 * thread at load and bought a guarantee already held.
 *
 * The schema is not weakened — it still gates the build. It just no longer runs
 * on a device that cannot do anything with the answer.
 */

const data = compactJson as unknown as {
  version: string
  bands: Record<string, { weight: number; description: string }>
  provenance: { source: string; licence: string; licenceUrl?: string; retrieved: string }
  locators: string[]
  entries: [string, string, string, string, number][]
}

const entries: readonly LexiconEntry[] = data.entries.map(
  ([id, latin, band, attestation, locator]) => ({
    id,
    latin,
    band: band as FrequencyBand,
    attestation: attestation as Attestation,
    provenance: {
      ...data.provenance,
      locator: data.locators[locator] ?? '',
    },
  }),
)

export const CLIENT_LEXICON: Lexicon = {
  version: data.version,
  entries,
  bandWeight: (band) => data.bands[band]?.weight ?? 0,
  isEmpty: entries.length === 0,
}
