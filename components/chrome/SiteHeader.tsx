'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getCopy } from '@/lib/i18n/copy'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/lib/i18n/locales'
import { href } from '@/lib/paths'
import { Rhombus } from '@/components/ambiguity/Rhombus'
import { eyebrow } from '@/components/chrome/eyebrow'

const SECTIONS = ['baca', 'tulis', 'aksara', 'ejaan'] as const

/**
 * A client component for one reason: the nav has to say where you are. Four
 * links with no current-page state is a map with no "you are here", and these
 * pages are long enough to lose the thread scrolling one.
 *
 * Sticky for the same reason. The reader runs to six sections, and having to
 * scroll back to the top to reach the writer is a tax on the one comparison
 * this tool exists to invite.
 */
export function SiteHeader({ locale }: { locale: Locale }) {
  const copy = getCopy(locale)
  const other = LOCALES.find((l) => l !== locale) ?? DEFAULT_LOCALE
  const pathname = usePathname() ?? ''

  /* A subpage is still its section, so `aksara/konformansi` marks `aksara`
     current. Matched on the trailing-slash path, so `/id/baca/` cannot also
     light up for some future `/id/bacaan/`. */
  const isCurrent = (section: string) => pathname.startsWith(href(locale, section))

  return (
    <header className="sticky top-0 z-20 border-b-2 border-gold/40 bg-grid print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-1 px-5 pt-3">
        <Link
          href={href(locale)}
          className="flex items-center gap-2 pb-3 no-underline"
          aria-current={pathname === href(locale) ? 'page' : undefined}
        >
          {/*
            Sulapa' eppa' — the four-cornered form. Structural, not decorative.

            The brand mark proper, with the vowel dot knocked out. Drawn rather
            than served: at this size the kit's own rule applies — "below 40px
            use the solid form, a 5.5% outline disappears" — and drawing it
            keeps the mark on the app's `gold` token instead of the kit's
            near-identical #C9992F, with no rounded tile in an interface that
            pins `borderRadius` to none. See public/icon/BRAND.md.

            18px, not 11: the dot is 8.5% of the mark, so at 11px it was under
            two pixels and simply filled in. This is the smallest size at which
            the mark is still the mark.
          */}
          <Rhombus size={18} tone="gold" dot />
          <span className="text-xl tracking-wide text-lontar">{copy.siteName}</span>
        </Link>

        <nav aria-label={copy.siteName} className="flex flex-wrap">
          {SECTIONS.map((section) => {
            const current = isCurrent(section)
            return (
              <Link
                key={section}
                href={href(locale, section)}
                aria-current={current ? 'page' : undefined}
                /* The current-page mark is a 2px gold rule landing on the
                   header's own border — the same hard line the rest of the
                   interface divides with, not a pill. Colour is not carrying
                   it alone, and `aria-current` carries it for a screen
                   reader. */
                className={`-mb-0.5 border-b-2 px-3 pb-3 pt-1 no-underline hover:text-gold ${
                  current ? 'border-gold text-gold' : 'border-transparent text-lontar/75'
                }`}
              >
                {copy.nav[section]}
              </Link>
            )
          })}
        </nav>

        <Link
          href={href(other)}
          hrefLang={other}
          lang={other}
          className={`ml-auto pb-3 no-underline hover:text-gold ${eyebrow('quiet', 'sm')}`}
        >
          {copy.common.switchLocale}
        </Link>
      </div>
    </header>
  )
}
