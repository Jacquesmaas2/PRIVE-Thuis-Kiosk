import { createClient, getAuthProfile } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { z } from 'zod'

const addressSchema = z.object({
  address_line1: z.string().max(200).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  postal_code: z.string().max(20).nullable().optional(),
  country: z.string().length(2).default('NL'),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
})

// PATCH /api/settings/address
// Parent only — update the family's home address.
export async function PATCH(req: Request) {
  try {
    const { profile } = await getAuthProfile()
    if (!profile) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    if (profile.role !== 'parent') {
      return NextResponse.json({ error: 'Alleen ouders kunnen het adres instellen' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = addressSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await admin
      .from('family_settings')
      .update(parsed.data)
      .eq('family_id', profile.family_id!)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: 'Onbekende fout', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
