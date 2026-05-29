import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { createClient as createAdmin } from '@supabase/supabase-js'

const COOKIE_NAME = 'active_profile_id'
const COOKIE_MAX_AGE = 60 * 60 * 8 // 8 hours

// POST /api/auth/switch-profile
// Verify PIN (if required) and set active_profile_id cookie.
// Body: { profile_id: string, pin?: string }
export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

    const { profile_id, pin } = await req.json()
    if (!profile_id) return NextResponse.json({ error: 'profile_id vereist' }, { status: 400 })

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Get auth user's profile to determine family
    const { data: authProfile } = await admin
      .from('profiles')
      .select('family_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!authProfile) {
      return NextResponse.json({ error: 'Geen profiel gevonden' }, { status: 404 })
    }

    // Get the target profile
    const { data: target } = await admin
      .from('profiles')
      .select('id, family_id, role, pin_hash')
      .eq('id', profile_id)
      .single()

    if (!target) return NextResponse.json({ error: 'Profiel niet gevonden' }, { status: 404 })
    if (target.family_id !== authProfile.family_id) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    // Verify PIN if one is set on this profile
    if (target.pin_hash) {
      if (!pin) return NextResponse.json({ error: 'PIN vereist' }, { status: 400 })
      const isMatch = await bcrypt.compare(String(pin), target.pin_hash)
      if (!isMatch) return NextResponse.json({ error: 'Onjuiste PIN' }, { status: 401 })
    }

    const cookieStore = cookies()
    cookieStore.set(COOKIE_NAME, profile_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: 'Onbekende fout', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

// DELETE /api/auth/switch-profile
// Clear the active_profile_id cookie (switch back to auth user).
export async function DELETE() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const cookieStore = cookies()
  cookieStore.delete(COOKIE_NAME)

  return NextResponse.json({ ok: true })
}
