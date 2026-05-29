'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { registerSchema } from '@/lib/validations/auth'
import { APP_NAME } from '@/lib/constants'
import type { User } from '@supabase/supabase-js'

type InviteData = { email: string; role: string; family_name: string } | null

interface RegisterFormProps {
  inviteToken?: string
  inviteData?: InviteData
}

export function RegisterForm({ inviteToken, inviteData }: RegisterFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [existingUser, setExistingUser] = useState<User | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [form, setForm] = useState({
    email: inviteData?.email ?? '',
    password: '',
    display_name: '',
    family_name: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setExistingUser(user)
      setCheckingSession(false)
    })
  }, [supabase])

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function postRegister(body: Record<string, string>) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.detail ?? json.error ?? 'Registratie mislukt')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // ── Mode A: existing auth session ─────────────────────────────────────
      if (existingUser) {
        await postRegister({
          display_name: form.display_name,
          ...(inviteToken ? { invite_token: inviteToken } : { family_name: form.family_name }),
        })
        router.push('/dashboard')
        router.refresh()
        return
      }

      // ── Mode B: invite — create auth account then join family ──────────────
      if (inviteToken) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        })
        if (signUpError || !authData.user) {
          throw new Error(signUpError?.message ?? 'Fout bij aanmaken account')
        }
        await postRegister({ display_name: form.display_name, invite_token: inviteToken })
        router.push('/dashboard')
        router.refresh()
        return
      }

      // ── Mode C: new family ─────────────────────────────────────────────────
      const parsed = registerSchema.safeParse(form)
      if (!parsed.success) {
        throw new Error(parsed.error.errors[0].message)
      }
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
      })
      if (signUpError || !authData.user) {
        throw new Error(signUpError?.message ?? 'Fout bij registratie')
      }
      await postRegister({
        display_name: parsed.data.display_name,
        family_name: parsed.data.family_name,
      })
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setLoading(false)
    }
  }

  // ── Spinner while checking session ────────────────────────────────────────
  if (checkingSession) {
    return (
      <div className="w-full max-w-sm flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // ── Invalid invite token ───────────────────────────────────────────────────
  if (inviteToken && !inviteData) {
    return (
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-4xl font-bold">🚫</h1>
        <h2 className="text-xl font-semibold">Ongeldige uitnodiging</h2>
        <p className="text-muted-foreground text-sm">
          Deze uitnodigingslink is verlopen of al gebruikt. Vraag een ouder om een nieuwe link.
        </p>
        <a href="/login" className="inline-block text-sm text-primary underline-offset-4 hover:underline">
          Terug naar inloggen
        </a>
      </div>
    )
  }

  // ── Invite mode — valid invite ─────────────────────────────────────────────
  if (inviteToken && inviteData) {
    const needsAuth = !existingUser
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-bold">🏠</h1>
          <h2 className="text-2xl font-bold">{APP_NAME}</h2>
          <p className="text-muted-foreground text-sm">
            Je bent uitgenodigd voor familie{' '}
            <span className="font-semibold text-foreground">{inviteData.family_name}</span>
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-5">
          {existingUser && (
            <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
              Ingelogd als{' '}
              <span className="font-medium text-foreground">{existingUser.email}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="display_name" className="text-sm font-medium">Jouw naam</label>
              <input
                id="display_name"
                type="text"
                required
                value={form.display_name}
                onChange={update('display_name')}
                placeholder="Mama / Papa"
                className="w-full h-12 rounded-xl border border-input bg-background px-4 text-base
                           focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              />
            </div>

            {needsAuth && (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">E-mailadres</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={update('email')}
                    placeholder={inviteData.email || 'naam@voorbeeld.nl'}
                    className="w-full h-12 rounded-xl border border-input bg-background px-4 text-base
                               focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium">Wachtwoord</label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={form.password}
                    onChange={update('password')}
                    placeholder="••••••••"
                    className="w-full h-12 rounded-xl border border-input bg-background px-4 text-base
                               focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                  />
                </div>
              </>
            )}

            {error && (
              <div role="alert" className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="kiosk-button w-full bg-primary text-primary-foreground hover:bg-primary/90
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Bezig…' : 'Uitnodiging accepteren'}
            </button>
          </form>

          {existingUser && (
            <div className="text-center text-sm text-muted-foreground">
              Ander account gebruiken?{' '}
              <button onClick={handleSignOut} className="font-medium text-primary underline-offset-4 hover:underline">
                Uitloggen
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Existing auth session — complete own profile ───────────────────────────
  if (existingUser) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-bold">🏠</h1>
          <h2 className="text-2xl font-bold">{APP_NAME}</h2>
          <p className="text-muted-foreground text-sm">Voltooi je familie-profiel</p>
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-5">
          <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            Ingelogd als{' '}
            <span className="font-medium text-foreground">{existingUser.email}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { id: 'family_name', label: 'Familienaam', placeholder: 'Familie De Vries' },
              { id: 'display_name', label: 'Jouw naam', placeholder: 'Mama / Papa' },
            ].map(({ id, label, placeholder }) => (
              <div key={id} className="space-y-1.5">
                <label htmlFor={id} className="text-sm font-medium">{label}</label>
                <input
                  id={id}
                  type="text"
                  required
                  value={form[id as keyof typeof form]}
                  onChange={update(id as keyof typeof form)}
                  placeholder={placeholder}
                  className="w-full h-12 rounded-xl border border-input bg-background px-4 text-base
                             focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                />
              </div>
            ))}

            {error && (
              <div role="alert" className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="kiosk-button w-full bg-primary text-primary-foreground hover:bg-primary/90
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Bezig…' : 'Profiel aanmaken'}
            </button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Ander account gebruiken?{' '}
            <button onClick={handleSignOut} className="font-medium text-primary underline-offset-4 hover:underline">
              Uitloggen
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── New user — full registration (creates new family) ─────────────────────
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-4xl font-bold">🏠</h1>
        <h2 className="text-2xl font-bold">{APP_NAME}</h2>
        <p className="text-muted-foreground text-sm">Maak een nieuw familie-account aan</p>
      </div>

      <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { id: 'family_name', label: 'Familienaam', type: 'text', placeholder: 'Familie De Vries' },
            { id: 'display_name', label: 'Jouw naam', type: 'text', placeholder: 'Mama / Papa' },
            { id: 'email', label: 'E-mailadres', type: 'email', placeholder: 'naam@voorbeeld.nl' },
            { id: 'password', label: 'Wachtwoord', type: 'password', placeholder: '••••••••' },
          ].map(({ id, label, type, placeholder }) => (
            <div key={id} className="space-y-1.5">
              <label htmlFor={id} className="text-sm font-medium">{label}</label>
              <input
                id={id}
                type={type}
                required
                value={form[id as keyof typeof form]}
                onChange={update(id as keyof typeof form)}
                placeholder={placeholder}
                className="w-full h-12 rounded-xl border border-input bg-background px-4 text-base
                           focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              />
            </div>
          ))}

          {error && (
            <div role="alert" className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="kiosk-button w-full bg-primary text-primary-foreground hover:bg-primary/90
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Account aanmaken…' : 'Familie aanmaken'}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Al een account?{' '}
          <a href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Inloggen
          </a>
        </div>
      </div>
    </div>
  )
}
