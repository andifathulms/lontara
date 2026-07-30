'use client'

import { useMemo, useState } from 'react'
import { enumerate } from '@/lib/engine/enumerate'
import { toClusters } from '@/lib/engine/normalize'
import { LEXICON } from '@/lib/lexicon/loader'
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

  const result = useMemo(() => enumerate(lontara, LEXICON), [lontara])
  const empty = lontara.length === 0

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <label
          htmlFor="lontara-input"
          className="block font-anotasi text-xs uppercase tracking-widest text-gold/80"
        >
          {copy.reader.inputLabel}
        </label>
        <input
          id="lontara-input"
          type="text"
          value={lontara}
          onChange={(event) => setLontara(event.target.value)}
          placeholder={copy.reader.placeholder}
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
          className="aksara w-full border-2 border-lontar/30 bg-lontar/5 px-4 py-3 text-3xl text-lontar placeholder:font-latin placeholder:text-base placeholder:text-lontar/30 focus:border-gold"
        />
        <button
          type="button"
          onClick={() => setShowKeyboard((v) => !v)}
          className="font-anotasi text-xs uppercase tracking-widest text-gold/80 hover:text-gold"
          aria-expanded={showKeyboard}
        >
          {copy.writer.keyboardToggle} {showKeyboard ? '−' : '+'}
        </button>
        <ShareLink locale={locale} value={lontara} />
      </div>

      {showKeyboard ? (
        <Keyboard locale={locale} value={lontara} onChange={setLontara} />
      ) : null}

      <section className="space-y-2">
        <h2 className="font-anotasi text-xs uppercase tracking-widest text-gold/80">
          {copy.reader.skeletonLabel}
        </h2>
        <p className="border-l-4 border-gold/50 bg-gold/5 px-4 py-3 text-2xl text-lontar">
          {empty ? (
            <span className="text-base text-lontar/50">{copy.reader.emptyState}</span>
          ) : (
            result.skeleton.latin || <span className="text-base text-lontar/50">∅</span>
          )}
        </p>
        <p className="text-xs text-lontar/55">
          {locale === 'id'
            ? 'Vokal inheren /a/ di seluruh rangka, tanpa konsonan akhir, tanpa konsonan ganda, tanpa hamzah. Inilah yang benar-benar dinyatakan aksara — bukan bacaan yang dipilih.'
            : 'The inherent vowel /a/ throughout, no finals, no gemination, no glottal stop. This is what the script actually states — not a chosen reading.'}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-anotasi text-xs uppercase tracking-widest text-gold/80">
          {copy.reader.treeLabel}
        </h2>

        {result.readings.length > 0 ? (
          <>
            <p className="font-anotasi text-xs text-lontar/55">
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
          <div className="border-l-4 border-gold bg-gold/10 px-4 py-3 space-y-2">
            <h3 className="font-anotasi text-xs uppercase tracking-widest text-gold">
              {copy.reader.noAttested}
            </h3>
            <p className="text-sm text-lontar/85">
              {result.lexicon.empty ? copy.reader.lexiconEmpty : copy.reader.noAttestedBody}
            </p>
          </div>
        )}

        {result.cap.applied ? (
          <p className="font-anotasi text-xs text-sabbe">
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
        <p className="font-anotasi text-[11px] text-lontar/40">
          {locale === 'id'
            ? 'Tidak ada saklar “hanya kata terdaftar” di sini: penyebutan bacaan digerakkan oleh leksikon, jadi setiap bacaan yang muncul memang kata terdaftar. Himpunan tak terfilter menuntut penyebutan struktural, yang tertahan pada openQuestions.final-inventory.'
            : 'There is no “known words only” switch here: enumeration is lexicon-driven, so every reading shown is already a known word. An unfiltered set would need structural enumeration, which is blocked on openQuestions.final-inventory.'}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-anotasi text-xs uppercase tracking-widest text-daun">
          <Rhombus size={11} tone="daun" />
          {copy.reader.undetermined}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {CLASSES.map((cls) => (
            <li key={cls} className="border-l-2 border-daun pl-3">
              <span className="font-anotasi text-[11px] uppercase tracking-widest text-daun">
                {copy.ambiguityClass[cls]}
              </span>
              <span className="block text-xs text-lontar/70">{copy.ambiguityClassBody[cls]}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-lontar/60">{result.basisNote}</p>
      </section>

      {result.ambiguities.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-anotasi text-xs uppercase tracking-widest text-daun">
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

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <CodepointView text={result.input.normalized} locale={locale} />
        </section>
        <section className="space-y-3">
          <h2 className="font-anotasi text-xs uppercase tracking-widest text-gold/80">
            {copy.writer.traceLabel}
          </h2>
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
