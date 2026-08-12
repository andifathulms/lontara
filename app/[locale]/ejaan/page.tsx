import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCopy } from '@/lib/i18n/copy'
import { pageMetadata } from '@/lib/metadata'
import { isLocale, localeParams, type Locale } from '@/lib/i18n/locales'
import { href } from '@/lib/paths'
import { INVENTORY } from '@/lib/rules/inventory'
import { RULE_SET, RULES, PROVISIONAL_RULES } from '@/lib/rules/loader'
import { openQuestionImpact } from '@/lib/analysis/impact'
import { LEXICON } from '@/lib/lexicon/loader'
import { AMBIGUITY_CLASSES } from '@/lib/rules/schema'
import { Rhombus } from '@/components/ambiguity/Rhombus'
import { eyebrow } from '@/components/chrome/eyebrow'
import { ScrollRegion } from '@/components/chrome/ScrollRegion'
import { Page, PageHeader } from '@/components/chrome/Page'

export function generateStaticParams() {
  return localeParams()
}

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  const copy = getCopy(locale)
  return pageMetadata({ locale, segments: ['ejaan'], title: copy.ejaan.title, description: copy.ejaan.lead })
}

/**
 * Orthography disclosure (PRD §6.7). A blocking deliverable for M2, not
 * documentation to write later: the Latin side needs as much specification as
 * the Lontara side, because the ambiguity classes are defined against Latin
 * distinctions and an underspecified Latin orthography makes the whole
 * enumeration unsound.
 *
 * Rendered from `rules.json` and `inventory.json`, so it cannot drift from what
 * the engine actually does. If a rule is provisional, this page says so because
 * the data says so.
 */
