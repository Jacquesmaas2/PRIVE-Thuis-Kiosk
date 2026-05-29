'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Copy, Check } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

export function InviteParentDialog({ open, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function reset() {
    setEmail('')
    setError(null)
    setInviteUrl(null)
    setCopied(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/profiles/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail ?? json.error ?? 'Fout bij uitnodigen')
      setInviteUrl(json.data.invite_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ouder uitnodigen</DialogTitle>
        </DialogHeader>

        {inviteUrl ? (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Stuur deze link naar de persoon die je wilt uitnodigen. De link is 7 dagen geldig.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteUrl}
                className="flex-1 h-11 rounded-xl border border-input bg-muted px-3 text-xs
                           focus:outline-none truncate"
              />
              <button
                onClick={handleCopy}
                className="h-11 w-11 flex items-center justify-center rounded-xl border
                           hover:bg-muted transition-colors"
                title="Kopieer link"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={() => { reset(); onClose() }}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium
                         hover:bg-primary/90 transition-colors"
            >
              Klaar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="invite-email" className="text-sm font-medium">
                E-mailadres van de ouder
              </label>
              <input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ouder@voorbeeld.nl"
                className="w-full h-11 rounded-xl border border-input bg-background px-4 text-base
                           focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { reset(); onClose() }}
                className="flex-1 h-11 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium
                           hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Genereren…' : 'Uitnodiging maken'}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
