'use client'

import { useGroceryRealtime } from '@/hooks/useGroceryRealtime'
import { AddItemForm } from './AddItemForm'
import { GroceryItemRow } from './GroceryItemRow'
import { GroceryScheduleBanner } from './GroceryScheduleBanner'
import { GROCERY_CATEGORIES } from '@/lib/constants'
import type { GroceryItemWithAdder } from '@/types'

interface GroceryListViewProps {
  listId: string
  initialItems: GroceryItemWithAdder[]
  orderDeadline: string | null
  deliveryAt: string | null
  isLocked: boolean
}

// Group items with the same (normalised) name into one merged row.
// • Shows combined quantity and all requesters' names.
// • Toggle / delete affects every item in the group.
interface MergedRow {
  ids: string[]
  representative: GroceryItemWithAdder
  totalQuantity: number | null
  adders: (GroceryItemWithAdder['adder'])[]
}

function mergeByName(items: GroceryItemWithAdder[]): MergedRow[] {
  const map = new Map<string, GroceryItemWithAdder[]>()
  for (const item of items) {
    const key = item.name.trim().toLowerCase()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return Array.from(map.values()).map((group) => {
    const hasQty = group.some((i) => i.quantity != null)
    return {
      ids: group.map((i) => i.id),
      representative: group[0],
      totalQuantity: hasQty ? group.reduce((s, i) => s + (i.quantity ?? 0), 0) : null,
      adders: group.map((i) => i.adder),
    }
  })
}

export function GroceryListView({
  listId,
  initialItems,
  orderDeadline,
  deliveryAt,
  isLocked,
}: GroceryListViewProps) {
  const { items, toggleItem, deleteItem } = useGroceryRealtime(listId, initialItems)

  // Compute client-side lock: 1 hour before order_deadline
  const computedLocked = isLocked || (
    orderDeadline
      ? Date.now() >= new Date(orderDeadline).getTime() - 60 * 60 * 1000
      : false
  )

  const unchecked = items.filter((i) => !i.is_checked)
  const checked = items.filter((i) => i.is_checked)

  // Group unchecked items by category, then by merged name within each category
  const grouped = GROCERY_CATEGORIES.map((cat) => ({
    ...cat,
    rows: mergeByName(unchecked.filter((i) => i.category === cat.value)),
  })).filter((g) => g.rows.length > 0)

  function renderRow(row: MergedRow) {
    const { representative: item, ids, totalQuantity, adders } = row
    const mergedItem: GroceryItemWithAdder = {
      ...item,
      quantity: totalQuantity,
    }
    return (
      <div key={ids.join('-')}>
        <GroceryItemRow
          item={mergedItem}
          adders={adders.length > 1 ? adders : undefined}
          onToggle={(_id, checked) => ids.forEach((id) => toggleItem(id, checked))}
          onDelete={() => ids.forEach((id) => deleteItem(id))}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <GroceryScheduleBanner
        orderDeadline={orderDeadline}
        deliveryAt={deliveryAt}
        isLocked={computedLocked}
      />

      <AddItemForm listId={listId} isLocked={computedLocked} />

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <span className="text-5xl">🛒</span>
          <p className="font-medium">De boodschappenlijst is leeg</p>
          <p className="text-sm">Voeg hierboven een artikel toe</p>
        </div>
      ) : (
        <>
          {grouped.map((group) => (
            <div key={group.value} className="space-y-2">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                <span>{group.icon}</span>
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.rows.map((row) => renderRow(row))}
              </div>
            </div>
          ))}

          {checked.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                ✅ Gekocht ({checked.length})
              </h3>
              <div className="space-y-2">
                {checked.map((item) => (
                  <GroceryItemRow
                    key={item.id}
                    item={item}
                    onToggle={toggleItem}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
