import { describe, expect, it } from 'vitest'
import fixture from './fixtures/writer.fixture.json'
import { interpret, codepointsOf } from '@/lib/engine/interpret'
import { normalize, toClusters } from '@/lib/engine/normalize'
import { segmentLatin } from '@/lib/engine/segment'
import { fromCodepoint } from '@/lib/rules/inventory'
import { lossSteps, outputClustersFor, sliceSpan } from '@/lib/engine/trace'
import { bandOf } from '@/lib/engine/band'
import { AMBIGUITY_CLASSES } from '@/lib/rules/schema'
import { RULES } from '@/lib/rules/loader'

const CASES = fixture.cases

describe('interpret — Latin → Lontara', () => {
  for (const c of CASES) {
    it(`${c.id}: ${c.latin}`, () => {
      const trace = interpret(c.latin)
      expect(codepointsOf(trace.output.text)).toEqual(c.lontara)
      expect(trace.output.text).toBe(c.lontara.map(fromCodepoint).join(''))
    })
  }
})

describe('every lossy class is declared at the span where it happens', () => {
  for (const c of CASES) {
    it(`${c.id}: declares ${c.expectLoss.length ? c.expectLoss.join(' + ') : 'no loss'}`, () => {
      const trace = interpret(c.latin)
      const classes = trace.ambiguities.map((a) => a.class)
      expect([...classes].sort()).toEqual([...c.expectLoss].sort())

      // A loss step for every ambiguity, and vice versa.
      expect(lossSteps(trace.steps).map((s) => s.ambiguityClass).sort()).toEqual(
        [...c.expectLoss].sort(),
      )

      for (const a of trace.ambiguities) {
        // Invariant 3: a `chosen` without a `reason` is a bug.
        expect(a.reason.length).toBeGreaterThan(0)
        expect(a.ruleId.length).toBeGreaterThan(0)
        expect(RULES.some((r) => r.id === a.ruleId)).toBe(true)
        expect(a.candidates.length).toBeGreaterThan(1)

        // The loss is marked where it happens: the input span must be non-empty
        // and point at real input, and the output span must be empty because
        // nothing was written there.
        expect(a.spans.input.end).toBeGreaterThan(a.spans.input.start)
        expect(sliceSpan(trace.input.clusters, a.spans.input).length).toBeGreaterThan(0)
        expect(a.spans.output.end).toBe(a.spans.output.start)
      }
    })
  }
})

describe('invariant 6 — every step has input and output spans', () => {
  for (const c of CASES) {
    it(c.id, () => {
      const trace = interpret(c.latin)
      expect(trace.steps.length).toBeGreaterThan(0)
      for (const s of trace.steps) {
        expect(s.inputSpan.start).toBeGreaterThanOrEqual(0)
        expect(s.inputSpan.end).toBeGreaterThanOrEqual(s.inputSpan.start)
        expect(s.inputSpan.end).toBeLessThanOrEqual(trace.input.clusters.length)

        // Both coordinate spaces must be in bounds for the array the step says
        // it indexes. Normalisation runs before any aksara exists, so a
        // normalize step's output span is in normalised-input space.
        const clusters = outputClustersFor(trace, s)
        expect(s.outputSpan.start).toBeGreaterThanOrEqual(0)
        expect(s.outputSpan.end).toBeGreaterThanOrEqual(s.outputSpan.start)
        expect(s.outputSpan.end).toBeLessThanOrEqual(clusters.length)
        expect(s.outputSpanIn).toBe(s.type === 'normalize' ? 'normalized-input' : 'output')
      }
    })
  }
})

describe('invariant 3 — the ambiguity class set is closed', () => {
  it('no trace emits a class outside the four', () => {
    for (const c of CASES) {
      for (const a of interpret(c.latin).ambiguities) {
        expect(AMBIGUITY_CLASSES).toContain(a.class)
      }
    }
  })
})

describe('the trace is stamped with the rule set behind it', () => {
  it('carries version and review status, so it cannot read as more authoritative than its rules', () => {
    const trace = interpret('mata')
    expect(trace.ruleSetVersion).toMatch(/^\d+\.\d+\.\d+$/)
    expect(trace.reviewStatus).toBe('unreviewed')
  })
})

describe('invariant 7 — no code-unit indexing', () => {
  it('segments by grapheme cluster, so a combining sequence is one unit', () => {
    // KA + VOWEL SIGN I is two code points but one grapheme cluster.
    const text = fromCodepoint('U+1A00') + fromCodepoint('U+1A17')
    expect(text.length).toBe(2)
    expect(toClusters(text)).toEqual([text])
  })

  it('handles input outside the BMP without splitting a surrogate pair', () => {
    // An emoji is not Bugis; it must come back as unhandled, whole.
    const trace = interpret('ka😀')
    const unhandled = trace.steps.filter((s) => s.type === 'unhandled')
    expect(unhandled).toHaveLength(1)
    expect(unhandled[0]?.type === 'unhandled' && unhandled[0].text).toBe('😀')
  })
})

