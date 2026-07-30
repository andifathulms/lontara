import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCopy } from '@/lib/i18n/copy'
import { isLocale, localeParams, type Locale } from '@/lib/i18n/locales'
import { href } from '@/lib/paths'
import { INVENTORY } from '@/lib/rules/inventory'
import { RULE_SET, RULES, OPEN_QUESTIONS, PROVISIONAL_RULES } from '@/lib/rules/loader'
import { AMBIGUITY_CLASSES } from '@/lib/rules/schema'
import { Rhombus } from '@/components/ambiguity/Rhombus'

export function generateStaticParams() {
  return localeParams()
}

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  return { title: getCopy(locale).ejaan.title, description: getCopy(locale).ejaan.lead }
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

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 space-y-12">
      <header className="space-y-3">
        <h1 className="text-3xl text-lontar">{copy.ejaan.title}</h1>
        <p className="max-w-3xl text-lontar/75">{copy.ejaan.lead}</p>
        <p className="font-anotasi text-xs text-lontar/45">
          rules.json v{RULE_SET.version} · {RULE_SET.reviewStatus} · {RULES.length}{' '}
          {id ? 'aturan' : 'rules'}
        </p>
      </header>

      <aside className="border-l-4 border-sabbe bg-sabbe/10 px-4 py-3">
        <h2 className="font-anotasi text-xs uppercase tracking-widest text-sabbe">
          {id ? 'Apa yang belum ada di sini' : 'What is not here'}
        </h2>
        <p className="mt-1 text-sm text-lontar/85">
          {id
            ? 'Halaman ini belum dapat menyebut satu pun ejaan Latin Bugis yang baku, karena belum ada satu pun sumber ejaan yang dibaca. Yang ada di bawah diturunkan dari pengkodean Unicode — nama karakter dan ketiadaan virama — bukan dari kamus, buku ajar, atau ketetapan Badan Bahasa. Itu perbedaan yang besar, dan tidak disamarkan.'
            : 'This page cannot yet name a single standard Bugis Latin orthography, because no orthography source has been read. What follows is derived from the Unicode encoding — character names and the absence of a virama — and not from a dictionary, a textbook, or a Badan Bahasa ruling. That is a large difference and it is not being blurred.'}
        </p>
      </aside>

      {/* What IS specified. */}
      <section className="space-y-4">
        <h2 className="text-2xl text-lontar">
          {id ? 'Yang sudah ditetapkan di sini' : 'What is specified here'}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="pb-2 text-left text-xs text-lontar/55">
              {id
                ? 'Onset Latin diambil dari nama karakter Unicode setiap huruf. Vokal inheren /a/ tidak ditulis dengan tanda.'
                : 'Latin onsets are taken from each letter’s Unicode character name. The inherent vowel /a/ has no sign.'}
            </caption>
            <thead>
              <tr className="border-b-2 border-gold/40 text-left">
                <th className="py-2 pr-4 font-anotasi text-xs uppercase tracking-widest text-gold/80">
                  {id ? 'Onset' : 'Onset'}
                </th>
                <th className="py-2 pr-4 font-anotasi text-xs uppercase tracking-widest text-gold/80">
                  {id ? 'Huruf' : 'Letter'}
                </th>
                <th className="py-2 font-anotasi text-xs uppercase tracking-widest text-gold/80">
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
                      <span className="ml-2 text-[10px] uppercase tracking-widest text-gold/70">
                        {id ? 'pranasal' : 'prenasal'}
                      </span>
                    ) : null}
                  </td>
                  <td className="aksara py-1.5 pr-4 text-xl text-lontar">
                    {String.fromCodePoint(Number.parseInt(c.codepoint.slice(2), 16))}
                  </td>
                  <td className="py-1.5 font-anotasi text-[11px] text-lontar/55">
                    {c.unicodeName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gold/40 text-left">
                <th className="py-2 pr-4 font-anotasi text-xs uppercase tracking-widest text-gold/80">
                  {id ? 'Vokal' : 'Vowel'}
                </th>
                <th className="py-2 pr-4 font-anotasi text-xs uppercase tracking-widest text-gold/80">
                  {id ? 'Tanda' : 'Sign'}
                </th>
                <th className="py-2 font-anotasi text-xs uppercase tracking-widest text-gold/80">
                  {id ? 'Dasar' : 'Basis'}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-lontar/15">
                <td className="py-1.5 pr-4 font-anotasi text-lontar">a</td>
                <td className="py-1.5 pr-4 font-anotasi text-[11px] text-lontar/55">
                  {id ? 'tanpa tanda — vokal inheren' : 'no sign — the inherent vowel'}
                </td>
                <td className="py-1.5 text-xs text-lontar/60">{INVENTORY.inherentVowel.note}</td>
              </tr>
              {INVENTORY.vowelSigns.map((v) => (
                <tr key={v.codepoint} className="border-b border-lontar/15">
                  <td className="py-1.5 pr-4 font-anotasi text-lontar">
                    {v.latin}
                    {v.latinNote ? (
                      <span className="ml-2 text-[10px] uppercase tracking-widest text-sabbe">
                        {copy.ejaan.provisional}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-1.5 pr-4 font-anotasi text-[11px] text-lontar/55">
                    {v.codepoint} · {v.unicodeName}
                  </td>
                  <td className="py-1.5 text-xs text-lontar/60">
                    {v.latinNote ?? v.positionSource}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* The Latin distinctions the classes are defined against. */}
      <section className="space-y-4 border-t-2 border-gold/30 pt-8">
        <h2 className="text-2xl text-lontar">
          {id
            ? 'Pembeda Latin yang menjadi dasar keempat kelas'
            : 'The Latin distinctions the four classes are defined against'}
        </h2>
        <p className="max-w-3xl text-sm text-lontar/75">
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
                  <span className="font-anotasi text-xs uppercase tracking-widest text-daun">
                    {copy.ambiguityClass[cls]}
                  </span>
                </dt>
                <dd className="mt-1 space-y-1">
                  <p className="text-sm text-lontar/80">{declared?.description}</p>
                  <p className="font-anotasi text-[11px] text-lontar/45">
                    {lossRule?.id} · {lossRule?.status}
                  </p>
                  <p className="text-xs text-lontar/60">{declared?.citation}</p>
                </dd>
              </div>
            )
          })}
        </dl>
      </section>

      {/* Where practice diverges — the provisional rules. */}
      <section className="space-y-4 border-t-2 border-gold/30 pt-8">
        <h2 className="text-2xl text-lontar">
          {id ? 'Tempat praktik berbeda-beda' : 'Where practice diverges'}
        </h2>
        {PROVISIONAL_RULES.length === 0 ? (
          <p className="text-sm text-lontar/70">
            {id ? 'Tidak ada aturan sementara.' : 'No provisional rules.'}
          </p>
        ) : (
          <ul className="space-y-px bg-sabbe/25">
            {PROVISIONAL_RULES.map((r) => (
              <li key={r.id} className="bg-grid px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-anotasi text-xs text-gold">{r.id}</span>
                  <span className="border border-sabbe px-1.5 font-anotasi text-[10px] uppercase tracking-widest text-sabbe">
                    {copy.trace.provisionalBadge}
                  </span>
                </div>
                <p className="mt-1 text-sm text-lontar/85">{r.description}</p>
                <p className="mt-1 text-xs text-lontar/60">{r.citation}</p>
                {r.note ? <p className="mt-1 text-xs text-sabbe/90">{r.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Open questions. */}
      <section className="space-y-4 border-t-2 border-gold/30 pt-8">
        <h2 className="text-2xl text-lontar">{copy.ejaan.openQuestions}</h2>
        <p className="max-w-3xl text-sm text-lontar/75">
          {id
            ? 'Tidak ditebak. Masing-masing menyebut siapa yang harus ditanya.'
            : 'Not guessed at. Each one names who to ask.'}
        </p>
        <ol className="space-y-px bg-gold/25">
          {OPEN_QUESTIONS.map((q) => (
            <li key={q.id} className="bg-grid px-4 py-4">
              <p className="font-anotasi text-xs text-gold">{q.id}</p>
              <p className="mt-1 text-lontar/90">{q.question}</p>
              <p className="mt-2 text-sm text-lontar/70">{q.why}</p>
              <p className="mt-2 font-anotasi text-[11px] text-lontar/50">
                {id ? 'Tanya' : 'Ask'}: {q.askWhom}
              </p>
              {q.blocks.length > 0 ? (
                <p className="mt-1 font-anotasi text-[11px] text-sabbe/80">
                  {id ? 'Menahan' : 'Blocks'}: {q.blocks.join(', ')}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3 border-t-2 border-gold/30 pt-8">
        <h2 className="text-2xl text-lontar">{id ? 'Menelaah sendiri' : 'Audit it yourself'}</h2>
        <p className="max-w-3xl text-sm text-lontar/75">
          {id
            ? 'Tidak ada aturan ejaan yang ditulis di dalam kode program. Semuanya ada di data/rules/rules.json beserta id, prioritas, dan rujukan — supaya penelaah yang paham Lontara tetapi tidak memprogram dapat memeriksanya. `pnpm rules:report` mencetaknya sebagai tabel yang bisa dibaca.'
            : 'No orthographic rule is written in application code. All of it is in data/rules/rules.json with an id, a priority and a citation — so that a Bugis-literate reviewer who does not program can audit it. `pnpm rules:report` prints it as a readable table.'}
        </p>
        <p className="text-sm">
          <Link
            href={href(locale, 'aksara')}
            className="font-anotasi text-xs uppercase tracking-widest text-gold no-underline"
          >
            {copy.nav.aksara} →
          </Link>
        </p>
      </section>
    </div>
  )
}
