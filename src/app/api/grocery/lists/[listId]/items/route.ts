import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAuthProfile } from '@/lib/supabase/server'
import { addGroceryItemSchema } from '@/lib/validations/grocery'

type Params = { params: { listId: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('grocery_items')
    .select(`
      id, name, quantity, unit, category, is_checked, sort_order, thumbnail_url, created_at,
      added_by_profile:profiles!grocery_items_added_by_fkey(id, display_name, avatar_url, color)
    `)
    .eq('list_id', params.listId)
    .order('is_checked', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest, { params }: Params) {
  // Use getAuthProfile so that when a kid is active (active_profile_id cookie),
  // the item is attributed to the kid's profile, not the parent's.
  const { userId, profile } = await getAuthProfile()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Still create the Supabase client for DB queries (uses parent's auth session for RLS).
  const supabase = createClient()

  // Enforce ordering deadline: locked 1 hour before order_deadline
  const { data: listMeta } = await supabase
    .from('grocery_lists')
    .select('is_locked, order_deadline, is_active')
    .eq('id', params.listId)
    .single()

  // Only block if we definitively know the list is inactive or locked.
  // If listMeta is null (query failed / RLS / unknown list), proceed and let
  // the INSERT RLS policy reject it rather than returning a confusing error.
  if (listMeta) {
    if (!listMeta.is_active) {
      return NextResponse.json({ error: 'Deze lijst is niet meer actief' }, { status: 409 })
    }
    if (listMeta.is_locked) {
      return NextResponse.json({ error: 'De besteldeadline is bereikt. Geen nieuwe wensen meer mogelijk.' }, { status: 409 })
    }
    if (listMeta.order_deadline) {
      const cutoff = new Date(listMeta.order_deadline).getTime() - 60 * 60 * 1000
      if (Date.now() >= cutoff) {
        return NextResponse.json({ error: 'Minder dan 1 uur voor de besteldeadline. Geen nieuwe wensen meer mogelijk.' }, { status: 409 })
      }
    }
  }

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = addGroceryItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('grocery_items')
    .insert({ ...parsed.data, list_id: params.listId, added_by: profile.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
