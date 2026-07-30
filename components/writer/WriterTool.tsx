'use client'

import { useMemo, useState } from 'react'
import { interpret } from '@/lib/engine/interpret'
import { bandOf } from '@/lib/engine/band'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { Band } from '@/components/band/Band'
import { TracePanel } from '@/components/trace/TracePanel'
import { AmbiguityPanel } from '@/components/ambiguity/AmbiguityPanel'
import { CodepointView } from '@/components/codepoints/CodepointView'

/**
 * Nothing is computed here (invariant 9). The component holds the input string,
 * calls the pure engine, and renders the `TransliterationTrace` it gets back —
 * the band, the trace panel and the ambiguity panel are all views of that one
 * structure.
 */
export function WriterTool({ locale }: { locale: Locale }) {
  const copy = getCopy(locale)
  const [latin, setLatin] = useState('')

  const trace = useMemo(() => interpret(latin), [latin])
  const band = useMemo(() => bandOf(trace), [trace])

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <label
          htmlFor="latin-input"
          className="block font-anotasi text-xs uppercase tracking-widest text-gold/80"
        >
          {copy.writer.inputLabel}
        </label>
        <input
          id="latin-input"
          type="text"
          value={latin}
          onChange={(event) => setLatin(event.target.value)}
          placeholder={copy.writer.placeholder}
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
          className="w-full border-2 border-lontar/30 bg-transparent px-4 py-3 text-2xl text-lontar placeholder:text-lontar/30 focus:border-gold"
        />
      </div>

      <section className="space-y-3">
        <h2 className="font-anotasi text-xs uppercase tracking-widest text-gold/80">
          {copy.writer.outputLabel}
        </h2>
        <Band band={band} locale={locale} />
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="space-y-3">
          <h2 className="font-anotasi text-xs uppercase tracking-widest text-daun">
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
        <h2 className="font-anotasi text-xs uppercase tracking-widest text-gold/80">
          {copy.writer.traceLabel}
        </h2>
        <TracePanel trace={trace} locale={locale} />
      </section>
    </div>
  )
}
