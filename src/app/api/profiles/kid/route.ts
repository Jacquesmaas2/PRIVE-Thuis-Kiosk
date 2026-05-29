import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { addKidSchema } from '@/lib/validations/profiles'
import { createClient as createAdmin } from '@supabase/supabase-js'

// POST /api/profiles/kid
// Parents only — creates a kid profile (no auth account needed).
export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const { data: caller } = await supabase
      .from('profiles')
      .select('role, family_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!caller || caller.role !== 'parent') {
      return NextResponse.json(
        { error: 'Alleen ouders kunnen kinderen toevoegen' },
        { status: 403 },
      )
    }

    const body = await req.json()
    const parsed = addKidSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: kid, error: kidErr } = await admin
      .from('profiles')
      .insert({
        family_id: caller.family_id,
        display_name: parsed.data.display_name,
        role: 'kid',
        date_of_birth: parsed.data.date_of_birth ?? null,
        color: parsed.data.color ?? '#6366f1',
        // auth_user_id intentionally omitted — kids don't log in
      })
      .select()
      .single()

    if (kidErr || !kid) {
      return NextResponse.json(
        { error: 'Kind aanmaken mislukt', detail: kidErr?.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ data: kid })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[profiles/kid]', err)
    return NextResponse.json({ error: 'Interne serverfout', detail: message }, { status: 500 })
  }
}
