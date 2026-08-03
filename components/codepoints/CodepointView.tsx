import { UNICODE_NAME_BY_CHAR, toCodepoint } from '@/lib/rules/inventory'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'

/**
 * Always available (invariant 10, PRD §6.8). Rendering will fail on some device;
 * the codepoints are the fallback that still carries the answer.
 *
 * Which is why this is a plain always-rendered list and not behind a toggle: a
 * disclosure that needs the aksara to render in order to be found would defeat
 * the purpose.
 */
export function CodepointView({ text, locale }: { text: string; locale: Locale }) {
  const copy = getCopy(locale)

  // Iterate code points, never code units (invariant 7). Each vowel sign is its
  // own code point and must be listed as one.
  const points = Array.from(text)

  return (
    <div>
      <h3 className="font-anotasi text-xs uppercase tracking-widest text-gold/80">
        {copy.common.codepointView}
      </h3>
      {points.length === 0 ? (
        <p className="mt-1 text-sm text-lontar/65">{copy.writer.emptyState}</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {points.map((char, index) => (
            <li
              key={`${index}-${char}`}
              className="flex flex-wrap items-baseline gap-x-3 font-anotasi text-anotasi text-lontar/65"
            >
              <span className="text-gold/80">{toCodepoint(char)}</span>
              <span>{UNICODE_NAME_BY_CHAR.get(char) ?? '—'}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 font-anotasi text-anotasi text-lontar/65">
        {locale === 'id'
          ? 'Selalu tersedia. Kalau aksara gagal tampil di perangkat Anda, titik kode ini tetap membawa jawabannya.'
          : 'Always available. If the aksara fails to render on your device, these codepoints still carry the answer.'}
      </p>
    </div>
  )
}
