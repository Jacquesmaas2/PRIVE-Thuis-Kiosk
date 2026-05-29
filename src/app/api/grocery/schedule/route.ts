import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { setGroceryScheduleSchema } from '@/lib/validations/grocery'

// PATCH /api/grocery/schedule
// Grocery manager or parent sets order_deadline + delivery_at on the active list
export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_grocery_manager, family_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const canManage = profile.role === 'parent' || profile.is_grocery_manager
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = setGroceryScheduleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 422 })
  }

  // Get the active list for this family
  const { data: list } = await supabase
    .from('grocery_lists')
    .select('id')
    .eq('family_id', profile.family_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!list) return NextResponse.json({ error: 'Geen actieve boodschappenlijst gevonden' }, { status: 404 })

  const { data, error } = await supabase
    .from('grocery_lists')
    .update({
      order_deadline: parsed.data.order_deadline ?? null,
      delivery_at: parsed.data.delivery_at ?? null,
    })
    .eq('id', list.id)
    .select('id, name, order_deadline, delivery_at, is_locked, cycle')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
