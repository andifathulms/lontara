/**
 * Shareable-by-URL-hash state (PRD §4: no accounts, no server, shareable by
 * URL hash).
 *
 * The fragment is deliberate and not just convenient. A URL fragment is never
 * sent to the server in the HTTP request, so a name someone is checking before
 * committing it to a signboard does not end up in a GitHub Pages access log.
 * With a query string it would.
 *
 * This module is pure — no DOM. `components/share/useHashState.ts` is the part
 * that touches `location`.
 *
 * NOTE: `decode(encode(x)) === x` holds here, and that is fine. This is a URL
 * encoding, not a transliteration. Invariant 4 forbids assuming a bijection
 * between Latin and Lontara; it says nothing about percent-encoding.
 */

const KEY = 'q'

/**
 * Percent-encoding rather than base64. A Buginese code point costs nine
 * characters this way instead of four, which is the price of a link whose Latin
 * portion a person can still read in the address bar — and browsers display the
 * decoded fragment anyway.
 */
export function encodeShareHash(value: string): string {
  if (value === '') return ''
  return `#${KEY}=${encodeURIComponent(value)}`
}

/**
 * Read the value out of a fragment. Returns `''` for anything unparseable —
 * a malformed shared link should land the reader on an empty tool, never throw.
 */
export function decodeShareHash(hash: string): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (raw === '') return ''

  for (const part of raw.split('&')) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    if (part.slice(0, separator) !== KEY) continue
    try {
      return decodeURIComponent(part.slice(separator + 1))
    } catch {
      // A truncated percent-escape — someone's chat client ate the tail.
      return ''
    }
  }
  return ''
}

/** The absolute URL to share, given the current location and a value. */
export function shareUrl(origin: string, pathname: string, value: string): string {
  return `${origin}${pathname}${encodeShareHash(value)}`
}
