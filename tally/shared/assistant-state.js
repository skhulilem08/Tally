import { z } from 'zod'
import { memoryChangeSchema } from './assistant-memory.js'

export const memorySchema = z.object({
  facts: z.array(z.object({
    label: z.string().trim().min(1).max(80),
    value: z.string().trim().min(1).max(500),
  })).max(30).refine((facts) => new Set(facts.map((fact) => fact.label)).size === facts.length, 'Use each fact label once.'),
  narrative: z.string().trim().max(8000),
})
export const messageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'event']),
  content: z.string().min(1).max(12000),
  spoken: z.boolean().optional(),
  memoryRevision: z.number().int().min(0).optional(),
})
// Editable drafts allow blank fields, but never arbitrary object/array shapes.
// Provider proposals and approvals enforce complete values separately.
const editNumber = z.union([z.number().finite(), z.string().max(40)])
const editableRecipe = z.object({
  title: z.string().max(180), description: z.string().max(2000),
  servings: editNumber,
  prepMinutes: editNumber.nullable().default(null),
  cookMinutes: editNumber.nullable().default(null),
  ingredients: z.array(z.object({
    name: z.string().max(160), amount: editNumber, unit: z.string().max(32),
  })).min(1).max(100),
  steps: z.array(z.string().max(4000)).min(1).max(80),
  notes: z.string().max(5000),
})
const editableGroceryPlan = z.object({
  name: z.string().max(160),
  selections: z.array(z.object({ recipeId: z.string().uuid(), servings: editNumber })).max(50),
  inventory: z.array(z.object({ name: z.string().max(160), amount: editNumber, unit: z.string().max(32) })).max(200),
})
export const assistantStateSchema = z.object({
  enabled: z.boolean(),
  memory: memorySchema,
  memoryRevision: z.number().int().min(0).default(0),
  memoryHistory: z.array(memoryChangeSchema).max(30).default([]),
  memoryCorrectionFloor: z.number().int().min(0).default(0),
  summary: z.string().max(4000),
  messages: z.array(messageSchema).max(60),
  draft: editableRecipe.nullable(),
  groceryPlan: editableGroceryPlan.nullable(),
  recipeRequestId: z.string().uuid(),
  groceryRequestId: z.string().uuid(),
  mode: z.enum(['chat', 'manual']).default('chat'),
  manual: z.object({
    kind: z.enum(['choose', 'recipe', 'groceries']),
    step: z.number().int().min(0).max(3),
    recipe: editableRecipe,
    groceries: z.object({ name: z.string().max(160), text: z.string().max(20000) }),
    recipeRequestId: z.string().uuid(),
    groceryRequestId: z.string().uuid(),
  }).nullable().default(null),
}).refine((state) => JSON.stringify(state).length <= 160000, 'Assistant history is too large.')

export function emptyAssistantState(newId = () => crypto.randomUUID()) {
  return {
    enabled: true,
    memory: { facts: [], narrative: '' },
    memoryRevision: 0,
    memoryHistory: [],
    memoryCorrectionFloor: 0,
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
