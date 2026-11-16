import { z } from 'zod'

const text = (max) => z.string().trim().min(1).max(max)
const amount = z.number().finite().positive().max(1000000)
export const ingredientSchema = z.object({
  name: text(160),
  amount,
  unit: text(32),
})

export const recipeSchema = z.object({
  title: text(160),
  description: z.string().trim().max(2000).default(''),
  servings: z.number().finite().positive().max(1000),
  prepMinutes: z.number().finite().min(0).max(100000).nullable().default(null),
  cookMinutes: z.number().finite().min(0).max(100000).nullable().default(null),
  ingredients: z.array(ingredientSchema).min(1).max(100),
  steps: z.array(text(4000)).min(1).max(80),
  notes: z.string().trim().max(5000).default(''),
})

export const approvalSchema = z.object({
  recipe: recipeSchema,
  approved: z.literal(true),
  requestId: z.string().uuid(),
})

export const planSchema = z.object({
  selections: z.array(z.object({
    recipeId: z.string().uuid(),
    servings: z.number().finite().positive().max(1000),
  })).min(1).max(50).refine(
    (rows) => new Set(rows.map((row) => row.recipeId)).size === rows.length,
    'Select each recipe once.',
  ),
  inventory: z.array(z.object({
    name: text(160),
    amount: z.number().finite().min(0).max(1000000),
    unit: text(32),
  })).max(200).default([]),
})

export const listApprovalSchema = planSchema.extend({
  name: text(160),
  approved: z.literal(true),
  requestId: z.string().uuid(),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
})

export const assistantSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: text(12000),
  })).min(1).max(30).refine(
    (messages) => messages.reduce((sum, message) => sum + message.content.length, 0) <= 50000,
    'This conversation is too long. Start a new conversation.',
  ),
  draft: recipeSchema.nullish(),
})
