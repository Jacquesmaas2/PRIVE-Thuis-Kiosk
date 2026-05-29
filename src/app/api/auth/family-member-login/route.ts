import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { kioskCredentials, KIOSK_FAMILY_COOKIE } from '@/lib/kiosk'

const ACTIVE_PROFILE_COOKIE = 'active_profile_id'
const ACTIVE_PROFILE_MAX_AGE = 60 * 60 * 8 // 8 hours

// POST /api/auth/family-member-login
// Allows a family member to sign in by selecting their profile and entering a PIN,
// without requiring the parent's email+password. Uses the per-family kiosk Supabase
// account whose credentials are derived server-side (never stored in the DB).
// Requires: kiosk_family_id httpOnly cookie (set by ensure-kiosk when parent was last logged in).
// Body: { profile_id: string, pin?: string }
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const familyId = cookieStore.get(KIOSK_FAMILY_COOKIE)?.value
    if (!familyId) {
      return NextResponse.json(
        { error: 'Kiosk sessie verlopen. Vraag een ouder om in te loggen.' },
        { status: 403 },
      )
    }

    const { profile_id, pin } = await req.json()
    if (!profile_id) {
      return NextResponse.json({ error: 'profile_id vereist' }, { status: 400 })
    }

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Validate target profile belongs to this family and has a PIN (required in kiosk mode)
    const { data: target } = await admin
      .from('profiles')
      .select('id, family_id, pin_hash, display_name, is_kiosk')
      .eq('id', profile_id)
      .single()

    if (!target) {
      return NextResponse.json({ error: 'Profiel niet gevonden' }, { status: 404 })
    }
    if (target.family_id !== familyId) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }
    if (target.is_kiosk) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }
    if (!target.pin_hash) {
      return NextResponse.json(
        { error: 'Geen PIN ingesteld. Vraag een ouder om een PIN in te stellen.' },
        { status: 400 },
      )
    }

    if (!pin) return NextResponse.json({ error: 'PIN vereist' }, { status: 400 })
    const isMatch = await bcrypt.compare(String(pin), target.pin_hash)
    if (!isMatch) return NextResponse.json({ error: 'Onjuiste PIN' }, { status: 401 })

    // Check if kiosk account is provisioned
    const { data: settings } = await admin
      .from('family_settings')
      .select('kiosk_auth_user_id')
      .eq('family_id', familyId)
      .single()

    if (!settings?.kiosk_auth_user_id) {
      return NextResponse.json(
        { error: 'Kiosk niet geconfigureerd. Vraag een ouder om in te loggen.' },
        { status: 400 },
      )
    }

    // Sign in as the family kiosk account using the SSR client (sets auth cookies)
    const { email, password } = kioskCredentials(familyId)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      console.error('[family-member-login] signIn error:', signInError)
      return NextResponse.json({ error: 'Inloggen mislukt. Probeer opnieuw.' }, { status: 500 })
    }

    // Set the active profile cookie so the app shows the kid's profile
    cookieStore.set(ACTIVE_PROFILE_COOKIE, profile_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ACTIVE_PROFILE_MAX_AGE,
      path: '/',
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[family-member-login]', err)
    return NextResponse.json({ error: 'Onbekende fout' }, { status: 500 })
  }
}
