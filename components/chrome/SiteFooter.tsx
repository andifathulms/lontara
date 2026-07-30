import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { REPOSITORY_URL } from '@/lib/paths'

/**
 * The non-authority statement is footer furniture on every page, not a page of
 * its own that nobody visits (PRD §9). Nulisa is linked warmly, because it is
 * the better tool for Javanese and Balinese and saying so costs nothing.
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  const copy = getCopy(locale)

  return (
    <footer className="mt-16 border-t-2 border-gold/40">
      <div className="mx-auto max-w-5xl px-5 py-8 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="font-anotasi text-xs uppercase tracking-widest text-sabbe">
            {copy.disclaimer.title}
          </h2>
          <p className="mt-2 text-sm text-lontar/70">{copy.disclaimer.body}</p>
        </div>

        <div className="text-sm text-lontar/70">
          <p>
            {locale === 'id'
              ? 'Untuk aksara Jawa dan Bali, '
              : 'For Javanese and Balinese, '}
            <a
              href="https://bennylin.github.io/transliterasijawa/"
              className="text-gold underline decoration-gold/40 underline-offset-4"
              rel="noopener noreferrer"
              target="_blank"
            >
              Nulisa
            </a>
            {locale === 'id'
              ? ' adalah alat yang lebih baik dan sudah menanganinya sejak 2012.'
              : ' is the better tool and has covered them since 2012.'}
          </p>
          <p className="mt-3">
            <a
              href={REPOSITORY_URL}
              className="font-anotasi text-xs uppercase tracking-widest text-lontar/55 hover:text-gold no-underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              {copy.common.sourceCode}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
