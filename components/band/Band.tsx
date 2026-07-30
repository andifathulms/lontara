import type { Band as BandLayout } from '@/lib/engine/band'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { Rhombus } from '@/components/ambiguity/Rhombus'

/**
 * The palm-leaf band (PRD §6.2): aksara on the lontar-leaf ground, the Latin
 * line beneath, connector strokes linking each Latin cluster to the glyph it
 * produced.
 *
 * No word spacing inside the aksara band — that is how the script works, and the
 * connector strokes carry segmentation instead (PRD §10).
 *
 * Discarded information is marked on the connector that dropped it, so loss is
 * visible at the point it happens rather than summarised in a footer. The
 * markers are `daun`, which means ambiguity here and nowhere else.
 */
export function Band({ band, locale }: { band: BandLayout; locale: Locale }) {
  const copy = getCopy(locale)

  if (band.columns.length === 0) {
    return <p className="text-sm text-lontar/55">{copy.writer.emptyState}</p>
  }

  return (
    <figure className="space-y-0 overflow-x-auto">
      {/* The band itself. One row, no gaps — the glyphs sit shoulder to shoulder. */}
      <div className="aksara flex bg-lontar px-4 py-4 text-5xl text-grid">
        {band.columns.map((column) => (
          <span key={column.index} className="flex flex-col items-center">
            {/* An empty trailing column still needs to occupy the band, or the
                connector below it would point at nothing. */}
            <span aria-hidden={column.aksara === ''}>{column.aksara || ' '}</span>
          </span>
        ))}
      </div>

      {/* Connectors. They draw in briefly, in the direction of writing. */}
      <div className="flex">
        {band.columns.map((column, order) => (
          <span key={column.index} className="flex flex-1 flex-col items-center">
            <span
              className={`block w-px ${
                column.losses.length > 0 ? 'bg-daun' : 'bg-gold/60'
              }`}
              style={{
                height: '1.75rem',
                transformOrigin: 'top',
                animation: 'lontara-stroke 220ms ease-out both',
                animationDelay: `${order * 45}ms`,
              }}
              aria-hidden="true"
            />
            {column.losses.length > 0 ? (
              <span className="flex flex-col items-center gap-1 pb-1">
                {column.losses.map((loss) => (
                  <span
                    key={`${loss.ruleId}-${loss.latin}`}
                    className="flex items-center gap-1 whitespace-nowrap"
                    title={loss.ruleId}
                  >
                    <Rhombus size={9} tone="daun" />
                    <span className="font-anotasi text-[11px] text-daun">
                      <span className="line-through">{loss.latin}</span>{' '}
                      {copy.ambiguityClass[loss.ambiguityClass]}
                    </span>
                  </span>
                ))}
              </span>
            ) : null}
          </span>
        ))}
      </div>

      {/* The Latin line. */}
      <div className="flex">
        {band.columns.map((column) => (
          <span
            key={column.index}
            className="flex flex-1 flex-col items-center font-anotasi text-xs text-lontar/80"
          >
            {column.latin}
          </span>
        ))}
      </div>

      <figcaption className="mt-3 font-anotasi text-[11px] text-lontar/45">
        {locale === 'id'
          ? 'Aksara tidak memakai spasi antarkata. Garis penghubung yang menandai batasnya.'
          : 'The script uses no word spacing. The connector strokes mark the boundaries instead.'}
      </figcaption>
    </figure>
  )
}
