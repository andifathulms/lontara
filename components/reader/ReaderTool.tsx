'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { enumerate } from '@/lib/engine/enumerate'
import { interpret } from '@/lib/engine/interpret'
import { toClusters } from '@/lib/engine/normalize'
import { fromCodepoint } from '@/lib/rules/inventory'
import { CLIENT_LEXICON } from '@/lib/lexicon/client'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { Keyboard } from '@/components/keyboard/Keyboard'
import { ReadingTree } from '@/components/tree/ReadingTree'
import { TracePanel } from '@/components/trace/TracePanel'
import { AmbiguityPanel } from '@/components/ambiguity/AmbiguityPanel'
import { CodepointView } from '@/components/codepoints/CodepointView'
import { Rhombus } from '@/components/ambiguity/Rhombus'
import { ShareLink } from '@/components/share/ShareLink'
import { useHashState } from '@/components/share/useHashState'
import { ToolInput } from '@/components/tool/ToolInput'
import { AttestedForms } from '@/components/corpus/AttestedForms'
import { eyebrow } from '@/components/chrome/eyebrow'
import { Announce } from '@/components/chrome/Announce'
import { Settling } from '@/components/chrome/Settling'

const CLASSES = ['final', 'gemination', 'prenasal', 'glottal'] as const

/**
 * The reader. It calls the pure enumerator and renders the result; the tree, the
 * skeleton and the ambiguity panel are views of one `EnumerationResult`.
 *
 * The shipped lexicon is empty, so in practice this renders the honest state:
 * the syllable skeleton, the four classes declared undetermined, and a statement
 * of why there are no ranked readings. That is the point — it says what it
 * cannot do instead of showing one confident guess.
 */
