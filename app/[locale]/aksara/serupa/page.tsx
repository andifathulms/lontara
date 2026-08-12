import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCopy } from '@/lib/i18n/copy'
import { pageMetadata } from '@/lib/metadata'
import { isLocale, localeParams, type Locale } from '@/lib/i18n/locales'
import { href } from '@/lib/paths'
import { encodeShareHash } from '@/lib/share/hash'
import { collisionReport } from '@/lib/analysis/collisions'
import { LEXICON } from '@/lib/lexicon/shipped'
import { AMBIGUITY_CLASSES } from '@/lib/rules/schema'
import { Rhombus } from '@/components/ambiguity/Rhombus'
import { eyebrow } from '@/components/chrome/eyebrow'
import { Page, PageHeader } from '@/components/chrome/Page'

export function generateStaticParams() {
  return localeParams()
}

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  const copy = getCopy(locale)
  return pageMetadata({ locale, segments: ['aksara', 'serupa'], page: 'serupa', description: copy.aksara.collisionsLead })
}

/**
 * The collision index. PRD §2 illustrates defectiveness with three chosen
 * words; this measures it against the vocabulary the repository actually holds.
 *
 * Computed here, at build time, in a server component. There is deliberately no
 * generated JSON artifact: an artifact would need regenerating whenever a rule
 * or the lexicon changed, and the first symptom of forgetting would be a page
 * of confident numbers describing a rule set that no longer exists. Computing
 * it in the page means it cannot be stale, and it costs the reader nothing —
 * none of this reaches the browser.
 *
 * The scope caveat is placed ABOVE the figures on purpose. The lexicon is a
 * Wikipedia scrape and it shows in the results — the largest collision set on
 * this page is eight English words. That is not a flaw to be hidden behind a
 * footnote; it is the most useful thing the page reveals, and it argues for the
 * dictionary-sourced lexicon PRD Appendix A calls for.
 */
