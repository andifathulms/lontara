/**
 * A horizontally scrolling region a keyboard can actually reach.
 *
 * Six containers in this app were `<div className="overflow-x-auto">` holding
 * no focusable element — three inventory tables, two orthography tables and the
 * writer's band. A pointer can scroll them. Nothing else can, so at 320px or at
 * 200% zoom the clipped columns and the right-hand end of the band were simply
 * unreachable without a mouse (WCAG 2.1.1).
 *
 * `tabIndex={0}` makes the box focusable so arrow keys scroll it. That alone
 * creates a new problem — a tab stop announced as "group" with no name — so it
 * takes `role="region"` and a label naming what is inside.
 *
 * ROLE JUSTIFICATION (native elements first, per this pass's rules): there is
 * no native element that is both scrollable and nameable. `<figure>` cannot
 * take focus and `<section>` only becomes a landmark once named, which is the
 * same ARIA by another spelling. This is the pattern the WAI documents for
 * scrollable content, and it is the only added role in the change.
 *
 * `label` is required rather than optional: an unnamed focusable region is
 * worse than the unreachable one it replaces.
 */
export function ScrollRegion({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={`overflow-x-auto${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  )
}
