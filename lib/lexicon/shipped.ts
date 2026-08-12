import lexiconJson from '@/data/lexicon/entries.json'
import { lexiconFrom, type Lexicon } from './loader'

/**
 * The full lexicon, parsed from the auditable source.
 *
 * Split out of `loader.ts` for one measured reason. `loader.ts` also exports
 * `ATTESTATION_WEIGHT`, a five-line constant that `lib/engine/rank.ts` imports
 * — and `rank.ts` is reached by `enumerate`, which is reached by the reader and
 * the writer. So a client bundle pulled in this module for one small record,
 * and with it all 614 kB of `entries.json` and a Zod parse of 1,323 entries.
 *
 * Nothing here is server-only by policy; it is server-only by size. Anything
 * that runs in a browser wants `./client`, which reads the compact projection
 * and rebuilds the same entries. Build-time consumers — the collision index,
 * the open-question impact, the scripts and the tests — want this one, because
 * they are also the ones that should be reading the file a reviewer audits.
 */
export const LEXICON: Lexicon = lexiconFrom(lexiconJson)
