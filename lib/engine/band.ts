import type { AmbiguityClass } from '@/lib/rules/schema'
import { sliceSpan, type TraceStep, type TransliterationTrace } from './trace'

/**
 * The band's layout, computed from a `TransliterationTrace`.
 *
 * Nothing is computed in a component (invariant 9), and the band is a *view* of
 * the trace (PRD §6.3) — so the columns, the connector strokes and where each
 * loss marker hangs are all derived here, in the pure layer, and
 * `components/band/` only draws them.
 */
export type BandLoss = {
  readonly ruleId: string
  readonly ambiguityClass: AmbiguityClass
  readonly dropped: string
  readonly latin: string
}

export type BandColumn = {
  readonly index: number
  /** Empty for the trailing column, which exists only to hang word-final losses on. */
  readonly aksara: string
  readonly codepoints: readonly string[]
  /** The Latin cluster that produced this glyph. */
  readonly latin: string
  /**
   * Losses that happened immediately before this glyph was written. Loss is
   * marked on the connector that dropped it, at the point it happens — not
   * summarised in a footer (CLAUDE.md, Working style).
   */
  readonly losses: readonly BandLoss[]
}

export type Band = {
  readonly columns: readonly BandColumn[]
  readonly hasLoss: boolean
}

function lossAt(trace: TransliterationTrace, position: number): BandLoss[] {
  return trace.steps
    .filter(
      (s): s is Extract<TraceStep, { type: 'loss' }> =>
        s.type === 'loss' && s.outputSpan.start === position,
    )
    .map((s) => ({
      ruleId: s.ruleId,
      ambiguityClass: s.ambiguityClass,
      dropped: s.dropped,
      latin: sliceSpan(trace.input.clusters, s.inputSpan),
    }))
}

export function bandOf(trace: TransliterationTrace): Band {
  const composeSteps = trace.steps.filter(
    (s): s is Extract<TraceStep, { type: 'compose' }> => s.type === 'compose',
  )

  const columns: BandColumn[] = composeSteps.map((step) => ({
    index: step.outputSpan.start,
    aksara: step.produced,
    codepoints: step.codepoints,
    latin: sliceSpan(trace.input.clusters, step.inputSpan),
    losses: lossAt(trace, step.outputSpan.start),
  }))

  // A word-final loss has no glyph after it to hang on, so it gets a column of
  // its own at the end of the band rather than being dropped from the view.
  const trailing = lossAt(trace, trace.output.clusters.length)
  if (trailing.length > 0) {
    columns.push({
      index: trace.output.clusters.length,
      aksara: '',
      codepoints: [],
      latin: '',
      losses: trailing,
    })
  }

  return {
    columns,
    hasLoss: columns.some((c) => c.losses.length > 0),
  }
}
