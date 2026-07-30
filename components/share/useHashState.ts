'use client'

import { useCallback, useEffect, useState } from 'react'
import { decodeShareHash, encodeShareHash } from '@/lib/share/hash'

/**
 * Input state, mirrored into the URL fragment so a link is shareable (PRD §4).
 *
 * The initial value is read in an effect and never during render. A static
 * export is prerendered without a fragment, so reading `location.hash` while
 * rendering would hand React different markup than it built and produce a
 * hydration mismatch.
 *
 * Writes use `replaceState`, so typing a word does not push twenty entries onto
 * the back stack — Back should leave the tool, not walk letter by letter through
 * what you just typed.
 */
export function useHashState(): [string, (next: string) => void] {
  const [value, setValue] = useState('')

  useEffect(() => {
    const read = () => setValue(decodeShareHash(window.location.hash))
    read()
    // Someone may paste a different link into the same tab, or use Back.
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])

  const update = useCallback((next: string) => {
    setValue(next)
    const url = `${window.location.pathname}${window.location.search}${encodeShareHash(next)}`
    window.history.replaceState(null, '', url)
  }, [])

  return [value, update]
}
