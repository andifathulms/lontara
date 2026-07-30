import type { ReadingTreeNode } from '@/lib/engine/enumerate'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { Rhombus } from '@/components/ambiguity/Rhombus'

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
            node.classes.length > 0 ? 'text-daun' : 'text-lontar/85'
          }`}
        >
          {node.latin || '∅'}
        </span>

        {node.classes.length > 0 ? (
          <span className="font-anotasi text-[10px] uppercase tracking-widest text-daun/80">
            {node.classes.map((c) => copy.ambiguityClass[c]).join(' + ')}
          </span>
        ) : null}

        {isBranch ? (
          <span className="font-anotasi text-[10px] uppercase tracking-widest text-lontar/40">
            {copy.reader.readingCount(node.readingCount)}
          </span>
        ) : null}
      </div>

      {isBranch ? (
        <div className="mb-1 ml-1 border-l-2 border-daun pl-3">
          {node.ambiguities.map((a, index) => (
            <p key={`${a.ruleId}-${index}`} className="text-xs text-lontar/65">
              <span className="font-anotasi uppercase tracking-widest text-daun">
                {copy.ambiguityClass[a.class]}
              </span>{' '}
              {a.reason}
            </p>
          ))}
        </div>
      ) : null}

      {isLeaf && node.reading ? (
        <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {/* What is actually behind this reading. A corpus attestation means the
              form occurs in text — not that it is a Bugis word — so it is
              badged in sabbe rather than gold, and never looks like a
              confirmation. */}
          {node.reading.attestation ? (
            <span
              className={`border px-1.5 font-anotasi text-[10px] uppercase tracking-widest ${
                node.reading.attestation === 'corpus'
                  ? 'border-sabbe text-sabbe'
                  : 'border-gold/50 text-gold'
              }`}
            >
              {copy.attestation[node.reading.attestation]}
            </span>
          ) : null}
          {node.reading.band && node.reading.band !== 'unknown' ? (
            <span className="border border-gold/50 px-1.5 font-anotasi text-[10px] uppercase tracking-widest text-gold">
              {node.reading.band}
            </span>
          ) : null}
          <span
            className="font-anotasi text-[11px] text-lontar/45"
            title={node.reading.score.components.map((c) => `${c.label}: ${c.value} — ${c.why}`).join('\n')}
          >
            skor {node.reading.score.total}
          </span>
          {node.reading.entries[0] ? (
            <span className="font-anotasi text-[11px] text-lontar/40">
              {node.reading.entries[0].provenance.source}
            </span>
          ) : null}
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
