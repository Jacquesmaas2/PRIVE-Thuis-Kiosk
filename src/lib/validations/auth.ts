import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens zijn'),
})

export const registerSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens zijn'),
  display_name: z.string().min(1, 'Naam is verplicht').max(50),
  family_name: z.string().min(1, 'Familienaam is verplicht').max(100),
})

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  avatar_url: z.string().url().optional().nullable(),
  locale: z.enum(['nl', 'en']).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
