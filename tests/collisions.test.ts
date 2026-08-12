import { describe, expect, it } from 'vitest'
import { collisionReport } from '@/lib/analysis/collisions'
import { interpret } from '@/lib/engine/interpret'
import { LEXICON, lexiconFrom, EMPTY_LEXICON } from '@/lib/lexicon/loader'

/**
 * The collision index renders one claim: these forms are written the same way.
 * If that is not true of every member of every set, the page is lying in the
 * most damaging way available to this project — confidently, with a number.
 * So it is asserted here rather than trusted.
 */
const REPORT = collisionReport(LEXICON)

describe('every set really is a collision', () => {
  it('every member writes to its own set’s string', () => {
    for (const set of REPORT.sets) {
      for (const member of set.members) {
        expect(
          interpret(member.latin).output.text,
          `${member.latin} is listed under ${set.lontara} but does not write to it`,
        ).toBe(set.lontara)
      }
    }
  })

  it('a set has two or more distinct forms', () => {
    for (const set of REPORT.sets) {
      expect(set.members.length).toBeGreaterThan(1)
      expect(new Set(set.members.map((m) => m.latin)).size).toBe(set.members.length)
    }
  })

  it('no form appears in two sets', () => {
    const seen = new Set<string>()
    for (const set of REPORT.sets) {
      for (const member of set.members) {
        expect(seen.has(member.latin), `${member.latin} is in two sets`).toBe(false)
        seen.add(member.latin)
      }
    }
  })

  it('every spelling listed under a form really normalizes to it', () => {
    for (const set of REPORT.sets) {
      for (const member of set.members) {
        for (const spelling of member.spellings) {
          expect(interpret(spelling).input.normalized).toBe(member.latin)
        }
      }
    }
  })
})

describe('the totals are internally consistent', () => {
  it('forms plus merged spellings account for every entry', () => {
    expect(REPORT.forms + REPORT.mergedSpellings).toBe(REPORT.entries)
    expect(REPORT.entries).toBe(LEXICON.entries.length)
  })

  it('formsInCollision is the sum of the set sizes', () => {
    expect(REPORT.formsInCollision).toBe(
      REPORT.sets.reduce((n, s) => n + s.members.length, 0),
    )
  })

  it('largest is the biggest set, and sets are ordered largest first', () => {
    const sizes = REPORT.sets.map((s) => s.members.length)
    expect(REPORT.largest).toBe(Math.max(...sizes))
    expect([...sizes].sort((a, b) => b - a)).toEqual(sizes)
  })

  it('distinct strings plus unwritable forms account for every form', () => {
    // Every writable form lands in exactly one string bucket, so the number of
    // buckets can never exceed the number of writable forms.
    const writable = REPORT.forms - REPORT.unwritable.length
    expect(REPORT.strings).toBeLessThanOrEqual(writable)
    // And collapsing is exactly the difference between the two.
    expect(REPORT.formsInCollision - REPORT.sets.length).toBe(writable - REPORT.strings)
  })

  it('stamps the versions it was computed from', () => {
    expect(REPORT.lexiconVersion).toBe(LEXICON.version)
    expect(REPORT.ruleSetVersion).toMatch(/^\d+\.\d+\.\d+$/)
  })
})

describe('the classes attributed to a set are the ones its members lose', () => {
  it('a set’s classes are exactly the union of its members’ classes', () => {
    for (const set of REPORT.sets) {
      const union = new Set(set.members.flatMap((m) => m.classes))
      expect(new Set(set.classes)).toEqual(union)
    }
  })

  it('every class count is the number of sets listing it', () => {
    for (const [cls, count] of Object.entries(REPORT.setsByClass)) {
      expect(REPORT.sets.filter((s) => s.classes.includes(cls as never)).length).toBe(count)
    }
  })
})

describe('the degenerate cases behave', () => {
  it('an empty lexicon collides with nothing and says so', () => {
    const report = collisionReport(EMPTY_LEXICON)
    expect(report.entries).toBe(0)
    expect(report.sets).toEqual([])
    expect(report.largest).toBe(0)
    expect(report.formsInCollision).toBe(0)
  })

  it('PRD §2’s own illustration collides, given a lexicon holding it', () => {
    /*
     * mata / matta / manta is the illustration the whole project is built on
     * and none of the three is in the shipped lexicon. Asserted against a
     * fixture lexicon so that the mechanism is proven on the canonical case
     * rather than only on whatever Wikipedia happened to contain.
     */
    const fixture = lexiconFrom({
      version: '0.0.0',
      bands: { unknown: { weight: 1, description: 'fixture' } },
      entries: ['mata', 'matta', 'manta'].map((latin) => ({
        id: `fixture-${latin}`,
        latin,
        band: 'unknown',
        attestation: 'corpus',
        provenance: {
          source: 'PRD §2',
          locator: 'the worked illustration',
          licence: 'n/a',
          retrieved: '2026-01-01',
        },
      })),
    })

    const report = collisionReport(fixture)
    expect(report.sets).toHaveLength(1)
    expect(report.sets[0]?.members.map((m) => m.latin)).toEqual(['manta', 'mata', 'matta'])
    expect(report.sets[0]?.codepoints).toEqual(['U+1A06', 'U+1A08'])
    expect(report.sets[0]?.classes).toEqual(['final', 'gemination'])
  })

  it('spelling variants merge instead of colliding with themselves', () => {
    const fixture = lexiconFrom({
      version: '0.0.0',
      bands: { unknown: { weight: 1, description: 'fixture' } },
      entries: ["aba'", 'abaq'].map((latin, i) => ({
        id: `fixture-${i}`,
        latin,
        band: 'unknown',
        attestation: 'corpus',
        provenance: {
          source: 'lexicon',
          locator: 'both spellings occur',
          licence: 'n/a',
          retrieved: '2026-01-01',
        },
      })),
    })

    const report = collisionReport(fixture)
    expect(report.entries).toBe(2)
    expect(report.forms).toBe(1)
    expect(report.mergedSpellings).toBe(1)
    // One word spelled two ways is not a collision.
    expect(report.sets).toEqual([])
  })
})
