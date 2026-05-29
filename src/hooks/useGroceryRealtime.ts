'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GroceryItemWithAdder } from '@/types'

export function useGroceryRealtime(listId: string, initial: GroceryItemWithAdder[]) {
  const [items, setItems] = useState<GroceryItemWithAdder[]>(initial)
  const supabase = useRef(createClient())

  // When the server refreshes (router.refresh), initial changes to include full
  // join data (adder name etc). Merge server data into local state so names show.
  useEffect(() => {
    setItems((prev) => {
      // For each server item, update the matching local item with its adder/checker
      // data, but keep any items already in state that the server may not have yet.
      const serverIds = new Set(initial.map((i) => i.id))
      const merged = prev
        .filter((i) => serverIds.has(i.id)) // drop items removed server-side
        .map((i) => {
          const serverVersion = initial.find((s) => s.id === i.id)
          // Prefer server version's join data (adder, checker) but keep local state otherwise
          return serverVersion ? { ...i, ...serverVersion } : i
        })
      // Add server items not yet in state (e.g. loaded on a fresh page visit)
      const localIds = new Set(prev.map((i) => i.id))
      for (const serverItem of initial) {
        if (!localIds.has(serverItem.id)) merged.push(serverItem)
      }
      return merged
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])

  useEffect(() => {
    const client = supabase.current
    const channel = client
      .channel(`grocery-list-${listId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'grocery_items',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          setItems((prev) => {
            // Avoid duplicates
            if (prev.some((i) => i.id === payload.new.id)) return prev
            return [...prev, payload.new as GroceryItemWithAdder]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'grocery_items',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          setItems((prev) =>
            prev.map((i) => (i.id === payload.new.id ? { ...i, ...payload.new } : i))
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'grocery_items',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          setItems((prev) => prev.filter((i) => i.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [listId])

  async function toggleItem(itemId: string, isChecked: boolean) {
    // Optimistic
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, is_checked: isChecked } : i)))
    const res = await fetch(
      `/api/grocery/lists/${listId}/items/${itemId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_checked: isChecked }),
      }
    )
    if (!res.ok) {
      // Revert
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, is_checked: !isChecked } : i)))
    }
  }

  async function deleteItem(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    await fetch(`/api/grocery/lists/${listId}/items/${itemId}`, { method: 'DELETE' })
  }

  return { items, toggleItem, deleteItem }
}
