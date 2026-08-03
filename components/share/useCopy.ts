'use client'

import { useEffect, useState } from 'react'

export type CopyState = 'idle' | 'copied' | 'refused'

/**
 * Copy-to-clipboard, with the refusal case treated as a real outcome rather
 * than a silent nothing.
 *
 * `navigator.clipboard` needs a secure context and can be denied outright, and
 * the caller has to be able to say so — for the aksara in particular, someone
 * who thinks they copied a name and did not could carve the wrong thing. The
 * text is always visible and selectable on the page as the fallback that works
 * regardless.
 *
 * The state resets whenever the text changes, so "copied" can never refer to
 * something other than what is on screen now.
 */
export function useCopy(text: string): [CopyState, () => void] {
  const [state, setState] = useState<CopyState>('idle')

  useEffect(() => {
    setState('idle')
  }, [text])

  const run = () => {
    if (!navigator.clipboard) {
      setState('refused')
      return
    }
    navigator.clipboard.writeText(text).then(
      () => setState('copied'),
      () => setState('refused'),
    )
  }

  return [state, run]
}
