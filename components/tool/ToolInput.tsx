'use client'

import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'

export type Example = {
  /** What the chip shows. */
  readonly label: string
  /** What pressing it puts in the field. */
  readonly value: string
  /** Rendered in the aksara face — the reader's examples are Lontara. */
  readonly aksara?: boolean
}

/**
 * The field both tools open on, and the first thing anyone sees.
 *
 * Two things it now does that it did not:
 *
 * **A way in.** Both tools used to open on an empty box and a placeholder.
 * The one thing this project has to demonstrate — that `mata`, `matta` and
 * `manta` are written identically — cost the visitor a guess at Bugis
 * orthography before they could see it. The examples are one press.
 *
 * **A way out.** There was no clear button, so on a phone, emptying the field
 * meant holding backspace against a string with no system keyboard for it.
 *
 * The clear button sits outside the input rather than floating inside it: an
 * overlay would either cover the aksara at the right-hand end of a long string
 * or need padding reserved for it permanently, and the field is where the
 * script is meant to be legible.
 */
export function ToolInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  examples,
  locale,
  aksara = false,
  children,
}: {
  id: string
  label: string
  value: string
  onChange: (next: string) => void
  placeholder: string
  examples: readonly Example[]
  locale: Locale
  aksara?: boolean
  children?: React.ReactNode
}) {
  const copy = getCopy(locale)

  return (
    <div className="space-y-3">
      <label htmlFor={id} className="block font-anotasi text-eyebrow uppercase text-gold">
        {label}
      </label>

      <div className="flex items-stretch border-2 border-lontar/30 focus-within:border-gold">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          /* The border lives on the wrapper so the clear button sits inside
             the same frame; the input's own outline would draw a second box. */
          className={`min-w-0 flex-1 bg-transparent px-4 py-3 text-3xl text-lontar placeholder:text-base placeholder:text-lontar/65 focus:outline-none ${
            aksara ? 'aksara bg-lontar/5 placeholder:font-latin' : ''
          }`}
        />
        {value.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange('')}
            /* 44px minimum, which is the smallest reliable touch target. */
            className="flex min-h-[44px] min-w-[44px] items-center justify-center px-3 font-anotasi text-lontar/65 hover:bg-sabbe/15 hover:text-lontar"
          >
            <span aria-hidden="true">✕</span>
            <span className="sr-only">{copy.common.clear}</span>
          </button>
        ) : null}
      </div>

      {examples.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="font-anotasi text-anotasi uppercase tracking-widest text-lontar/65">
            {copy.common.tryExample}
          </span>
          {examples.map((example) => (
            <button
              key={example.value}
              type="button"
              onClick={() => onChange(example.value)}
              className={`min-h-[36px] border border-gold/50 px-3 py-1 text-lontar/85 hover:border-gold hover:bg-gold/10 hover:text-lontar ${
                example.aksara ? 'aksara text-2xl leading-tight' : 'font-anotasi text-sm'
              }`}
            >
              {example.label}
            </button>
          ))}
        </div>
      ) : null}

      {children}
    </div>
  )
}
