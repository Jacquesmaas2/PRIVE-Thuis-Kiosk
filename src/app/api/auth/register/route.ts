import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { registerSchema } from '@/lib/validations/auth'
import { createClient as createAdmin } from '@supabase/supabase-js'

// Register endpoint — two modes:
//   1. New family: body = { email?, password?, display_name, family_name }
//   2. Join via invite: body = { email?, password?, display_name, invite_token }
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

    const body = await req.json()
    const invite_token: string | undefined = body?.invite_token
    const parsed = registerSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { display_name } = parsed.data

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // ── Mode 2: join existing family via invite token ──────────────────────
    if (invite_token) {
      const { data: invitation, error: inviteErr } = await admin
        .from('invitations')
        .select('*')
        .eq('token', invite_token)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (inviteErr || !invitation) {
        return NextResponse.json(
          { error: 'Ongeldige of verlopen uitnodiging' },
          { status: 400 },
        )
      }

      const { error: profileErr } = await admin.from('profiles').insert({
        auth_user_id: user.id,
        family_id: invitation.family_id,
        display_name: display_name ?? user.email?.split('@')[0] ?? 'Gebruiker',
        role: invitation.role,
      })

      if (profileErr) {
        return NextResponse.json(
          { error: 'Profiel aanmaken mislukt', detail: profileErr.message },
          { status: 500 },
        )
      }

      // Mark invitation accepted
      await admin
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)

      return NextResponse.json({ data: { family_id: invitation.family_id } })
    }

    // ── Mode 1: create new family ──────────────────────────────────────────
    const family_name = parsed.data.family_name
    if (!family_name) {
      return NextResponse.json({ error: 'Familienaam is verplicht' }, { status: 400 })
    }

    const { data: family, error: familyErr } = await admin
      .from('families')
      .insert({ name: family_name })
      .select()
      .single()

    if (familyErr || !family) {
      return NextResponse.json(
        { error: 'Familie aanmaken mislukt', detail: familyErr?.message },
        { status: 500 },
      )
    }

    await admin.from('family_settings').insert({ family_id: family.id })

    const { error: profileErr } = await admin.from('profiles').insert({
      auth_user_id: user.id,
      family_id: family.id,
      display_name: display_name ?? user.email?.split('@')[0] ?? 'Gebruiker',
      role: 'parent',
    })

    if (profileErr) {
      await admin.from('families').delete().eq('id', family.id)
      return NextResponse.json(
        { error: 'Profiel aanmaken mislukt', detail: profileErr.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ data: { family_id: family.id } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[register]', err)
    return NextResponse.json({ error: 'Interne serverfout', detail: message }, { status: 500 })
  }
}
