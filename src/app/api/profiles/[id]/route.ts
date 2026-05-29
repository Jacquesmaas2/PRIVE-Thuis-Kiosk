import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { updateProfileSchema } from '@/lib/validations/profiles'
import { createClient as createAdmin } from '@supabase/supabase-js'

// PATCH /api/profiles/[id]
// Caller must be a parent in the same family, OR updating their own profile.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
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
      .select('id, role, family_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!caller) return NextResponse.json({ error: 'Profiel niet gevonden' }, { status: 404 })

    const body = await req.json()
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Verify the target profile belongs to same family
    const { data: target } = await admin
      .from('profiles')
      .select('id, family_id, role')
      .eq('id', params.id)
      .single()

    if (!target || target.family_id !== caller.family_id) {
      return NextResponse.json({ error: 'Profiel niet gevonden' }, { status: 404 })
    }

    // Only a parent can update other people's profiles; anyone can update own
    const isOwnProfile = caller.id === target.id
    if (!isOwnProfile && caller.role !== 'parent') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    // Role changes: only parents can change roles; cannot demote yourself
    if (parsed.data.role && isOwnProfile) {
      return NextResponse.json(
        { error: 'Je kunt je eigen rol niet aanpassen' },
        { status: 403 },
      )
    }

    const { data: updated, error: updateErr } = await admin
      .from('profiles')
      .update(parsed.data)
      .eq('id', params.id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ data: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Interne serverfout', detail: message }, { status: 500 })
  }
}

// DELETE /api/profiles/[id]
// Parents only — cannot delete own profile.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
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
      .select('id, role, family_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!caller || caller.role !== 'parent') {
      return NextResponse.json({ error: 'Alleen ouders kunnen profielen verwijderen' }, { status: 403 })
    }

    if (caller.id === params.id) {
      return NextResponse.json(
        { error: 'Je kunt je eigen profiel niet verwijderen' },
        { status: 400 },
      )
    }

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Verify same family
    const { data: target } = await admin
      .from('profiles')
      .select('family_id')
      .eq('id', params.id)
      .single()

    if (!target || target.family_id !== caller.family_id) {
      return NextResponse.json({ error: 'Profiel niet gevonden' }, { status: 404 })
    }

    const { error } = await admin.from('profiles').delete().eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Interne serverfout', detail: message }, { status: 500 })
  }
}
