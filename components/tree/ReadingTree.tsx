import type { ReadingTreeNode } from '@/lib/engine/enumerate'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { Rhombus } from '@/components/ambiguity/Rhombus'
import { eyebrow } from '@/components/chrome/eyebrow'

/**
 * The reading tree (PRD §6.1) — the flagship view.
 *
 * Ambiguity nodes render as rhombi, the *sulapa' eppa'* four-cornered form,
 * because a branch point is a place where the reading has corners (PRD §10).
 * This is a meaning-carrying choice, not decoration.
 *
 * Branches expand from the rhombus. That is the only motion here.
 */
function Node({
  node,
  locale,
  order,
}: {
  node: ReadingTreeNode
  locale: Locale
  order: number
}) {
  const copy = getCopy(locale)
  const isBranch = node.children.length > 1
  const isLeaf = node.children.length === 0

  return (
    <li
      className="border-l border-lontar/20 pl-4"
      style={{
        animation: 'lontara-branch 200ms ease-out both',
        animationDelay: `${Math.min(order, 12) * 35}ms`,
      }}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-1">
        {isBranch ? <Rhombus size={12} tone="daun" className="translate-y-0.5" /> : null}

        <span
          className={`font-anotasi ${
            node.classes.length > 0 ? 'text-daun-ink' : 'text-lontar/85'
          }`}
        >
          {node.latin || '∅'}
        </span>

        {node.classes.length > 0 ? (
          <span className={eyebrow('daun', 'sm')}>
            {node.classes.map((c) => copy.ambiguityClass[c]).join(' + ')}
          </span>
        ) : null}

        {isBranch ? (
          <span className={eyebrow('quiet', 'sm')}>
            {copy.reader.readingCount(node.readingCount)}
          </span>
        ) : null}
      </div>

      {isBranch ? (
        <div className="mb-1 ml-1 border-l-2 border-daun pl-3">
          {node.ambiguities.map((a, index) => (
            <p key={`${a.ruleId}-${index}`} className="text-xs text-lontar/65">
              <span className={eyebrow('daun')}>
                {copy.ambiguityClass[a.class]}
              </span>{' '}
              {a.reason}
            </p>
          ))}
        </div>
      ) : null}

      {isLeaf && node.reading ? (
        <div className="mb-2 space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {/* What is actually behind this reading. A corpus attestation means the
                form occurs in text — not that it is a Bugis word — so it is
                badged in sabbe rather than gold, and never looks like a
                confirmation. */}
            {node.reading.attestation ? (
              <span
                className={`border px-1.5 ${
                  node.reading.attestation === 'corpus'
                    ? `border-sabbe ${eyebrow('sabbe', 'sm')}`
                    : `border-gold/50 ${eyebrow('gold', 'sm')}`
                }`}
              >
                {copy.attestation[node.reading.attestation]}
              </span>
            ) : null}
            {node.reading.band && node.reading.band !== 'unknown' ? (
              <span className={`border border-gold/50 px-1.5 ${eyebrow('gold', 'sm')}`}>
                {node.reading.band}
              </span>
            ) : null}
          </div>

          {/*
            Every component of a score is named so that a ranking can be argued
            with (rank.ts) — and all of it was reaching the user through a
            `title` tooltip, which no touch device has ever shown. A ranking you
            cannot inspect is exactly the black box this project is a reaction
            to.

            `<details>` rather than state: it needs no hydration, it is one tap,
            and it is a disclosure widget every screen reader already knows.
          */}
          <details className="group">
            <summary className="cursor-pointer list-none font-anotasi text-anotasi text-lontar/65 marker:content-[''] hover:text-gold">
              <span aria-hidden="true" className="inline-block w-3">
                {/* No animation — PRD §10 permits two, and this is not one. */}
                <span className="group-open:hidden">+</span>
                <span className="hidden group-open:inline">−</span>
              </span>{' '}
              {copy.reader.scoreLabel} {node.reading.score.total}
            </summary>

            <dl className="mt-1 space-y-1 border-l-2 border-gold/30 pl-3">
              <div className={eyebrow('quiet', 'sm')}>{copy.reader.scoreBasis}</div>
              {node.reading.score.components.map((component) => (
                <div key={component.label} className="text-xs">
                  <dt className="font-anotasi text-anotasi text-gold">
                    {component.label} · {component.value}
                  </dt>
                  <dd className="max-w-measure text-lontar/75">{component.why}</dd>
                </div>
              ))}
              {node.reading.entries[0] ? (
                <div className="text-xs">
                  <dt className={eyebrow('quiet', 'sm')}>{copy.reader.provenanceLabel}</dt>
                  <dd className="max-w-measure font-anotasi text-anotasi text-lontar/75">
                    {node.reading.entries[0].provenance.source}
                    {' · '}
                    {node.reading.entries[0].provenance.locator}
                    {' · '}
                    {node.reading.entries[0].provenance.licence}
                  </dd>
                </div>
              ) : null}
            </dl>
          </details>
        </div>
      ) : null}

      {node.children.length > 0 ? (
        <ul className="space-y-0">
          {node.children.map((child, index) => (
            <Node key={child.id} node={child} locale={locale} order={order + index + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function ReadingTree({
  tree,
  locale,
}: {
  tree: ReadingTreeNode
  locale: Locale
}) {
  if (tree.children.length === 0) return null

  return (
    <ul className="space-y-0">
      {tree.children.map((child, index) => (
        <Node key={child.id} node={child} locale={locale} order={index} />
      ))}
    </ul>
  )
}
