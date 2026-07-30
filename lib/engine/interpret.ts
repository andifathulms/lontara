import { INVENTORY, fromCodepoint, toCodepoint } from '@/lib/rules/inventory'
import { RULE_SET, rule } from '@/lib/rules/loader'
import { normalize } from './normalize'
import { classifyFinal, segmentLatin, type LatinUnit } from './segment'
import {
  assertNever,
  span,
  type Ambiguity,
  type TraceStep,
  type TransliterationTrace,
} from './trace'

/**
 * The writer. Latin → Lontara: the **defaulting** traversal.
 *
 * Deterministic but lossy. Everything discarded is declared as an `Ambiguity` at
 * the span where it happened — loss is marked where it happens, not summarised
 * in a footer (CLAUDE.md, Working style). A user writing a name on a sign needs
 * to know their Latin distinctions are about to vanish, and where.
 *
 * One rule set, two traversals (invariant 8): this defaults and discloses,
 * `enumerate.ts` expands. Neither forks the rule data.
 */

const CARRIER_CODEPOINT = (() => {
  const compose = rule('lontara.syllable.compose')
  if (compose.type !== 'composition' || !compose.carrier) {
    throw new Error('lontara.syllable.compose must declare a carrier letter')
  }
  return compose.carrier
})()

const LETTER_BY_ONSET = new Map(INVENTORY.consonants.map((c) => [c.onset, c]))
const SIGN_BY_LATIN = new Map(INVENTORY.vowelSigns.map((v) => [v.latin, v]))

/**
 * Write one (C)V unit. Returns null when the inventory has no letter for the
 * onset, which the caller reports rather than papering over.
 */
function compose(onset: string, vowel: string): { text: string; codepoints: string[] } | null {
  const letter = onset === '' ? undefined : LETTER_BY_ONSET.get(onset)
  const letterCodepoint = onset === '' ? CARRIER_CODEPOINT : letter?.codepoint
  if (!letterCodepoint) return null

  const codepoints = [letterCodepoint]
  if (vowel !== INVENTORY.inherentVowel.latin) {
    const sign = SIGN_BY_LATIN.get(vowel)
    if (!sign) return null
    codepoints.push(sign.codepoint)
  }

  return { text: codepoints.map(fromCodepoint).join(''), codepoints }
}

/**
 * Which composition rule accounts for a unit. The prenasal letters are cited
 * separately from the generic composition, so a trace over `mampa` names
 * `lontara.prenasal.letter` at the MPA and not a rule about vowel signs.
 */
function compositionRuleFor(onset: string): string {
  const letter = LETTER_BY_ONSET.get(onset)
  return letter?.prenasal ? rule('lontara.prenasal.letter').id : rule('lontara.syllable.compose').id
}

export type InterpretOptions = {
  /** Left in for symmetry with `enumerate`; the writer has nothing to cap. */
  readonly unused?: never
}

