import { describe, expect, it } from 'vitest'
import corpus from '@/data/corpus/bugwiki-pairs.json'
import { interpret } from '@/lib/engine/interpret'
import { toCodepoint } from '@/lib/rules/inventory'
import { ATTESTED_FORMS, attestedSample } from '@/lib/corpus/loader'

/**
 * Conformance against attested Lontara↔Latin pairs from Bugis Wikipedia.
 *
 * These pairs are NOT reviewer-approved fixtures and do not have that authority
 * — `tests/reviewed/` is where a reviewer's sign-off lives, and it is still
 * empty. Wikipedia is community practice, and some of these pairs are plainly
 * wrong.
 *
 * What this test does is stop the agreement rate from regressing silently. A
 * rule change that improves one thing and breaks eight attested words is a
 * finding, and it should show up here rather than in a reader's hands.
 */

const PAIRS = corpus.pairs

/**
 * Pairs where the corpus contradicts itself or the article is plainly in error.
 * Each is named individually and explained. This list is allowed to exist; it is
 * NOT allowed to grow silently, which is what the count assertion below is for.
 */
const KNOWN_CORPUS_ERRORS: Record<string, string> = {
  Désa:
    'The article is titled ᨀᨇᨚ (Kampo) and the two template arguments do not describe the same ' +
    'word — the Lontara says Kampo, the Latin says Désa (an Indonesian word).',
  Italiya:
    'The two sides disagree with each other: the Lontara ends in U+1A15 LETTER A, the Latin ends ' +
    'in `ya`. One of the two was typed wrong.',
  Selleng:
    'The Lontara carries a leading U+1A15 LETTER A with no vowel for it to carry, which no rule ' +
    'accounts for and which the Latin does not have.',
  'Wedang ronde':
    'Writes plain `e` with U+1A19 rather than U+1A1B, against ~30 other pairs. It is an ' +
    'Indonesian/Javanese loan phrase rather than a Bugis word, which is the likeliest reason.',
  Watangpola:
    'Writes `ngp` with U+1A07 MPA. Genuine evidence about prenasal coverage rather than an ' +
    'error — recorded in openQuestions.prenasal-coverage and deliberately not acted on.',
  Perancisiq:
    'Writes `nc` with U+1A0F NYCA, the same pattern as Watangpola. Also evidence rather than an ' +
    'error, and also not acted on.',
}

describe('the corpus fixture is intact', () => {
  it('carries provenance good enough to check the claim later', () => {
    expect(corpus.provenance.dumpDate).toMatch(/^\d{8}$/)
    expect(corpus.provenance.dumpSha256).toMatch(/^[0-9a-f]{64}$/)
    expect(corpus.provenance.licence).toBe('CC BY-SA 4.0')
    expect(corpus.provenance.dumpUrl).toContain(corpus.provenance.dumpDate)
    // Never `latest` — a citation pointing at a moving target is not a citation.
    expect(corpus.provenance.dumpUrl).not.toContain('latest')
  })

  it('has pairs, all of them pure aksara on the Lontara side', () => {
    expect(PAIRS.length).toBeGreaterThan(80)
    for (const pair of PAIRS) {
      expect(pair.lontara).toMatch(/^[ᨀ-᨟]+$/)
      expect(pair.latin.length).toBeGreaterThan(0)
      expect(pair.articles.length).toBeGreaterThan(0)
    }
  })
})

