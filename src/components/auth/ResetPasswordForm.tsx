'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function ResetPasswordForm() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens zijn.')
      return
    }

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Wachtwoord wijzigen is mislukt. Open de link opnieuw en probeer het nog eens.')
      setLoading(false)
      return
    }

    setSuccess('Wachtwoord gewijzigd. Je kunt nu opnieuw inloggen.')
    setLoading(false)

    setTimeout(() => {
      router.push('/login')
      router.refresh()
    }, 1200)
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Nieuw wachtwoord instellen</h1>
        <p className="text-muted-foreground text-sm">
          Vul hieronder je nieuwe wachtwoord in.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Nieuw wachtwoord
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-xl border border-input bg-background px-4 text-base
                         focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              Herhaal wachtwoord
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-12 rounded-xl border border-input bg-background px-4 text-base
                         focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="kiosk-button w-full bg-primary text-primary-foreground hover:bg-primary/90
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Opslaan…' : 'Wachtwoord opslaan'}
          </button>
        </form>
      </div>
    </div>
  )
}
