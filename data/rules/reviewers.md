# Penelaah / Reviewers

**Status: no reviewer. The gate is unmet. The reader (M3) does not launch.**

Lontara is a living script with a community of practice and a major literary
tradition. Confidently wrong output has consequences: a mis-rendered name on a
permanent sign, a student taught a wrong rule, a manuscript passage misread
(PRD §9).

The machine-readable list is [`reviewers.json`](./reviewers.json). `lib/gate.ts`
and `pnpm gate:check` both read it. This file is the human account.

## What the gate requires

- At least one **named** Bugis reviewer, with **consent recorded**, before the
  reader ships publicly.
- Ideally someone who reads **manuscript** Lontara, not only someone who can
  type it — the reader is aimed at exactly that skill.
- Credited by name, prominently, with consent.

## Where to look

Per PRD §9:

- The **Bugis Wikipedia** community (`bug.wikipedia.org`).
- The **Sastra Daerah** programme at Universitas Hasanuddin.
- The **Badan Bahasa** provincial office in South Sulawesi — also the place to
  ask about the standard Latin orthography, which `ejaan` depends on.

## Log

Record every approach here, including the ones that went nowhere. This is the
long-lead item on the project and the one thing that cannot be hurried — it is
a human task, not a technical one.

| Date | Who | Channel | Outcome |
|---|---|---|---|
| — | — | — | Not yet started. |

## What a reviewer is being asked to do

Not to read code. The orthography lives in
[`rules.json`](./rules.json) as data — id, pattern, output, priority,
citation — precisely so that a Bugis-literate reviewer who does not program can
audit it (invariant 1). `pnpm rules:report` prints every rule with its citation
and review status in a readable table.

Sign-off is per-fixture, not blanket. An approved fixture goes in
`tests/reviewed/`, which is the highest authority in the repo: if the engine
disagrees with one, **the engine is wrong** (invariant 11). Those files are not
modifiable without going back to the reviewer who signed them.
