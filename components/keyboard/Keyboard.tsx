'use client'

import { INVENTORY, fromCodepoint, CONSONANT_BY_CHAR } from '@/lib/rules/inventory'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { eyebrow } from '@/components/chrome/eyebrow'

/**
 * The on-screen Lontara keyboard (PRD §6.5). There is no system Lontara keyboard
 * on most devices, and this removes the main practical barrier to anyone using
 * the reader at all.
 *
 * Laid out in traditional *ka-ga-nga* order, which is the codepoint order — the
 * rows come from `inventory.json` rather than being hand-written here, so the
 * layout cannot drift from the inventory.
 *
 * Vowel signs are modifiers: they apply to whatever letter was typed last, which
 * is how the script works. A sign pressed with no letter before it is refused
 * rather than inserted stranded.
 *
 * Every key names itself to assistive technology. A grid of glyphs a screen
 * reader can only announce as "button" is not a keyboard — and the people
 * using one here are the least likely to have the script installed at all.
 */
const KEY =
  'flex min-h-[52px] flex-1 flex-col items-center justify-center bg-grid px-2 py-2 hover:bg-gold/10 active:bg-gold/20'

export function Keyboard({
  locale,
  value,
  onChange,
}: {
  locale: Locale
  value: string
  onChange: (next: string) => void
}) {
  const copy = getCopy(locale)

  const lastIsLetter = (() => {
    const points = Array.from(value)
    const last = points[points.length - 1]
    return last !== undefined && CONSONANT_BY_CHAR.has(last)
  })()

  const append = (codepoint: string) => onChange(value + fromCodepoint(codepoint))

  const backspace = () => {
    const points = Array.from(value)
    onChange(points.slice(0, -1).join(''))
  }

  return (
    <div className="space-y-3 print:hidden">
      <h3 className={eyebrow()} id="papan-tombol-judul">
        {copy.writer.keyboardLabel}
      </h3>

      <div
        className="space-y-px bg-gold/25 p-px"
        role="group"
        aria-labelledby="papan-tombol-judul"
      >
        {INVENTORY.order.rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-px">
            {row.map((codepoint) => {
              const letter = INVENTORY.consonants.find((c) => c.codepoint === codepoint)
              if (!letter) return null
              return (
                <button
                  key={codepoint}
                  type="button"
                  onClick={() => append(codepoint)}
                  className={KEY}
                  title={`${letter.unicodeName} · ${codepoint}`}
                  aria-label={`${letter.onset}a — ${letter.unicodeName}`}
                >
                  <span className="aksara text-2xl text-lontar" aria-hidden="true">
                    {fromCodepoint(codepoint)}
                  </span>
                  <span className="font-anotasi text-anotasi text-lontar/65" aria-hidden="true">
                    {letter.onset}a
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <p id="tanda-vokal-catatan" className="font-anotasi text-anotasi text-lontar/65">
          {locale === 'id'
            ? 'Tanda vokal mengubah huruf terakhir. Vokal inheren /a/ tidak punya tanda.'
            : 'A vowel sign modifies the last letter. The inherent vowel /a/ has no sign.'}
        </p>
        <div className="flex gap-px bg-gold/25 p-px">
          {INVENTORY.vowelSigns.map((sign) => (
            <button
              key={sign.codepoint}
              type="button"
              onClick={() => append(sign.codepoint)}
              disabled={!lastIsLetter}
              /* Refused rather than inserted stranded — and the note above is
                 wired to the key with `aria-describedby`, so a screen reader
                 reads the reason instead of leaving "dimmed, unavailable"
                 unexplained. 40% is the lowest this tier stays readable while
                 still reading as unavailable; 30% was neither. */
              className={`${KEY} disabled:opacity-40`}
              title={`${sign.unicodeName} · ${sign.codepoint}`}
              aria-label={`${sign.latin} — ${sign.unicodeName}`}
              aria-describedby="tanda-vokal-catatan"
            >
              <span className="aksara text-2xl text-lontar" aria-hidden="true">
                {'◌' + fromCodepoint(sign.codepoint)}
              </span>
              <span className="font-anotasi text-anotasi text-lontar/65" aria-hidden="true">
                {sign.latin}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-px bg-gold/25 p-px">
        {INVENTORY.punctuation.map((mark) => (
          <button
            key={mark.codepoint}
            type="button"
            onClick={() => append(mark.codepoint)}
            className={KEY}
            title={`${mark.unicodeName} · ${mark.codepoint}`}
            aria-label={mark.unicodeName}
          >
            <span className="aksara text-2xl text-lontar" aria-hidden="true">
              {fromCodepoint(mark.codepoint)}
            </span>
            <span className="font-anotasi text-anotasi text-lontar/65" aria-hidden="true">
              {mark.unicodeName.replace('BUGINESE ', '').toLowerCase()}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={backspace}
          disabled={value.length === 0}
          className={`${KEY} text-lontar/85 hover:bg-sabbe/15 disabled:opacity-40`}
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            ⌫
          </span>
          <span className="sr-only">{copy.common.backspace}</span>
        </button>
      </div>
    </div>
  )
}
