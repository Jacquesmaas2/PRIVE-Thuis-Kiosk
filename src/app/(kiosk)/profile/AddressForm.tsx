'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AddressData {
  address_line1: string | null
  city: string | null
  postal_code: string | null
  country: string
}

interface Props {
  initial: AddressData
}

export function AddressForm({ initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    address_line1: initial.address_line1 ?? '',
    city: initial.city ?? '',
    postal_code: initial.postal_code ?? '',
    country: initial.country ?? 'NL',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setSaved(false)
      setForm((f) => ({ ...f, [field]: e.target.value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)

    const body = {
      address_line1: form.address_line1 || null,
      city: form.city || null,
      postal_code: form.postal_code || null,
      country: form.country || 'NL',
    }

    try {
      const res = await fetch('/api/settings/address', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Opslaan mislukt')
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Straat en huisnummer</label>
          <input
            type="text"
            value={form.address_line1}
            onChange={update('address_line1')}
            placeholder="Hoofdstraat 1"
            className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Postcode</label>
          <input
            type="text"
            value={form.postal_code}
            onChange={update('postal_code')}
            placeholder="1234 AB"
            className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Stad</label>
          <input
            type="text"
            value={form.city}
            onChange={update('city')}
            placeholder="Amsterdam"
            className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        De coördinaten voor het weerwidget worden automatisch bepaald op basis van dit adres.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-green-600 dark:text-green-400">Adres opgeslagen ✓</p>}

      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground
                   hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Opslaan…' : 'Adres opslaan'}
      </button>
    </form>
  )
}