export default function SerupaPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const copy = getCopy(locale)
  const id = locale === 'id'

  const report = collisionReport(LEXICON)

  /* One formatter for every number on the page. Mixing `1,321` with `1323` two
     words apart reads as two different quantities being compared. */
  const n = (value: number) => value.toLocaleString(locale)

  /* Sets are already ordered largest-first by the report, so grouping is a
     fold rather than a re-sort — the order on screen is the report's order. */
  const GROUPS = report.sets.reduce<{ size: number; sets: typeof report.sets }[]>((acc, set) => {
    const last = acc[acc.length - 1]
    if (last && last.size === set.members.length) last.sets = [...last.sets, set]
    else acc.push({ size: set.members.length, sets: [set] })
    return acc
  }, [])

  const figures = [
    {
      value: report.forms,
      label: id ? 'bentuk berbeda' : 'distinct forms',
      note: id
        ? `dari ${n(report.entries)} lema; ${n(report.mergedSpellings)} ejaan digabung`
        : `from ${n(report.entries)} entries; ${n(report.mergedSpellings)} spellings merged`,
    },
    {
      value: report.strings,
      label: id ? 'rangkaian Lontara' : 'Lontara strings',
      note: id ? 'yang dihasilkan bentuk-bentuk itu' : 'that those forms produce',
    },
    {
      value: report.formsInCollision,
      label: id ? 'bentuk yang bertumpuk' : 'forms that collide',
      note: id
        ? `${Math.round((report.formsInCollision / report.forms) * 100)}% dari seluruh bentuk`
        : `${Math.round((report.formsInCollision / report.forms) * 100)}% of all forms`,
    },
    {
      value: report.sets.length,
      label: id ? 'himpunan tumpukan' : 'collision sets',
      note: id
        ? `terbesar berisi ${n(report.largest)}`
        : `largest holds ${n(report.largest)}`,
    },
  ]

  return (
    <Page>
      <PageHeader
        title={copy.aksara.collisionsLink}
        lead={copy.aksara.collisionsLead}
      >
        <p className="font-anotasi text-xs text-lontar/65">
          rules.json v{report.ruleSetVersion} · {report.reviewStatus} · lexicon v
          {report.lexiconVersion} · {n(report.entries)} {id ? 'lema' : 'entries'}
        </p>
      </PageHeader>

      {/*
        Before any number. The figures below are correct arithmetic over an
        untrustworthy word list, and a reader who meets the arithmetic first
        will carry away a claim about Bugis that nothing here supports.
      */}
      <aside aria-labelledby="serupa-scope" className="border-l-4 border-sabbe bg-sabbe/10 px-4 py-3">
        <p id="serupa-scope" className={eyebrow('sabbe')}>
          {id ? 'Apa yang diukur di sini' : 'What is being measured'}
        </p>
        <p className="mt-1 text-sm text-lontar/85">
          {id
            ? 'Yang diukur adalah leksikon ini di bawah himpunan aturan ini — bukan Basa Ugi. Seluruh 1.323 lema diambil dari Wikipedia Basa Ugi dan semuanya berstatus attestation: "corpus": bentuknya muncul di teks, dan tidak lebih dari itu. Korpus yang sama memuat kata Indonesia, Inggris, dan nama tempat asing, dan tidak ada apa pun di repositori ini yang bisa membedakannya. Itu terlihat jelas di bawah: himpunan terbesar di halaman ini berisi delapan kata Inggris. Mekanisme yang diperagakan nyata dan dihitung dengan benar; kosakata tempat ia dihitung belum layak dipercaya.'
            : 'What is measured is this lexicon under this rule set — not Basa Ugi. All 1,323 entries come from Bugis Wikipedia and every one is attestation: "corpus": the form occurs in the text, and nothing more. The same corpus contains Indonesian, English and foreign place names, and nothing in this repository can tell them apart. It shows plainly below: the largest set on this page is eight English words. The mechanism on display is real and correctly computed; the vocabulary it is computed over is not yet trustworthy.'}
        </p>
      </aside>

      <section className="space-y-4">
        <h2 className="text-section text-lontar">
          {id ? 'Seberapa jauh ia bertumpuk' : 'How far it collapses'}
        </h2>

        <dl className="grid gap-px bg-gold/30 sm:grid-cols-2 lg:grid-cols-4">
          {figures.map((f) => (
            <div key={f.label} className="bg-grid px-5 py-4">
              <dd className="text-title text-gold">{n(f.value)}</dd>
              <dt className={`mt-1 ${eyebrow()}`}>{f.label}</dt>
              <dd className="mt-1 text-sm text-lontar/75">{f.note}</dd>
            </div>
          ))}
        </dl>

        <p className="max-w-measure text-lontar/85">
          {id
            ? `Jadi ${n(report.forms - report.strings)} bentuk kehilangan rangkaiannya sendiri: ditulis ke Lontara, ia jatuh ke rangkaian yang sudah dipakai bentuk lain. Itulah sifat defektif aksara, dihitung dan bukan sekadar dinyatakan.`
            : `So ${n(report.forms - report.strings)} forms lose a string of their own: written to Lontara, each falls onto a string another form already occupies. That is the script’s defectiveness, counted rather than asserted.`}
        </p>

        {/* The 1,323 -> 1,321 step, explained where it happens. A number that
            silently shrinks is exactly the arithmetic-without-reason this page
            is otherwise trying to avoid. */}
        {report.mergedSpellings > 0 ? (
          <p className="max-w-measure text-sm text-lontar/75">{copy.aksara.mergeNote}</p>
        ) : null}

        {report.unwritable.length > 0 ? (
          <p className="max-w-measure text-sm text-lontar/65">
            {id
              ? `${n(report.unwritable.length)} bentuk tidak dapat dituliskan sepenuhnya oleh aturan di sini dan dikeluarkan dari hitungan di atas, bukan dijadikan satu tumpukan kosong.`
              : `${n(report.unwritable.length)} forms cannot be fully written by these rules and are excluded from the counts above, rather than bucketed together on an empty string.`}
          </p>
        ) : null}
      </section>

      <section className="space-y-4 border-t-2 border-gold/30 pt-8">
        <h2 className="text-section text-lontar">
          {id ? 'Kelas mana yang menumpuknya' : 'Which class does the collapsing'}
        </h2>
        <p className="max-w-measure text-lontar/85">
          {id
            ? 'Satu himpunan dapat dihitung di lebih dari satu kelas, karena anggotanya bisa kehilangan lebih dari satu hal sekaligus.'
            : 'A set can count under more than one class, because its members can lose more than one thing at once.'}
        </p>

        <ul className="grid gap-3 sm:grid-cols-2">
          {AMBIGUITY_CLASSES.map((cls) => {
            const count = report.setsByClass[cls]
            return (
              <li key={cls} className="flex gap-3 bg-lontar/5 px-4 py-3">
                <Rhombus size={13} tone="daun" className="mt-1.5" />
                <span>
                  <span className={eyebrow('daun')}>{copy.ambiguityClass[cls]}</span>
                  <span className="block text-sm text-lontar/85">
                    {count === 0
                      ? id
                        ? 'tidak menumpuk satu himpunan pun di leksikon ini'
                        : 'collapses no set in this lexicon'
                      : id
                        ? `${count} himpunan`
                        : `${count} sets`}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>

        {report.setsByClass.prenasal === 0 ? (
          <aside aria-labelledby="serupa-prenasal" className="border-l-4 border-gold bg-gold/10 px-4 py-3">
            <p id="serupa-prenasal" className={eyebrow()}>
              {id ? 'Pranasalisasi tidak muncul sama sekali' : 'Prenasalisation does not appear'}
            </p>
            <p className="mt-1 max-w-measure text-sm text-lontar/85">
              {id
                ? 'Tidak satu pun tumpukan di leksikon ini disebabkan oleh pranasalisasi. Itu temuan, bukan bukti bahwa kelasnya tidak perlu — bisa jadi leksikon Wikipedia ini memang tidak memuat gugus nasal+hambat yang relevan, bisa jadi cakupan pranasal di aturan memang belum tepat. Pertanyaannya masih terbuka: lihat openQuestions.prenasal-coverage di halaman Ejaan.'
                : 'Not one collision in this lexicon is caused by prenasalisation. That is a finding, not evidence the class is unnecessary — either this Wikipedia-derived lexicon happens to hold no relevant nasal+stop clusters, or the rule set’s prenasal coverage is wrong. The question is still open: see openQuestions.prenasal-coverage on the Ejaan page.'}
            </p>
          </aside>
        ) : null}
      </section>

      {/*
        Not printed. The print stylesheet exists for the signmaker carrying one
        short correct string to a workshop (PRD §5); 115 sets is twelve pages
        of reference that nobody is holding next to a piece of material. The
        figures, the scope caveat and the class attribution above all print,
        because those are the parts that travel.

        Omitted, and said so — the same discipline the enumeration cap follows.
        A printout that quietly stops at the summary would read as though the
        summary were all there was.
      */}
      <section className="space-y-4 border-t-2 border-gold/30 pt-8 print:hidden">
        <h2 className="text-section text-lontar">
          {id ? 'Setiap tumpukan' : 'Every collision set'}
        </h2>
        <p className="max-w-measure text-lontar/85">
          {id
            ? `Seluruh ${n(report.sets.length)} himpunan, dikelompokkan menurut banyaknya bentuk. Tidak ada yang dipotong — bila suatu saat daftar ini dibatasi, batasnya akan dilaporkan di sini dan bukan diterapkan diam-diam.`
            : `All ${n(report.sets.length)} sets, grouped by how many forms they hold. Nothing is truncated — if this list is ever capped, the cap will be reported here rather than silently applied.`}
        </p>

        {/*
          Grouped rather than run together, because the distribution is itself
          the finding and a flat list hid it: 87 of the 115 sets hold exactly
          two forms, and the five interesting ones were buried under eighty-odd
          near-identical rows. Grouping shows the shape for free and lets the
          per-row count badge go, since the heading now carries it.

          Every set is still rendered. Nothing here is a cap.
        */}
        {GROUPS.map(({ size, sets }) => (
          <section key={size} className="space-y-3">
            <h3 className={eyebrow()}>
              {id
                ? `${n(size)} bentuk · ${n(sets.length)} himpunan`
                : `${n(size)} forms · ${n(sets.length)} ${sets.length === 1 ? 'set' : 'sets'}`}
            </h3>

            <ul className="space-y-px bg-gold/30">
              {sets.map((set) => (
                <li key={set.lontara} className="bg-grid px-5 py-4">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="aksara text-aksara-row text-lontar">{set.lontara}</span>
                    <span className="font-anotasi text-anotasi text-lontar/65">
                      {set.codepoints.join(' ')}
                    </span>
                  </div>

                  {/* Forms only. Never a meaning — invariant 16. */}
                  <p className="mt-2 text-lead text-lontar">
                    {set.members.map((m) => m.latin).join(' · ')}
                  </p>

                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {set.classes.map((cls) => (
                      <span key={cls} className="flex items-center gap-1.5">
                        <Rhombus size={9} tone="daun" />
                        <span className={eyebrow('daun', 'sm')}>{copy.ambiguityClass[cls]}</span>
                      </span>
                    ))}
                  </p>

                  {/*
                    A way in. This page was 115 worked examples with no door on
                    any of them: a reader looking at `ada · adan · anda` and
                    wanting to ask why had nowhere to click. The set opens in
                    the reader, which is the tool that answers exactly that.
                  */}
                  <p className="mt-2">
                    <Link
                      href={`${href(locale, 'baca')}${encodeShareHash(set.lontara)}`}
                      className={`inline-block no-underline ${eyebrow('quiet', 'sm')} hover:text-gold`}
                    >
                      {copy.aksara.openInReader} →
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>

      {/* The stated omission. Screen-hidden, print-only — the mirror of the
          section above it. */}
      <p className="hidden print:block border-l-4 border-gold pl-3 text-sm">
        {id
          ? `${n(report.sets.length)} himpunan tumpukan tidak disertakan dalam cetakan ini. Semuanya ada di halaman ini di layar.`
          : `${n(report.sets.length)} collision sets are omitted from this printout. All of them are on this page on screen.`}
      </p>
    </Page>
  )
}
