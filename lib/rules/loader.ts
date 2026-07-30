import rulesJson from '@/data/rules/rules.json'
import {
  RuleSetSchema,
  type AmbiguityClass,
  type CompositionRule,
  type LossRule,
  type Rule,
  type RuleSet,
  type SegmentationRule,
  type VariantRule,
} from './schema'

/**
 * Parse the rule set once. `data/rules/rules.json` is the only place an
 * orthographic rule lives (invariant 1); everything downstream reads it through
 * here, so no module can hard-code a rule and no module can reach a rule
 * without its citation attached.
 */
export const RULE_SET: RuleSet = RuleSetSchema.parse(rulesJson)

export const RULES: readonly Rule[] = RULE_SET.rules

const byId = new Map(RULES.map((r) => [r.id, r]))

/**
 * Throws on an unknown id rather than returning undefined. A trace step that
 * cannot name its rule is not a trace step, and failing loudly at the call site
 * is better than a step whose citation is silently missing.
 */
export function rule(id: string): Rule {
  const found = byId.get(id)
  if (!found) throw new Error(`unknown rule id: ${id}`)
  return found
}

function ofType<T extends Rule['type']>(type: T): Extract<Rule, { type: T }>[] {
  return RULES.filter((r): r is Extract<Rule, { type: T }> => r.type === type).sort(
    (a, b) => a.priority - b.priority,
  )
}

export const VARIANT_RULES: VariantRule[] = ofType('variant')
export const SEGMENTATION_RULES: SegmentationRule[] = ofType('segmentation')
export const COMPOSITION_RULES: CompositionRule[] = ofType('composition')
export const LOSS_RULES: LossRule[] = ofType('loss')

export function lossRuleFor(cls: AmbiguityClass): LossRule {
  const found = LOSS_RULES.find((r) => r.ambiguityClass === cls)
  if (!found) throw new Error(`no loss rule declares ambiguity class: ${cls}`)
  return found
}

export const PROVISIONAL_RULES: readonly Rule[] = RULES.filter((r) => r.status === 'provisional')

export const OPEN_QUESTIONS = RULE_SET.openQuestions

export function openQuestionsFor(ruleId: string) {
  return OPEN_QUESTIONS.filter((q) => q.blocks.includes(ruleId))
}
