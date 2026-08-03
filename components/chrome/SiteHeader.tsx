import Link from 'next/link'
import { getCopy } from '@/lib/i18n/copy'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/lib/i18n/locales'
import { href } from '@/lib/paths'
import { Rhombus } from '@/components/ambiguity/Rhombus'

const SECTIONS = ['baca', 'tulis', 'aksara', 'ejaan'] as const

export function SiteHeader({ locale }: { locale: Locale }) {
  const copy = getCopy(locale)
  const other = LOCALES.find((l) => l !== locale) ?? DEFAULT_LOCALE

  return (
    <header className="border-b-2 border-gold/40">
      <div className="mx-auto max-w-5xl px-5 py-4 flex flex-wrap items-baseline gap-x-6 gap-y-3">
        <Link href={href(locale)} className="flex items-baseline gap-2 no-underline">
          {/* Sulapa' eppa' — the four-cornered form. Structural, not decorative. */}
          <Rhombus size={11} tone="gold" />
          <span className="text-lontar text-xl tracking-wide">{copy.siteName}</span>
        </Link>

        <nav aria-label={copy.siteName} className="flex flex-wrap gap-x-5 gap-y-1">
          {SECTIONS.map((section) => (
            <Link
              key={section}
              href={href(locale, section)}
              className="text-lontar/75 hover:text-gold no-underline"
            >
              {copy.nav[section]}
            </Link>
          ))}
        </nav>

        <Link
          href={href(other)}
          hrefLang={other}
          className="ml-auto font-anotasi text-xs uppercase tracking-widest text-lontar/65 hover:text-gold no-underline"
        >
          {copy.common.switchLocale}
        </Link>
      </div>
    </header>
  )
}
