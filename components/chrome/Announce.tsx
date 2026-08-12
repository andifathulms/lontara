/**
 * A polite status message for a result that changed without focus moving.
 *
 * Both tools recompute on every keystroke and on every example or attested
 * form pressed. Sighted users see the band, the tree and the counts change;
 * before this, nobody else was told anything at all — the only live region in
 * the app announced that a copy button had been pressed (WCAG 4.1.3).
 *
 * # Why it is terse
 *
 * A status message that recited the output would be unusable: the reading tree
 * alone runs to hundreds of forms. Everything is already on the page to be read
 * at leisure. This says only what changed and what it means — "3 possible
 * readings", "2 things were discarded" — and leaves the detail to be navigated.
 *
 * # Why it is always rendered
 *
 * A live region has to be in the DOM *before* its contents change, or the
 * change is not announced. So this renders unconditionally with an empty string
 * rather than being mounted when there is something to say.
 *
 * # Why it is not chatty
 *
 * The text node only mutates when the sentence itself changes, and the sentence
 * is a summary — typing `m`, `ma`, `mat` produces the same "nothing was
 * discarded" and announces once, not three times. `aria-live="polite"` then
 * queues behind whatever the user is doing rather than interrupting it.
 */
export function Announce({ children }: { children: string }) {
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {children}
    </p>
  )
}
