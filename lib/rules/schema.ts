import { z } from 'zod'

/**
 * The rule-set schema. Enforced at build time by `pnpm rules:validate`, which
 * is wired into `build` and CI and may fail the deploy (PRD §8).
 *
 * Two things the schema makes non-negotiable:
 *   - Every rule has a non-empty `citation` (invariant 2).
 *   - `ambiguityClass` is drawn from a closed set of four (invariant 3). Adding
 *     one means editing this file on purpose.
 */
export const AMBIGUITY_CLASSES = ['final', 'gemination', 'prenasal', 'glottal'] as const
export type AmbiguityClass = (typeof AMBIGUITY_CLASSES)[number]

/**
 * `normalize` resolves input variants, `segment` parses into (C)V units and
 * leftovers, `classify` decides what each leftover's ambiguity class is, and
 * `compose` writes the units out. Loss rules live in `classify` and not in
 * `segment` so that priority means one thing only: the order in which rules that
 * could match the same input are tried.
 */
export const STAGES = ['normalize', 'segment', 'classify', 'compose'] as const
export type Stage = (typeof STAGES)[number]

/**
 * `cited`      — points at a published source.
 * `derived`    — follows from cited facts by reasoning written out in the
 *                citation field, so the derivation can be disputed as a whole.
 * `provisional`— not established. Requires a `note` saying what is unverified.
 *                Surfaced in the UI and listed first by `pnpm rules:report`.
 */
export const RULE_STATUSES = ['cited', 'derived', 'provisional'] as const
export type RuleStatus = (typeof RULE_STATUSES)[number]

const RuleBase = {
  id: z
    .string()
    .regex(
      /^(lontara|latin)\.[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/,
      'rule ids are stable and readable: lontara.final.drop, latin.glottal.apostrophe',
    ),
  stage: z.enum(STAGES),
  priority: z.number().int().positive(),
  status: z.enum(RULE_STATUSES),
  citation: z.string().min(20, 'a citation this short is not a citation'),
  note: z.string().min(1).optional(),
  description: z.string().min(1),
}

const VariantRule = z.object({
  ...RuleBase,
  type: z.literal('variant'),
  from: z.array(z.string().min(1)).nonempty(),
  to: z.string().min(1),
})

const SegmentationRule = z.object({
  ...RuleBase,
  type: z.literal('segmentation'),
  strategy: z.literal('maximal-onset'),
})

const CompositionRule = z.object({
  ...RuleBase,
  type: z.literal('composition'),
  onsetSource: z.string().min(1),
  vowelSource: z.string().min(1),
  inherentVowel: z.literal('a'),
  carrier: z
    .string()
    .regex(/^U\+1A[0-9A-F]{2}$/)
    .optional(),
})

const LossRule = z.object({
  ...RuleBase,
  type: z.literal('loss'),
  ambiguityClass: z.enum(AMBIGUITY_CLASSES),
  trigger: z.string().min(1),
  action: z.enum(['drop', 'collapse']),
})

export const RuleSchema = z.discriminatedUnion('type', [
  VariantRule,
  SegmentationRule,
  CompositionRule,
  LossRule,
])

export type Rule = z.infer<typeof RuleSchema>
export type VariantRule = z.infer<typeof VariantRule>
export type SegmentationRule = z.infer<typeof SegmentationRule>
export type CompositionRule = z.infer<typeof CompositionRule>
export type LossRule = z.infer<typeof LossRule>

/**
 * Which forms an unanswered question actually decides.
 *
 * A question recorded as prose says *that* something is unknown. It never says
 * what turns on it, so the cost of not knowing stays invisible and "please
 * review our orthography" stays an unbounded request that a reviewer defers.
 * This is the declarative half of the answer: a selector over the engine's own
 * output, so the affected set is computed from what the writer really does
 * rather than estimated.
 *
 * Deliberately NOT a second rule set. Running the counterfactual — actually
 * writing every form under the *other* answer — would need the engine
 * parameterised by rule set, which it is not, and for
 * `openQuestions.prenasal-coverage` it would need a prenasal-generalisation
 * rule that this repository has explicitly declined to write on two pieces of
 * evidence. Sizing the question needs neither, and claims only what it can
 * compute: these are the forms whose output depends on the answer.
 *
 * `basis` carries the same burden `citation` carries on a rule — it has to say
 * why this selector is the right set for this question, so the choice is
 * auditable rather than asserted.
 *
 * Optional. A question that cannot be sized honestly does not get a selector,
 * and the page says it is not sized rather than inventing a number.
 */
const AffectsSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('outputCodepoint'),
    /** The written form contains any of these. */
    codepoints: z.array(z.string().regex(/^U\+1A[0-9A-F]{2}$/)).nonempty(),
    basis: z.string().min(20, 'a basis this short does not explain the selector'),
  }),
  z.object({
    kind: z.literal('ambiguityClass'),
    /** The writer declared a loss of this class for the form. */
    ambiguityClass: z.enum(AMBIGUITY_CLASSES),
    basis: z.string().min(20, 'a basis this short does not explain the selector'),
  }),
  z.object({
    kind: z.literal('latinContains'),
    /** The lexicon's own spelling contains any of these. */
    substrings: z.array(z.string().min(1)).nonempty(),
    basis: z.string().min(20, 'a basis this short does not explain the selector'),
  }),
])

export type Affects = z.infer<typeof AffectsSchema>

const OpenQuestionSchema = z.object({
  id: z.string().regex(/^openQuestions\.[a-z][a-z0-9-]*$/),
  blocks: z.array(z.string()),
  question: z.string().min(1),
  why: z.string().min(1),
  askWhom: z.string().min(1),
  affects: AffectsSchema.optional(),
})

export type OpenQuestion = z.infer<typeof OpenQuestionSchema>

export const RuleSetSchema = z
  .object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    reviewStatus: z.enum(['unreviewed', 'reviewed']),
    ambiguityClasses: z.record(
      z.enum(AMBIGUITY_CLASSES),
      z.object({ citation: z.string().min(20), description: z.string().min(1) }).passthrough(),
    ),
    stages: z.array(z.enum(STAGES)).nonempty(),
    rules: z.array(RuleSchema).nonempty(),
    openQuestions: z.array(OpenQuestionSchema),
  })
  .passthrough()

export type RuleSet = z.infer<typeof RuleSetSchema>
