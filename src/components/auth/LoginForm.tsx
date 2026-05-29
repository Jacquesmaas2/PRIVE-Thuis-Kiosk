'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/lib/validations/auth'
import { APP_NAME } from '@/lib/constants'

interface LoginFormProps {
  redirectTo: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.errors[0].message)
      return
    }

    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (authError) {
      setError('E-mailadres of wachtwoord is onjuist.')
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-4xl font-bold tracking-tight">🏠</h1>
        <h2 className="text-2xl font-bold">{APP_NAME}</h2>
        <p className="text-muted-foreground text-sm">Log in op je familie dashboard</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              E-mailadres
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-xl border border-input bg-background px-4 text-base
                         focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              placeholder="naam@voorbeeld.nl"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-xl border border-input bg-background px-4 text-base
                         focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              placeholder="••••••••"
            />
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="kiosk-button w-full bg-primary text-primary-foreground hover:bg-primary/90
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Bezig met inloggen…' : 'Inloggen'}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Geen account?{' '}
          <a
            href="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Familie aanmaken
          </a>
        </div>
      </div>
    </div>
  )
}
