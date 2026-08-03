import { notFound } from 'next/navigation'
import { getCopy } from '@/lib/i18n/copy'
import { isLocale, localeParams, type Locale } from '@/lib/i18n/locales'
import { HARD_STRINGS } from '@/lib/rendering/hardStrings'

export function generateStaticParams() {
  return localeParams()
}

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  return { title: getCopy(locale).aksara.conformanceLink }
}

/**
 * The rendering conformance page (PRD §8). It exists to be opened on a real
 * phone: each case shows the string large, the codepoints beneath it, and — in
 * words — what a pass looks like, so someone checking on iOS Safari can decide
 * without an image to compare against.
 *
 * Rendering first (CLAUDE.md, Working style): a correct codepoint sequence that
 * renders as garbage is not done.
 */
export default function ConformancePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const copy = getCopy(locale)

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 space-y-8">
      <header className="space-y-3">
        <h1 className="text-title text-lontar">{copy.aksara.conformanceLink}</h1>
        <p className="max-w-measure text-lead text-lontar/75">
          {locale === 'id'
            ? 'Buka halaman ini di perangkat sungguhan. Setiap kasus menampilkan rangkaiannya besar-besar, titik kodenya di bawah, dan apa yang dihitung lulus. Rangkaian aksara di bawah dibangun dari daftar titik kode, bukan dari teks harfiah, jadi keduanya tidak mungkin berbeda.'
            : 'Open this page on a real device. Each case shows its string large, its codepoints beneath, and what counts as a pass. The aksara below is built from the codepoint list rather than from a literal, so the two cannot drift apart.'}
        </p>
        <dl className="font-anotasi text-xs text-lontar/65 space-y-1">
          <div>
            <dt className="inline text-gold/80">face </dt>
            <dd className="inline">
              {HARD_STRINGS.font.face} {HARD_STRINGS.font.version}
            </dd>
          </div>
          <div>
            <dt className="inline text-gold/80">shipped </dt>
            <dd className="inline">{HARD_STRINGS.font.shipped}</dd>
          </div>
          <div>
            <dt className="inline text-gold/80">features </dt>
            <dd className="inline">{HARD_STRINGS.font.features.join(' · ')}</dd>
          </div>
          <div>
            <dt className="inline text-gold/80">check on </dt>
            <dd className="inline">{HARD_STRINGS.devices.join(' · ')}</dd>
          </div>
        </dl>
      </header>

      <ol className="space-y-px bg-gold/30">
        {HARD_STRINGS.cases.map((c, index) => (
          <li key={c.id} className="bg-grid px-5 py-6 grid gap-4 md:grid-cols-[1fr_1.2fr]">
            <div className="space-y-3">
              <p className="font-anotasi text-xs uppercase tracking-widest text-gold/80">
                {String(index + 1).padStart(2, '0')} · {c.id}
              </p>
              {/* The lontar-leaf band the aksara sits on. PRD §10. */}
              <div className="aksara bg-lontar text-grid px-4 py-5 text-5xl leading-relaxed break-words">
                {c.text}
              </div>
              <p className="font-anotasi text-anotasi leading-relaxed text-lontar/65 break-words">
                {c.codepoints.join(' ')}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <h2 className="font-anotasi text-xs uppercase tracking-widest text-lontar/65">
                  {locale === 'id' ? 'Mengapa kasus ini' : 'Why this case'}
                </h2>
                <p className="mt-1 text-lontar/75">{c.why}</p>
              </div>
              <div>
                <h2 className="font-anotasi text-xs uppercase tracking-widest text-lontar/65">
                  {locale === 'id' ? 'Lulus berarti' : 'A pass means'}
                </h2>
                <p className="mt-1 text-lontar/85">{c.expect}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <section className="border-l-4 border-gold bg-gold/10 px-4 py-3 space-y-2">
        <h2 className="font-anotasi text-xs uppercase tracking-widest text-gold">
          {locale === 'id' ? 'Kasus yang belum diketahui' : 'Cases not yet identified'}
        </h2>
        {HARD_STRINGS.openCases.map((o) => (
          <p key={o.note} className="text-sm text-lontar/85">
            {o.note}
          </p>
        ))}
      </section>
    </div>
  )
}
