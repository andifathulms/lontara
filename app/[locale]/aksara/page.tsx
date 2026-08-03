import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCopy } from '@/lib/i18n/copy'
import { isLocale, localeParams, type Locale } from '@/lib/i18n/locales'
import { href } from '@/lib/paths'
import { INVENTORY, fromCodepoint } from '@/lib/rules/inventory'
import { eyebrow } from '@/components/chrome/eyebrow'
import { Page, PageHeader } from '@/components/chrome/Page'

export function generateStaticParams() {
  return localeParams()
}

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  return { title: getCopy(locale).aksara.title, description: getCopy(locale).aksara.lead }
}

const DOTTED_CIRCLE = '◌'

export default function AksaraPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const copy = getCopy(locale)
  const { columns } = copy.aksara

  return (
    <Page>
      <PageHeader title={copy.aksara.title} lead={copy.aksara.lead}>
        <p className="max-w-measure text-sm text-lontar/75">{copy.aksara.inherentVowel}</p>
        <p className="font-anotasi text-xs text-lontar/65">
          {INVENTORY.source.citation}
        </p>
        <Link
          href={href(locale, 'aksara/konformansi')}
          className={`inline-block no-underline ${eyebrow()}`}
        >
          {copy.aksara.conformanceLink} →
        </Link>
      </PageHeader>

      {/* No virama. This is the fact the whole project follows from, so it is
          stated on the reference page and not only in the prose. */}
      <aside className="border-l-4 border-sabbe bg-sabbe/10 px-4 py-3">
        <h2 className={eyebrow('sabbe')}>
          {locale === 'id' ? 'Tidak ada virama' : 'No virama'}
        </h2>
        <p className="mt-1 text-sm text-lontar/85">{INVENTORY.block.viramaNote}</p>
      </aside>

      <section className="space-y-4">
        <h2 className="text-section text-lontar">{copy.aksara.consonants}</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gold/40 text-left">
                <th className={`py-2 pr-4 ${eyebrow()}`}>
                  {columns.glyph}
                </th>
                <th className={`py-2 pr-4 ${eyebrow()}`}>
                  {columns.latin}
                </th>
                <th className={`py-2 pr-4 ${eyebrow()}`}>
                  {columns.codepoint}
                </th>
                <th className={`py-2 pr-4 ${eyebrow()}`}>
                  {columns.unicodeName}
                </th>
                <th className={`py-2 ${eyebrow()}`}>
                  {columns.note}
                </th>
              </tr>
            </thead>
            <tbody>
              {INVENTORY.consonants.map((c) => (
                <tr key={c.codepoint} className="border-b border-lontar/15">
                  <td className="aksara py-2 pr-4 text-3xl text-lontar">
                    {fromCodepoint(c.codepoint)}
                  </td>
                  <td className="py-2 pr-4 text-lontar">{`${c.onset}a`}</td>
                  <td className="py-2 pr-4 font-anotasi text-xs text-lontar/65">{c.codepoint}</td>
                  <td className="py-2 pr-4 font-anotasi text-xs text-lontar/65">
                    {c.unicodeName}
                  </td>
                  <td className="py-2 text-xs text-lontar/75">
                    {c.onset === ''
                      ? locale === 'id'
                        ? 'Pengusung vokal — vokal mandiri /a/.'
                        : 'Vowel carrier — the independent vowel /a/.'
                      : c.prenasal
                        ? locale === 'id'
                          ? 'Huruf pranasal — gugus nasal+hambat tertulis.'
                          : 'Prenasal letter — a written nasal+stop cluster.'
                        : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-section text-lontar">{copy.aksara.vowelSigns}</h2>
        <p className="max-w-measure text-sm text-lontar/75">
          {locale === 'id'
            ? 'Setiap tanda ditampilkan pada lingkaran bertitik (U+25CC), supaya perilaku penggabungannya terlihat langsung dan tidak perlu dipercayai dari tabel.'
            : 'Each sign is shown on a dotted circle (U+25CC), so its combining behaviour is visible directly rather than taken on trust from a table.'}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gold/40 text-left">
                <th className={`py-2 pr-4 ${eyebrow()}`}>
                  {columns.glyph}
                </th>
                <th className={`py-2 pr-4 ${eyebrow()}`}>
                  ka + {columns.glyph.toLowerCase()}
                </th>
                <th className={`py-2 pr-4 ${eyebrow()}`}>
                  {columns.latin}
                </th>
                <th className={`py-2 pr-4 ${eyebrow()}`}>
                  {columns.codepoint}
                </th>
                <th className={`py-2 ${eyebrow()}`}>
                  {columns.note}
                </th>
              </tr>
            </thead>
            <tbody>
              {INVENTORY.vowelSigns.map((v) => (
                <tr key={v.codepoint} className="border-b border-lontar/15">
                  <td className="aksara py-2 pr-4 text-3xl text-lontar">
                    {DOTTED_CIRCLE + fromCodepoint(v.codepoint)}
                  </td>
                  <td className="aksara py-2 pr-4 text-3xl text-lontar">
                    {fromCodepoint('U+1A00') + fromCodepoint(v.codepoint)}
                  </td>
                  <td className="py-2 pr-4 text-lontar">{`k${v.latin}`}</td>
                  <td className="py-2 pr-4 font-anotasi text-xs text-lontar/65">
                    <div>{v.codepoint}</div>
                    <div className="text-lontar/65">
                      {v.generalCategory} · ccc {v.combiningClass}
                    </div>
                  </td>
                  <td className="py-2 text-xs text-lontar/75">
                    <div>{v.positionSource}</div>
                    {v.latinNote ? (
                      <div className="mt-1 text-gold/80">{v.latinNote}</div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-section text-lontar">{copy.aksara.punctuation}</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gold/40 text-left">
                <th className={`py-2 pr-4 ${eyebrow()}`}>
                  {columns.glyph}
                </th>
                <th className={`py-2 pr-4 ${eyebrow()}`}>
                  {columns.codepoint}
                </th>
                <th className={`py-2 pr-4 ${eyebrow()}`}>
                  {columns.unicodeName}
                </th>
                <th className={`py-2 ${eyebrow()}`}>
                  {columns.latin}
                </th>
              </tr>
            </thead>
            <tbody>
              {INVENTORY.punctuation.map((p) => (
                <tr key={p.codepoint} className="border-b border-lontar/15">
                  <td className="aksara py-2 pr-4 text-3xl text-lontar">
                    {fromCodepoint(p.codepoint)}
                  </td>
                  <td className="py-2 pr-4 font-anotasi text-xs text-lontar/65">{p.codepoint}</td>
                  <td className="py-2 pr-4 font-anotasi text-xs text-lontar/65">
                    {p.unicodeName}
                  </td>
                  <td className="py-2 text-xs text-gold/80">
                    {p.latin ?? copy.common.unverified}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="max-w-measure text-sm text-lontar/75">
          {locale === 'id'
            ? 'Padanan Latin untuk kedua tanda ini belum dapat dirujuk di repositori ini, jadi dibiarkan kosong daripada ditebak. Lihat halaman Ejaan.'
            : 'A Latin representation for either mark cannot yet be cited in this repository, so it is left blank rather than guessed. See the Ejaan page.'}
        </p>
      </section>
    </Page>
  )
}
