import { describe, expect, it } from 'vitest'
import { collisionReport } from '@/lib/analysis/collisions'
import { interpret } from '@/lib/engine/interpret'
import { LEXICON } from '@/lib/lexicon/shipped'
import { lexiconFrom, EMPTY_LEXICON } from '@/lib/lexicon/loader'
import { returnTrip } from '@/lib/analysis/returnTrip'

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

/**
 * The return trip on the writer (components/writer/ReturnTrip.tsx) makes one
 * claim: "these other forms are written the same way". It reaches them by
 * enumerating its own output over the lexicon and dropping its own form.
 *
 * Asserted here against the real engine rather than by rendering the component,
 * because the claim is a property of the engine and not of the markup: whatever
 * the panel lists must be exactly the rest of that form's collision set.
 */
describe('the writer’s return trip lists the rest of the collision set', () => {
  /*
   * Every set, one member each. A full `returnTrip` is a full enumeration over
   * the lexicon — ~1,300 `interpret` calls, ~29 ms — so checking all 268
   * members put 15 seconds into a suite that otherwise runs in two. One member
   * per set still exercises all 115 sets, and the members of a set are
   * symmetric by construction: they were grouped by producing the same string.
   */
  it('agrees with the collision report on every set, and never lists the writer’s own form', () => {
    for (const set of REPORT.sets) {
      const member = set.members[0]!
      const { rivals } = returnTrip(set.lontara, LEXICON, member.latin)

      const expected = set.members
        .map((m) => m.latin)
        .filter((latin) => latin !== member.latin)
        .sort((a, b) => a.localeCompare(b))

      expect(rivals, `return trip for ${member.latin}`).toEqual(expected)
      expect(rivals).not.toContain(member.latin)
    }
  })

  it('collapses spelling variants instead of counting them twice', () => {
    /*
     * `aba'` and `abaq` are one word under latin.glottal.q. The engine keys
     * readings on the raw spelling and so offers both; the panel must not
     * report two rival forms where the script leaves one. This is the
     * workaround described in lib/analysis/returnTrip.ts — when the engine
     * question is settled, this test says what the panel has to keep doing.
     */
    const lontara = interpret("aba'").output.text
    const { rivals } = returnTrip(lontara, LEXICON, 'aba')
    expect(rivals).toContain("aba'")
    expect(rivals).not.toContain('abaq')
    expect(new Set(rivals).size).toBe(rivals.length)
  })

  it('lists nothing for a form that collides with nothing', () => {
    const colliding = new Set(REPORT.sets.flatMap((s) => s.members.map((m) => m.latin)))
    const alone = LEXICON.entries.find((e) => !colliding.has(interpret(e.latin).input.normalized))
    expect(alone, 'the lexicon should hold at least one form that collides with nothing').toBeDefined()

    const normalized = interpret(alone!.latin).input.normalized
    const lontara = interpret(normalized).output.text
    expect(returnTrip(lontara, LEXICON, normalized).rivals).toEqual([])
  })

  it('says nothing at all for empty input', () => {
    expect(returnTrip('', LEXICON, '')).toEqual({ rivals: [], capApplied: false, maxDepth: 0 })
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
