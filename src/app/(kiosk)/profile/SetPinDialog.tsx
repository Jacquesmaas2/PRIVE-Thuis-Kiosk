'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, X } from 'lucide-react'
import { PinPad } from '@/components/shared/PinPad'

interface Props {
  profileId: string
  profileName: string
  hasPIN: boolean
  open: boolean
  onClose: () => void
}

export function SetPinDialog({ profileId, profileName, hasPIN, open, onClose }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setStep('enter')
    setPin('')
    setConfirmPin('')
    setError(null)
    onClose()
  }

  function handleFirstPin(value: string) {
    setPin(value)
    if (value.length === 4) setStep('confirm')
  }

  async function handleConfirmPin(value: string) {
    setConfirmPin(value)
    if (value.length === 4) {
      if (value !== pin) {
        setError('PINs komen niet overeen. Probeer opnieuw.')
        setStep('enter')
        setPin('')
        setConfirmPin('')
        return
      }
      await submitPin(pin)
    }
  }

  async function submitPin(finalPin: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/profiles/${profileId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: finalPin }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Opslaan mislukt')
      router.refresh()
      reset()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onbekende fout')
      setStep('enter')
      setPin('')
      setConfirmPin('')
    } finally {
      setLoading(false)
    }
  }

  async function removePin() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/profiles/${profileId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: null }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Verwijderen mislukt')
      }
      router.refresh()
      reset()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onbekende fout')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={reset} />
      <div className="relative z-10 w-full max-w-xs rounded-2xl bg-card p-6 shadow-xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">PIN instellen</h2>
          </div>
          <button
            onClick={reset}
            className="rounded-lg p-1 hover:bg-muted transition-colors"
            aria-label="Sluiten"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          {step === 'enter'
            ? `Kies een 4-cijferige PIN voor ${profileName}`
            : 'Voer de PIN nogmaals in ter bevestiging'}
        </p>

        <PinPad
          value={step === 'enter' ? pin : confirmPin}
          onChange={step === 'enter' ? handleFirstPin : handleConfirmPin}
        />

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {loading && (
          <div className="flex justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {hasPIN && step === 'enter' && !loading && (
          <button
            onClick={removePin}
            className="w-full text-sm text-destructive underline-offset-4 hover:underline"
          >
            PIN verwijderen
          </button>
        )}
      </div>
    </div>
  )
}
