import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compact, serialise } from '../scripts/lexicon-compact'
import { CLIENT_LEXICON } from '@/lib/lexicon/client'
import { LEXICON } from '@/lib/lexicon/shipped'

/**
 * `data/lexicon/compact.json` is derived, committed, and shipped to the
 * browser. A derived artifact nobody re-derives is a stale artifact, and a
 * stale one here would mean the reader answering from a lexicon the repository
 * no longer holds — while `entries.json`, the file a reviewer audits, said
 * something else.
 *
 * So it is not trusted. It is regenerated from source and compared.
 */
const SOURCE = JSON.parse(readFileSync(join(process.cwd(), 'data/lexicon/entries.json'), 'utf8'))
const COMMITTED = readFileSync(join(process.cwd(), 'data/lexicon/compact.json'), 'utf8')

describe('the compact lexicon is in sync with its source', () => {
  it('is byte-identical to a fresh regeneration', () => {
    expect(
      serialise(compact(SOURCE)),
      'compact.json is stale — run `pnpm lexicon:compact`',
    ).toBe(COMMITTED)
  })
})

describe('the browser gets the same lexicon the auditable file describes', () => {
  it('holds every entry', () => {
    expect(CLIENT_LEXICON.entries.length).toBe(LEXICON.entries.length)
    expect(CLIENT_LEXICON.version).toBe(LEXICON.version)
    expect(CLIENT_LEXICON.isEmpty).toBe(LEXICON.isEmpty)
  })

  it('reproduces every field the engine and the UI read, entry for entry', () => {
    const byId = new Map(LEXICON.entries.map((e) => [e.id, e]))

    for (const entry of CLIENT_LEXICON.entries) {
      const source = byId.get(entry.id)
      expect(source, `${entry.id} is not in entries.json`).toBeDefined()

      expect(entry.latin).toBe(source!.latin)
      expect(entry.band).toBe(source!.band)
      expect(entry.attestation).toBe(source!.attestation)

      // The three the reading tree renders (ReadingTree.tsx:131-137).
      expect(entry.provenance.source).toBe(source!.provenance.source)
      expect(entry.provenance.locator).toBe(source!.provenance.locator)
      expect(entry.provenance.licence).toBe(source!.provenance.licence)
      expect(entry.provenance.retrieved).toBe(source!.provenance.retrieved)
    }
  })

  it('weighs bands identically', () => {
    for (const band of ['core', 'common', 'uncommon', 'rare', 'unknown'] as const) {
      expect(CLIENT_LEXICON.bandWeight(band)).toBe(LEXICON.bandWeight(band))
    }
  })

  it('is materially smaller than the file it is derived from', () => {
    const source = readFileSync(join(process.cwd(), 'data/lexicon/entries.json'), 'utf8')
    // Not a vanity check: if a future change to the format loses this, the
    // reason the file exists at all has gone with it.
    expect(COMMITTED.length).toBeLessThan(source.length / 2)
  })
})

describe('the compact format refuses to silently misrepresent the lexicon', () => {
  it('throws rather than hoisting a provenance field that is not constant', () => {
    const mixed = JSON.parse(JSON.stringify(SOURCE))
    mixed.entries[5].provenance.source = 'A different dictionary'

    expect(() => compact(mixed)).toThrow(/differs from the rest/)
  })
})
