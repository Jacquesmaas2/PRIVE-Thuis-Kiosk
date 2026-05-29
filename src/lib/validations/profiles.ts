import { z } from 'zod'

export const addKidSchema = z.object({
  display_name: z.string().min(1, 'Naam is verplicht').max(50),
  date_of_birth: z.string().optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Ongeldige kleur')
    .optional()
    .default('#6366f1'),
})

export const inviteParentSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
})

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  date_of_birth: z.string().optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  role: z.enum(['parent', 'kid', 'guest']).optional(),
})

export type AddKidInput = z.infer<typeof addKidSchema>
export type InviteParentInput = z.infer<typeof inviteParentSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
