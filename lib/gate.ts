import reviewers from '@/data/rules/reviewers.json'

/**
 * The reviewer gate. PRD §9: at least one named Bugis reviewer before launch;
 * no reviewer, no launch. This gates M3 — the reader.
 *
 * The gate is data, read from `data/rules/reviewers.json`, so that satisfying
 * it means naming a person with their consent recorded — not flipping a flag in
 * code. `pnpm gate:check` reads the same file.
 *
 * Invariant 12: do not launch a feature past a reviewer gate. While the gate is
 * unmet the reader is built but every page carries the unmet-gate notice, and
 * the reader carries the stronger "not publicly released" line.
 */
export type Reviewer = {
  name: string
  affiliation: string
  scope: string
  consentRecorded: boolean
  signedOff: string[]
}

export const REVIEWERS: Reviewer[] = reviewers.reviewers as Reviewer[]

export const CONSENTING_REVIEWERS = REVIEWERS.filter((r) => r.consentRecorded)

/** True only when a named Bugis reviewer has recorded consent. */
export const REVIEWER_GATE_MET = CONSENTING_REVIEWERS.length > 0
