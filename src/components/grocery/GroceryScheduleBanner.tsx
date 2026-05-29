'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, Lock, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GroceryScheduleBannerProps {
  orderDeadline: string | null
  deliveryAt: string | null
  isLocked: boolean
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('nl-BE', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

function useCountdown(target: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!target) return
    const update = () => {
      const diff = new Date(target).getTime() - Date.now()
      setRemaining(diff > 0 ? diff : 0)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [target])

  return remaining
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}u ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function GroceryScheduleBanner({
  orderDeadline,
  deliveryAt,
  isLocked,
}: GroceryScheduleBannerProps) {
  const cutoff = orderDeadline
    ? new Date(new Date(orderDeadline).getTime() - 60 * 60 * 1000).toISOString()
    : null

  const remaining = useCountdown(cutoff)
  const isNearDeadline = remaining !== null && remaining <= 2 * 60 * 60 * 1000 && remaining > 0

  if (!orderDeadline && !deliveryAt && !isLocked) return null

  return (
    <div className="space-y-2">
      {/* Locked banner */}
      {isLocked && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <Lock className="h-4 w-4 shrink-0 text-destructive" />
          <span className="text-sm font-medium text-destructive">
            Besteldeadline bereikt — geen nieuwe wensen meer mogelijk
          </span>
        </div>
      )}

      {/* Countdown / approaching deadline */}
      {!isLocked && orderDeadline && remaining !== null && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg border px-4 py-3',
            isNearDeadline
              ? 'border-orange-300/50 bg-orange-500/10'
              : 'border-border bg-muted/40'
          )}
        >
          {isNearDeadline ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-orange-500" />
          ) : (
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="flex flex-1 flex-wrap items-baseline gap-x-2 text-sm">
            <span className={cn('font-medium', isNearDeadline && 'text-orange-600')}>
              Besteldeadline:
            </span>
            <span className="text-muted-foreground">{formatDate(orderDeadline)}</span>
            {remaining > 0 && (
              <span
                className={cn(
                  'ml-auto font-mono font-semibold tabular-nums',
                  isNearDeadline ? 'text-orange-600' : 'text-foreground'
                )}
              >
                nog {formatCountdown(remaining)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Delivery moment */}
      {deliveryAt && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex flex-1 flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-medium">Bezorging:</span>
            <span className="text-muted-foreground">{formatDate(deliveryAt)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
