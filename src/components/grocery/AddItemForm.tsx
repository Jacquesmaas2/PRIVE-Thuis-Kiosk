'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GROCERY_CATEGORIES } from '@/lib/constants'

interface AddItemFormProps {
  listId: string
  isLocked?: boolean
}

export function AddItemForm({ listId, isLocked = false }: AddItemFormProps) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [category, setCategory] = useState<string>('overig')
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // Debounced thumbnail search whenever name changes
  useEffect(() => {
    setThumbnailUrl(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!name.trim() || name.trim().length < 2) return

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/grocery/product-image?q=${encodeURIComponent(name.trim())}`)
        if (res.ok) {
          const { imageUrl } = await res.json()
          setThumbnailUrl(imageUrl ?? null)
        }
      } catch {
        // silently ignore
      }
    }, 600)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [name])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || isLocked) return
    setLoading(true)
    setServerError(null)
    try {
      const res = await fetch(`/api/grocery/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          quantity: quantity ? parseFloat(quantity) : undefined,
          category,
          thumbnail_url: thumbnailUrl ?? undefined,
        }),
      })
      if (res.ok) {
        setName('')
        setQuantity('')
        setThumbnailUrl(null)
        router.refresh()
      } else {
        const json = await res.json()
        setServerError(json.error ?? 'Toevoegen mislukt')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {isLocked && (
        <p className="text-sm text-destructive font-medium px-1">
          🔒 Besteldeadline bereikt — wensen toevoegen is niet meer mogelijk
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap sm:flex-nowrap items-center">
        {thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt=""
            className="h-10 w-10 rounded-lg object-cover border shrink-0"
          />
        )}
        <Input
          placeholder="Artikel toevoegen..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-40"
          required
          disabled={isLocked}
        />
        <Input
          placeholder="Aantal"
          type="number"
          min="0"
          step="0.1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-24"
          disabled={isLocked}
        />
        <Select value={category} onValueChange={setCategory} disabled={isLocked}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GROCERY_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.icon} {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" loading={loading} className="shrink-0" disabled={isLocked}>
          <Plus className="h-4 w-4" />
          <span className="sr-only">Toevoegen</span>
        </Button>
      </form>
      {serverError && (
        <p className="text-sm text-destructive px-1">{serverError}</p>
      )}
    </div>
  )
}
