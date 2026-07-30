import { describe, expect, it } from 'vitest'
import { decodeShareHash, encodeShareHash, shareUrl } from '@/lib/share/hash'
import { interpret } from '@/lib/engine/interpret'
import { fromCodepoint } from '@/lib/rules/inventory'

/**
 * A shared link is the one part of this project that travels without its
 * context, so it has to survive being pasted through a chat client and mangled.
 */
describe('the share hash round-trips', () => {
  const cases = [
    ['empty', ''],
    ['latin', 'mata'],
    ['latin with a glottal stop', "lontara'"],
    ['latin uppercase', 'MATA'],
    ['aksara', interpret('mata').output.text],
    ['aksara with a vowel sign', interpret('ki').output.text],
    ['aksara with pallawa', fromCodepoint('U+1A06') + fromCodepoint('U+1A1E') + fromCodepoint('U+1A08')],
    ['a long unspaced run', interpret('matakuluperonasae').output.text],
    ['characters that need escaping', "a&b=c#d?e f'g"],
    ['non-BMP input', 'ka😀'],
  ] as const

  for (const [label, value] of cases) {
    it(label, () => {
      expect(decodeShareHash(encodeShareHash(value))).toBe(value)
    })
  }
})

describe('a malformed link lands on an empty tool rather than throwing', () => {
  for (const hash of ['', '#', '#q', '#q=', '#other=mata', '#q=%E1%A8', '#q=%', '#%%%', 'q=mata']) {
    it(`"${hash}"`, () => {
      expect(() => decodeShareHash(hash)).not.toThrow()
      expect(typeof decodeShareHash(hash)).toBe('string')
    })
  }

  it('ignores a key it does not own', () => {
    expect(decodeShareHash('#other=mata')).toBe('')
  })

  it('finds its key among others', () => {
    expect(decodeShareHash('#other=x&q=mata&more=y')).toBe('mata')
  })
})

describe('the fragment carries the value, so it never reaches the server', () => {
  it('puts everything after the #', () => {
    const url = shareUrl('https://example.test', '/lontara/tulis/', "lontara'")
    expect(url.split('#')[0]).toBe('https://example.test/lontara/tulis/')
    expect(url).toContain('#q=')
  })

  it('emits no fragment at all for empty input', () => {
    expect(shareUrl('https://example.test', '/lontara/tulis/', '')).toBe(
      'https://example.test/lontara/tulis/',
    )
  })
})