export function interpret(raw: string): TransliterationTrace {
  const normalized = normalize(raw, 'latin-to-lontara')
  const { units } = segmentLatin(normalized.clusters)

  const steps: TraceStep[] = [...normalized.steps]
  const ambiguities: Ambiguity[] = []
  const outputClusters: string[] = []

  units.forEach((unit, index) => {
    // Output spans are indices into `outputClusters`, one entry per written
    // unit (a letter with its vowel sign attached, if any). One entry per unit
    // rather than per code point is what makes a connector stroke from a Latin
    // cluster to the glyph it produced expressible as a span.
    const at = outputClusters.length

    switch (unit.kind) {
      case 'syllable': {
        const written = compose(unit.onset, unit.vowel)
        if (!written) {
          steps.push({
            type: 'unhandled',
            ruleId: rule('lontara.syllable.compose').id,
            inputSpan: unit.span,
            outputSpan: span(at, at),
            outputSpanIn: 'output',
            text: `${unit.onset}${unit.vowel}`,
            why:
              `The inventory has no letter for the onset "${unit.onset}" or no sign for the ` +
              `vowel "${unit.vowel}". Nothing is written for it rather than something approximate.`,
          })
          return
        }

        steps.push({
          type: 'segment',
          ruleId: rule('latin.syllable.segment').id,
          inputSpan: unit.span,
          outputSpan: span(at, at + 1),
          outputSpanIn: 'output',
          onset: unit.onset,
          vowel: unit.vowel,
        })

        outputClusters.push(written.text)
        steps.push({
          type: 'compose',
          ruleId: compositionRuleFor(unit.onset),
          inputSpan: unit.span,
          outputSpan: span(at, at + 1),
          outputSpanIn: 'output',
          produced: written.text,
          codepoints: written.codepoints,
        })
        return
      }

      case 'final': {
        const { ambiguityClass, ruleId } = classifyFinal(units, index)
        const lossRule = rule(ruleId)
        const next = units[index + 1]
        const nextOnset = next?.kind === 'syllable' ? next.onset : null

        // The loss is declared at the span where it happens. An empty output
        // span at the current position is the point: nothing was written here.
        const spans = { input: unit.span, output: span(at, at) }

        steps.push({
          type: 'loss',
          ruleId,
          inputSpan: spans.input,
          outputSpan: spans.output,
          outputSpanIn: 'output',
          ambiguityClass,
          dropped: unit.consonant,
        })

        const candidates =
          ambiguityClass === 'gemination' && nextOnset
            ? [nextOnset, `${nextOnset}${nextOnset}`]
            : [unit.consonant, '']

        ambiguities.push({
          class: ambiguityClass,
          candidates,
          // The writer was given the answer, so it states it — but as a
          // declaration of what is about to become unrecoverable, not as a
          // resolution of the ambiguity.
          chosen: unit.consonant,
          reason:
            ambiguityClass === 'gemination'
              ? `"${unit.consonant}" is identical to the onset that follows it, so the two are ` +
                `written as one letter. ${lossRule.description} Reading it back cannot tell ` +
                `"${nextOnset}" from "${nextOnset}${nextOnset}".`
              : `${lossRule.description} "${unit.consonant}" is not recoverable from the writing.`,
          ruleId,
          spans,
        })
        return
      }

      case 'glottal': {
        const lossRule = rule('lontara.glottal.drop')
        const spans = { input: unit.span, output: span(at, at) }

        steps.push({
          type: 'loss',
          ruleId: lossRule.id,
          inputSpan: spans.input,
          outputSpan: spans.output,
          outputSpanIn: 'output',
          ambiguityClass: 'glottal',
          dropped: unit.span.end > unit.span.start ? "'" : '',
        })

        ambiguities.push({
          class: 'glottal',
          candidates: ["'", ''],
          chosen: "'",
          reason: `${lossRule.description} Reading it back cannot tell whether it was there.`,
          ruleId: lossRule.id,
          spans,
        })
        return
      }

      case 'unhandled': {
        steps.push({
          type: 'unhandled',
          ruleId: rule('latin.syllable.segment').id,
          inputSpan: unit.span,
          outputSpan: span(at, at),
          outputSpanIn: 'output',
          text: unit.text,
          why:
            `"${unit.text}" is not an onset, a vowel or the glottal-stop apostrophe in ` +
            `this rule set, so nothing is written for it.`,
        })
        return
      }

      default:
        assertNever(unit, 'interpret: LatinUnit')
    }
  })

  return {
    direction: 'latin-to-lontara',
    input: {
      raw,
      normalized: normalized.text,
      clusters: normalized.clusters,
    },
    output: {
      text: outputClusters.join(''),
      clusters: outputClusters,
    },
    steps,
    ambiguities,
    ruleSetVersion: RULE_SET.version,
    reviewStatus: RULE_SET.reviewStatus,
  }
}

/** Codepoint view (PRD §6.8). Always available — rendering will fail somewhere. */
export function codepointsOf(text: string): string[] {
  return Array.from(text, toCodepoint)
}
