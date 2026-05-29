import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { createCalendarSubscriptionSchema } from '@/lib/validations/calendar'

export async function GET() {
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
      .select('family_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!caller?.family_id) {
      return NextResponse.json({ error: 'Profiel niet gevonden' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('calendar_subscriptions')
      .select('*')
      .eq('family_id', caller.family_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Interne serverfout', detail: message }, { status: 500 })
  }
}

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

    if (!caller?.family_id) {
      return NextResponse.json({ error: 'Profiel niet gevonden' }, { status: 404 })
    }

    if (caller.role !== 'parent') {
      return NextResponse.json({ error: 'Alleen ouders kunnen abonnementen beheren' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = createCalendarSubscriptionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data, error } = await admin
      .from('calendar_subscriptions')
      .insert({
        family_id: caller.family_id,
        created_by: caller.id,
        name: parsed.data.name.trim(),
        url: parsed.data.url.trim(),
        color: parsed.data.color,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Interne serverfout', detail: message }, { status: 500 })
  }
}
