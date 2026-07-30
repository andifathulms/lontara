import { z } from 'zod'
import hardStringsJson from '@/data/rendering/hard-strings.json'
import { fromCodepoint } from '@/lib/rules/inventory'

const CaseSchema = z.object({
  id: z.string().min(1),
  codepoints: z.array(z.string().regex(/^U\+[0-9A-F]{4}$/)).nonempty(),
  why: z.string().min(1),
  expect: z.string().min(1),
})

export const HardStringsSchema = z
  .object({
    font: z.object({
      face: z.string().min(1),
      version: z.string().min(1),
      shipped: z.string().min(1),
      features: z.array(z.string()).nonempty(),
    }),
    devices: z.array(z.string()).nonempty(),
    cases: z.array(CaseSchema).nonempty(),
    openCases: z.array(z.object({ note: z.string().min(1) })),
  })
  .passthrough()

export type HardStringCase = z.infer<typeof CaseSchema> & { text: string }

const parsed = HardStringsSchema.parse(hardStringsJson)

export const HARD_STRINGS = {
  ...parsed,
  cases: parsed.cases.map((c) => ({
    ...c,
    // Built from the codepoint list, never from a literal, so the string on
    // screen and the codepoints beside it cannot drift apart.
    text: c.codepoints.map(fromCodepoint).join(''),
  })),
} satisfies { cases: HardStringCase[] } & Record<string, unknown>
