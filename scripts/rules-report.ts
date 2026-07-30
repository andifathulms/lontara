/**
 * Print every rule with its citation and review status.
 *
 * This is the artefact a Bugis reviewer reads. It is why the orthography is data
 * and not code (invariant 1): someone who does not program has to be able to
 * audit it. So the output is prose in reading order, not a dump — provisional
 * rules first, because they are the ones to attack, then the derivations, then
 * what is straightforwardly cited, then the open questions and who to ask.
 */
import { RULE_SET, RULES, OPEN_QUESTIONS } from '../lib/rules/loader'
import { REVIEWERS } from '../lib/gate'
import type { Rule, RuleStatus } from '../lib/rules/schema'

function wrap(text: string, width = 76, indent = '    '): string {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    if (line.length + word.length + 1 > width) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(line)
  return lines.map((l) => indent + l).join('\n')
}

function heading(text: string) {
  console.log('')
  console.log(text)
  console.log('─'.repeat(text.length))
}

function printRule(r: Rule) {
  console.log('')
  console.log(`  ${r.id}    [${r.stage} · priority ${r.priority} · ${r.status}]`)
  console.log(wrap(r.description))
  if (r.type === 'loss') {
    console.log(wrap(`Ambiguity class: ${r.ambiguityClass}. Trigger: ${r.trigger}. Action: ${r.action}.`))
  }
  console.log('')
  console.log(wrap(`Citation — ${r.citation}`))
  if (r.note) {
    console.log('')
    console.log(wrap(`NOTE — ${r.note}`))
  }
  const questions = OPEN_QUESTIONS.filter((q) => q.blocks.includes(r.id))
  for (const q of questions) {
    console.log(wrap(`Open question — ${q.id}`))
  }
}

const ORDER: RuleStatus[] = ['provisional', 'derived', 'cited']
const LABEL: Record<RuleStatus, string> = {
  provisional: 'PROVISIONAL — not established. Attack these first.',
  derived: 'DERIVED — follows from cited facts by the reasoning in the citation.',
  cited: 'CITED — points at a published source.',
}

console.log(`Lontara — himpunan aturan / rule set ${RULE_SET.version}`)
console.log(`Review status: ${RULE_SET.reviewStatus}`)
console.log(
  REVIEWERS.length === 0
    ? 'Reviewers: none. The gate is unmet and the reader does not launch (PRD §9).'
    : `Reviewers: ${REVIEWERS.map((r) => r.name).join(', ')}`,
)
console.log(`Rules: ${RULES.length}. Open questions: ${OPEN_QUESTIONS.length}.`)

for (const status of ORDER) {
  const group = RULES.filter((r) => r.status === status)
  if (group.length === 0) continue
  heading(`${status.toUpperCase()} (${group.length})`)
  console.log(wrap(LABEL[status], 76, '  '))
  for (const r of group) printRule(r)
}

heading('AMBIGUITY CLASSES (closed set — invariant 3)')
for (const [cls, meta] of Object.entries(RULE_SET.ambiguityClasses)) {
  if (!meta) continue
  console.log('')
  console.log(`  ${cls}`)
  console.log(wrap(meta.description))
  console.log(wrap(`Citation — ${meta.citation}`))
}

heading(`OPEN QUESTIONS (${OPEN_QUESTIONS.length})`)
console.log(wrap('Not guessed at. Each names who to ask.', 76, '  '))
for (const q of OPEN_QUESTIONS) {
  console.log('')
  console.log(`  ${q.id}${q.blocks.length ? `    blocks: ${q.blocks.join(', ')}` : ''}`)
  console.log(wrap(`Q — ${q.question}`))
  console.log(wrap(`Why it matters — ${q.why}`))
  console.log(wrap(`Ask — ${q.askWhom}`))
}

console.log('')
