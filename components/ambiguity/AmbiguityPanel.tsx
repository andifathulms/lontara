import { rule } from '@/lib/rules/loader'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { ambiguitiesByClass, sliceSpan, type Ambiguity } from '@/lib/engine/trace'
import { Rhombus } from '@/components/ambiguity/Rhombus'

/**
 * Ambiguity stated plainly and without apology (PRD §10).
 *
 * `daun` throughout, because it is reserved for ambiguity and nothing else — so
 * green always means "the script does not decide this".
 */
export function AmbiguityPanel({
  ambiguities,
  inputClusters,
  locale,
  emptyMessage,
}: {
  ambiguities: readonly Ambiguity[]
  inputClusters: readonly string[]
  locale: Locale
  emptyMessage: string
}) {
  const copy = getCopy(locale)
  const grouped = ambiguitiesByClass(ambiguities)

  if (ambiguities.length === 0) {
    return <p className="text-sm text-lontar/55">{emptyMessage}</p>
  }

  return (
    <div className="space-y-px bg-daun/30">
      {[...grouped.entries()].map(([cls, items]) => (
        <section key={cls} className="bg-grid px-4 py-3">
          <h3 className="flex items-center gap-2">
            <Rhombus size={12} tone="daun" />
            <span className="font-anotasi text-xs uppercase tracking-widest text-daun">
              {copy.ambiguityClass[cls]}
            </span>
            <span className="font-anotasi text-[11px] text-lontar/40">
              ×{items.length}
            </span>
          </h3>
          <p className="mt-1 text-sm text-lontar/70">{copy.ambiguityClassBody[cls]}</p>

          <ul className="mt-2 space-y-2">
            {items.map((a, index) => (
              <li key={`${a.ruleId}-${index}`} className="border-l-2 border-daun pl-3">
                <p className="font-anotasi text-xs text-lontar/85">
                  {a.candidates.map((c) => (c === '' ? '∅' : c)).join('  |  ')}
                </p>
                <p className="mt-1 text-xs text-lontar/70">{a.reason}</p>
                <p className="mt-1 font-anotasi text-[11px] text-lontar/45">
                  {copy.trace.ruleId} {a.ruleId} · {copy.trace.input} “
                  {sliceSpan(inputClusters, a.spans.input) || '∅'}”
                  {a.chosen === null ? (
                    <> · {copy.reader.undetermined}</>
                  ) : null}
                </p>
                {rule(a.ruleId).note ? (
                  <p className="mt-1 text-[11px] text-sabbe/90">{rule(a.ruleId).note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
