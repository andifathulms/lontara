import type { ReactNode } from 'react'

/**
 * The shared "the result on screen is a beat behind what you typed"
 * treatment, used by both tools' deferred panels — `ReturnTrip` and the
 * reader's tree.
 *
 * Before this, `ReturnTrip` dimmed to `opacity-50` while settling and the
 * reader's tree gave no signal at all, and both live regions went silent for
 * the duration — silence a screen-reader user cannot tell apart from "nothing
 * changed." The visible label here says the same thing the caller's `Announce`
 * should say while `active` is true, on the same principle `Announce.tsx`
 * documents for the rest of this app: sighted users get it from the page,
 * everyone else gets the identical sentence from the live region.
 */
export function Settling({
  active,
  label,
  children,
}: {
  active: boolean
  label: string
  children: ReactNode
}) {
  return (
    <div className={active ? 'opacity-50' : undefined}>
      {active ? <p className="mb-2 font-anotasi text-anotasi text-gold/80">{label}</p> : null}
      {children}
    </div>
  )
}
