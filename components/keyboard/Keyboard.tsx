'use client'

import { useCallback, useMemo, useRef, useState } from 'react'

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
 *
 * The `title` on each key is kept deliberately. It sits on a button that
 * already carries an `aria-label`, so a screen reader uses the label and
 * ignores it — no duplication — while a mouse user gets the code point on
 * hover. Nothing is title-only: what a key *is* comes from its label, and the
 * code points are all on the Aksara page. On a non-focusable element a title
 * would be a genuine problem, which is why the band no longer has one.
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

  /*
   * Roving tabindex over every key.
   *
   * The keyboard is 31 buttons and each one was a tab stop, so reaching
   * anything below it cost 31 presses — the exact tax this component exists to
   * remove for people who have no system keyboard for the script. One stop
   * enters the keyboard; arrows move inside it.
   *
   * Disabled keys are skipped rather than landed on. A vowel sign with no
   * letter before it, and backspace with an empty field, are genuinely
   * unavailable — and a disabled button cannot take focus, so a roving index
   * that pointed at one would strand the whole widget. `activeId` therefore
   * falls back to the first available key whenever the remembered position is
   * not focusable.
   */
  const rows = useMemo(() => {
    const consonants = INVENTORY.order.rows.map((row) =>
      row
        .filter((codepoint) => INVENTORY.consonants.some((c) => c.codepoint === codepoint))
        .map((codepoint) => ({ id: codepoint, disabled: false })),
    )
    return [
      ...consonants,
      INVENTORY.vowelSigns.map((sign) => ({ id: sign.codepoint, disabled: !lastIsLetter })),
      [
        ...INVENTORY.punctuation.map((mark) => ({ id: mark.codepoint, disabled: false })),
        { id: 'backspace', disabled: value.length === 0 },
      ],
    ]
  }, [lastIsLetter, value.length])

  const [pos, setPos] = useState<readonly [number, number]>([0, 0])
  const keyRefs = useRef(new Map<string, HTMLButtonElement | null>())

  const remembered = rows[pos[0]]?.[pos[1]]
  const activeId =
    remembered && !remembered.disabled
      ? remembered.id
      : rows.flat().find((k) => !k.disabled)?.id

  const focusKey = useCallback((r: number, c: number) => {
    setPos([r, c])
    keyRefs.current.get(rows[r]?.[c]?.id ?? '')?.focus()
  }, [rows])

  /** Walk the whole layout in reading order, skipping what cannot take focus. */
  const step = useCallback(
    (r: number, c: number, delta: 1 | -1) => {
      const flat = rows.flatMap((row, ri) => row.map((key, ci) => ({ ...key, ri, ci })))
      const at = flat.findIndex((k) => k.ri === r && k.ci === c)
      for (let i = 1; i <= flat.length; i += 1) {
        const next = flat[(at + delta * i + flat.length * i) % flat.length]
        if (next && !next.disabled) return focusKey(next.ri, next.ci)
      }
    },
    [rows, focusKey],
  )

  /** Same column one row away, falling back to the nearest available key there. */
  const jumpRow = useCallback(
    (r: number, c: number, delta: 1 | -1) => {
      for (let i = 1; i <= rows.length; i += 1) {
        const row = rows[(r + delta * i + rows.length * i) % rows.length]
        if (!row) continue
        const candidate =
          (!row[Math.min(c, row.length - 1)]?.disabled && row[Math.min(c, row.length - 1)]) ||
          row.find((k) => !k.disabled)
        if (candidate) {
          return focusKey((r + delta * i + rows.length * i) % rows.length, row.indexOf(candidate))
        }
      }
    },
    [rows, focusKey],
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent, r: number, c: number) => {
      const row = rows[r]
      if (!row) return
      switch (event.key) {
        case 'ArrowRight': event.preventDefault(); return step(r, c, 1)
        case 'ArrowLeft': event.preventDefault(); return step(r, c, -1)
        case 'ArrowDown': event.preventDefault(); return jumpRow(r, c, 1)
        case 'ArrowUp': event.preventDefault(); return jumpRow(r, c, -1)
        case 'Home': {
          event.preventDefault()
          const first = row.findIndex((k) => !k.disabled)
          return first >= 0 ? focusKey(r, first) : undefined
        }
        case 'End': {
          event.preventDefault()
          const last = row.map((k) => k.disabled).lastIndexOf(false)
          return last >= 0 ? focusKey(r, last) : undefined
        }
        default:
          return
      }
    },
    [rows, step, jumpRow, focusKey],
  )

  /** Wires one key into the roving group. */
  const key = (id: string, r: number, c: number) => ({
    ref: (node: HTMLButtonElement | null) => {
      keyRefs.current.set(id, node)
    },
    tabIndex: id === activeId ? 0 : -1,
    onKeyDown: (event: React.KeyboardEvent) => onKeyDown(event, r, c),
    /* Focus arriving from anywhere else — a mouse press, a screen reader
       moving through the group — becomes the new origin. Without this, arrows
       after a click would move relative to the last key the ARROWS touched,
       which is not the one under the cursor. */
    onFocus: () => setPos([r, c]),
  })

  const append = (codepoint: string) => onChange(value + fromCodepoint(codepoint))

  const backspace = () => {
    const points = Array.from(value)
    onChange(points.slice(0, -1).join(''))
  }

  return (
    <div className="space-y-3 print:hidden">
      {/* A label, not a heading. It already names the key group through
          `aria-labelledby` below, and as an <h3> sitting above the reader's
          first <h2> it skipped a level in the page outline for no gain. */}
      <p className={eyebrow()} id="papan-tombol-judul">
        {copy.writer.keyboardLabel}
      </p>

      <div
        className="space-y-px bg-gold/25 p-px"
        role="group"
        aria-labelledby="papan-tombol-judul"
      >
        {INVENTORY.order.rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-px">
            {row
              .filter((codepoint) =>
                INVENTORY.consonants.some((c) => c.codepoint === codepoint),
              )
              .map((codepoint, colIndex) => {
              const letter = INVENTORY.consonants.find((c) => c.codepoint === codepoint)
              if (!letter) return null
              return (
                <button
                  key={codepoint}
                  type="button"
                  {...key(codepoint, rowIndex, colIndex)}
                  onClick={() => append(codepoint)}
                  className={KEY}
                  title={`${letter.unicodeName} · ${codepoint}`}
                  aria-label={`${letter.onset}a — ${letter.unicodeName}`}
                >
                  <span className="aksara text-glyph text-lontar" aria-hidden="true">
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
          {INVENTORY.vowelSigns.map((sign, colIndex) => (
            <button
              key={sign.codepoint}
              type="button"
              {...key(sign.codepoint, INVENTORY.order.rows.length, colIndex)}
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
              <span className="aksara text-glyph text-lontar" aria-hidden="true">
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
        {INVENTORY.punctuation.map((mark, colIndex) => (
          <button
            key={mark.codepoint}
            type="button"
            {...key(mark.codepoint, INVENTORY.order.rows.length + 1, colIndex)}
            onClick={() => append(mark.codepoint)}
            className={KEY}
            title={`${mark.unicodeName} · ${mark.codepoint}`}
            aria-label={mark.unicodeName}
          >
            <span className="aksara text-glyph text-lontar" aria-hidden="true">
              {fromCodepoint(mark.codepoint)}
            </span>
            <span className="font-anotasi text-anotasi text-lontar/65" aria-hidden="true">
              {mark.unicodeName.replace('BUGINESE ', '').toLowerCase()}
            </span>
          </button>
        ))}
        <button
          type="button"
          {...key('backspace', INVENTORY.order.rows.length + 1, INVENTORY.punctuation.length)}
          onClick={backspace}
          disabled={value.length === 0}
          className={`${KEY} text-lontar/85 hover:bg-sabbe/15 disabled:opacity-40`}
        >
          <span aria-hidden="true" className="text-glyph leading-none">
            ⌫
          </span>
          <span className="sr-only">{copy.common.backspace}</span>
        </button>
      </div>
    </div>
  )
}
