'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GROCERY_CATEGORIES } from '@/lib/constants'
import type { GroceryItemWithAdder } from '@/types'

interface GroceryItemRowProps {
  item: GroceryItemWithAdder
  /** When multiple items with the same name are merged, pass all adders here. */
  adders?: (GroceryItemWithAdder['adder'])[]
  onToggle: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
}

export function GroceryItemRow({ item, adders, onToggle, onDelete }: GroceryItemRowProps) {
  const cat = GROCERY_CATEGORIES.find((c) => c.value === item.category)
  const displayAdders = adders ?? (item.adder ? [item.adder] : [])
  const adderNames = displayAdders.filter(Boolean).map((a) => a!.display_name)

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
          item.is_checked ? 'bg-muted opacity-60' : 'bg-card'
        }`}
      >
        <Checkbox
          checked={item.is_checked}
          onCheckedChange={(v) => onToggle(item.id, Boolean(v))}
          className="touch-target shrink-0"
          id={`item-${item.id}`}
        />
        {item.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail_url}
            alt=""
            className="h-10 w-10 rounded-lg object-cover border shrink-0"
          />
        )}
        <label
          htmlFor={`item-${item.id}`}
          className={`flex-1 cursor-pointer text-sm font-medium ${item.is_checked ? 'line-through text-muted-foreground' : ''}`}
        >
          {item.name}
          {item.quantity != null && (
            <span className="ml-2 text-muted-foreground font-normal">
              × {item.quantity}{item.unit ? ` ${item.unit}` : ''}
            </span>
          )}
          {adderNames.length > 0 && (
            <span className="block text-xs text-muted-foreground font-normal mt-0.5">
              door {adderNames.join(' & ')}
            </span>
          )}
        </label>
        {cat && (
          <Badge variant="outline" className="text-xs hidden sm:flex gap-1 shrink-0">
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(item.id)}
          aria-label="Verwijderen"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </motion.div>
    </AnimatePresence>
  )
}
