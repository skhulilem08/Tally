import { z } from 'zod'

export const manualListSchema = z.object({
  name: z.string().trim().min(1).max(160),
  text: z.string().trim().min(1).max(20000),
  requestId: z.string().uuid(),
  approved: z.literal(true),
}).superRefine(({ text }, context) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (!lines.length || lines.length > 200 || lines.some((line) => line.length > 160)) {
    context.addIssue({ code: 'custom', path: ['text'], message: 'Use 1–200 non-empty lines, at most 160 characters each.' })
  }
})
export function manualListData({ name, text }, newId) {
  return {
    name, source: 'manual', selections: [], inventory: [], warnings: [],
    items: text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => ({
      id: newId(), name: line, amount: null, unit: '', checked: false,
    })),
  }
}
