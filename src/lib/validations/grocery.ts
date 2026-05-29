import { z } from 'zod'

export const createGroceryListSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht').max(100).default('Boodschappenlijst'),
})

export const addGroceryItemSchema = z.object({
  name: z.string().min(1, 'Item naam is verplicht').max(200),
  quantity: z.number().positive().optional(),
  unit: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  thumbnail_url: z.string().url().optional(),
})

export const updateGroceryItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  quantity: z.number().positive().optional().nullable(),
  unit: z.string().max(50).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  is_checked: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
})

export const setGroceryScheduleSchema = z.object({
  order_deadline: z.string().datetime({ offset: true }).nullable().optional(),
  delivery_at: z.string().datetime({ offset: true }).nullable().optional(),
}).refine(
  (data) => {
    if (data.order_deadline && data.delivery_at) {
      return new Date(data.delivery_at) > new Date(data.order_deadline)
    }
    return true
  },
  { message: 'Bezorgtijdstip moet na de besteldeadline liggen', path: ['delivery_at'] }
)

export type CreateGroceryListInput = z.infer<typeof createGroceryListSchema>
export type AddGroceryItemInput = z.infer<typeof addGroceryItemSchema>
export type UpdateGroceryItemInput = z.infer<typeof updateGroceryItemSchema>
export type SetGroceryScheduleInput = z.infer<typeof setGroceryScheduleSchema>
