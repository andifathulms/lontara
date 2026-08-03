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
 */
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
    <div className="space-y-3">
      <h3 className={eyebrow()}>
        {copy.writer.keyboardLabel}
      </h3>

      <div className="space-y-px bg-gold/25 p-px">
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
                  className="flex flex-1 flex-col items-center bg-grid px-2 py-2 hover:bg-gold/10"
                  title={`${letter.unicodeName} · ${codepoint}`}
                >
                  <span className="aksara text-2xl text-lontar">{fromCodepoint(codepoint)}</span>
                  <span className="font-anotasi text-anotasi text-lontar/65">
                    {letter.onset}a
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <p className="font-anotasi text-anotasi text-lontar/65">
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
              className="flex flex-1 flex-col items-center bg-grid px-2 py-2 hover:bg-gold/10 disabled:opacity-30"
              title={`${sign.unicodeName} · ${sign.codepoint}`}
            >
              <span className="aksara text-2xl text-lontar">
                {'◌' + fromCodepoint(sign.codepoint)}
              </span>
              <span className="font-anotasi text-anotasi text-lontar/65">{sign.latin}</span>
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
            className="flex flex-1 flex-col items-center bg-grid px-2 py-2 hover:bg-gold/10"
            title={`${mark.unicodeName} · ${mark.codepoint}`}
          >
            <span className="aksara text-2xl text-lontar">{fromCodepoint(mark.codepoint)}</span>
            <span className="font-anotasi text-anotasi text-lontar/65">
              {mark.unicodeName.replace('BUGINESE ', '').toLowerCase()}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={backspace}
          disabled={value.length === 0}
          className="flex flex-1 items-center justify-center bg-grid px-2 py-2 font-anotasi text-xs text-lontar/75 hover:bg-sabbe/15 disabled:opacity-30"
        >
          ⌫
        </button>
      </div>
    </div>
  )
}