describe('normalize', () => {
  it('applies NFC before anything else looks at the text', () => {
    // A decomposed é must not survive as two clusters into segmentation.
    const decomposed = 'é'
    const result = normalize(decomposed, 'latin-to-lontara')
    expect(result.text).toBe(decomposed.normalize('NFC'))
  })

  it('leaves Lontara input alone apart from NFC — the latin.* rules do not apply to aksara', () => {
    const aksara = fromCodepoint('U+1A00') + fromCodepoint('U+1A17')
    const result = normalize(aksara, 'lontara-to-latin')
    expect(result.text).toBe(aksara)
    expect(result.steps).toHaveLength(0)
  })

  it('records a normalize step naming the rule that fired', () => {
    const trace = interpret('MATA')
    const steps = trace.steps.filter((s) => s.type === 'normalize')
    expect(steps.length).toBe(4)
    expect(steps.every((s) => s.ruleId === 'latin.case.fold')).toBe(true)
  })
})

describe('segmentLatin — maximal onset', () => {
  const kinds = (latin: string) =>
    segmentLatin(toClusters(latin)).units.map((u) =>
      u.kind === 'syllable' ? `${u.onset}|${u.vowel}` : u.kind === 'final' ? `final:${u.consonant}` : u.kind,
    )

  it('takes the longest onset that is followed by a vowel', () => {
    expect(kinds('mangka')).toEqual(['m|a', 'ngk|a'])
    expect(kinds('manga')).toEqual(['m|a', 'ng|a'])
    expect(kinds('manyca')).toEqual(['m|a', 'nyc|a'])
    expect(kinds('manya')).toEqual(['m|a', 'ny|a'])
  })

  it('leaves a consonant that cannot begin a unit as syllable-final', () => {
    expect(kinds('matta')).toEqual(['m|a', 'final:t', 't|a'])
    expect(kinds('manta')).toEqual(['m|a', 'final:n', 't|a'])
    expect(kinds('mang')).toEqual(['m|a', 'final:ng'])
  })

  it('carries a bare vowel on U+1A15 with an empty onset', () => {
    expect(kinds('ana')).toEqual(['|a', 'n|a'])
  })

  it('treats `é` as its own vowel, not as a stray character', () => {
    // Before rules v0.2.0, `é` was not in the vowel set, so `sapéda` parsed as
    // sa + final p + unhandled é + da and lost the whole `pé` syllable. The
    // attested pair Sapéda → ᨔᨄᨙᨉ is what caught it.
    expect(kinds('sapéda')).toEqual(['s|a', 'p|é', 'd|a'])
    expect(kinds('kae')).toEqual(['k|a', '|e'])
  })
})

describe('classification of a dropped final', () => {
  it('calls an identical following onset gemination, not a bare final', () => {
    const trace = interpret('matta')
    expect(trace.ambiguities.map((a) => a.class)).toEqual(['gemination'])
    expect(trace.ambiguities[0]?.candidates).toEqual(['t', 'tt'])
    expect(trace.ambiguities[0]?.ruleId).toBe('lontara.gemination.collapse')
  })

  it('fires prenasal only where the inventory evidences the pattern', () => {
    // The whole point is that the class comes out of inventory data and not out
    // of an asserted phonological set. The nasals are the first components of
    // the four written prenasal letters — ng, m, n, ny — and the second
    // components are k, p, r, c.
    //
    // n + k: `n` is a nasal component and `k` is a second component, so the
    // pattern is evidenced by the inventory and the class is prenasal.
    expect(interpret('manka').ambiguities.map((a) => a.class)).toEqual(['prenasal'])
    // n + t: `t` is not a second component of any prenasal letter, so this
    // stays a plain unwritten final — narrower than PRD §2's prose, which is
    // openQuestions.prenasal-coverage.
    expect(interpret('manta').ambiguities.map((a) => a.class)).toEqual(['final'])
    // ng + g: `g` is not a second component either.
    expect(interpret('mangga').ambiguities.map((a) => a.class)).toEqual(['final'])
  })

  it('writes the four covered clusters with their own letter and loses nothing', () => {
    for (const latin of ['mampa', 'mangka', 'manra', 'manyca']) {
      expect(interpret(latin).ambiguities).toHaveLength(0)
    }
  })
})

describe('codepoint view (PRD §6.8)', () => {
  it('is derivable from any output, because rendering will fail somewhere', () => {
    expect(codepointsOf(interpret('mata').output.text)).toEqual(['U+1A06', 'U+1A08'])
  })
})

/*
 * The band and the rule trace are two views of one structure, and the writer
 * links them: pointing at a step highlights the aksara that step produced.
 * That link is only sound if an output-space span actually addresses band
 * columns — which is a different claim from "the span is in bounds", already
 * asserted above. A span that resolved to no column would light up nothing
 * and read as "this rule did nothing", silently.
 */
describe('span linking — every output-space step addresses band columns', () => {
  for (const c of CASES) {
    it(`${c.id}: ${c.latin}`, () => {
      const trace = interpret(c.latin)
      const band = bandOf(trace)
      const indices = new Set(band.columns.map((col) => col.index))

      for (const step of trace.steps) {
        if (step.outputSpanIn !== 'output') continue

        const { start, end } = step.outputSpan
        // A loss produces nothing, so its span is empty and means "here", not
        // "nowhere" — it must still land on a column, the one it hangs under.
        const covered =
          end > start
            ? band.columns.filter((col) => col.index >= start && col.index < end)
            : band.columns.filter((col) => col.index === start)

        expect(
          covered.length,
          `${step.ruleId} (${step.type}) spans [${start},${end}) but covers no band column; columns are [${[...indices].join(', ')}]`,
        ).toBeGreaterThan(0)
      }
    })
  }
})
