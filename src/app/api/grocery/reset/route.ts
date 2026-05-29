import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/grocery/reset
// Archives current active list items to grocery_order_history,
// then deactivates the old list and creates a new one.
// Only callable by a parent or grocery manager.
// Also triggered automatically when delivery_at has passed.
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_grocery_manager, family_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const canReset = profile.role === 'parent' || profile.is_grocery_manager
  if (!canReset) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Get the active list
  const { data: list } = await supabase
    .from('grocery_lists')
    .select('id, name, cycle, family_id')
    .eq('family_id', profile.family_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!list) return NextResponse.json({ error: 'Geen actieve boodschappenlijst gevonden' }, { status: 404 })

  // Fetch all items (including added_by profile name) before archiving
  const { data: items, error: itemsError } = await supabase
    .from('grocery_items')
    .select(`
      id, name, quantity, unit, category, created_at,
      adder:profiles!grocery_items_added_by_fkey(id, display_name)
    `)
    .eq('list_id', list.id)

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  // Archive items to grocery_order_history
  if (items && items.length > 0) {
    const historyRows = items.map((item) => {
      const adder = item.adder as unknown as { id: string; display_name: string } | null
      return {
        family_id: list.family_id,
        cycle: list.cycle,
        list_name: list.name,
        item_name: item.name,
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
        category: item.category ?? null,
        added_by: adder?.id ?? null,
        adder_name: adder?.display_name ?? null,
        added_at: item.created_at,
        archived_at: new Date().toISOString(),
      }
    })

    const { error: archiveError } = await supabase
      .from('grocery_order_history')
      .insert(historyRows)

    if (archiveError) return NextResponse.json({ error: archiveError.message }, { status: 500 })
  }

  // Deactivate the old list
  await supabase.from('grocery_lists').update({ is_active: false }).eq('id', list.id)

  // Create a fresh list for the next cycle
  const { data: newList, error: createError } = await supabase
    .from('grocery_lists')
    .insert({
      family_id: profile.family_id,
      created_by: profile.id,
      name: list.name,
      is_active: true,
      cycle: list.cycle + 1,
    })
    .select('id, name, cycle, is_active, is_locked, order_deadline, delivery_at')
    .single()

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })

  return NextResponse.json({
    data: newList,
    archived: items?.length ?? 0,
  }, { status: 201 })
}
