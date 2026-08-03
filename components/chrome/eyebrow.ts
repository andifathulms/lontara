/**
 * The small letterspaced label that heads almost every section, panel and
 * badge in this interface.
 *
 * There were 63 of them written by hand in ten different combinations —
 * `text-xs` and `text-[10px]` and `text-[11px]`, `text-gold` and
 * `text-gold/80`, `tracking-widest` sometimes forgotten. Two of those
 * combinations were illegible and the rest were merely inconsistent. One
 * definition, two sizes, four tones.
 *
 * `md` heads a section. `sm` is for a badge or an inline annotation inside
 * dense output — the reading tree and the band — where 12px would wrap.
 * Letterspacing comes from the `eyebrow` step in the type scale, so it can
 * never be left off.
 */
export type EyebrowTone = 'gold' | 'daun' | 'sabbe' | 'quiet'

const TONE: Record<EyebrowTone, string> = {
  gold: 'text-gold',
  /* daun and sabbe set type here, so they take the measured text tier —
     see the contrast table in globals.css. */
  daun: 'text-daun-ink',
  sabbe: 'text-sabbe-ink',
  quiet: 'text-lontar/65',
}

export function eyebrow(tone: EyebrowTone = 'gold', size: 'md' | 'sm' = 'md'): string {
  const step = size === 'md' ? 'text-eyebrow' : 'text-anotasi tracking-widest'
  return `font-anotasi ${step} uppercase ${TONE[tone]}`
}
