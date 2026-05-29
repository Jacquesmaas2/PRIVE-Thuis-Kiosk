import { z } from 'zod'

const colorHexSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Kleur moet een geldige hexcode zijn, bijvoorbeeld #3b82f6')

const calendarUrlSchema = z
  .string()
  .min(1, 'URL is verplicht')
  .refine((value) => {
    try {
      const parsed = new URL(value)
      return ['http:', 'https:', 'webcal:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }, 'Gebruik een geldige URL (http, https of webcal)')

export const createCalendarSubscriptionSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht').max(100),
  url: calendarUrlSchema,
  color: colorHexSchema.default('#3b82f6'),
})

export const updateCalendarSubscriptionSchema = createCalendarSubscriptionSchema.partial()

export type CreateCalendarSubscriptionInput = z.infer<typeof createCalendarSubscriptionSchema>
export type UpdateCalendarSubscriptionInput = z.infer<typeof updateCalendarSubscriptionSchema>
