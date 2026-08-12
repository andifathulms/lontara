/**
 * A horizontally scrolling box a keyboard can actually reach into.
 *
 * Six containers were `<div className="overflow-x-auto">` holding no focusable
 * element — three inventory tables, two orthography tables, and the writer's
 * band. A pointer scrolls them. Nothing else could, so at 320px or at 200%
 * zoom the clipped columns and the right-hand end of the band were simply
 * unreachable without a mouse (WCAG 2.1.1).
 *
 * `tabIndex={0}` makes the box focusable, so arrow keys scroll it. That alone
 * would create a new problem — a tab stop announced as nothing in particular —
 * so it also needs a name.
 *
 * ROLE JUSTIFICATION, since this pass wants native elements first: there is no
 * native element that is both scrollable and nameable. `<figure>` cannot take
 * focus, and `<section>` only becomes a landmark once it is named, which is the
 * same ARIA wearing a different spelling. `role="region"` with a name is the
 * pattern the WAI documents for exactly this, and it is the only role added.
 *
 * The name is an id reference, never a string. Every one of these wraps content
 * that is already titled — a table with an accessible name, or a figure with a
 * caption — so the region borrows that name instead of inventing a second one
 * beside it. An unnamed focusable region would be worse than the unreachable
 * box it replaces; a *redundantly* named one would just be noise.
 */
export function ScrollRegion({
  labelledBy,
  className,
  children,
}: {
  /** Id of the element that already names this content. */
  labelledBy: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      role="region"
      aria-labelledby={labelledBy}
      tabIndex={0}
      className={`overflow-x-auto${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  )
}
