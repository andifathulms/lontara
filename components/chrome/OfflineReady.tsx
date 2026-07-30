'use client'

import { useEffect, useState } from 'react'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { BASE_PATH } from '@/lib/paths'

/**
 * Register the generated service worker, and say so once it is actually in
 * control (PRD §12: fully offline after first load).
 *
 * The notice is rendered from `controller`, not from a successful registration.
 * Registering only means the worker is installing; it does not mean anything is
 * cached yet, and telling someone the site works offline before it does is the
 * kind of confident wrongness this project is supposed to avoid.
 */
export function OfflineReady({ locale }: { locale: Locale }) {
  const copy = getCopy(locale)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    // sw.js only exists in an export; `next dev` has no such file.
    if (process.env.NODE_ENV !== 'production') return

    let cancelled = false

    navigator.serviceWorker
      .register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` })
      .catch(() => {
        // No offline support on this device. Nothing else degrades, so there is
        // nothing to report to the reader.
      })

    const check = () => {
      if (!cancelled) setReady(navigator.serviceWorker.controller !== null)
    }
    check()
    navigator.serviceWorker.addEventListener('controllerchange', check)

    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener('controllerchange', check)
    }
  }, [])

  if (!ready) return null

  return (
    <p className="font-anotasi text-[11px] text-lontar/45">
      {/* gold, not daun — daun is reserved for ambiguity markers and nothing
          else, so that green always means "the script does not decide this". */}
      <span className="text-gold/80">●</span> {copy.offline.ready} — {copy.offline.note}
    </p>
  )
}
