import { describe, expect, it } from 'vitest'
import { openQuestionImpact } from '@/lib/analysis/impact'
import { codepointsOf, interpret } from '@/lib/engine/interpret'
import { LEXICON, EMPTY_LEXICON } from '@/lib/lexicon/loader'
import { OPEN_QUESTIONS } from '@/lib/rules/loader'

/**
 * The Ejaan page puts a number beside each open question: "565 of 1,321 forms".
 * A reviewer is meant to decide where to spend twenty minutes on the strength
 * of it, so the number has to mean exactly what it says — these forms, and no
 * others, depend on this answer.
 */
const IMPACT = openQuestionImpact(LEXICON)

describe('every open question is accounted for', () => {
  it('reports one entry per question, in rule-set order', () => {
    expect(IMPACT.map((i) => i.question.id)).toEqual(OPEN_QUESTIONS.map((q) => q.id))
  })

  it('shares one denominator, and it is the distinct normalized form count', () => {
    const forms = new Set(LEXICON.entries.map((e) => interpret(e.latin).input.normalized))
    for (const impact of IMPACT) {
      expect(impact.total).toBe(forms.size)
    }
  })

  it('a sized question carries its basis; an unsized one carries no number', () => {
    for (const impact of IMPACT) {
      if (impact.sized) {
        expect(impact.basis, `${impact.question.id} is sized but states no basis`).toBeTruthy()
      } else {
        expect(impact.affected).toBe(0)
        expect(impact.samples).toEqual([])
        expect(impact.basis).toBeNull()
      }
    }
  })

  it('never claims more affected forms than there are forms', () => {
    for (const impact of IMPACT) {
      expect(impact.affected).toBeGreaterThanOrEqual(0)
      expect(impact.affected).toBeLessThanOrEqual(impact.total)
    }
  })
})

describe('the samples are really affected forms', () => {
  it('shows at most eight, and never more than it counted', () => {
    for (const impact of IMPACT) {
      expect(impact.samples.length).toBeLessThanOrEqual(8)
      expect(impact.samples.length).toBeLessThanOrEqual(impact.affected)
    }
  })

  it('every sample satisfies its own question’s selector', () => {
    for (const impact of IMPACT) {
      const affects = impact.question.affects
      if (!affects) continue

      for (const sample of impact.samples) {
        const trace = interpret(sample)

        switch (affects.kind) {
          case 'outputCodepoint': {
            const produced = codepointsOf(trace.output.text)
            expect(
              affects.codepoints.some((cp) => produced.includes(cp)),
              `${impact.question.id}: ${sample} is listed but writes none of ${affects.codepoints.join(', ')}`,
            ).toBe(true)
            break
          }
          case 'ambiguityClass': {
            expect(
              trace.ambiguities.some((a) => a.class === affects.ambiguityClass),
              `${impact.question.id}: ${sample} is listed but loses no ${affects.ambiguityClass}`,
            ).toBe(true)
            break
          }
          case 'latinContains': {
            // Matched against the lexicon's own spellings, so the sample's
            // normalized form need not contain the substring itself — some
            // spelling behind it must.
            const spellings = LEXICON.entries
              .filter((e) => interpret(e.latin).input.normalized === sample)
              .map((e) => e.latin)
            expect(
              affects.substrings.some((s) => spellings.some((sp) => sp.includes(s))),
              `${impact.question.id}: ${sample} is listed but no spelling of it contains ${affects.substrings.join(', ')}`,
            ).toBe(true)
            break
          }
        }
      }
    }
  })

  it('lists samples alphabetically, so the page does not reshuffle between builds', () => {
    for (const impact of IMPACT) {
      const sorted = [...impact.samples].sort((a, b) => a.localeCompare(b))
      expect(impact.samples).toEqual(sorted)
    }
  })
})

describe('the counts are reproducible from the shipped engine alone', () => {
  /**
   * Recomputed here the long way — one independent pass per question — so the
   * single-pass implementation cannot quietly disagree with the definition it
   * claims to implement.
   */
  it('agrees with a naive per-question recount', () => {
    const forms = new Map<string, string[]>()
    for (const entry of LEXICON.entries) {
      const normalized = interpret(entry.latin).input.normalized
      forms.set(normalized, [...(forms.get(normalized) ?? []), entry.latin])
    }

    for (const impact of IMPACT) {
      const affects = impact.question.affects
      if (!affects) continue

      let expected = 0
      for (const [normalized, spellings] of forms) {
        const trace = interpret(normalized)
        const hit =
          affects.kind === 'outputCodepoint'
            ? affects.codepoints.some((cp) => codepointsOf(trace.output.text).includes(cp))
            : affects.kind === 'ambiguityClass'
              ? trace.ambiguities.some((a) => a.class === affects.ambiguityClass)
              : affects.substrings.some((s) => spellings.some((sp) => sp.includes(s)))
        if (hit) expected += 1
      }

      expect(impact.affected, `${impact.question.id}`).toBe(expected)
    }
  })

  it('reports zero rather than guessing when the lexicon cannot size a question', () => {
    /*
     * `openQuestions.pallawa` asks about punctuation, and the lexicon holds
     * single words. Zero is the honest answer and it is a finding — the
     * question cannot be sized until the repository holds running text. It
     * must not be confused with "nothing depends on this".
     */
    const pallawa = IMPACT.find((i) => i.question.id === 'openQuestions.pallawa')
    expect(pallawa?.sized).toBe(true)
    expect(pallawa?.affected).toBe(0)
    expect(pallawa?.basis).toBeTruthy()
  })

  it('sizes everything at zero against an empty lexicon without throwing', () => {
    for (const impact of openQuestionImpact(EMPTY_LEXICON)) {
      expect(impact.affected).toBe(0)
      expect(impact.total).toBe(0)
      expect(impact.samples).toEqual([])
    }
  })
})
