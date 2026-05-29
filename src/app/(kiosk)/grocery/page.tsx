import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthProfile } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { GroceryListView } from '@/components/grocery/GroceryListView'
import { GroceryManagerPanel } from '@/components/grocery/GroceryManagerPanel'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus } from 'lucide-react'
import type { GroceryItemWithAdder } from '@/types'

export const metadata = { title: 'Boodschappen | Thuis Kiosk' }

export default async function GroceryPage() {
  const { userId, profile } = await getAuthProfile()
  if (!userId || !profile) redirect(ROUTES.login)

  const supabase = createClient()

  // Get or create active grocery list (with schedule columns)
  let { data: list } = await supabase
    .from('grocery_lists')
    .select('id, name, is_active, is_locked, order_deadline, delivery_at, cycle')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Auto-reset if delivery time has passed (only parents/managers trigger this)
  if (list?.delivery_at && new Date(list.delivery_at) < new Date()) {
    const canReset = profile.role === 'parent' || profile.is_grocery_manager
    if (canReset) {
      // Archive items to history
      const { data: itemsToArchive } = await supabase
        .from('grocery_items')
        .select(`
          id, name, quantity, unit, category, created_at,
          adder:profiles!grocery_items_added_by_fkey(id, display_name)
        `)
        .eq('list_id', list.id)

      if (itemsToArchive && itemsToArchive.length > 0) {
        await supabase.from('grocery_order_history').insert(
          itemsToArchive.map((item) => {
            const adder = item.adder as unknown as { id: string; display_name: string } | null
            return {
              family_id: profile.family_id,
              cycle: list!.cycle,
              list_name: list!.name,
              item_name: item.name,
              quantity: item.quantity ?? null,
              unit: item.unit ?? null,
              category: item.category ?? null,
              added_by: adder?.id ?? null,
              adder_name: adder?.display_name ?? null,
              added_at: item.created_at,
            }
          })
        )
      }

      // Deactivate old list and create fresh one
      await supabase.from('grocery_lists').update({ is_active: false }).eq('id', list.id)
      const { data: freshList } = await supabase
        .from('grocery_lists')
        .insert({
          family_id: profile.family_id,
          created_by: profile.id,
          name: list.name,
          is_active: true,
          cycle: list.cycle + 1,
        })
        .select('id, name, is_active, is_locked, order_deadline, delivery_at, cycle')
        .single()
      list = freshList
    }
  }

  if (!list && profile.role === 'parent') {
    const { data: newList } = await supabase
      .from('grocery_lists')
      .insert({
        family_id: profile.family_id,
        created_by: profile.id,
        name: 'Boodschappenlijst',
        is_active: true,
      })
      .select('id, name, is_active, is_locked, order_deadline, delivery_at, cycle')
      .single()
    list = newList
  }

  const { data: items } = list
    ? await supabase
        .from('grocery_items')
        .select(`
          id, name, quantity, unit, category, is_checked, sort_order, created_at, added_by,
          adder:profiles!grocery_items_added_by_fkey(id, display_name, avatar_url, color),
          checker:profiles!grocery_items_checked_by_fkey(id, display_name)
        `)
        .eq('list_id', list.id)
        .order('is_checked', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
    : { data: [] }

  const canManage = profile.role === 'parent' || profile.is_grocery_manager

  // Server-side lock computation (1 hour before deadline)
  const serverLocked = list?.is_locked || (
    list?.order_deadline
      ? new Date() >= new Date(new Date(list.order_deadline).getTime() - 60 * 60 * 1000)
      : false
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={list?.name ?? 'Boodschappen'}
        description="Realtime gesynchroniseerde boodschappenlijst"
        icon={<ShoppingCart className="h-7 w-7" />}
        actions={
          !list && profile.role === 'parent' ? (
            <form action={`/api/grocery/lists`} method="POST">
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe lijst
              </Button>
            </form>
          ) : undefined
        }
      />

      {/* Manager panel — only for parents / grocery managers */}
      {canManage && list && (
        <GroceryManagerPanel
          currentDeadline={list.order_deadline}
          currentDelivery={list.delivery_at}
        />
      )}

      {list ? (
        <GroceryListView
          listId={list.id}
          initialItems={(items ?? []) as unknown as GroceryItemWithAdder[]}
          orderDeadline={list.order_deadline}
          deliveryAt={list.delivery_at}
          isLocked={serverLocked}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <span className="text-5xl">🛒</span>
          <p className="font-medium">Nog geen boodschappenlijst</p>
          <p className="text-sm">Vraag een ouder om een lijst aan te maken</p>
        </div>
      )}
    </div>
  )
}
