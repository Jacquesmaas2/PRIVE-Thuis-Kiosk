import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { inviteParentSchema } from '@/lib/validations/profiles'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// POST /api/profiles/invite
// Parents only — creates an invitation token for a new parent.
// Returns the invite URL for the parent to share manually.
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
      .select('id, role, family_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!caller || caller.role !== 'parent') {
      return NextResponse.json(
        { error: 'Alleen ouders kunnen uitnodigingen sturen' },
        { status: 403 },
      )
    }

    const body = await req.json()
    const parsed = inviteParentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Check for existing pending invite for this email
    const { data: existing } = await admin
      .from('invitations')
      .select('id')
      .eq('family_id', caller.family_id)
      .eq('email', parsed.data.email)
      .is('accepted_at', null)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Er staat al een openstaande uitnodiging voor dit e-mailadres' },
        { status: 409 },
      )
    }

    const { data: invite, error: inviteErr } = await admin
      .from('invitations')
      .insert({
        family_id: caller.family_id,
        email: parsed.data.email,
        role: 'parent',
        invited_by: caller.id,
      })
      .select('token')
      .single()

    if (inviteErr || !invite) {
      return NextResponse.json(
        { error: 'Uitnodiging aanmaken mislukt', detail: inviteErr?.message },
        { status: 500 },
      )
    }

    // Build the invite URL from request origin
    const requestHeaders = headers()
    const origin =
      requestHeaders.get('origin') ??
      requestHeaders.get('x-forwarded-proto') + '://' + requestHeaders.get('host')

    const invite_url = `${origin}/register?token=${invite.token}`

    return NextResponse.json({ data: { invite_url, token: invite.token } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[profiles/invite]', err)
    return NextResponse.json({ error: 'Interne serverfout', detail: message }, { status: 500 })
  }
}

// DELETE /api/profiles/invite?id=<invitation_id>
// Parents only — revokes a pending invitation.
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is vereist' }, { status: 400 })

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
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await admin
      .from('invitations')
      .delete()
      .eq('id', id)
      .eq('family_id', caller.family_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Interne serverfout', detail: message }, { status: 500 })
  }
}
