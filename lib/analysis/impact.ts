import { codepointsOf, interpret } from '@/lib/engine/interpret'
import type { Lexicon } from '@/lib/lexicon/types'
import { OPEN_QUESTIONS } from '@/lib/rules/loader'
import type { Affects, OpenQuestion } from '@/lib/rules/schema'

/**
 * How much each unanswered question actually decides.
 *
 * The Ejaan page has always listed the open questions, which says *that*
 * something is unknown and never what turns on it. So the cost of not knowing
 * is invisible, and "please review our orthography" stays an unbounded request
 * that a reviewer with twenty minutes quite reasonably defers. This turns each
 * question into a bounded one: here are the N forms your answer decides, and
 * here are some of them.
 *
 * # What this is not
 *
 * It is not a counterfactual. It does not claim to know what the output would
 * become under the other answer — that would need the engine parameterised by
 * rule set, and for `openQuestions.prenasal-coverage` it would need a
 * prenasal-generalisation rule this repository has deliberately refused to
 * write on two attested pairs. Sizing needs neither and claims only what it can
 * compute from the shipped engine: which forms depend on the answer.
 *
 * Every selector is declared in `data/rules/rules.json` with a `basis` saying
 * why it is the right set, and `pnpm rules:validate` checks that it points at
 * codepoints and classes that exist. No selector is written here — this file is
 * the interpreter, exactly as the engine is for rules (invariant 1).
 *
 * Pure. Takes the lexicon as an argument, and runs one `interpret` per entry
 * for all questions at once rather than one pass per question.
 *
 * NOTE: build-time use by a server component. Do not import into a client
 * component; it walks the whole lexicon.
 */

export type QuestionImpact = {
  readonly question: OpenQuestion
  /** False when the question carries no selector — said plainly, never as 0. */
  readonly sized: boolean
  /** Distinct normalized forms whose output depends on the answer. */
  readonly affected: number
  /** Forms considered, so `affected` has a denominator on screen. */
  readonly total: number
  /** A few of them, alphabetical. Forms only — never a meaning (invariant 16). */
  readonly samples: readonly string[]
  readonly basis: string | null
}

const SAMPLE_LIMIT = 8

/** Does this form depend on the answer to a question carrying this selector? */
function matches(
  affects: Affects,
  form: { latin: string; spellings: readonly string[]; outputCodepoints: readonly string[]; classes: ReadonlySet<string> },
): boolean {
  switch (affects.kind) {
    case 'outputCodepoint':
      return affects.codepoints.some((cp) => form.outputCodepoints.includes(cp))
    case 'ambiguityClass':
      return form.classes.has(affects.ambiguityClass)
    case 'latinContains':
      // Against the lexicon's own spellings, not the normalized form: the
      // question is about a letter someone actually wrote, and normalization
      // is what would have erased it.
      return affects.substrings.some((s) => form.spellings.some((sp) => sp.includes(s)))
    default: {
      const never: never = affects
      throw new Error(`impact: unhandled selector ${JSON.stringify(never)}`)
    }
  }
}

export function openQuestionImpact(lexicon: Lexicon): readonly QuestionImpact[] {
  /*
   * One pass over the lexicon, collapsed onto normalized forms the same way the
   * collision index does — `aba'` and `abaq` are one form, and counting both
   * would inflate every question that touches the glottal stop.
   */
  const forms = new Map<
    string,
    { latin: string; spellings: string[]; outputCodepoints: string[]; classes: Set<string> }
  >()

  for (const entry of lexicon.entries) {
    const trace = interpret(entry.latin)
    const latin = trace.input.normalized
    const found = forms.get(latin)

    if (found) {
      if (!found.spellings.includes(entry.latin)) found.spellings.push(entry.latin)
      continue
    }

    forms.set(latin, {
      latin,
      spellings: [entry.latin],
      outputCodepoints: codepointsOf(trace.output.text),
      classes: new Set(trace.ambiguities.map((a) => a.class)),
    })
  }

  const all = [...forms.values()]

  return OPEN_QUESTIONS.map((question): QuestionImpact => {
    const affects = question.affects

    if (!affects) {
      return {
        question,
        sized: false,
        affected: 0,
        total: all.length,
        samples: [],
        basis: null,
      }
    }

    const hits = all.filter((form) => matches(affects, form))

    return {
      question,
      sized: true,
      affected: hits.length,
      total: all.length,
      samples: hits
        .map((f) => f.latin)
        .sort((a, b) => a.localeCompare(b))
        .slice(0, SAMPLE_LIMIT),
      basis: affects.basis,
    }
  })
}
