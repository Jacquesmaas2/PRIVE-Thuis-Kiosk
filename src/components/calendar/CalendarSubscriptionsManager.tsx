'use client'

import { useMemo, useState } from 'react'
import type { Database } from '@/types/database.types'

type CalendarSubscription = Database['public']['Tables']['calendar_subscriptions']['Row']

interface Props {
  initialSubscriptions: CalendarSubscription[]
  canManage: boolean
}

const DEFAULT_COLOR = '#3b82f6'

export function CalendarSubscriptionsManager({ initialSubscriptions, canManage }: Props) {
  const [items, setItems] = useState<CalendarSubscription[]>(initialSubscriptions)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name, 'nl-NL')),
    [items],
  )

  function resetForm() {
    setName('')
    setUrl('')
    setColor(DEFAULT_COLOR)
    setEditingId(null)
  }

  function startEdit(item: CalendarSubscription) {
    setName(item.name)
    setUrl(item.url)
    setColor(item.color)
    setEditingId(item.id)
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!canManage) {
      setError('Alleen ouders kunnen kalenderabonnementen beheren.')
      return
    }

    setLoading(true)

    try {
      const method = editingId ? 'PATCH' : 'POST'
      const endpoint = editingId
        ? `/api/calendar/subscriptions/${editingId}`
        : '/api/calendar/subscriptions'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, color }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Opslaan mislukt')
      }

      const saved = json.data as CalendarSubscription
      if (editingId) {
        setItems((prev) => prev.map((item) => (item.id === saved.id ? saved : item)))
        setSuccess('Abonnement bijgewerkt.')
      } else {
        setItems((prev) => [saved, ...prev])
        setSuccess('Abonnement toegevoegd.')
      }

      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!canManage) return

    const confirmed = window.confirm('Weet je zeker dat je dit abonnement wilt verwijderen?')
    if (!confirmed) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/calendar/subscriptions/${id}`, {
        method: 'DELETE',
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Verwijderen mislukt')
      }

      setItems((prev) => prev.filter((item) => item.id !== id))
      if (editingId === id) {
        resetForm()
      }
      setSuccess('Abonnement verwijderd.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="kiosk-card p-5 space-y-4">
        <h2 className="text-base font-semibold">Kalenderabonnement toevoegen</h2>

        {canManage ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Naam</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bijv. Schoolagenda"
                  className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Kleur</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-2"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Abonnement URL</label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://... of webcal://..."
                className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="h-11 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground
                           hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Opslaan…' : editingId ? 'Abonnement bijwerken' : 'Abonnement toevoegen'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="h-11 rounded-xl border px-6 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Bewerken annuleren
                </button>
              )}
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Alleen ouders kunnen kalenderabonnementen toevoegen of wijzigen.
          </p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
      </div>

      <div className="kiosk-card p-5 space-y-4">
        <h2 className="text-base font-semibold">Geconfigureerde abonnementen</h2>

        {sortedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen kalenderabonnementen geconfigureerd.</p>
        ) : (
          <ul className="space-y-3">
            {sortedItems.map((item) => (
              <li key={item.id} className="rounded-xl border border-border/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <p className="font-medium truncate">{item.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground break-all">{item.url}</p>
                  </div>

                  {canManage && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="h-9 rounded-lg border px-3 text-sm hover:bg-muted transition-colors"
                      >
                        Bewerken
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(item.id)}
                        className="h-9 rounded-lg border border-destructive/40 px-3 text-sm text-destructive
                                   hover:bg-destructive/10 transition-colors"
                      >
                        Verwijderen
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
