import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Titel is verplicht').max(100),
  description: z.string().max(500).optional(),
  points: z.number().int().min(0).max(1000).default(0),
  assigned_to: z.string().uuid().optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.enum(['daily', 'weekly', 'monthly']).optional().nullable(),
})

export const updateTaskSchema = createTaskSchema.partial().extend({
  is_active: z.boolean().optional(),
})

export const completeTaskSchema = z.object({
  notes: z.string().max(500).optional(),
})

export const approveTaskSchema = z.object({
  approved: z.boolean(),
  notes: z.string().max(500).optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>
export type ApproveTaskInput = z.infer<typeof approveTaskSchema>
