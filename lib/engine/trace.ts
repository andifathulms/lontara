import type { AmbiguityClass } from '@/lib/rules/schema'

/**
 * The one structure everything renders. The band, the reading tree, the rule
 * trace panel and the ambiguity markers are all views of a
 * `TransliterationTrace` — nothing is computed in a component (invariant 9).
 *
 * The engine is pure: `(input, direction, options, ruleSet, lexicon) =>
 * TransliterationTrace`. No React, no DOM, no globals, no clock (invariant 5).
 */

/**
 * Half-open `[start, end)` over **grapheme-cluster indices**, never code units.
 * Indexing a string by code unit for glyph logic is the single most common
 * defect in aksara tooling, so spans are defined against the cluster arrays the
 * trace carries and there is no way to express a code-unit span here
 * (invariant 7).
 */
export type Span = {
  readonly start: number
  readonly end: number
}

export function span(start: number, end: number): Span {
  return { start, end }
}

export function spanLength(s: Span): number {
  return s.end - s.start
}

export function isEmptySpan(s: Span): boolean {
  return s.end <= s.start
}

/** Slice a cluster array by span. The only sanctioned way to read a span's text. */
export function sliceSpan(clusters: readonly string[], s: Span): string {
  return clusters.slice(s.start, s.end).join('')
}

export type Direction = 'latin-to-lontara' | 'lontara-to-latin'

/**
 * A first-class type, not a warning string (PRD §7). Ambiguity is never
 * silently resolved (invariant 3): `reason` is required, so a `chosen` without
 * a reason cannot be constructed.
 */
export type Ambiguity = {
  readonly class: AmbiguityClass
  readonly candidates: readonly string[]
  /** What the traversal settled on, or null where it refuses to settle. */
  readonly chosen: string | null
  readonly reason: string
  /** The rule that accounts for it. Always present — an unattributed ambiguity is a bug. */
  readonly ruleId: string
  readonly spans: {
    readonly input: Span
    readonly output: Span
  }
}

/**
 * Every step carries an input span and an output span (invariant 6). All
 * highlighting, linking and loss-marking is span-based; a step without spans is
 * unfinished, so the spans are required on the base type rather than added per
 * variant.
 */
type StepBase = {
  readonly ruleId: string
  readonly inputSpan: Span
  readonly outputSpan: Span
  /**
   * Which cluster array `outputSpan` indexes.
   *
   * There are genuinely two coordinate spaces here and conflating them is a
   * bug waiting to happen: normalisation runs before any aksara exists, so a
   * `normalize` step's output is the normalised *input*, not the output text.
   * Rather than leave that to be inferred from `type`, every step says which
   * array to slice. Use `outputClustersFor`.
   */
  readonly outputSpanIn: 'normalized-input' | 'output'
}

export type TraceStep =
  /** An input variant resolved before anything else looked at the text. */
  | (StepBase & { readonly type: 'normalize'; readonly from: string; readonly to: string })
  /** A (C)V unit recognised in the input. */
  | (StepBase & {
      readonly type: 'segment'
      readonly onset: string
      readonly vowel: string
    })
  /** A consonant or mark that the script has no way to write. */
  | (StepBase & {
      readonly type: 'loss'
      readonly ambiguityClass: AmbiguityClass
      readonly dropped: string
    })
  /** A unit written out as aksara. */
  | (StepBase & {
      readonly type: 'compose'
      readonly produced: string
      readonly codepoints: readonly string[]
    })
  /** A Lontara unit read back as Latin. */
  | (StepBase & {
      readonly type: 'read'
      readonly letter: string
      readonly sign: string | null
      readonly latin: string
    })
  /** Input the rule set has nothing to say about. Never silently dropped. */
  | (StepBase & { readonly type: 'unhandled'; readonly text: string; readonly why: string })

export type TransliterationTrace = {
  readonly direction: Direction
  readonly input: {
    readonly raw: string
    readonly normalized: string
    readonly clusters: readonly string[]
  }
  readonly output: {
    readonly text: string
    readonly clusters: readonly string[]
  }
  readonly steps: readonly TraceStep[]
  readonly ambiguities: readonly Ambiguity[]
  /** Stamped so a trace can never be read as more authoritative than the rules behind it. */
  readonly ruleSetVersion: string
  readonly reviewStatus: 'unreviewed' | 'reviewed'
}

/** The array a step's `outputSpan` indexes. The only sanctioned way to resolve one. */
export function outputClustersFor(
  trace: Pick<TransliterationTrace, 'input' | 'output'>,
  step: TraceStep,
): readonly string[] {
  return step.outputSpanIn === 'normalized-input' ? trace.input.clusters : trace.output.clusters
}

/** Exhaustiveness helper. Discriminated unions get an exhaustive switch with a `never` default. */
export function assertNever(value: never, context: string): never {
  throw new Error(`${context}: unhandled variant ${JSON.stringify(value)}`)
}

export function lossSteps(steps: readonly TraceStep[]) {
  return steps.filter((s): s is Extract<TraceStep, { type: 'loss' }> => s.type === 'loss')
}

export function ambiguitiesByClass(
  ambiguities: readonly Ambiguity[],
): ReadonlyMap<AmbiguityClass, Ambiguity[]> {
  const out = new Map<AmbiguityClass, Ambiguity[]>()
  for (const a of ambiguities) {
    const list = out.get(a.class) ?? []
    list.push(a)
    out.set(a.class, list)
  }
  return out
}
