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
import { ShareLink } from '@/components/share/ShareLink'
import { CopyAksara } from '@/components/share/CopyAksara'
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

  /*
   * Which trace step the reader is pointing at, linking the rule list to the
   * glyphs it produced. Held here rather than in either view, because the
   * whole point is that the two are showing the same structure.
   */
  const [activeStep, setActiveStep] = useState<number | null>(null)

  /*
   * Only steps whose span indexes the *output* can highlight the band. A
   * `normalize` step's `outputSpan` addresses the normalised input instead
   * (see `outputSpanIn`), and lighting up band column 0 for it would be
   * pointing at an unrelated glyph with total confidence.
   */
  const activeSpan = useMemo(() => {
    if (activeStep === null) return null
    const step = trace.steps[activeStep]
    if (!step || step.outputSpanIn !== 'output') return null
    return step.outputSpan
  }, [activeStep, trace])

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
        <h2 className="text-section text-lontar">{copy.writer.outputLabel}</h2>
        <Band band={band} locale={locale} activeSpan={activeSpan} />
        <CopyAksara locale={locale} text={trace.output.text} />
      </section>

      {/* What was discarded is the reason this tool exists — someone writing a
          name on a sign needs to know their Latin distinctions are about to
          vanish (PRD §3). It was sharing a row with a codepoint dump. It gets
          the full measure now. */}
      <section className="space-y-3">
        <h2 className="text-section text-daun-ink">{copy.writer.lossTitle}</h2>
        <AmbiguityPanel
          ambiguities={trace.ambiguities}
          inputClusters={trace.input.clusters}
          locale={locale}
          emptyMessage={latin.length === 0 ? copy.writer.emptyState : copy.writer.lossEmpty}
        />
      </section>

      {/* Reference tier. Always present (invariant 10) and always complete,
          but ruled off from the answer above it so it reads as apparatus
          rather than as another finding. */}
      <div className="grid gap-8 border-t-2 border-gold/30 pt-8 md:grid-cols-2">
        <section>
          <CodepointView text={trace.output.text} locale={locale} />
        </section>

        <section className="space-y-3">
          <h2 className={eyebrow()}>{copy.writer.traceLabel}</h2>
          <TracePanel
            trace={trace}
            locale={locale}
            activeIndex={activeStep}
            onActiveChange={setActiveStep}
          />
        </section>
      </div>
    </div>
  )
}
