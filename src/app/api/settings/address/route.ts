import { createClient, getAuthProfile } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { geocodeAddress } from '@/lib/geocoding'
import { z } from 'zod'

const addressSchema = z.object({
  address_line1: z.string().max(200).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  postal_code: z.string().max(20).nullable().optional(),
  country: z.string().length(2).default('NL'),
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

    const normalizedAddress = {
      address_line1: parsed.data.address_line1?.trim() || null,
      city: parsed.data.city?.trim() || null,
      postal_code: parsed.data.postal_code?.trim() || null,
      country: parsed.data.country,
    }

    const hasAddress = Boolean(
      normalizedAddress.address_line1 || normalizedAddress.city || normalizedAddress.postal_code,
    )

    let coordinates: { latitude: number | null; longitude: number | null } = {
      latitude: null,
      longitude: null,
    }
    if (hasAddress) {
      const geocoded = await geocodeAddress(normalizedAddress)
      if (!geocoded) {
        return NextResponse.json(
          { error: 'Adres niet gevonden. Controleer straat, postcode en stad.' },
          { status: 400 },
        )
      }

      coordinates = geocoded
    }

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await admin
      .from('family_settings')
      .update({
        ...normalizedAddress,
        ...coordinates,
      })
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
