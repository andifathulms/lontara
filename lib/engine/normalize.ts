import { VARIANT_RULES } from '@/lib/rules/loader'
import type { VariantRule } from '@/lib/rules/schema'
import { span, type Direction, type TraceStep } from './trace'

/**
 * NFC, then the input-variant rules from `rules.json` in priority order.
 *
 * Nothing here decides orthography — the variant rules are data, and this module
 * only applies them. `latin.va.w` in particular widens what is accepted on
 * input and never changes what is written out.
 */

/** Grapheme clusters, never code units (invariant 7). */
export function toClusters(text: string): string[] {
  const segmenter = new Intl.Segmenter('id', { granularity: 'grapheme' })
  return Array.from(segmenter.segment(text), (s) => s.segment)
}

export type NormalizeResult = {
  readonly raw: string
  readonly text: string
  readonly clusters: readonly string[]
  readonly steps: readonly TraceStep[]
}

function codepointOf(token: string): string | null {
  const match = /^U\+([0-9A-F]{4,6})$/.exec(token)
  if (!match?.[1]) return null
  return String.fromCodePoint(Number.parseInt(match[1], 16))
}

/**
 * Resolve one rule against one cluster. Returns the replacement, or null if the
 * rule does not apply. Each rule's `from`/`to` is read as data:
 *   - `to: "lowercase"` with `from: ["A-Z"]` — a case fold
 *   - `from`/`to` as `U+XXXX` tokens — a character substitution
 *   - plain strings — a literal substitution
 */
function applyVariant(rule: VariantRule, cluster: string): string | null {
  if (rule.to === 'lowercase') {
    const folded = cluster.toLowerCase()
    return folded === cluster ? null : folded
  }

  const target = codepointOf(rule.to) ?? rule.to

  for (const from of rule.from) {
    const literal = codepointOf(from)
    if (literal !== null) {
      if (cluster === literal) return target
      continue
    }
    if (cluster === from) return target
  }
  return null
}

/**
 * Latin input runs every variant rule; Lontara input runs none of them — they
 * are all `latin.*` and folding case or apostrophes in aksara would be
 * meaningless. NFC applies in both directions.
 */
export function normalize(raw: string, direction: Direction): NormalizeResult {
  const nfc = raw.normalize('NFC')
  const clusters = toClusters(nfc)
  const steps: TraceStep[] = []

  if (direction === 'lontara-to-latin') {
    return { raw, text: nfc, clusters, steps }
  }

  const out: string[] = []
  for (let i = 0; i < clusters.length; i += 1) {
    const cluster = clusters[i]
    if (cluster === undefined) continue

    let current = cluster
    for (const rule of VARIANT_RULES) {
      const replaced = applyVariant(rule, current)
      if (replaced === null) continue
      steps.push({
        type: 'normalize',
        ruleId: rule.id,
        // Spans are cluster indices and stay aligned because every variant rule
        // here is a one-cluster-for-one-cluster substitution. A rule that
        // changed cluster count would need the alignment rebuilt, and the
        // schema does not currently allow one.
        inputSpan: span(i, i + 1),
        outputSpan: span(i, i + 1),
        outputSpanIn: 'normalized-input',
        from: current,
        to: replaced,
      })
      current = replaced
    }
    out.push(current)
  }

  return { raw, text: out.join(''), clusters: out, steps }
}
