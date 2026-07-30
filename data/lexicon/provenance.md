# Provenans leksikon / Lexicon provenance

**The lexicon is empty. That is a deliberate state, not an unfinished one.**

Invariant 13: every lexicon entry has a provenance field. No entry without a
source. Anything with unclear licensing does not go in, however convenient.

Every source named in PRD Appendix A is a PDF. None has been extracted. So
there is currently nothing that could be added here honestly, and inventing
Bugis words to make the reader look like it works would be the exact failure
this project exists to avoid.

## What an empty lexicon costs

The reader's enumeration is lexicon-driven by design. Given a Lontara string it
finds every lexicon entry which, when run through the writer, produces that
string. This is sound without any orthographic rule about which consonants can
close a syllable — it inverts a cited function over an attested word list.

With no entries, the reader can state:

- the **syllable skeleton** — the reading with the inherent vowel throughout, no
  finals, no gemination, no glottal stop;
- that the four ambiguity classes are **undetermined**, and that the number of
  possible readings is **unknown**.

It cannot rank, and it cannot filter to known words. It says so, in those words,
rather than presenting the skeleton as *the* reading.

The alternative — a structural enumerator seeded with a guessed inventory of
possible final consonants — would produce a confident-looking tree of readings
that are not Bugis. See `openQuestions.final-inventory` in
[`../rules/rules.json`](../rules/rules.json).

## Required fields per entry

```json
{
  "id": "said-1977-0001",
  "latin": "…",
  "band": "core | common | uncommon | rare | unknown",
  "provenance": {
    "source": "Said, Kamus Bahasa Bugis-Indonesia (1977)",
    "locator": "p. 12, headword 3",
    "licence": "…",
    "licenceUrl": "https://…",
    "retrieved": "2026-07-30"
  }
}
```

`band` is a claim about frequency. Until a corpus is actually counted, an
honest entry from a dictionary is `unknown` — guessing a band would make the
ranking untrustworthy in precisely the way a curated lexicon is meant to
prevent.

`gloss` is optional and is **for reviewer verification only**. It is never
rendered anywhere in the UI. Transliteration is not translation, and the UI must
never suggest the tool produces meaning (invariant 16).

## Candidate sources, and what has to happen first

| Source | Licence status | Action needed |
|---|---|---|
| Said, *Kamus Bahasa Bugis-Indonesia* (1977), via oxis.org | **Unverified.** Hosted as a downloadable PDF; hosting is not a licence. | Establish the copyright position before extracting a single entry. 1977 is not obviously out of copyright in Indonesia. |
| *Kamus Bahasa Bugis-Indonesia* (227 pp.), Wikimedia Commons | **Check the file's licence tag.** Commons hosting means a tag exists; it does not mean it is permissive. | Read the tag on that specific file and record it per entry. |
| *Kamus Dwibahasa Bugis-Indonesia* (2017), Wikimedia Commons | **Check the file's licence tag.** A 2017 work is very likely still in copyright. | Same. |
| Bugis–English–Indonesian dictionary ordered by Latin alphabet | **Unverified.** | Easiest to extract — prefer it for bulk work once the licence is settled. |
| Bugis Wikipedia (`bug.wikipedia.org`) | **CC BY-SA.** Known and permissive. | The frequency corpus. Attribution required, so record it per band rather than per entry. |

The Wikipedia corpus is the one source whose licence is already clear, which
makes it the sensible place to start — and it gives frequency bands, which the
dictionaries do not.

## Extraction log

Record every extraction pass here, including abandoned ones.

| Date | Source | Entries added | Notes |
|---|---|---|---|
| — | — | 0 | Not yet started. Licence positions unresolved. |
