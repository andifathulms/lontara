/**
 * The reviewer gate (PRD §9, invariant 12). Exits non-zero while unmet.
 *
 * Deliberately NOT wired into `build`. The gate blocks *launching* the reader,
 * not building the site — a build that refused to run would stop the writer,
 * the script reference and the conformance page from being worked on at all,
 * and those are exactly the things that have to exist before a reviewer can be
 * given anything to review.
 *
 * So: CI runs this and reports it loudly, every page carries the unmet-gate
 * notice, and the reader carries the stronger "not publicly released" line. The
 * gate is honoured in the product, not by bricking the toolchain.
 */
import { REVIEWERS, CONSENTING_REVIEWERS, REVIEWER_GATE_MET } from '../lib/gate'
import { RULE_SET } from '../lib/rules/loader'

const blocked = ['baca (the reader) — M3, PRD §11']

console.log('gate:check — gerbang penelaah / reviewer gate (PRD §9)')
console.log('')

if (REVIEWER_GATE_MET) {
  console.log('  ✓ MET')
  for (const r of CONSENTING_REVIEWERS) {
    console.log(`      ${r.name} — ${r.affiliation}`)
    console.log(`      scope: ${r.scope}`)
    console.log(`      signed off: ${r.signedOff.length ? r.signedOff.join(', ') : 'nothing yet'}`)
  }
  if (RULE_SET.reviewStatus !== 'reviewed') {
    console.log('')
    console.log('  ! A reviewer is named but rules.json reviewStatus is still "unreviewed".')
    console.log('    Update it deliberately, when the sign-off actually covers the rule set.')
  }
  process.exit(0)
}

console.log('  ✗ UNMET — no named Bugis reviewer with consent recorded.')
console.log('')
console.log('    Blocked from public launch:')
for (const b of blocked) console.log(`      · ${b}`)
console.log('')

if (REVIEWERS.length > 0) {
  console.log(`    ${REVIEWERS.length} reviewer(s) listed but none has consent recorded:`)
  for (const r of REVIEWERS) console.log(`      · ${r.name}`)
  console.log('')
}

console.log('    This is the long-lead item on the project and it is a human task, not a')
console.log('    technical one. Start now, not at M3. Where to look, and the log of who has')
console.log('    been approached, is in data/rules/reviewers.md.')
console.log('')
console.log('    Naming someone means editing data/rules/reviewers.json with their consent.')
console.log('    Do not satisfy this check any other way.')
console.log('')

process.exit(1)