export function ReaderTool({ locale }: { locale: Locale }) {
  const copy = getCopy(locale)
  const [lontara, setLontara] = useHashState()
  const [showKeyboard, setShowKeyboard] = useState(true)

  /*
   * What the reader works through before anyone has pasted anything.
   *
   * The flagship opened on "No input yet." and a "no attested reading" notice
   * — a void that needed Lontara text the newcomer does not have and cannot
   * type without first finding the keyboard toggle. It works an example
   * instead.
   *
   * ᨄᨆᨘᨒ is chosen for what it teaches, and it is corpus-attested rather than
   * invented: three real forms — pammula, pammulang, pamula — diverging on two
   * different classes at once, so the tree actually branches and both
   * `gemination` and `final` are on screen in one example.
   *
   * Built from codepoints, never a pasted literal, on the same principle as
   * everything else that shows aksara here.
   *
   * NOT prefilled into the field: the URL and the input would then disagree,
   * and clearing the field would leave a state a refresh silently undoes. The
   * field stays genuinely empty; only the derivation falls back.
   */
  const showingExample = lontara === ''
  const source = showingExample
    ? ['U+1A04', 'U+1A06', 'U+1A18', 'U+1A12'].map(fromCodepoint).join('')
    : lontara

  /*
   * Deferred, for the same reason the writer's return trip is.
   *
   * `enumerate` inverts the writer over the whole lexicon: 1,323 `interpret`
   * calls, measured at 30ms on a laptop and several times that on the phone
   * PRD §12 targets. It was running on the urgent render path, so every
   * keystroke in the reader — the flagship — blocked the main thread for
   * longer than a frame before the character appeared.
   *
   * This does not make the work cheaper. It moves it off the path that has to
   * keep up with typing: React shows the previous tree until the new one is
   * ready, and the field never waits for it.
   */
  const deferredSource = useDeferredValue(source)
  const settling = deferredSource !== source

  const result = useMemo(() => enumerate(deferredSource, CLIENT_LEXICON), [deferredSource])
  const empty = false

  /*
   * The example is written by the writer, not typed out here as a literal.
   * PRD §2's three words all produce one string, so running them through
   * `interpret` and deduplicating leaves exactly the sequence a reader is
   * supposed to find undecidable — and it cannot drift from what the writer
   * actually emits, which a hard-coded literal could.
   */
  const examples = useMemo(() => {
    const seen = new Set<string>()
    for (const word of copy.writer.examples) {
      const written = interpret(word).output.text
      if (written) seen.add(written)
    }
    return [...seen].map((value) => ({ label: value, value, aksara: true }))
  }, [copy.writer.examples])

  /*
   * While settling, the live region says so (`copy.common.settling`) rather
   * than going quiet — matches the treatment `ReturnTrip` uses for the same
   * deferred-value lag, via the shared `Settling` component below.
   */
  const announcement = settling
    ? copy.common.settling
    : result.readings.length > 0
      ? copy.reader.readingCount(result.readings.length)
      : copy.reader.noAttested

  return (
    <div className="space-y-8">
      {/* The skeleton, the tree and the reading count all change without focus
          moving. The count is the whole answer; the tree is navigable below. */}
      <Announce>{announcement}</Announce>

      <ToolInput
        id="lontara-input"
        label={copy.reader.inputLabel}
        value={lontara}
        onChange={setLontara}
        placeholder={copy.reader.placeholder}
        locale={locale}
        aksara
        examples={examples}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => setShowKeyboard((v) => !v)}
            className={`min-h-[36px] hover:text-gold ${eyebrow()}`}
            aria-expanded={showKeyboard}
            aria-controls="papan-tombol"
          >
            {copy.writer.keyboardToggle} {showKeyboard ? '−' : '+'}
          </button>
        </div>
        <ShareLink locale={locale} value={lontara} />
      </ToolInput>

      {showKeyboard ? (
        <div id="papan-tombol">
          <Keyboard locale={locale} value={lontara} onChange={setLontara} />
        </div>
      ) : null}

      {showingExample ? (
        <p className="border-l-4 border-gold/50 bg-gold/5 px-4 py-2 text-sm text-lontar/85">
          <span aria-hidden="true" className="aksara text-aksara-inline text-lontar">{source}</span>{' '}
          {copy.common.exampleShown}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-section text-lontar">{copy.reader.skeletonLabel}</h2>
        <p className="border-l-4 border-gold/50 bg-gold/5 px-4 py-3 text-glyph text-lontar">
          {empty ? (
            <span className="text-base text-lontar/65">{copy.reader.emptyState}</span>
          ) : (
            result.skeleton.latin || <span className="text-base text-lontar/65">∅</span>
          )}
        </p>
        <p className="text-xs text-lontar/65">
          {locale === 'id'
            ? 'Vokal inheren /a/ di seluruh rangka, tanpa konsonan akhir, tanpa konsonan ganda, tanpa hamzah. Inilah yang benar-benar dinyatakan aksara — bukan bacaan yang dipilih.'
            : 'The inherent vowel /a/ throughout, no finals, no gemination, no glottal stop. This is what the script actually states — not a chosen reading.'}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-section text-lontar">{copy.reader.treeLabel}</h2>

        {/* Everything below reads `result`, which lags the field by a beat
            (see the comment on `deferredSource` above) — the same lag
            `ReturnTrip` already dims for, now given the same treatment. */}
        <Settling active={settling} label={copy.common.settling}>
          <div className="space-y-3">
            {result.readings.length > 0 ? (
              <>
                <p className="font-anotasi text-xs text-lontar/65">
                  {copy.reader.readingCount(result.readings.length)}
                </p>
                {/* Every reading here rests on a corpus occurrence and nothing
                    stronger. Saying so above the tree, not in a tooltip. */}
                {result.readings.every((r) => r.attestation === 'corpus') ? (
                  <p className="border-l-4 border-sabbe bg-sabbe/10 px-4 py-3 text-sm text-lontar/85">
                    {copy.attestation.corpusWarning}
                  </p>
                ) : null}
                <ReadingTree tree={result.tree} locale={locale} />
              </>
            ) : (
              <aside
                aria-labelledby="reader-no-attested"
                className="border-l-4 border-gold bg-gold/10 px-4 py-3 space-y-2"
              >
                <p id="reader-no-attested" className={eyebrow()}>
                  {copy.reader.noAttested}
                </p>
                <p className="text-sm text-lontar/85">
                  {result.lexicon.empty ? copy.reader.lexiconEmpty : copy.reader.noAttestedBody}
                </p>
              </aside>
            )}

            {result.cap.applied ? (
              <p className="font-anotasi text-xs text-sabbe-ink">
                {copy.reader.capReported(result.cap.maxDepth)}
                {result.cap.dropped > 0 ? ` ${copy.reader.hiddenCount(result.cap.dropped)}.` : ''}
              </p>
            ) : null}

            {/*
              PRD §6.1 asks for a "known words only" default with the unfiltered set
              one toggle away. There is no unfiltered set to toggle to: enumeration
              is lexicon-driven, so every reading it can produce is already a known
              word. Saying so beats shipping a toggle that does nothing.
            */}
            <p className="font-anotasi text-anotasi text-lontar/65">
              {locale === 'id'
                ? 'Tidak ada saklar “hanya kata terdaftar” di sini: penyebutan bacaan digerakkan oleh leksikon, jadi setiap bacaan yang muncul memang kata terdaftar. Himpunan tak terfilter menuntut penyebutan struktural, yang tertahan pada openQuestions.final-inventory.'
                : 'There is no “known words only” switch here: enumeration is lexicon-driven, so every reading shown is already a known word. An unfiltered set would need structural enumeration, which is blocked on openQuestions.final-inventory.'}
            </p>
          </div>
        </Settling>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-3 text-section text-daun-ink">
          <Rhombus size={14} tone="daun" />
          {copy.reader.undetermined}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {CLASSES.map((cls) => (
            <li key={cls} className="border-l-2 border-daun pl-3">
              <span className={eyebrow('daun', 'sm')}>
                {copy.ambiguityClass[cls]}
              </span>
              <span className="block text-xs text-lontar/75">{copy.ambiguityClassBody[cls]}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-lontar/65">{result.basisNote}</p>
      </section>

      {result.ambiguities.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-section text-daun-ink">
            {copy.reader.treeLabel} — {copy.reader.undetermined}
          </h2>
          <AmbiguityPanel
            ambiguities={result.ambiguities}
            inputClusters={result.input.clusters}
            locale={locale}
            emptyMessage={copy.reader.emptyState}
          />
        </section>
      ) : null}

      <AttestedForms locale={locale} onPick={setLontara} />

      {/* Reference tier. Always present (invariant 10) and always complete,
          but ruled off from the answer above it so it reads as apparatus
          rather than as another finding. */}
      <div className="grid gap-8 border-t-2 border-gold/30 pt-8 md:grid-cols-2">
        <section>
          <CodepointView text={result.input.normalized} locale={locale} />
        </section>
        <section className="space-y-3">
          <h3 className={eyebrow()}>
            {copy.writer.traceLabel}
          </h3>
          <TracePanel
            trace={{
              input: result.input,
              // toClusters, not Array.from: the read steps' output spans were
              // computed against grapheme clusters (invariant 7).
              output: {
                text: result.skeleton.latin,
                clusters: toClusters(result.skeleton.latin),
              },
              steps: result.steps,
            }}
            locale={locale}
          />
        </section>
      </div>
    </div>
  )
}
