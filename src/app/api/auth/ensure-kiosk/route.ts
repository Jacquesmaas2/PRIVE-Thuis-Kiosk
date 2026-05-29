import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { kioskCredentials, KIOSK_FAMILY_COOKIE, KIOSK_COOKIE_MAX_AGE } from '@/lib/kiosk'

// POST /api/auth/ensure-kiosk
// Idempotent: creates the per-family kiosk Supabase auth account if it doesn't
// exist yet and stores the family_id in a long-lived cookie for offline kid login.
// Requires an active parent auth session.
export async function POST() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Resolve the family of the logged-in user
    const { data: authProfile } = await admin
      .from('profiles')
      .select('family_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!authProfile?.family_id) {
      return NextResponse.json({ error: 'Geen familie gevonden' }, { status: 400 })
    }
    const familyId = authProfile.family_id

    // Set long-lived kiosk cookie (always refresh it)
    const cookieStore = cookies()
    cookieStore.set(KIOSK_FAMILY_COOKIE, familyId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: KIOSK_COOKIE_MAX_AGE,
      path: '/',
    })

    // Check if kiosk account already exists
    const { data: settings } = await admin
      .from('family_settings')
      .select('kiosk_auth_user_id')
      .eq('family_id', familyId)
      .single()

    if (settings?.kiosk_auth_user_id) {
      // Already provisioned
      return NextResponse.json({ ok: true, family_id: familyId })
    }

    // Create Supabase auth user for this family's kiosk
    const { email, password } = kioskCredentials(familyId)
    const { data: kioskAuthUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { is_kiosk: true, family_id: familyId },
    })

    if (createError) {
      // If the user already exists (e.g. kiosk_auth_user_id was lost), look it up
      if (!createError.message.includes('already')) {
        console.error('[ensure-kiosk] createUser error:', createError)
        return NextResponse.json({ error: 'Kiosk aanmaken mislukt' }, { status: 500 })
      }
      // Try to find the existing user by email
      const { data: listData } = await admin.auth.admin.listUsers()
      const existing = listData?.users.find((u) => u.email === email)
      if (!existing) {
        return NextResponse.json({ error: 'Kiosk gebruiker niet gevonden' }, { status: 500 })
      }
      // Create kiosk profile if missing, then store user id
      await ensureKioskProfile(admin, existing.id, familyId)
      await admin
        .from('family_settings')
        .update({ kiosk_auth_user_id: existing.id })
        .eq('family_id', familyId)
      return NextResponse.json({ ok: true, family_id: familyId })
    }

    // Create a kiosk profile (role=parent so RLS passes; is_kiosk=true to hide from UI)
    await ensureKioskProfile(admin, kioskAuthUser.user.id, familyId)

    // Persist the kiosk auth user id in family_settings
    await admin
      .from('family_settings')
      .update({ kiosk_auth_user_id: kioskAuthUser.user.id })
      .eq('family_id', familyId)

    return NextResponse.json({ ok: true, family_id: familyId })
  } catch (err) {
    console.error('[ensure-kiosk]', err)
    return NextResponse.json({ error: 'Onbekende fout' }, { status: 500 })
  }
}

async function ensureKioskProfile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  authUserId: string,
  familyId: string,
) {
  const existing = await admin
    .from('profiles')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (!existing.data) {
    await admin.from('profiles').insert({
      family_id: familyId,
      display_name: '__kiosk__',
      role: 'parent',
      auth_user_id: authUserId,
      is_kiosk: true,
    })
  }
}