describe('the rule set agrees with attested practice', () => {
  const disagreeing = PAIRS.filter((p) => interpret(p.latin).output.text !== p.lontara)

  it('agrees with at least 90% of pairs', () => {
    const rate = (PAIRS.length - disagreeing.length) / PAIRS.length
    expect(rate).toBeGreaterThanOrEqual(0.9)
  })

  it('disagrees only where a reason is recorded', () => {
    const unexplained = disagreeing
      .map((p) => p.latin)
      .filter((latin) => !(latin in KNOWN_CORPUS_ERRORS))
    expect(
      unexplained,
      `these attested pairs disagree with the rule set and nothing explains why:\n` +
        unexplained
          .map((latin) => {
            const pair = PAIRS.find((p) => p.latin === latin)
            const produced = interpret(latin).output.text
            return (
              `  ${latin}\n` +
              `    attested  ${pair?.lontara}  ${Array.from(pair?.lontara ?? '', toCodepoint).join(' ')}\n` +
              `    produced  ${produced}  ${Array.from(produced, toCodepoint).join(' ')}`
            )
          })
          .join('\n'),
    ).toEqual([])
  })

  it('does not carry stale entries in the known-errors list', () => {
    // If a rule change makes one of these agree, the explanation is obsolete and
    // should be deleted rather than left to rot.
    for (const latin of Object.keys(KNOWN_CORPUS_ERRORS)) {
      const pair = PAIRS.find((p) => p.latin === latin)
      if (!pair) continue
      expect(
        interpret(pair.latin).output.text,
        `${latin} now agrees with the rule set — remove it from KNOWN_CORPUS_ERRORS`,
      ).not.toBe(pair.lontara)
    }
  })
})

describe('specific attested pairs, as regression cases', () => {
  const check = (latin: string) => {
    const pair = PAIRS.find((p) => p.latin === latin)
    expect(pair, `${latin} is no longer in the corpus fixture`).toBeDefined()
    return { produced: interpret(latin).output.text, attested: pair?.lontara }
  }

  it('Sapéda — `é` is a vowel, and a whole syllable is not dropped', () => {
    const { produced, attested } = check('Sapéda')
    expect(produced).toBe(attested)
  })

  it('Lébarepuluq — both e-signs in one word, plus a final q', () => {
    const { produced, attested } = check('Lébarepuluq')
    expect(produced).toBe(attested)
  })

  it('Komputeréq — prenasal mp written, both e-signs, final q', () => {
    const { produced, attested } = check('Komputeréq')
    expect(produced).toBe(attested)
  })

  it('Watangpola — the nasal is dropped and the loss is declared, not silently ignored', () => {
    // This one intentionally disagrees with the corpus: it attests `ngp` written
    // with U+1A07 MPA, and the rule set drops the nasal instead. What must not
    // happen is silence about it.
    //
    // The class is `prenasal`, not `final`: `ng` is a nasal component and `p` a
    // second component of the inventory's prenasal letters, so the derived sets
    // do recognise the pattern — they just do not license writing it. That is a
    // more informative label than `final` and it points at the open question.
    const trace = interpret('Watangpola')
    expect(trace.ambiguities.map((a) => a.class)).toEqual(['prenasal'])
    expect(trace.ambiguities[0]?.ruleId).toBe('lontara.prenasal.drop')
    expect(trace.ambiguities[0]?.reason.length).toBeGreaterThan(0)
  })
})

/*
 * The reader shows a sample of these pairs. Taking the top N by occurrence
 * would show twelve successes and no failures, because the rule set happens to
 * handle every one of the commonest forms — a true list making a false
 * impression about the tool.
 *
 * So the sample leads with every disagreeing pair. This asserts it stays that
 * way: a future rule change that introduces a new disagreement must not
 * quietly push it out of view.
 */
describe('the shown sample does not hide the failures', () => {
  const SHOWN = 12

  it('includes every pair the rule set disagrees with', () => {
    const sample = attestedSample(SHOWN)
    const missing = ATTESTED_FORMS.filter(
      (form) => !form.agrees && !sample.some((s) => s.lontara === form.lontara && s.latin === form.latin),
    )
    expect(
      missing.map((f) => f.latin),
      'these attested pairs disagree with the rule set but are not shown to the reader',
    ).toEqual([])
  })

  it('leaves room for agreeing pairs too, so it is a sample and not a defect list', () => {
    const sample = attestedSample(SHOWN)
    expect(sample.length).toBe(SHOWN)
    expect(sample.some((f) => f.agrees)).toBe(true)
  })

  it('is deterministic — same build, same list', () => {
    expect(attestedSample(SHOWN)).toEqual(attestedSample(SHOWN))
  })
})
