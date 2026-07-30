import { z } from 'zod'
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
export const INVENTORY: Inventory = InventorySchema.parse(inventoryJson)

/** `"U+1A00"` → `"ᨀ"`. */
export function fromCodepoint(codepoint: string): string {
  return String.fromCodePoint(Number.parseInt(codepoint.slice(2), 16))
}

/** `"ᨀ"` → `"U+1A00"`. Takes a whole code point, never a code unit. */
export function toCodepoint(char: string): string {
  const cp = char.codePointAt(0)
  if (cp === undefined) return ''
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`
}

export const CONSONANT_BY_CHAR: ReadonlyMap<string, Consonant> = new Map(
  INVENTORY.consonants.map((c) => [fromCodepoint(c.codepoint), c]),
)

export const VOWEL_SIGN_BY_CHAR: ReadonlyMap<string, VowelSign> = new Map(
  INVENTORY.vowelSigns.map((v) => [fromCodepoint(v.codepoint), v]),
)

export const PUNCTUATION_BY_CHAR: ReadonlyMap<string, Punctuation> = new Map(
  INVENTORY.punctuation.map((p) => [fromCodepoint(p.codepoint), p]),
)

export const UNICODE_NAME_BY_CHAR: ReadonlyMap<string, string> = new Map([
  ...INVENTORY.consonants.map((c) => [fromCodepoint(c.codepoint), c.unicodeName] as const),
  ...INVENTORY.vowelSigns.map((v) => [fromCodepoint(v.codepoint), v.unicodeName] as const),
  ...INVENTORY.punctuation.map((p) => [fromCodepoint(p.codepoint), p.unicodeName] as const),
])

/** Whether a code point sits in the Buginese block at all. */
export function isBuginese(char: string): boolean {
  const cp = char.codePointAt(0)
  return cp !== undefined && cp >= 0x1a00 && cp <= 0x1a1f
}
