'use client'

import { attestedSample, AGREEMENT, CORPUS_PROVENANCE } from '@/lib/corpus/loader'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { eyebrow } from '@/components/chrome/eyebrow'

/**
 * Real attested Lontara, offered to the reader.
 *
 * `mata` is a fine demonstration of the core property and a poor demonstration
 * that this tool is about a living script. These are forms people actually
 * wrote, with a dump URL and a SHA-256 behind them.
 *
 * The pairs the rule set gets *wrong* are shown too, badged, and not sorted to
 * the bottom. A tool that only ever shows you the cases it handles is making a
 * claim about itself that it has not earned — and where this disagrees with
 * attested practice is the most informative thing on the page for anyone
 * evaluating whether to trust it. `tests/corpus.test.ts` holds the reasons,
 * one by one.
 */
const SHOWN = 12

export function AttestedForms({
  locale,
  onPick,
}: {
  locale: Locale
  onPick: (lontara: string) => void
}) {
  const copy = getCopy(locale)
  const forms = attestedSample(SHOWN)

  return (
    <section className="space-y-3 border-t-2 border-gold/30 pt-8">
      <h2 className="text-section text-lontar">{copy.corpus.title}</h2>
      <p className="max-w-measure text-sm text-lontar/85">{copy.corpus.lead}</p>

      <ul className="grid gap-px bg-gold/25 sm:grid-cols-2 lg:grid-cols-3">
        {forms.map((form) => (
          <li key={`${form.lontara}-${form.latin}`} className="bg-grid">
            <button
              type="button"
              onClick={() => onPick(form.lontara)}
              className="flex w-full flex-col items-start gap-1 px-4 py-3 text-left hover:bg-gold/10"
            >
              <span className="aksara text-3xl leading-tight text-lontar">{form.lontara}</span>
              <span className="font-anotasi text-sm text-lontar/85">{form.latin}</span>
              <span className="flex flex-wrap items-center gap-2">
                <span
                  className={`border px-1.5 ${
                    form.agrees
                      ? `border-gold/50 ${eyebrow('gold', 'sm')}`
                      : `border-sabbe ${eyebrow('sabbe', 'sm')}`
                  }`}
                >
                  {form.agrees ? copy.corpus.agrees : copy.corpus.disagrees}
                </span>
                {/* When the rules disagree, say what they produce instead.
                    "differs" without the difference is just a shrug. */}
                {!form.agrees ? (
                  <span className="aksara text-xl text-sabbe-ink">{form.produced}</span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <p className="max-w-measure text-xs text-lontar/75">{copy.corpus.claim}</p>

      {forms.some((f) => !f.agrees) ? (
        <p className="max-w-measure border-l-2 border-sabbe pl-3 text-xs text-lontar/75">
          {copy.corpus.disagreesNote}
        </p>
      ) : null}

      <p className={eyebrow('quiet', 'sm')}>
        {copy.corpus.agreementLine(AGREEMENT.agreeing, AGREEMENT.total)}
      </p>

      {/* Provenance good enough to check the claim later, which is the whole
          standard this repository holds its data to (invariant 13). */}
      <p className="max-w-measure font-anotasi text-anotasi text-lontar/65">
        {CORPUS_PROVENANCE.source} · {CORPUS_PROVENANCE.dumpDate} ·{' '}
        {CORPUS_PROVENANCE.licence} · {CORPUS_PROVENANCE.attribution}
      </p>
    </section>
  )
}
