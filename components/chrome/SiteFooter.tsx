import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { REPOSITORY_URL } from '@/lib/paths'
import { OfflineReady } from '@/components/chrome/OfflineReady'
import { Rhombus } from '@/components/ambiguity/Rhombus'

/**
 * The non-authority statement is footer furniture on every page, not a page of
 * its own that nobody visits (PRD §9). Nulisa is linked warmly, because it is
 * the better tool for Javanese and Balinese and saying so costs nothing.
 *
 * The disclaimer takes two of three columns rather than half of two. It is the
 * reason this footer exists, and at equal width with a link list it read as
 * boilerplate to be skipped.
 */
function External({
  href,
  children,
  locale,
  className = 'text-gold underline decoration-gold/40 underline-offset-4',
}: {
  href: string
  children: React.ReactNode
  locale: Locale
  className?: string
}) {
  const copy = getCopy(locale)
  return (
    <a href={href} className={className} rel="noopener noreferrer" target="_blank">
      {children}
      {/* Leaving the site is a state change, and saying so costs one glyph. */}
      <span aria-hidden="true"> ↗</span>
      <span className="sr-only"> ({copy.common.opensInNewTab})</span>
    </a>
  )
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const copy = getCopy(locale)

  return (
    <footer className="mt-20 border-t-2 border-gold/40">
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="flex items-center gap-2 font-anotasi text-eyebrow uppercase text-sabbe-ink">
            <Rhombus size={9} tone="sabbe" />
            {copy.disclaimer.title}
          </h2>
          <p className="mt-2 max-w-measure text-sm text-lontar/75">{copy.disclaimer.body}</p>
        </div>

        <div className="space-y-4 text-sm text-lontar/75">
          <p>
            {locale === 'id' ? 'Untuk aksara Jawa dan Bali, ' : 'For Javanese and Balinese, '}
            <External href="https://bennylin.github.io/transliterasijawa/" locale={locale}>
              Nulisa
            </External>
            {locale === 'id'
              ? ' adalah alat yang lebih baik dan sudah menanganinya sejak 2012.'
              : ' is the better tool and has covered them since 2012.'}
          </p>

          <p>
            <External
              href={REPOSITORY_URL}
              locale={locale}
              className="font-anotasi text-anotasi uppercase tracking-widest text-lontar/65 underline decoration-lontar/30 underline-offset-4 hover:text-gold"
            >
              {copy.common.sourceCode}
            </External>
          </p>

          <OfflineReady locale={locale} />
        </div>
      </div>
    </footer>
  )
}
