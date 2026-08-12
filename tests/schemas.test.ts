import { describe, expect, it } from 'vitest'
import rulesJson from '@/data/rules/rules.json'
import inventoryJson from '@/data/rules/inventory.json'
import corpusJson from '@/data/corpus/bugwiki-pairs.json'
import lexiconJson from '@/data/lexicon/entries.json'
import compactJson from '@/data/lexicon/compact.json'
import { RuleSetSchema } from '@/lib/rules/schema'
import { InventorySchema } from '@/lib/rules/inventory.schema'
import { LexiconSchema } from '@/lib/lexicon/loader'

/**
 * The shipped data still satisfies its schema.
 *
 * The runtime loaders used to prove this by parsing every file through Zod on
 * load — including in the browser, where it cost 13.7 kB of downloaded
 * validator to re-check bytes that `pnpm rules:validate` and
 * `pnpm lexicon:validate` had already passed before the build began.
 *
 * They now cast instead. This file is the reason that is safe rather than
 * merely cheaper: the check did not disappear, it moved here, where it runs on
 * every `pnpm test:run` and costs a visitor nothing. If any of these files ever
 * stops satisfying its schema, this goes red before anything is built or
 * deployed.
 *
 * Deleting a case here silently restores the class of bug the loaders used to
 * catch. Don't.
 */
describe('every data file the app casts still parses', () => {
  it('rules.json satisfies RuleSetSchema', () => {
    expect(() => RuleSetSchema.parse(rulesJson)).not.toThrow()
  })

  it('inventory.json satisfies InventorySchema', () => {
    expect(() => InventorySchema.parse(inventoryJson)).not.toThrow()
  })

  it('entries.json satisfies LexiconSchema', () => {
    expect(() => LexiconSchema.parse(lexiconJson)).not.toThrow()
  })

  it('bugwiki-pairs.json has the shape the corpus loader assumes', () => {
    const corpus = corpusJson as { provenance?: unknown; pairs?: unknown[] }
    expect(corpus.provenance).toBeDefined()
    expect(Array.isArray(corpus.pairs)).toBe(true)
    expect((corpus.pairs ?? []).length).toBeGreaterThan(0)
  })

  it('compact.json has the shape the client loader assumes', () => {
    const compact = compactJson as unknown as {
      version: string
      provenance: Record<string, string>
      locators: string[]
      entries: unknown[]
    }
    expect(compact.version).toMatch(/^\d+\.\d+\.\d+$/)
    expect(compact.provenance.source).toBeTruthy()
    expect(compact.provenance.licence).toBeTruthy()
    expect(compact.locators.length).toBeGreaterThan(0)
    expect(compact.entries.length).toBeGreaterThan(0)

    // Every locator index resolves. An out-of-range index would render an
    // empty provenance locator in the reading tree rather than throwing.
    for (const entry of compact.entries as [string, string, string, string, number][]) {
      expect(compact.locators[entry[4]]).toBeDefined()
    }
  })
})
