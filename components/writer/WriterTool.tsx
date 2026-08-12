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
import { Announce } from '@/components/chrome/Announce'
import { ReturnTrip } from '@/components/writer/ReturnTrip'

/**
 * Nothing is computed here (invariant 9). The component holds the input string,
 * calls the pure engine, and renders the `TransliterationTrace` it gets back —
 * the band, the trace panel and the ambiguity panel are all views of that one
 * structure.
 */
/**
 * What the writer works through before anyone has typed.
 *
 * `matta` rather than `mata`: it is the PRD §2 illustration the landing page
 * has just walked the reader through, and it actually loses something, so the
 * loss panel and the return trip below it have real content rather than two
 * more empty states.
 */
const EXAMPLE = 'matta'

export function WriterTool({ locale }: { locale: Locale }) {
  const copy = getCopy(locale)
  const [latin, setLatin] = useHashState()

  /*
   * The tool opened on five copies of "No input yet." — output, loss, read
   * back, codepoints, trace — so a newcomer met it as a void and had to
   * already know what to type before it would show them anything.
   *
   * It works an example instead. Deliberately NOT by prefilling the field:
   * that would make the URL and the input disagree, and clearing the field
   * would leave a state that a refresh silently undoes. The field stays empty
   * and genuinely empty; only the derivation below falls back.
   */
  const showingExample = latin === ''
  const source = showingExample ? EXAMPLE : latin

  const trace = useMemo(() => interpret(source), [source])
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
      {/* The band and the loss panel below change on every keystroke with no
          focus moving, so nothing announced them. This says only what was
          discarded; the detail stays on the page to be navigated. */}
      <Announce>{latin === '' ? '' : copy.writer.discarded(trace.ambiguities.length)}</Announce>

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

      {showingExample ? (
        <p className="border-l-4 border-gold/50 bg-gold/5 px-4 py-2 text-sm text-lontar/85">
          <span className={eyebrow()}>{source}</span>{' '}
          {copy.common.exampleShown}
        </p>
      ) : null}

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
          emptyMessage={copy.writer.lossEmpty}
        />
      </section>

      {/* The consequence of the loss above. "gemination was dropped here" tells
          you something went missing; this tells you who you are now written
          identically to — which is the question someone about to cut a name
          into a signboard is actually asking. */}
      <section className="space-y-3">
        <h2 className="text-section text-lontar">{copy.returnTrip.title}</h2>
        <ReturnTrip
          locale={locale}
          normalizedLatin={trace.input.normalized}
          lontara={trace.output.text}
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
          <h3 className={eyebrow()}>{copy.writer.traceLabel}</h3>
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
