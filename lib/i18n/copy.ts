import type { Locale } from './locales'

/**
 * All user-facing strings. Ambiguity is stated plainly and without apology
 * (PRD §10), and nothing anywhere implies the tool produces meaning
 * (invariant 16) — the word "terjemah" / "translate" appears only in the
 * sentence that denies it.
 */
export type Copy = {
  siteName: string
  tagline: string
  notTranslator: { title: string; body: string }
  nav: { baca: string; tulis: string; aksara: string; ejaan: string }
  /**
   * A one-word hint beside each nav label, for the locale that needs one.
   *
   * `nav` is byte-identical in both locales, because the sections are named in
   * the language the site is about and that is the convention here. In `id`
   * that is four ordinary words. In `en` it is four opaque ones, in the sticky
   * header, on every page, with the sentences that would explain them living
   * on the home page only — which is where an English visitor gave up.
   *
   * Deliberately not called a gloss. A gloss in this project is a lexicon
   * entry's meaning, which invariant 16 stops at the data layer and which no
   * component may ever read. This names a section of a website; the two must
   * not be confused, and tests/invariants.test.ts is right to refuse the word
   * anywhere in the UI tree.
   *
   * The Bugis term stays primary and stays the link text. `null` where the
   * locale needs no hint; do not add one for `id`, and do not replace the
   * terms in either.
   */
  navHint: { baca: string; tulis: string; aksara: string; ejaan: string } | null
  navDescription: { baca: string; tulis: string; aksara: string; ejaan: string }
  gate: { title: string; body: string; blocked: string }
  disclaimer: { title: string; body: string }
  home: {
    /**
     * `tagline` is two sentences, because a `<title>` and an OG description
     * want the whole claim in one string. A page heading does not: set at the
     * display step it ran to five lines of poster-weight type that nobody
     * finishes. The heading takes the first sentence; the second folds into
     * the lead below it.
     */
    headline: string
    lead: string
    /** Heads the aksara demonstration. The demonstration itself is the three
     *  readings and the note, which live under `defective` and are shared. */
    heroLabel: string
    /** The two rows of destinations. Four equal tiles made a visitor read all
     *  four labels and rank them; these say which two are the product. */
    groupTools: string
    groupReference: string
    /** On the writer's tile only — the one tool the reviewer gate does not
     *  hold back, so the one a visitor can act on today. */
    cta: string
    defective: { title: string; body: string; example: string; exampleNote: string }
    asymmetry: { title: string; latinToLontara: string; lontaraToLatin: string }
    open: string
  }
  ambiguityClass: Record<'final' | 'gemination' | 'prenasal' | 'glottal', string>
  ambiguityClassBody: Record<'final' | 'gemination' | 'prenasal' | 'glottal', string>
  writer: {
    title: string
    lead: string
    inputLabel: string
    placeholder: string
    outputLabel: string
    lossTitle: string
    lossEmpty: string
    codepointsLabel: string
    traceLabel: string
    keyboardLabel: string
    keyboardToggle: string
    emptyState: string
    copy: string
    copied: string
    /** Worked examples. PRD §2's illustration: all three are written alike. */
    examples: readonly string[]
  }
  reader: {
    title: string
    lead: string
    inputLabel: string
    placeholder: string
    treeLabel: string
    emptyState: string
    skeletonLabel: string
    noAttested: string
    noAttestedBody: string
    lexiconEmpty: string
    knownOnly: string
    hiddenCount: (n: number) => string
    readingCount: (n: number) => string
    capReported: (depth: number) => string
    undetermined: string
    scoreLabel: string
    scoreBasis: string
    provenanceLabel: string
  }
  aksara: {
    title: string
    lead: string
    consonants: string
    vowelSigns: string
    punctuation: string
    inherentVowel: string
    columns: { glyph: string; codepoint: string; unicodeName: string; latin: string; note: string }
    conformanceLink: string
    /** The collision index. Prose for that page is written inline there, as the
     *  conformance page does — only the shared label lives here. */
    collisionsLink: string
  }
  ejaan: {
    title: string
    lead: string
    openQuestions: string
    provisional: string
  }
  corpus: {
    title: string
    lead: string
    claim: string
    agrees: string
    disagrees: string
    disagreesNote: string
    agreementLine: (agreeing: number, total: number) => string
  }
  attestation: {
    corpus: string
    dictionary: string
    reviewer: string
    corpusWarning: string
  }
  share: {
    copyLink: string
    copied: string
    fragmentNote: string
    copyAksara: string
    copyRefused: string
  }
  offline: {
    ready: string
    note: string
  }
  trace: {
    ruleId: string
    citation: string
    input: string
    output: string
    provisionalBadge: string
    citedBadge: string
  }
  common: {
    back: string
    switchLocale: string
    sourceCode: string
    codepointView: string
    unverified: string
    clear: string
    tryExample: string
    backspace: string
    skipToContent: string
    currentPage: string
    opensInNewTab: string
    builtBy: string
  }
}

