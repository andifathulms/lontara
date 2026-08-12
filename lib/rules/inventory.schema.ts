import { z } from 'zod'

/**
 * The inventory schema, kept apart from the data it describes.
 *
 * `inventory.ts` is reached by the engine and therefore by the browser. While
 * the schema lived beside the data, importing one code point's Unicode name
 * pulled Zod into every client bundle to validate a file `pnpm rules:validate`
 * had already validated before the build began.
 *
 * Nothing else moved. The schema still gates the build, and
 * tests/schemas.test.ts still runs it against this exact file.
 */
import inventoryJson from '@/data/rules/inventory.json'

/**
 * The Buginese block as encoded. Facts about the script and its encoding —
 * codepoints and Unicode character names — kept separate from orthography,
 * which lives in rules.json.
 *
 * `pnpm rules:validate` checks every codepoint and name here against the
 * vendored font's cmap, so a transcription slip fails the build rather than
 * reaching a reader.
 */
const CODEPOINT = z.string().regex(/^U\+1A[0-9A-F]{2}$/, 'expected U+1Axx')

const ConsonantSchema = z.object({
  codepoint: CODEPOINT,
  unicodeName: z.string().min(1),
  /** Latin onset. Empty string for U+1A15 BUGINESE LETTER A, the vowel carrier. */
  onset: z.string(),
  prenasal: z.boolean(),
  /** Present where the onset departs from the Unicode character name. */
  onsetNote: z.string().min(1).optional(),
})

const VowelSignSchema = z.object({
  codepoint: CODEPOINT,
  unicodeName: z.string().min(1),
  latin: z.string().min(1),
  generalCategory: z.enum(['Mn', 'Mc']),
  combiningClass: z.number().int().min(0).max(255),
  position: z.enum(['above', 'below', 'before', 'after', 'unverified']),
  positionSource: z.string().min(1),
  latinNote: z.string().min(1).optional(),
})

const PunctuationSchema = z.object({
  codepoint: CODEPOINT,
  unicodeName: z.string().min(1),
  /** null where this repo cannot yet cite a Latin representation. */
  latin: z.string().nullable(),
})

export const InventorySchema = z
  .object({
    source: z.object({
      standard: z.string().min(1),
      citation: z.string().min(1),
      url: z.string().url(),
      designRationale: z.string().min(1),
      verifiedAgainstFont: z.string().min(1),
    }),
    block: z.object({
      start: CODEPOINT,
      end: CODEPOINT,
      assigned: z.literal(30),
      since: z.string().min(1),
      hasVirama: z.literal(false),
      viramaNote: z.string().min(1),
    }),
    inherentVowel: z.object({ latin: z.literal('a'), note: z.string().min(1) }),
    order: z.object({
      name: z.literal('ka-ga-nga'),
      note: z.string().min(1),
      rows: z.array(z.array(CODEPOINT).nonempty()).nonempty(),
    }),
    consonants: z.array(ConsonantSchema).length(23),
    vowelSigns: z.array(VowelSignSchema).length(5),
    punctuation: z.array(PunctuationSchema).length(2),
  })
  .passthrough()

export type Inventory = z.infer<typeof InventorySchema>
export type Consonant = z.infer<typeof ConsonantSchema>
export type VowelSign = z.infer<typeof VowelSignSchema>
export type Punctuation = z.infer<typeof PunctuationSchema>

/** Parsed once. The inventory is static data and never mutated. */
/*
 * Cast, not parsed, at runtime.
 *
 * `pnpm build` runs `pnpm rules:validate` before `next build` and it fails the deploy on
 * malformed data (PRD §8). Re-validating the same bytes in the browser bought a
 * guarantee already held and shipped Zod — 13.7 kB gzipped — to every visitor
 * to do it.
 *
 * The schema is untouched and still gates the build. It also still runs on this
 * exact file in tests/schemas.test.ts, so the check moved rather than
 * disappeared: if this data ever stops satisfying its schema, the suite goes red
 * before anything is built.
 */
