import { describe, expect, it } from 'vitest'
import writerFixture from '../fixtures/writer.fixture.json'
import { interpret } from '@/lib/engine/interpret'
import { enumerate, type ReadingTreeNode } from '@/lib/engine/enumerate'
import { lexiconFrom, EMPTY_LEXICON, type Lexicon } from '@/lib/lexicon/loader'
import { AMBIGUITY_CLASSES } from '@/lib/rules/schema'
import { fromCodepoint } from '@/lib/rules/inventory'
import { toClusters } from '@/lib/engine/normalize'

/**
 * Enumeration completeness (invariant 15, PRD §8) — the property that matters
 * most in this repository. For every Latin fixture: transliterate to Lontara,
 * enumerate back, and assert the ORIGINAL appears in the reading set.
 *
 * Never an exact round-trip. Latin → Lontara is lossy by design, so asserting
 * `enumerate(interpret(x)) === x` would be asserting something false. The
 * correct property is set membership.
 */

const LATIN_FORMS = [...new Set(writerFixture.cases.map((c) => c.latin))]

/**
 * A synthetic test lexicon built from the writer fixtures.
 *
 * It is NOT a claim that these strings are Bugis words, and it is not shipped —
 * data/lexicon/entries.json is empty and stays empty until a source is actually
 * extracted (invariant 13). Its provenance field says exactly that, so it cannot
 * be mistaken for lexical data if it is ever copied somewhere else.
 */
function testLexicon(forms: readonly string[]): Lexicon {
  return lexiconFrom({
    version: '0.0.0',
    bands: { unknown: { weight: 1, description: 'synthetic test data' } },
    entries: forms.map((latin, index) => ({
      id: `synthetic-${String(index).padStart(4, '0')}`,
      latin,
      band: 'unknown',
      provenance: {
        source:
          'SYNTHETIC — tests/fixtures/writer.fixture.json. Engine test data only. Not a claim ' +
          'that this form is a Bugis word, and never shipped in data/lexicon/.',
        locator: `case ${index}`,
        licence: 'CC0-1.0',
        retrieved: '2026-07-30',
      },
    })),
  })
}

const LEXICON = testLexicon(LATIN_FORMS)

describe('invariant 15 — enumeration completeness', () => {
  for (const latin of LATIN_FORMS) {
    it(`"${latin}" appears in the reading set for its own Lontara`, () => {
      const written = interpret(latin)
      const result = enumerate(written.output.text, LEXICON)

      // The ORIGINAL form, exactly as invariant 15 states it. Not the
      // normalised one: the lexicon stores the attested spelling and
      // enumeration hands that spelling back, so `goloq` returns as `goloq`
      // and not as `golo'`. Normalisation is input tolerance — it widens what
      // the writer accepts and never rewrites the lexicon.
      expect(result.readings.map((r) => r.latin)).toContain(latin)
    })
  }

  it('never asserts an exact round-trip — several forms share one Lontara string', () => {
    // PRD §2: mata, matta and manta are written identically.
    const target = interpret('mata').output.text
    expect(interpret('matta').output.text).toBe(target)
    expect(interpret('manta').output.text).toBe(target)

    const result = enumerate(target, testLexicon(['mata', 'matta', 'manta']))
    expect(result.readings.map((r) => r.latin).sort()).toEqual(['manta', 'mata', 'matta'])
  })
})

describe('every reading carries the proof that it produces the input', () => {
  it('the writer trace on each reading writes back to the enumerated string', () => {
    const target = interpret('mata').output.text
    const result = enumerate(target, testLexicon(['mata', 'matta', 'manta']))
    expect(result.readings.length).toBe(3)
    for (const reading of result.readings) {
      expect(reading.proof).not.toBeNull()
      expect(reading.proof?.output.text).toBe(target)
    }
  })
})

describe('the reading tree', () => {
  const target = interpret('mata').output.text
  const result = enumerate(target, testLexicon(['mata', 'matta', 'manta']))

  function walk(node: ReadingTreeNode, visit: (n: ReadingTreeNode) => void) {
    visit(node)
    node.children.forEach((c) => walk(c, visit))
  }

  it('branches where the readings diverge and nowhere else', () => {
    const branches: ReadingTreeNode[] = []
    walk(result.tree, (n) => {
      if (n.children.length > 1) branches.push(n)
    })

    // All three readings share `ma`, then diverge into ta / tta / nta.
    expect(branches).toHaveLength(1)
    expect(branches[0]?.latin).toBe('ma')
    expect(branches[0]?.children.map((c) => c.latin)).toEqual(['nta', 'ta', 'tta'])
  })

  it('names an ambiguity class at every branch, and refuses to choose', () => {
    walk(result.tree, (n) => {
      if (n.children.length > 1) {
        expect(n.ambiguities.length).toBeGreaterThan(0)
        for (const a of n.ambiguities) {
          // The reader refuses to choose. That is the product.
          expect(a.chosen).toBeNull()
          expect(a.reason.length).toBeGreaterThan(0)
          expect(AMBIGUITY_CLASSES).toContain(a.class)
          expect(a.candidates.length).toBe(n.children.length)
        }
      } else {
        expect(n.ambiguities).toHaveLength(0)
      }
    })
  })

  it('distinguishes gemination from a plain unwritten final at the same branch', () => {
    const branch = result.tree.children[0]
    expect(branch?.children.find((c) => c.latin === 'tta')?.classes).toEqual(['gemination'])
    expect(branch?.children.find((c) => c.latin === 'nta')?.classes).toEqual(['final'])
    expect(branch?.children.find((c) => c.latin === 'ta')?.classes).toEqual([])

    expect(new Set(branch?.ambiguities.map((a) => a.class))).toEqual(
      new Set(['gemination', 'final']),
    )
  })

  it('every leaf holds a complete reading and every branch holds none', () => {
    walk(result.tree, (n) => {
      if (n.children.length === 0 && n.depth >= 0) {
        expect(n.reading).not.toBeNull()
      } else {
        expect(n.reading).toBeNull()
      }
    })
  })

  it('keeps every span inside the arrays it indexes', () => {
    walk(result.tree, (n) => {
      expect(n.inputSpan.start).toBeGreaterThanOrEqual(0)
      expect(n.inputSpan.end).toBeLessThanOrEqual(result.input.clusters.length)
      expect(n.outputSpan.end).toBeGreaterThanOrEqual(n.outputSpan.start)
    })
  })
})

