import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { REVIEWER_GATE_MET, CONSENTING_REVIEWERS } from '@/lib/gate'
import { eyebrow } from '@/components/chrome/eyebrow'

/**
 * Two notices that must be unmissable rather than tucked away:
 *
 *  - `NotTranslatorNotice` — invariant 16. Existing sites blur this and users
 *    arrive confused, so it sits above the tools, not below them.
 *  - `ReviewerGateNotice` — PRD §9. Rendered while the gate is unmet. When a
 *    reviewer is named in reviewers.json this flips to a credit instead.
 */
export function NotTranslatorNotice({ locale }: { locale: Locale }) {
  const copy = getCopy(locale)
  return (
    <aside className="border-l-4 border-sabbe bg-sabbe/10 px-4 py-3">
      <h2 className={eyebrow('sabbe')}>
        {copy.notTranslator.title}
      </h2>
      <p className="mt-1 text-sm text-lontar/85">{copy.notTranslator.body}</p>
    </aside>
  )
}

export function ReviewerGateNotice({
  locale,
  strong = false,
}: {
  locale: Locale
  strong?: boolean
}) {
  const copy = getCopy(locale)

  if (REVIEWER_GATE_MET) {
    return (
      <aside className="border-l-4 border-gold bg-gold/10 px-4 py-3">
        <h2 className={eyebrow()}>
          {locale === 'id' ? 'Ditelaah oleh' : 'Reviewed by'}
        </h2>
        <ul className="mt-1 text-sm text-lontar/85">
          {CONSENTING_REVIEWERS.map((r) => (
            <li key={r.name}>
              {r.name} — {r.affiliation} · <span className="text-lontar/65">{r.scope}</span>
            </li>
          ))}
        </ul>
      </aside>
    )
  }

  return (
    <aside className="border-l-4 border-gold bg-gold/10 px-4 py-3">
      <h2 className={eyebrow()}>
        {copy.gate.title}
      </h2>
      <p className="mt-1 text-sm text-lontar/85">{copy.gate.body}</p>
      {strong ? (
        <p className="mt-2 font-anotasi text-xs text-sabbe-ink">{copy.gate.blocked}</p>
      ) : null}
    </aside>
  )
}
