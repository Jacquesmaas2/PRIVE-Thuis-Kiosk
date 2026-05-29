'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { PinPad } from '@/components/shared/PinPad'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

type ProfileWithPin = Profile & { pin_hash: string | null }

interface KidLoginPanelProps {
  profiles: ProfileWithPin[]
  authProfileId: string
  redirectTo: string
  familyId?: string
  /** True when there is no active parent session — login goes via family-member-login */
  isKioskMode?: boolean
}

const roleLabel: Record<string, string> = { parent: 'Ouder', kid: 'Kind', guest: 'Gast' }

export function KidLoginPanel({
  profiles,
  authProfileId,
  redirectTo,
  familyId,
  isKioskMode = false,
}: KidLoginPanelProps) {
  const router = useRouter()
  const supabase = createClient()

  const [selected, setSelected] = useState<ProfileWithPin | null>(null)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ensure the kiosk account is provisioned and the kiosk cookie is refreshed.
  // Runs silently when a parent is actually logged in (not in kiosk mode).
  useEffect(() => {
    if (!isKioskMode) {
      fetch('/api/auth/ensure-kiosk', { method: 'POST' }).catch(() => {})
    }
  }, [isKioskMode])

  async function selectProfile(p: ProfileWithPin) {
    setError(null)

    if (!isKioskMode && p.id === authProfileId) {
      // Switching back to the auth user's own profile — just clear the override cookie
      setLoading(true)
      await fetch('/api/auth/switch-profile', { method: 'DELETE' })
      router.push(redirectTo)
      router.refresh()
      return
    }

    if (p.pin_hash) {
      setSelected(p)
      setPin('')
    } else if (isKioskMode) {
      setError('Geen PIN ingesteld voor dit profiel. Vraag een ouder om een PIN in te stellen.')
    } else {
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
      const endpoint = isKioskMode
        ? '/api/auth/family-member-login'
        : '/api/auth/switch-profile'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId, pin: pinValue }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Inloggen mislukt')
        setPin('')
        setLoading(false)
        return
      }
      router.push(redirectTo)
      router.refresh()
    } catch {
      setError('Verbindingsfout. Probeer opnieuw.')
      setPin('')
      setLoading(false)
    }
  }

  async function handleParentLogin() {
    if (!isKioskMode) {
      await supabase.auth.signOut()
    }
    router.push('/login?mode=parent')
    router.refresh()
  }

  // ── PIN entry view ──────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">🏠</h1>
          <h2 className="text-2xl font-bold">Wie ben jij?</h2>
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-6">
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
            <p className="text-sm text-muted-foreground">Voer je PIN in</p>
          </div>

          <PinPad value={pin} onChange={handlePin} />

          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          {loading && (
            <div className="flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Profile grid view ───────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-4xl font-bold tracking-tight">🏠</h1>
        <h2 className="text-2xl font-bold">Wie ben jij?</h2>
        <p className="text-muted-foreground text-sm">Kies je profiel om verder te gaan</p>
      </div>

      {/* Profile grid */}
      <div className="grid gap-3 grid-cols-2">
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => selectProfile(p)}
            disabled={loading}
            className="kiosk-card flex flex-col items-center gap-3 p-5 text-center
                       hover:border-primary hover:shadow-md transition-all
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <UserAvatar profile={p} size="lg" />
            <div>
              <p className="font-semibold text-sm">{p.display_name}</p>
              <p className="text-xs text-muted-foreground">{roleLabel[p.role] ?? p.role}</p>
              {p.pin_hash && (!isKioskMode ? p.id !== authProfileId : true) && (
                <p className="text-xs text-muted-foreground mt-1">🔒 PIN</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      {/* Fallback for parent re-login */}
      <div className="text-center">
        <button
          onClick={handleParentLogin}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          {isKioskMode ? 'Inloggen als ouder met e-mail en wachtwoord' : 'Inloggen als een andere ouder'}
        </button>
      </div>
    </div>
  )
}
