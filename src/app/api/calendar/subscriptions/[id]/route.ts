import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { updateCalendarSubscriptionSchema } from '@/lib/validations/calendar'

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
      .select('role, family_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!caller?.family_id) {
      return NextResponse.json({ error: 'Profiel niet gevonden' }, { status: 404 })
    }

    if (caller.role !== 'parent') {
      return NextResponse.json({ error: 'Alleen ouders kunnen abonnementen beheren' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = updateCalendarSubscriptionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'Geen velden om bij te werken' }, { status: 400 })
    }

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: existing } = await admin
      .from('calendar_subscriptions')
      .select('id, family_id')
      .eq('id', params.id)
      .single()

    if (!existing || existing.family_id !== caller.family_id) {
      return NextResponse.json({ error: 'Abonnement niet gevonden' }, { status: 404 })
    }

    const payload: Record<string, string> = {}
    if (parsed.data.name !== undefined) payload.name = parsed.data.name.trim()
    if (parsed.data.url !== undefined) payload.url = parsed.data.url.trim()
    if (parsed.data.color !== undefined) payload.color = parsed.data.color

    const { data, error } = await admin
      .from('calendar_subscriptions')
      .update(payload)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Interne serverfout', detail: message }, { status: 500 })
  }
}

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
      .select('role, family_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!caller?.family_id) {
      return NextResponse.json({ error: 'Profiel niet gevonden' }, { status: 404 })
    }

    if (caller.role !== 'parent') {
      return NextResponse.json({ error: 'Alleen ouders kunnen abonnementen beheren' }, { status: 403 })
    }

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: existing } = await admin
      .from('calendar_subscriptions')
      .select('id, family_id')
      .eq('id', params.id)
      .single()

    if (!existing || existing.family_id !== caller.family_id) {
      return NextResponse.json({ error: 'Abonnement niet gevonden' }, { status: 404 })
    }

    const { error } = await admin
      .from('calendar_subscriptions')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Interne serverfout', detail: message }, { status: 500 })
  }
}