const id: Copy = {
  siteName: 'Lontara',
  tagline:
    'Penjelas baca-tulis aksara Lontara untuk Basa Ugi. Menyebut satu per satu apa yang tidak ditentukan oleh aksara.',
  notTranslator: {
    title: 'Ini bukan penerjemah',
    body:
      'Alat ini hanya mengalihkan aksara — dari Lontara ke Latin dan sebaliknya. Ia tidak menerjemahkan, tidak memberi arti, dan tidak tahu makna kata apa pun.',
  },
  nav: { baca: 'Baca', tulis: 'Tulis', aksara: 'Aksara', ejaan: 'Ejaan' },
  navHint: null,
  navDescription: {
    baca: 'Lontara → Latin. Himpunan bacaan yang mungkin, sebagai pohon.',
    tulis: 'Latin → Lontara. Beserta apa yang hilang, dan di mana.',
    aksara: 'Inventaris lengkap: nama, titik kode, perilaku tanda.',
    ejaan: 'Ejaan Latin Bugis yang dipakai di sini, beserta rujukannya.',
  },
  gate: {
    title: 'Belum ditinjau penutur Bugis',
    body:
      'Belum ada seorang pun penelaah Bugis yang menandatangani himpunan aturan di sini. Sampai ada, keluaran alat ini belum layak dijadikan rujukan — pakai untuk belajar, jangan untuk papan nama.',
    blocked: 'Pembaca (Baca) belum dirilis publik. Gerbang penelaah PRD §9 belum terpenuhi.',
  },
  disclaimer: {
    title: 'Proyek pribadi, bukan otoritas',
    body:
      'Lontara adalah proyek pribadi dan bisa salah. Ia bukan lembaga, bukan standar, dan tidak berbicara untuk siapa pun. Setiap keluaran dapat dilacak ke aturannya, supaya kesalahannya bisa ditunjuk dan diperbaiki.',
  },
  home: {
    headline: 'Penjelas baca-tulis aksara Lontara untuk Basa Ugi.',
    heroLabel: 'Satu rangkaian, tiga bacaan',
    groupTools: 'Alat',
    groupReference: 'Rujukan',
    cta: 'Coba sekarang',
    lead:
      'Ia menyebut satu per satu apa yang tidak ditentukan oleh aksara — pembaca menyebutkan semua bacaan yang mungkin, penulis menyebutkan apa yang dibuang.',
    defective: {
      title: 'Aksara Lontara bersifat defektif',
      body:
        'Blok Buginese di Unicode (U+1A00–U+1A1F) memuat 23 huruf konsonan, lima tanda vokal, dan dua tanda baca — dan tidak ada virama. Tidak ada mekanisme dalam pengkodean untuk konsonan tanpa vokal. Akibatnya aksara tidak menuliskan konsonan akhir, konsonan ganda, pranasalisasi, maupun hamzah.',
      example: 'mata · matta · manta',
      exampleNote: 'Ketiganya ditulis serupa. Pembaca memulihkan kata yang dimaksud dari kosakata dan konteks.',
    },
    asymmetry: {
      title: 'Ketidaksetangkupan inilah produknya',
      latinToLontara: 'Latin → Lontara: pasti, tetapi menghilangkan informasi. Yang hilang dapat diramalkan dan disebutkan satu per satu.',
      lontaraToLatin: 'Lontara → Latin: satu-ke-banyak. Satu rangkaian punya banyak bacaan sah; memilih menuntut pengetahuan kosakata dan konteks.',
    },
    open: 'Sumber terbuka. Setiap aturan memuat rujukan.',
  },
  ambiguityClass: {
    final: 'konsonan akhir',
    gemination: 'konsonan ganda',
    prenasal: 'pranasalisasi',
    glottal: 'hamzah',
  },
  ambiguityClassBody: {
    final: 'Konsonan penutup suku kata tidak dituliskan.',
    gemination: 'Konsonan tunggal dan konsonan ganda ditulis serupa.',
    prenasal: 'Pranasalisasi tidak selalu tampak pada tulisan.',
    glottal: "Hamzah — tanda petik pada Lontara' — tidak dituliskan.",
  },
  writer: {
    title: 'Tulis',
    lead: 'Ketik Basa Ugi beraksara Latin. Keluarannya aksara Lontara, beserta pernyataan tegas tentang apa yang dibuang dan di mana.',
    inputLabel: 'Latin (Basa Ugi)',
    placeholder: 'contoh: mata',
    outputLabel: 'Aksara Lontara',
    lossTitle: 'Yang hilang di sini',
    lossEmpty: 'Tidak ada informasi yang dibuang pada masukan ini.',
    codepointsLabel: 'Titik kode',
    traceLabel: 'Jejak aturan',
    keyboardLabel: 'Papan tombol Lontara',
    keyboardToggle: 'Papan tombol',
    emptyState: 'Belum ada masukan.',
    copy: 'Salin',
    copied: 'Tersalin',
    examples: ['mata', 'matta', 'manta'],
  },
  reader: {
    title: 'Baca',
    lead: 'Tempel atau ketik aksara Lontara. Keluarannya himpunan bacaan Latin yang mungkin, sebagai pohon — bukan satu terkaan yang percaya diri.',
    inputLabel: 'Aksara Lontara',
    placeholder: 'tempel aksara Lontara di sini',
    treeLabel: 'Pohon bacaan',
    emptyState: 'Belum ada masukan.',
    skeletonLabel: 'Rangka suku kata',
    noAttested: 'Tidak ada bacaan terkonfirmasi',
    noAttestedBody:
      'Tidak ada lema dalam leksikon yang, bila dituliskan ke Lontara, menghasilkan rangkaian ini. Yang bisa disebut hanyalah rangka suku kata di bawah. Konsonan akhir, konsonan ganda, pranasalisasi, dan hamzah tetap tidak ditentukan — jumlah kemungkinannya tidak diketahui.',
    lexiconEmpty:
      'Leksikon masih kosong. Penyebutan bacaan di sini digerakkan oleh leksikon: tanpa lema bersumber, pembaca hanya dapat menyebut rangka suku kata. Lihat data/lexicon/provenance.md.',
    knownOnly: 'Hanya kata yang terdaftar',
    hiddenCount: (n) => `${n} bacaan disembunyikan`,
    readingCount: (n) => `${n} kemungkinan bacaan`,
    capReported: (depth) => `Penyebutan dibatasi pada kedalaman ${depth}. Batas ini dilaporkan, bukan diterapkan diam-diam.`,
    undetermined: 'Tidak ditentukan oleh aksara',
    scoreLabel: 'skor',
    scoreBasis: 'Dasar peringkat ini',
    provenanceLabel: 'Sumber',
  },
  aksara: {
    title: 'Aksara',
    lead: 'Inventaris lengkap blok Buginese: 23 huruf konsonan, lima tanda vokal, dua tanda baca. Tiga puluh titik kode, sejak Unicode 4.1.',
    consonants: 'Huruf konsonan',
    vowelSigns: 'Tanda vokal',
    punctuation: 'Tanda baca',
    inherentVowel: 'Setiap huruf konsonan membawa vokal inheren /a/. Tanda vokal menggantikannya.',
    columns: { glyph: 'Bentuk', codepoint: 'Titik kode', unicodeName: 'Nama Unicode', latin: 'Latin', note: 'Catatan' },
    conformanceLink: 'Uji ketepatan tampilan',
    collisionsLink: 'Kata yang ditulis serupa',
  },
  ejaan: {
    title: 'Ejaan',
    lead: 'Sisi Latin butuh spesifikasi sama ketatnya dengan sisi Lontara. Ejaan Latin yang kurang tegas membuat seluruh penyebutan bacaan tidak sahih.',
    openQuestions: 'Pertanyaan yang belum terjawab',
    provisional: 'Sementara — menunggu penelaah',
  },
  corpus: {
    title: 'Bentuk yang terbukti dalam korpus',
    lead: 'Bentuk-bentuk ini sungguh muncul di Wikipedia Basa Ugi, ditulis beraksara Lontara dan Latin oleh penyuntingnya. Tekan salah satunya untuk membacanya di sini.',
    claim:
      'Yang diklaim sebuah pasangan hanya ini: seorang penyunting Wikipedia menuliskan aksara ini dan Latin ini untuk satu sama lain. Itu praktik komunitas, bukan otoritas — belum ada penelaah yang menandatanganinya, dan sebagian pasangan memang keliru.',
    agrees: 'sesuai',
    disagrees: 'berbeda',
    disagreesNote:
      'Aturan di repositori ini menghasilkan aksara yang berbeda dari yang tertulis di korpus. Bisa jadi aturannya yang salah, bisa jadi praktiknya memang beragam. Ditampilkan apa adanya, bukan disembunyikan.',
    agreementLine: (agreeing, total) =>
      `Aturan di sini sesuai dengan ${agreeing} dari ${total} pasangan terbukti.`,
  },
  attestation: {
    corpus: 'korpus',
    dictionary: 'kamus',
    reviewer: 'penelaah',
    corpusWarning:
      'Bacaan di bawah hanya terbukti dari korpus: bentuknya memang muncul dalam teks Wikipedia Basa Ugi, tetapi itu bukan berarti ia kata Bugis. Korpus yang sama memuat bahasa Indonesia, Inggris, dan nama tempat asing, dan alat ini tidak dapat membedakannya. Belum ada kamus yang dipakai.',
  },
  share: {
    copyLink: 'Salin tautan',
    copied: 'Tersalin',
    copyAksara: 'Salin aksara',
    copyRefused:
      'Peramban menolak menyalin. Aksara di atas bisa dipilih dan disalin sendiri, dan titik kodenya ada di bawah.',
    fragmentNote: 'Bagian setelah # tidak dikirim ke server.',
  },
  offline: {
    ready: 'Siap dipakai tanpa jaringan',
    note:
      'Seluruh situs sudah tersimpan di perangkat ini. Ia tetap bekerja tanpa sambungan, dan tidak ada yang dikirim ke mana pun.',
  },
  trace: {
    ruleId: 'Aturan',
    citation: 'Rujukan',
    input: 'Masukan',
    output: 'Keluaran',
    provisionalBadge: 'sementara',
    citedBadge: 'berujukan',
  },
  common: {
    back: 'Kembali',
    switchLocale: 'English',
    sourceCode: 'Kode sumber',
    codepointView: 'Tampilan titik kode',
    unverified: 'belum terverifikasi',
    clear: 'Kosongkan',
    tryExample: 'Coba',
    backspace: 'Hapus satu aksara',
    skipToContent: 'Langsung ke isi',
    currentPage: 'halaman ini',
    opensInNewTab: 'membuka tab baru',
    builtBy: 'Dirancang & dibangun oleh',
  },
}

