import { z } from 'zod'

export const memorySchema = z.object({
  facts: z.array(z.object({
    label: z.string().trim().min(1).max(80),
    value: z.string().trim().min(1).max(500),
  })).max(30),
  narrative: z.string().trim().max(8000),
})
export const messageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'event']),
  content: z.string().min(1).max(12000),
  spoken: z.boolean().optional(),
})
// Editable drafts may be incomplete. Provider proposals and approvals have
// stricter domain schemas at their respective boundaries.
export const assistantStateSchema = z.object({
  enabled: z.boolean(),
  memory: memorySchema,
  summary: z.string().max(4000),
  messages: z.array(messageSchema).max(60),
  draft: z.record(z.string(), z.unknown()).nullable(),
  groceryPlan: z.record(z.string(), z.unknown()).nullable(),
  recipeRequestId: z.string().uuid(),
  groceryRequestId: z.string().uuid(),
  mode: z.enum(['chat', 'manual']).default('chat'),
  manual: z.record(z.string(), z.unknown()).nullable().default(null),
}).refine((state) => JSON.stringify(state).length <= 160000, 'Assistant history is too large.')

export function emptyAssistantState(newId = () => crypto.randomUUID()) {
  return {
    enabled: true,
    memory: { facts: [], narrative: '' },
    summary: '',
    messages: [],
    draft: null,
    groceryPlan: null,
    recipeRequestId: newId(),
    groceryRequestId: newId(),
    mode: 'chat',
    manual: null,
  }
}

export function memoryMarkdown(memory) {
  const cell = (value) => value.replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ')
  return `# Personal memory\n\n| General fact | Detail |\n| --- | --- |\n${memory.facts.map(({ label, value }) => `| ${cell(label)} | ${cell(value)} |`).join('\n')}\n\n## Preferences and context\n\n${memory.narrative || 'No preferences remembered yet.'}\n`
}
