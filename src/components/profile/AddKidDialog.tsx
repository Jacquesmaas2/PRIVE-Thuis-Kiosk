'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#ec4899', label: 'Roze' },
  { value: '#f97316', label: 'Oranje' },
  { value: '#10b981', label: 'Groen' },
  { value: '#3b82f6', label: 'Blauw' },
  { value: '#8b5cf6', label: 'Paars' },
  { value: '#f43f5e', label: 'Rood' },
  { value: '#14b8a6', label: 'Teal' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function AddKidDialog({ open, onClose }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({ display_name: '', date_of_birth: '', color: '#6366f1' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setForm({ display_name: '', date_of_birth: '', color: '#6366f1' })
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/profiles/kid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: form.display_name,
          date_of_birth: form.date_of_birth || null,
          color: form.color,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail ?? json.error ?? 'Fout bij aanmaken')
      reset()
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Kind toevoegen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="kid-name" className="text-sm font-medium">Naam</label>
            <input
              id="kid-name"
              type="text"
              required
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              placeholder="Emma"
              className="w-full h-11 rounded-xl border border-input bg-background px-4 text-base
                         focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="kid-dob" className="text-sm font-medium">
              Geboortedatum <span className="text-muted-foreground font-normal">(optioneel)</span>
            </label>
            <input
              id="kid-dob"
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
              className="w-full h-11 rounded-xl border border-input bg-background px-4 text-base
                         focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Kleur</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    borderColor: form.color === c.value ? 'white' : 'transparent',
                    outline: form.color === c.value ? `2px solid ${c.value}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => { reset(); onClose() }}
              className="flex-1 h-11 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium
                         hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Toevoegen…' : 'Toevoegen'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
