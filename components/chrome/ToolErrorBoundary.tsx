'use client'

import { Component, type ReactNode } from 'react'
import { decodeShareHash } from '@/lib/share/hash'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { eyebrow } from '@/components/chrome/eyebrow'
import { CodepointView } from '@/components/codepoints/CodepointView'

type Props = { locale: Locale; children: ReactNode }
type State = { hasError: boolean }

/**
 * Wraps `ReaderTool` and `WriterTool` specifically — not the route. See
 * `app/[locale]/error.tsx` for the outer net that catches anything else under
 * `[locale]`.
 *
 * `interpret()` and `enumerate()` run inside `useMemo` in render with no
 * try/catch of their own. This project's second stated principle is "never
 * guess quietly"; an unhandled crash is the loudest possible way to break
 * that, since the user gets a blank page instead of a declared limitation.
 *
 * Both tools mirror their input into the URL fragment before ever touching
 * the engine (`useHashState`), so the fragment survives a crash even though
 * the component that was reading it does not. Recovering it here — rather
 * than lifting input state out of the tools — is what lets the fallback show
 * the input and its codepoints without the engine that just failed on them.
 */
export class ToolErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override componentDidCatch(error: unknown) {
    // A caught engine throw is a bug, not a supported state. Logged plainly —
    // not swallowed — and not sent anywhere: this project has no backend to
    // send it to (PRD §4, no server).
    console.error(error)
  }

  private handleReset = () => {
    if (typeof window === 'undefined') return
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    window.location.reload()
  }

  override render() {
    if (!this.state.hasError) return this.props.children

    const copy = getCopy(this.props.locale)
    const input = typeof window !== 'undefined' ? decodeShareHash(window.location.hash) : ''

    return (
      <div role="alert" className="space-y-4 border-l-4 border-sabbe bg-sabbe/10 px-4 py-4">
        <div className="space-y-1">
          <p className={eyebrow('sabbe')}>{copy.common.engineError.title}</p>
          <p className="text-sm text-lontar/85">{copy.common.engineError.body}</p>
        </div>

        {input ? (
          <p className="border-l-4 border-gold/50 bg-gold/5 px-4 py-2 font-anotasi text-sm text-lontar/85">
            {input}
          </p>
        ) : null}

        <button
          type="button"
          onClick={this.handleReset}
          className={`min-h-[36px] hover:underline ${eyebrow()}`}
        >
          {copy.common.engineError.reset}
        </button>

        {/* Does not depend on the engine (invariant 10) — the one part of the
            page that can still answer while everything else here just crashed. */}
        <CodepointView text={input} locale={this.props.locale} />
      </div>
    )
  }
}