const en: Copy = {
  siteName: 'Lontara',
  tagline:
    'A Lontara reading and writing explainer for Basa Ugi. Enumerates what the script leaves undetermined.',
  notTranslator: {
    title: 'This is not a translator',
    body:
      'This tool converts script only — Lontara to Latin and back. It does not translate, does not supply meaning, and does not know what any word means.',
  },
  nav: { baca: 'Baca', tulis: 'Tulis', aksara: 'Aksara', ejaan: 'Ejaan' },
  navHint: { baca: 'Read', tulis: 'Write', aksara: 'Script', ejaan: 'Orthography' },
  navDescription: {
    baca: 'Lontara → Latin. The set of possible readings, as a tree.',
    tulis: 'Latin → Lontara. Plus what was lost, and where.',
    aksara: 'The full inventory: names, codepoints, combining behaviour.',
    ejaan: 'The Bugis Latin orthography used here, with citations.',
  },
  gate: {
    title: 'Not yet reviewed by a Bugis reader',
    body:
      'No Bugis reviewer has signed off on the rule set here. Until one has, the output is not fit to cite — use it to learn, not to cut a signboard.',
    blocked: 'The reader (Baca) is not publicly released. The PRD §9 reviewer gate is unmet.',
  },
  disclaimer: {
    title: 'A personal project, not an authority',
    body:
      'Lontara is a personal project and can be wrong. It is not an institution, not a standard, and speaks for nobody. Every output traces to its rule, so that a mistake can be pointed at and fixed.',
  },
  home: {
    headline: 'A Lontara reading and writing explainer for Basa Ugi.',
    heroLabel: 'One string, three readings',
    groupTools: 'Tools',
    groupReference: 'Reference',
    cta: 'Try it now',
    lead:
      'It enumerates what the script leaves undetermined — the reader lists every possible reading, the writer lists what it discarded.',
    defective: {
      title: 'Lontara is a defective script',
      body:
        'The Unicode Buginese block (U+1A00–U+1A1F) contains 23 consonant letters, five vowel signs, and two punctuation marks — and no virama. There is no mechanism in the encoding for a bare consonant. Consequently the orthography does not write syllable-final consonants, geminates, prenasalisation, or the glottal stop.',
      example: 'mata · matta · manta',
      exampleNote: 'All three are written alike. Readers recover the intended word from vocabulary and context.',
    },
    asymmetry: {
      title: 'This asymmetry is the product',
      latinToLontara: 'Latin → Lontara: deterministic, but lossy. The discarded information is predictable and enumerable.',
      lontaraToLatin: 'Lontara → Latin: one-to-many. A string has many valid readings; choosing requires lexical and contextual knowledge.',
    },
    open: 'Open source. Every rule carries a citation.',
  },
  ambiguityClass: {
    final: 'final consonant',
    gemination: 'gemination',
    prenasal: 'prenasalisation',
    glottal: 'glottal stop',
  },
  ambiguityClassBody: {
    final: 'A syllable-final consonant is not written.',
    gemination: 'Single and doubled consonants are written alike.',
    prenasal: 'Prenasalisation is not always visible in the writing.',
    glottal: "The glottal stop — the apostrophe in Lontara' — is not written.",
  },
  writer: {
    title: 'Tulis',
    lead: 'Type Basa Ugi in Latin script. Get Lontara, plus an explicit statement of what was discarded and where.',
    inputLabel: 'Latin (Basa Ugi)',
    placeholder: 'e.g. mata',
    outputLabel: 'Lontara',
    lossTitle: 'What is lost here',
    lossEmpty: 'No information was discarded for this input.',
    codepointsLabel: 'Codepoints',
    traceLabel: 'Rule trace',
    keyboardLabel: 'Lontara keyboard',
    keyboardToggle: 'Keyboard',
    emptyState: 'No input yet.',
    copy: 'Copy',
    copied: 'Copied',
    examples: ['mata', 'matta', 'manta'],
  },
  reader: {
    title: 'Baca',
    lead: 'Paste or type Lontara. Get the set of plausible Latin readings as a tree — not one confident guess.',
    inputLabel: 'Lontara',
    placeholder: 'paste Lontara here',
    treeLabel: 'Reading tree',
    emptyState: 'No input yet.',
    skeletonLabel: 'Syllable skeleton',
    noAttested: 'No attested reading',
    noAttestedBody:
      'No lexicon entry, when written to Lontara, produces this string. All that can be stated is the syllable skeleton below. Final consonants, gemination, prenasalisation, and the glottal stop remain undetermined — the number of possibilities is unknown.',
    lexiconEmpty:
      'The lexicon is empty. Enumeration here is lexicon-driven: without sourced entries the reader can only state the syllable skeleton. See data/lexicon/provenance.md.',
    knownOnly: 'Known words only',
    hiddenCount: (n) => `${n} readings hidden`,
    readingCount: (n) => `${n} possible readings`,
    capReported: (depth) => `Enumeration was capped at depth ${depth}. The cap is reported, never silently applied.`,
    undetermined: 'Not determined by the script',
    scoreLabel: 'score',
    scoreBasis: 'What this ranking rests on',
    provenanceLabel: 'Source',
  },
  aksara: {
    title: 'Aksara',
    lead: 'The full Buginese block: 23 consonant letters, five vowel signs, two punctuation marks. Thirty code points, since Unicode 4.1.',
    consonants: 'Consonant letters',
    vowelSigns: 'Vowel signs',
    punctuation: 'Punctuation',
    inherentVowel: 'Every consonant letter carries the inherent vowel /a/. A vowel sign replaces it.',
    columns: { glyph: 'Glyph', codepoint: 'Codepoint', unicodeName: 'Unicode name', latin: 'Latin', note: 'Note' },
    conformanceLink: 'Rendering conformance',
    collisionsLink: 'Words written alike',
  },
  ejaan: {
    title: 'Ejaan',
    lead: 'The Latin side needs as much specification as the Lontara side. An underspecified Latin orthography makes the whole enumeration unsound.',
    openQuestions: 'Open questions',
    provisional: 'Provisional — awaiting a reviewer',
  },
  corpus: {
    title: 'Forms attested in the corpus',
    lead: 'These forms genuinely occur in Bugis Wikipedia, written in both Lontara and Latin by its editors. Press one to read it here.',
    claim:
      'What a pair claims is only this: a Wikipedia editor wrote this aksara and this Latin for each other. That is community practice, not authority — no reviewer has signed any of it off, and some pairs are plainly wrong.',
    agrees: 'agrees',
    disagrees: 'differs',
    disagreesNote:
      'This repository\'s rules produce different aksara from what the corpus records. Either the rules are wrong or practice varies. Shown as it is, rather than hidden.',
    agreementLine: (agreeing, total) =>
      `These rules agree with ${agreeing} of ${total} attested pairs.`,
  },
  attestation: {
    corpus: 'corpus',
    dictionary: 'dictionary',
    reviewer: 'reviewer',
    corpusWarning:
      'The readings below are corpus-attested only: the form does occur in Bugis Wikipedia text, but that does not make it a Bugis word. The same corpus contains Indonesian, English and foreign place names, and this tool cannot tell them apart. No dictionary has been used yet.',
  },
  share: {
    copyLink: 'Copy link',
    copied: 'Copied',
    copyAksara: 'Copy the aksara',
    copyRefused:
      'The browser refused to copy. The aksara above can be selected and copied by hand, and its codepoints are below.',
    fragmentNote: 'Everything after the # is never sent to the server.',
  },
  offline: {
    ready: 'Ready to use offline',
    note:
      'The whole site is stored on this device. It keeps working with no connection, and nothing is sent anywhere.',
  },
  trace: {
    ruleId: 'Rule',
    citation: 'Citation',
    input: 'Input',
    output: 'Output',
    provisionalBadge: 'provisional',
    citedBadge: 'cited',
  },
  common: {
    back: 'Back',
    switchLocale: 'Bahasa Indonesia',
    sourceCode: 'Source',
    codepointView: 'Codepoint view',
    unverified: 'unverified',
    clear: 'Clear',
    tryExample: 'Try',
    backspace: 'Delete one character',
    skipToContent: 'Skip to content',
    currentPage: 'current page',
    opensInNewTab: 'opens in a new tab',
    builtBy: 'Designed & built by',
  },
}

const COPY: Record<Locale, Copy> = { id, en }

export function getCopy(locale: Locale): Copy {
  return COPY[locale]
}
