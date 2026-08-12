import inventoryJson from '@/data/rules/inventory.json'
/* Type-only, so the schema module — and Zod with it — is erased from the
   bundle. See lib/rules/inventory.schema.ts. */
import type { Inventory, Consonant, VowelSign, Punctuation } from './inventory.schema'
export type { Inventory, Consonant, VowelSign, Punctuation } from './inventory.schema'

export const INVENTORY: Inventory = inventoryJson as unknown as Inventory

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
