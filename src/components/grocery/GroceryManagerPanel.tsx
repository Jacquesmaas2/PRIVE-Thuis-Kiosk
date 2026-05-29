'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, RefreshCw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface GroceryManagerPanelProps {
  currentDeadline: string | null
  currentDelivery: string | null
}

function toLocalDateTimeInput(iso: string | null): string {
  if (!iso) return ''
  // datetime-local input requires "YYYY-MM-DDTHH:MM" in local time
  const d = new Date(iso)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function toISOString(localInput: string): string | null {
  if (!localInput) return null
  return new Date(localInput).toISOString()
}

export function GroceryManagerPanel({
  currentDeadline,
  currentDelivery,
}: GroceryManagerPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isResetting, startReset] = useTransition()

  const [orderDeadline, setOrderDeadline] = useState(toLocalDateTimeInput(currentDeadline))
  const [deliveryAt, setDeliveryAt] = useState(toLocalDateTimeInput(currentDelivery))
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function saveSchedule() {
    setError(null)
    setSaved(false)

    const res = await fetch('/api/grocery/schedule', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_deadline: toISOString(orderDeadline),
        delivery_at: toISOString(deliveryAt),
      }),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Opslaan mislukt')
      return
    }

    setSaved(true)
    startTransition(() => router.refresh())
  }

  async function resetList() {
    if (!confirm('Weet je zeker dat je de boodschappenlijst wilt resetten? Alle items worden gearchiveerd en een nieuwe lege lijst wordt aangemaakt.')) return
    setError(null)

    const res = await fetch('/api/grocery/reset', { method: 'POST' })
    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Reset mislukt')
      return
    }

    startReset(() => router.refresh())
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-4 w-4" />
          Boodschappen beheer
        </CardTitle>
        <CardDescription>
          Stel de besteldeadline en het bezorgtijdstip in. Iedereen kan wensen toevoegen
          tot 1 uur voor de deadline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="order-deadline">Besteldeadline</Label>
            <Input
              id="order-deadline"
              type="datetime-local"
              value={orderDeadline}
              onChange={(e) => setOrderDeadline(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="delivery-at">Bezorgtijdstip</Label>
            <Input
              id="delivery-at"
              type="datetime-local"
              value={deliveryAt}
              min={orderDeadline || undefined}
              onChange={(e) => setDeliveryAt(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {saved && !error && (
          <p className="text-sm text-green-600">Schema opgeslagen ✓</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={saveSchedule}
            disabled={isPending}
          >
            <Save className="mr-2 h-3.5 w-3.5" />
            {isPending ? 'Opslaan…' : 'Schema opslaan'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={resetList}
            disabled={isResetting}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            {isResetting ? 'Resetten…' : 'Lijst resetten'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
