'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { PinPad } from '@/components/shared/PinPad'
import type { Profile } from '@/types'

type ProfileWithPin = Profile & { pin_hash: string | null }

interface Props {
  profiles: ProfileWithPin[]
  // The profile ID linked to the Supabase auth user (not the active override)
  authProfileId: string
}

const roleLabel: Record<string, string> = { parent: 'Ouder', kid: 'Kind', guest: 'Gast' }

export function ProfileSwitcher({ profiles, authProfileId }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<ProfileWithPin | null>(null)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function selectProfile(p: ProfileWithPin) {
    setError(null)

    // Switching to the auth user's own profile — just clear the override cookie
    if (p.id === authProfileId) {
      setLoading(true)
      await fetch('/api/auth/switch-profile', { method: 'DELETE' })
      router.push('/dashboard')
      router.refresh()
      return
    }

    if (p.pin_hash) {
      // PIN required — show numpad
      setSelected(p)
      setPin('')
    } else {
      // No PIN — switch directly
      await doSwitch(p.id, undefined)
    }
  }

  async function handlePin(value: string) {
    setPin(value)
    if (value.length === 4) {
      await doSwitch(selected!.id, value)
    }
  }

  async function doSwitch(profileId: string, pinValue: string | undefined) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/switch-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId, pin: pinValue }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Schakelen mislukt')
        setPin('')
        setLoading(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Verbindingsfout. Probeer opnieuw.')
      setPin('')
      setLoading(false)
    }
  }

  // ── PIN entry view ──────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="space-y-6 max-w-xs mx-auto">
        <button
          onClick={() => { setSelected(null); setPin(''); setError(null) }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar profielkeuze
        </button>

        <div className="flex flex-col items-center gap-3">
          <UserAvatar profile={selected} size="lg" />
          <div className="text-center">
            <p className="font-semibold text-lg">{selected.display_name}</p>
            <p className="text-sm text-muted-foreground">{roleLabel[selected.role] ?? selected.role}</p>
          </div>
          <p className="text-sm text-muted-foreground">Voer PIN in</p>
        </div>

        <PinPad value={pin} onChange={handlePin} />

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        {loading && (
          <div className="flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    )
  }

  // ── Profile grid view ───────────────────────────────────────────────────────
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {profiles.map((p) => (
        <button
          key={p.id}
          onClick={() => selectProfile(p)}
          disabled={loading}
          className="kiosk-card flex flex-col items-center gap-3 p-6 text-center
                     hover:border-primary hover:shadow-md transition-all
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <UserAvatar profile={p} size="lg" />
          <div>
            <p className="font-semibold">{p.display_name}</p>
            <p className="text-xs text-muted-foreground">{roleLabel[p.role] ?? p.role}</p>
            {p.id === authProfileId && (
              <p className="text-xs text-primary mt-1">Jouw account</p>
            )}
            {p.pin_hash && p.id !== authProfileId && (
              <p className="text-xs text-muted-foreground mt-1">🔒 PIN vereist</p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
