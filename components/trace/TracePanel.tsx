import { rule } from '@/lib/rules/loader'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import {
  outputClustersFor,
  sliceSpan,
  assertNever,
  type TraceStep,
  type TransliterationTrace,
} from '@/lib/engine/trace'
import { Rhombus } from '@/components/ambiguity/Rhombus'
import { eyebrow } from '@/components/chrome/eyebrow'

/**
 * The rule trace (PRD §6.3): the ordered list of applied rules with input span,
 * output span, rule id and citation. Every output is traceable to its rule in
 * one tap (PRD §12).
 *
 * The `provisional` badge is not decoration. A reader looking at output derived
 * from an unverified rule needs to see that on the step, not buried on a
 * disclosure page.
 */
function StatusBadge({ status, locale }: { status: string; locale: Locale }) {
  const copy = getCopy(locale)
  if (status === 'provisional') {
    return (
      <span className={`border border-sabbe px-1.5 ${eyebrow('sabbe', 'sm')}`}>
        {copy.trace.provisionalBadge}
      </span>
    )
  }
  return (
    <span className={eyebrow('quiet', 'sm')}>
      {status}
    </span>
  )
}

function describe(step: TraceStep, locale: Locale): string {
  const copy = getCopy(locale)
  switch (step.type) {
    case 'normalize':
      return `"${step.from}" → "${step.to}"`
    case 'segment':
      return `${step.onset || '∅'} + ${step.vowel}`
    case 'loss':
      return `${copy.ambiguityClass[step.ambiguityClass]}: "${step.dropped}"`
    case 'compose':
      return step.codepoints.join(' ')
    case 'read':
      return `${step.letter}${step.sign ? ` + ${step.sign}` : ''} → "${step.latin}"`
    case 'unhandled':
      return step.why
    default:
      return assertNever(step, 'TracePanel: TraceStep')
  }
}

/**
 * Optional linking. Every step already carries an input and an output span
 * (invariant 6) and the comment on that type says "all highlighting, linking
 * and loss-marking is span-based" — but nothing consumed them, so the spans
 * were printed as bare index pairs and left for the reader to resolve by
 * counting glyphs.
 *
 * Pointing at a step now lights up exactly the aksara it produced. Hover and
 * focus preview it; a click pins it, because hover does not exist on a phone
 * and this is most useful on the device where the band is hardest to read.
 */
export function TracePanel({
  trace,
  locale,
  activeIndex = null,
  onActiveChange,
}: {
  trace: Pick<TransliterationTrace, 'input' | 'output' | 'steps'>
  locale: Locale
  activeIndex?: number | null
  onActiveChange?: (index: number | null) => void
}) {
  const copy = getCopy(locale)

  if (trace.steps.length === 0) {
    return <p className="text-sm text-lontar/65">{copy.writer.emptyState}</p>
  }

  const linked = onActiveChange !== undefined

  return (
    <ol className="space-y-px bg-gold/20">
      {trace.steps.map((step, index) => {
        const meta = rule(step.ruleId)
        const inputText = sliceSpan(trace.input.clusters, step.inputSpan)
        const outputText = sliceSpan(outputClustersFor(trace, step), step.outputSpan)
        const active = linked && activeIndex === index

        return (
          <li
            key={`${step.ruleId}-${index}`}
            className={`px-4 py-3 ${active ? 'bg-gold/10' : 'bg-grid'}`}
            onMouseEnter={linked ? () => onActiveChange(index) : undefined}
            onMouseLeave={linked ? () => onActiveChange(null) : undefined}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {step.type === 'loss' ? <Rhombus size={10} tone="daun" /> : null}
              {/* Only the rule id is a control. The rest of the step is a `dl`
                  and a couple of paragraphs, which cannot legally live inside
                  a button. */}
              <button
                type="button"
                disabled={!linked}
                aria-pressed={linked ? active : undefined}
                onFocus={linked ? () => onActiveChange(index) : undefined}
                onBlur={linked ? () => onActiveChange(null) : undefined}
                onClick={linked ? () => onActiveChange(active ? null : index) : undefined}
                className={`font-anotasi text-xs disabled:cursor-text ${
                  step.type === 'loss' ? 'text-daun-ink' : 'text-gold'
                } ${linked ? 'underline decoration-dotted underline-offset-4' : ''}`}
              >
                {step.ruleId}
              </button>
              <StatusBadge status={meta.status} locale={locale} />
              <span className={eyebrow('quiet', 'sm')}>
                {step.type}
              </span>
            </div>

            <p className="mt-1 text-sm text-lontar/85">{describe(step, locale)}</p>

            <dl className="mt-1 flex flex-wrap gap-x-5 font-anotasi text-anotasi text-lontar/65">
              <span>
                <dt className="inline">{copy.trace.input} </dt>
                <dd className="inline">
                  [{step.inputSpan.start},{step.inputSpan.end}) {inputText ? `“${inputText}”` : '∅'}
                </dd>
              </span>
              <span>
                <dt className="inline">{copy.trace.output} </dt>
                <dd className="inline">
                  [{step.outputSpan.start},{step.outputSpan.end}){' '}
                  {outputText ? `“${outputText}”` : '∅'}
                </dd>
              </span>
            </dl>

            <p className="mt-2 border-l-2 border-lontar/20 pl-3 text-xs text-lontar/65">
              <span className={eyebrow('quiet')}>
                {copy.trace.citation}
              </span>{' '}
              {meta.citation}
            </p>

            {meta.note ? (
              <p className="mt-1 border-l-2 border-sabbe pl-3 text-xs text-sabbe-ink">
                {meta.note}
              </p>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
