/**
 * The page column. One measure, one rhythm, one set of gutters.
 *
 * The six pages had drifted to three different vertical rhythms (`space-y-8`,
 * `-10`, `-12`) for no reason anyone could state, which is exactly the kind of
 * difference a reader feels as sloppiness without being able to name it.
 */
export function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-5 py-12">{children}</div>
  )
}

/**
 * Title and lead. Every page opens the same way, and the lead is capped at a
 * readable measure rather than at the column width.
 */
export function PageHeader({
  title,
  lead,
  children,
}: {
  title: string
  lead: string
  children?: React.ReactNode
}) {
  return (
    <header className="space-y-4">
      <h1 className="text-title text-lontar">{title}</h1>
      <p className="max-w-measure text-lead text-lontar/75">{lead}</p>
      {children}
    </header>
  )
}
