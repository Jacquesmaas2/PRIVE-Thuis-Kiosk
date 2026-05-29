import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient as createAdmin } from '@supabase/supabase-js'

// PATCH /api/profiles/[id]/pin
// Parent only — set or clear the PIN for a kid profile.
// Body: { pin: "1234" } to set, { pin: null } to remove.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

    const { data: caller } = await supabase
      .from('profiles')
      .select('role, family_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!caller || caller.role !== 'parent') {
      return NextResponse.json({ error: 'Alleen ouders kunnen een PIN instellen' }, { status: 403 })
    }

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Verify the target profile is in the same family and is a kid/guest
    const { data: target } = await admin
      .from('profiles')
      .select('id, family_id, role')
      .eq('id', params.id)
      .single()

    if (!target) return NextResponse.json({ error: 'Profiel niet gevonden' }, { status: 404 })
    if (target.family_id !== caller.family_id) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }
    if (target.role !== 'kid') {
      return NextResponse.json({ error: 'PIN is alleen voor kinderprofielen' }, { status: 400 })
    }

    const { pin } = await req.json()

    if (pin === null || pin === undefined || pin === '') {
      // Remove PIN
      await admin.from('profiles').update({ pin_hash: null }).eq('id', params.id)
    } else {
      if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
        return NextResponse.json({ error: 'PIN moet precies 4 cijfers zijn' }, { status: 400 })
      }
      const hash = await bcrypt.hash(pin, 10)
      await admin.from('profiles').update({ pin_hash: hash }).eq('id', params.id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: 'Onbekende fout', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