describe('with an empty lexicon — the state this actually ships in', () => {
  const target = interpret('mata').output.text
  const result = enumerate(target, EMPTY_LEXICON)

  it('offers no attested readings rather than inventing any', () => {
    expect(result.readings).toHaveLength(0)
    expect(result.tree.children).toHaveLength(0)
    expect(result.lexicon.empty).toBe(true)
  })

  it('still states the syllable skeleton, which is what the script does say', () => {
    expect(result.skeleton.latin).toBe('mata')
    expect(result.skeleton.attested).toBe(false)
    expect(result.skeleton.score.total).toBe(0)
  })

  it('declares all four classes undetermined and says what the basis is', () => {
    expect([...result.undetermined].sort()).toEqual([...AMBIGUITY_CLASSES].sort())
    expect(result.basisNote).toMatch(/leksikon/)
  })
})

describe('the skeleton never outranks an attested reading', () => {
  it('scores zero, so it cannot be presented as the answer', () => {
    const result = enumerate(interpret('mata').output.text, testLexicon(['mata']))
    expect(result.skeleton.score.total).toBe(0)
    expect(result.readings[0]?.score.total).toBeGreaterThan(0)
  })
})

describe('the cap is reported, never silently applied (PRD §6.1)', () => {
  it('reports how many readings were dropped', () => {
    const forms = ['mata', 'matta', 'manta']
    const result = enumerate(interpret('mata').output.text, testLexicon(forms), {
      maxReadings: 2,
    })
    expect(result.readings).toHaveLength(2)
    expect(result.cap.applied).toBe(true)
    expect(result.cap.dropped).toBe(1)
  })

  it('does not claim a cap was applied when it was not', () => {
    const result = enumerate(interpret('mata').output.text, testLexicon(['mata']))
    expect(result.cap.applied).toBe(false)
    expect(result.cap.dropped).toBe(0)
  })
})

describe('input the reader cannot account for is reported, not dropped', () => {
  it('says why pallawa is not read back, instead of guessing it is a space', () => {
    const pallawa = fromCodepoint('U+1A1E')
    const text = fromCodepoint('U+1A06') + pallawa + fromCodepoint('U+1A08')
    const result = enumerate(text, EMPTY_LEXICON)

    const unhandled = result.steps.filter((s) => s.type === 'unhandled')
    expect(unhandled).toHaveLength(1)
    expect(unhandled[0]?.type === 'unhandled' && unhandled[0].why).toMatch(/openQuestions\.pallawa/)
    // It is not silently swallowed into the skeleton either.
    expect(result.skeleton.latin).toBe('mata')
  })

  it('reports a vowel sign with no letter to attach to', () => {
    const stranded = fromCodepoint('U+1A17')
    const result = enumerate(stranded, EMPTY_LEXICON)
    const unhandled = result.steps.filter((s) => s.type === 'unhandled')
    expect(unhandled).toHaveLength(1)
    expect(unhandled[0]?.type === 'unhandled' && unhandled[0].why).toMatch(/no consonant letter/)
  })

  it('reports characters outside the Buginese block', () => {
    const result = enumerate('abc', EMPTY_LEXICON)
    expect(result.steps.filter((s) => s.type === 'unhandled')).toHaveLength(3)
    expect(result.skeleton.latin).toBe('')
  })
})

describe('invariant 7 — the reader reads clusters, not code units', () => {
  it('treats a letter with its vowel sign as one unit', () => {
    const text = fromCodepoint('U+1A00') + fromCodepoint('U+1A17')
    expect(toClusters(text)).toHaveLength(1)
    const result = enumerate(text, EMPTY_LEXICON)
    expect(result.units).toHaveLength(1)
    expect(result.skeleton.latin).toBe('ki')
  })

  it('reads a vowel sign that arrives as its own cluster', () => {
    // Constructed so the sign is a separate cluster: two letters, then a sign.
    const text = fromCodepoint('U+1A06') + fromCodepoint('U+1A08') + fromCodepoint('U+1A17')
    const result = enumerate(text, EMPTY_LEXICON)
    expect(result.skeleton.latin).toBe('mati')
  })
})

describe('the result is stamped with the rules and lexicon behind it', () => {
  it('carries rule set version, review status and lexicon size', () => {
    const result = enumerate(interpret('mata').output.text, LEXICON)
    expect(result.ruleSetVersion).toMatch(/^\d+\.\d+\.\d+$/)
    expect(result.reviewStatus).toBe('unreviewed')
    expect(result.lexicon.size).toBe(LATIN_FORMS.length)
  })
})