export default function EjaanPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const copy = getCopy(locale)
  const id = locale === 'id'

  /* Sized at build time from the shipped engine. Sorted by leverage: an unsized
     question has no claim on a reviewer's attention ahead of one that decides
     565 forms, so it sorts last rather than first. */
  const IMPACT = [...openQuestionImpact(LEXICON)].sort(
    (a, b) => Number(b.sized) - Number(a.sized) || b.affected - a.affected,
  )

  return (
    <Page>
      <PageHeader title={copy.ejaan.title} lead={copy.ejaan.lead}>
        <p className="font-anotasi text-xs text-lontar/65">
          rules.json v{RULE_SET.version} · {RULE_SET.reviewStatus} · {RULES.length}{' '}
          {id ? 'aturan' : 'rules'}
        </p>
      </PageHeader>

      <aside aria-labelledby="ejaan-scope" className="border-l-4 border-sabbe bg-sabbe/10 px-4 py-3">
        <p id="ejaan-scope" className={eyebrow('sabbe')}>
          {id ? 'Apa yang belum ada di sini' : 'What is not here'}
        </p>
        <p className="mt-1 text-sm text-lontar/85">
          {id
            ? 'Halaman ini belum dapat menyebut satu pun ejaan Latin Bugis yang baku, karena belum ada satu pun sumber ejaan yang dibaca. Yang ada di bawah diturunkan dari pengkodean Unicode — nama karakter dan ketiadaan virama — bukan dari kamus, buku ajar, atau ketetapan Badan Bahasa. Itu perbedaan yang besar, dan tidak disamarkan.'
            : 'This page cannot yet name a single standard Bugis Latin orthography, because no orthography source has been read. What follows is derived from the Unicode encoding — character names and the absence of a virama — and not from a dictionary, a textbook, or a Badan Bahasa ruling. That is a large difference and it is not being blurred.'}
        </p>
      </aside>

      {/* What IS specified. */}
      <section className="space-y-4">
        <h2 className="text-section text-lontar">
          {id ? 'Yang sudah ditetapkan di sini' : 'What is specified here'}
        </h2>

        <ScrollRegion labelledBy="ejaan-onset-caption">
          <table className="w-full border-collapse text-sm">
            <caption id="ejaan-onset-caption" className="pb-2 text-left text-xs text-lontar/65">
              {id
                ? 'Onset Latin diambil dari nama karakter Unicode setiap huruf. Vokal inheren /a/ tidak ditulis dengan tanda.'
                : 'Latin onsets are taken from each letter’s Unicode character name. The inherent vowel /a/ has no sign.'}
            </caption>
            <thead>
              <tr className="border-b-2 border-gold/40 text-left">
                <th className={`py-2 pr-4 ${eyebrow()}`}>
                  {id ? 'Onset' : 'Onset'}
                </th>
                <th className={`py-2 pr-4 ${eyebrow()}`}>
                  {id ? 'Huruf' : 'Letter'}
                </th>
                <th className={`py-2 ${eyebrow()}`}>
                  {id ? 'Nama Unicode' : 'Unicode name'}
                </th>
              </tr>
            </thead>
            <tbody>
              {INVENTORY.consonants.map((c) => (
                <tr key={c.codepoint} className="border-b border-lontar/15">
                  <td className="py-1.5 pr-4 font-anotasi text-lontar">
                    {c.onset === '' ? '∅' : c.onset}
                    {c.prenasal ? (
                      <span className="ml-2 text-anotasi uppercase tracking-widest text-gold/80">
                        {id ? 'pranasal' : 'prenasal'}
                      </span>
                    ) : null}
                  </td>
                  <td className="aksara py-1.5 pr-4 text-aksara-inline text-lontar">
                    {String.fromCodePoint(Number.parseInt(c.codepoint.slice(2), 16))}
                  </td>
                  <td className="py-1.5 font-anotasi text-anotasi text-lontar/65">
                    {c.unicodeName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>

        <ScrollRegion labelledBy="ejaan-vokal-caption">
          <table className="w-full border-collapse text-sm">
            {/* A caption rather than a name borrowed from the h2 above: that
                heading covers both tables on this page, so it names neither.
                This says what only this table holds. */}
            <caption id="ejaan-vokal-caption" className="pb-2 text-left text-xs text-lontar/65">
              {id
                ? 'Setiap tanda vokal, titik kodenya, dan dasar bentuk Latin yang dipakai di sini.'
                : 'Each vowel sign, its codepoint, and the basis for the Latin value used here.'}
            </caption>
            <thead>
              <tr className="border-b-2 border-gold/40 text-left">
                <th className={`py-2 pr-4 ${eyebrow()}`}>
                  {id ? 'Vokal' : 'Vowel'}
                </th>
                <th className={`py-2 pr-4 ${eyebrow()}`}>
                  {id ? 'Tanda' : 'Sign'}
                </th>
                <th className={`py-2 ${eyebrow()}`}>
                  {id ? 'Dasar' : 'Basis'}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-lontar/15">
                <td className="py-1.5 pr-4 font-anotasi text-lontar">a</td>
                <td className="py-1.5 pr-4 font-anotasi text-anotasi text-lontar/65">
                  {id ? 'tanpa tanda — vokal inheren' : 'no sign — the inherent vowel'}
                </td>
                <td className="py-1.5 text-xs text-lontar/65">{INVENTORY.inherentVowel.note}</td>
              </tr>
              {INVENTORY.vowelSigns.map((v) => (
                <tr key={v.codepoint} className="border-b border-lontar/15">
                  <td className="py-1.5 pr-4 font-anotasi text-lontar">
                    {v.latin}
                    {v.latinNote ? (
                      <span className="ml-2 text-anotasi uppercase tracking-widest text-sabbe-ink">
                        {copy.ejaan.provisional}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-1.5 pr-4 font-anotasi text-anotasi text-lontar/65">
                    {v.codepoint} · {v.unicodeName}
                  </td>
                  <td className="py-1.5 text-xs text-lontar/65">
                    {v.latinNote ?? v.positionSource}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      </section>

      {/* The Latin distinctions the classes are defined against. */}
      <section className="space-y-4 border-t-2 border-gold/30 pt-8">
        <h2 className="text-section text-lontar">
          {id
            ? 'Pembeda Latin yang menjadi dasar keempat kelas'
            : 'The Latin distinctions the four classes are defined against'}
        </h2>
        <p className="max-w-measure text-sm text-lontar/75">
          {id
            ? 'Sisi Latin harus menyandikan konsonan akhir, konsonan ganda, pranasalisasi, dan hamzah — justru pembeda-pembeda inilah yang menjadi acuan penetapan kelas kerancuan. Kalau sisi Latin kabur, seluruh penyebutan bacaan menjadi tidak sahih.'
            : 'The Latin side has to encode final consonants, gemination, prenasalisation and the glottal stop — precisely the distinctions the ambiguity classes are defined against. If the Latin side is vague, the whole enumeration is unsound.'}
        </p>
        <dl className="grid gap-px bg-daun/30 sm:grid-cols-2">
          {AMBIGUITY_CLASSES.map((cls) => {
            const declared = RULE_SET.ambiguityClasses[cls]
            const lossRule = RULES.find((r) => r.type === 'loss' && r.ambiguityClass === cls)
            return (
              <div key={cls} className="bg-grid px-4 py-3">
                <dt className="flex items-center gap-2">
                  <Rhombus size={11} tone="daun" />
                  <span className={eyebrow('daun')}>
                    {copy.ambiguityClass[cls]}
                  </span>
                </dt>
                <dd className="mt-1 space-y-1">
                  <p className="text-sm text-lontar/85">{declared?.description}</p>
                  <p className="font-anotasi text-anotasi text-lontar/65">
                    {lossRule?.id} · {lossRule?.status}
                  </p>
                  <p className="text-xs text-lontar/65">{declared?.citation}</p>
                </dd>
              </div>
            )
          })}
        </dl>
      </section>

      {/* Where practice diverges — the provisional rules. */}
      <section className="space-y-4 border-t-2 border-gold/30 pt-8">
        <h2 className="text-section text-lontar">
          {id ? 'Tempat praktik berbeda-beda' : 'Where practice diverges'}
        </h2>
        {PROVISIONAL_RULES.length === 0 ? (
          <p className="text-sm text-lontar/75">
            {id ? 'Tidak ada aturan sementara.' : 'No provisional rules.'}
          </p>
        ) : (
          <ul className="space-y-px bg-sabbe/25">
            {PROVISIONAL_RULES.map((r) => (
              <li key={r.id} className="bg-grid px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-anotasi text-xs text-gold">{r.id}</span>
                  <span className={`border border-sabbe px-1.5 ${eyebrow('sabbe', 'sm')}`}>
                    {copy.trace.provisionalBadge}
                  </span>
                </div>
                <p className="mt-1 text-sm text-lontar/85">{r.description}</p>
                <p className="mt-1 text-xs text-lontar/65">{r.citation}</p>
                {r.note ? <p className="mt-1 text-xs text-sabbe-ink">{r.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Open questions. */}
      <section className="space-y-4 border-t-2 border-gold/30 pt-8">
        <h2 className="text-section text-lontar">{copy.ejaan.openQuestions}</h2>
        <p className="max-w-measure text-sm text-lontar/75">
          {id
            ? 'Tidak ditebak. Masing-masing menyebut siapa yang harus ditanya — dan berapa banyak bentuk yang jawabannya menentukan.'
            : 'Not guessed at. Each one names who to ask — and how many forms its answer decides.'}
        </p>

        {/*
          Ordered by how much each question decides, not by the order they were
          written down. A reviewer with twenty minutes should meet the question
          with the most leverage first; that ordering is the point of sizing
          them at all.
        */}
        <p className="max-w-measure text-sm text-lontar/65">
          {id
            ? `Diurutkan menurut jumlah bentuk yang terpengaruh, dari ${IMPACT[0]?.total.toLocaleString('id') ?? 0} bentuk berbeda di leksikon. Angka ini menyebutkan bentuk mana yang bergantung pada jawaban — bukan akan jadi apa bentuk itu nanti. Untuk mengetahuinya, pertanyaannya harus dijawab dahulu.`
            : `Ordered by how many forms each affects, out of the ${IMPACT[0]?.total.toLocaleString('en') ?? 0} distinct forms in the lexicon. The number says which forms depend on the answer — not what they would become. Knowing that requires the answer first.`}
        </p>

        <ol className="space-y-px bg-gold/25">
          {IMPACT.map(({ question: q, sized, affected, total, samples, basis }) => (
            <li key={q.id} className="bg-grid px-4 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="font-anotasi text-xs text-gold">{q.id}</p>
                <p className={eyebrow(affected > 0 ? 'daun' : 'quiet', 'sm')}>
                  {!sized
                    ? id
                      ? 'belum terukur'
                      : 'not sized'
                    : id
                      ? `${affected.toLocaleString('id')} dari ${total.toLocaleString('id')} bentuk`
                      : `${affected.toLocaleString('en')} of ${total.toLocaleString('en')} forms`}
                </p>
              </div>

              <p className="mt-1 text-lontar/85">{q.question}</p>
              <p className="mt-2 text-sm text-lontar/75">{q.why}</p>

              {/* Forms only, never meanings (invariant 16). */}
              {samples.length > 0 ? (
                <p className="mt-2 text-sm text-lontar/85">
                  <span className={eyebrow('quiet', 'sm')}>
                    {id ? 'Misalnya' : 'For example'}{' '}
                  </span>
                  {samples.join(' · ')}
                  {affected > samples.length ? (
                    <span className="text-lontar/65">
                      {id ? ` … dan ${(affected - samples.length).toLocaleString('id')} lagi` : ` … and ${(affected - samples.length).toLocaleString('en')} more`}
                    </span>
                  ) : null}
                </p>
              ) : null}

              {/* Why this is the right set to count. The same burden a rule's
                  citation carries, and validated the same way. */}
              {basis ? <p className="mt-2 text-xs text-lontar/65">{basis}</p> : null}

              {/*
                What the number is NOT, said next to the number.

                A count like "565 of 1,321" provokes exactly one question —
                so what would those 565 become? — and this repository cannot
                answer it. Running the counterfactual needs the engine
                parameterised by rule set, and for prenasal-coverage it would
                need a generalisation rule the project has deliberately
                refused to write on two attested pairs. Saying so one section
                up, where the ordering is explained, leaves the number itself
                looking like it promises more than it does.
              */}
              {sized && affected > 0 ? (
                <p className="mt-2 text-xs text-lontar/65">
                  {id
                    ? 'Angka ini menyebut bentuk mana yang bergantung pada jawaban, bukan akan menjadi apa bentuk itu. Menjalankan kemungkinan yang lain menuntut aturan yang justru belum ditetapkan — jadi jumlahnya dapat dihitung, akibatnya belum.'
                    : 'This counts which forms depend on the answer, not what they would become. Running the alternative needs the very rule that is not settled — so the size is computable and the consequence is not.'}
                </p>
              ) : null}

              <p className="mt-2 font-anotasi text-anotasi text-lontar/65">
                {id ? 'Tanya' : 'Ask'}: {q.askWhom}
              </p>
              {q.blocks.length > 0 ? (
                <p className="mt-1 font-anotasi text-anotasi text-sabbe-ink">
                  {id ? 'Menahan' : 'Blocks'}: {q.blocks.join(', ')}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3 border-t-2 border-gold/30 pt-8">
        <h2 className="text-section text-lontar">{id ? 'Menelaah sendiri' : 'Audit it yourself'}</h2>
        <p className="max-w-measure text-sm text-lontar/75">
          {id
            ? 'Tidak ada aturan ejaan yang ditulis di dalam kode program. Semuanya ada di data/rules/rules.json beserta id, prioritas, dan rujukan — supaya penelaah yang paham Lontara tetapi tidak memprogram dapat memeriksanya. `pnpm rules:report` mencetaknya sebagai tabel yang bisa dibaca.'
            : 'No orthographic rule is written in application code. All of it is in data/rules/rules.json with an id, a priority and a citation — so that a Bugis-literate reviewer who does not program can audit it. `pnpm rules:report` prints it as a readable table.'}
        </p>
        <p className="text-sm">
          <Link
            href={href(locale, 'aksara')}
            className={`no-underline ${eyebrow()}`}
          >
            {copy.nav.aksara} →
          </Link>
        </p>
      </section>
    </Page>
  )
}
