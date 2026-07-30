/**
 * A minimal TrueType `cmap` reader — just enough to list which code points a
 * font actually maps.
 *
 * Written by hand rather than pulled from a dependency because it exists to
 * answer one question at build time: does every codepoint in inventory.json
 * really exist in the font we ship? Reading the answer out of the font itself is
 * the only way to keep a transcription slip from reaching a reader.
 *
 * It reads the vendored TTF, not the shipped woff2 — woff2 is brotli-compressed
 * and decompressing it would mean a dependency. `pnpm fonts:subset` generates
 * the woff2 from this exact TTF, so the TTF is a sound stand-in for coverage.
 * The subset's own unicode list is asserted separately in the validator.
 */
import { readFileSync } from 'node:fs'

export function readCmap(path: string): Set<number> {
  const buf = readFileSync(path)
  const numTables = buf.readUInt16BE(4)

  let cmapOffset = -1
  for (let i = 0; i < numTables; i += 1) {
    const record = 12 + i * 16
    if (buf.toString('ascii', record, record + 4) === 'cmap') {
      cmapOffset = buf.readUInt32BE(record + 8)
      break
    }
  }
  if (cmapOffset < 0) throw new Error(`no cmap table in ${path}`)

  const numSubtables = buf.readUInt16BE(cmapOffset + 2)
  const codepoints = new Set<number>()

  for (let i = 0; i < numSubtables; i += 1) {
    const encoding = cmapOffset + 4 + i * 8
    const subtable = cmapOffset + buf.readUInt32BE(encoding + 4)
    const format = buf.readUInt16BE(subtable)

    if (format === 4) readFormat4(buf, subtable, codepoints)
    else if (format === 12) readFormat12(buf, subtable, codepoints)
    // Formats 0/6 map only the BMP subsets that formats 4/12 also cover in
    // every font we care about here; ignoring them cannot cause a false pass,
    // only a false failure, which is the safe direction.
  }

  return codepoints
}

function readFormat4(buf: Buffer, base: number, out: Set<number>): void {
  const segCountX2 = buf.readUInt16BE(base + 6)
  const segCount = segCountX2 / 2
  const endCodes = base + 14
  const startCodes = endCodes + segCountX2 + 2
  const idDeltas = startCodes + segCountX2
  const idRangeOffsets = idDeltas + segCountX2

  for (let s = 0; s < segCount; s += 1) {
    const end = buf.readUInt16BE(endCodes + s * 2)
    const start = buf.readUInt16BE(startCodes + s * 2)
    if (start > end) continue

    const delta = buf.readInt16BE(idDeltas + s * 2)
    const rangeOffset = buf.readUInt16BE(idRangeOffsets + s * 2)

    for (let cp = start; cp <= end && cp !== 0xffff; cp += 1) {
      let glyph: number
      if (rangeOffset === 0) {
        glyph = (cp + delta) & 0xffff
      } else {
        const at = idRangeOffsets + s * 2 + rangeOffset + (cp - start) * 2
        if (at + 1 >= buf.length) continue
        const raw = buf.readUInt16BE(at)
        glyph = raw === 0 ? 0 : (raw + delta) & 0xffff
      }
      if (glyph !== 0) out.add(cp)
    }
  }
}

function readFormat12(buf: Buffer, base: number, out: Set<number>): void {
  const nGroups = buf.readUInt32BE(base + 12)
  for (let g = 0; g < nGroups; g += 1) {
    const group = base + 16 + g * 12
    const start = buf.readUInt32BE(group)
    const end = buf.readUInt32BE(group + 4)
    const startGlyph = buf.readUInt32BE(group + 8)
    if (startGlyph === 0) continue
    for (let cp = start; cp <= end; cp += 1) out.add(cp)
  }
}

export function hex(cp: number): string {
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`
}
