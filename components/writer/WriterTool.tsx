'use client'

import { useMemo } from 'react'
import { interpret } from '@/lib/engine/interpret'
import { bandOf } from '@/lib/engine/band'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { Band } from '@/components/band/Band'
import { TracePanel } from '@/components/trace/TracePanel'
import { AmbiguityPanel } from '@/components/ambiguity/AmbiguityPanel'
import { CodepointView } from '@/components/codepoints/CodepointView'
import { ShareLink } from '@/components/share/ShareLink'
import { useHashState } from '@/components/share/useHashState'
import { eyebrow } from '@/components/chrome/eyebrow'
import { ToolInput } from '@/components/tool/ToolInput'

/**
 * Nothing is computed here (invariant 9). The component holds the input string,
 * calls the pure engine, and renders the `TransliterationTrace` it gets back —
 * the band, the trace panel and the ambiguity panel are all views of that one
 * structure.
 */
export function WriterTool({ locale }: { locale: Locale }) {
  const copy = getCopy(locale)
  const [latin, setLatin] = useHashState()

  const trace = useMemo(() => interpret(latin), [latin])
  const band = useMemo(() => bandOf(trace), [trace])

  return (
    <div className="space-y-8">
      {/* The three examples are PRD §2's illustration, and they are the whole
          argument: press them in turn and the band below does not change. */}
      <ToolInput
        id="latin-input"
        label={copy.writer.inputLabel}
        value={latin}
        onChange={setLatin}
        placeholder={copy.writer.placeholder}
        locale={locale}
        examples={copy.writer.examples.map((value) => ({ label: value, value }))}
      >
        <ShareLink locale={locale} value={latin} />
      </ToolInput>

      <section className="space-y-3">
        <h2 className={eyebrow()}>
          {copy.writer.outputLabel}
        </h2>
        <Band band={band} locale={locale} />
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="space-y-3">
          <h2 className={eyebrow('daun')}>
            {copy.writer.lossTitle}
          </h2>
          <AmbiguityPanel
            ambiguities={trace.ambiguities}
            inputClusters={trace.input.clusters}
            locale={locale}
            emptyMessage={latin.length === 0 ? copy.writer.emptyState : copy.writer.lossEmpty}
          />
        </section>

        <section className="space-y-3">
          <CodepointView text={trace.output.text} locale={locale} />
        </section>
      </div>

      <section className="space-y-3">
        <h2 className={eyebrow()}>
          {copy.writer.traceLabel}
        </h2>
        <TracePanel trace={trace} locale={locale} />
      </section>
    </div>
  )
}
