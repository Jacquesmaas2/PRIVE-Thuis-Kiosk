'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Trash2 } from 'lucide-react'

type Invitation = {
  id: string
  email: string
  role: string
  token: string
  created_at: string
  expires_at: string
}

export function PendingInvitations({ invitations }: { invitations: Invitation[] }) {
  return (
    <div className="space-y-2">
      {invitations.map((inv) => (
        <InvitationRow key={inv.id} invitation={inv} />
      ))}
    </div>
  )
}

function InvitationRow({ invitation }: { invitation: Invitation }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState(false)

  const roleLabel: Record<string, string> = { parent: 'Ouder', kid: 'Kind', guest: 'Gast' }
  const inviteUrl = `${window.location.origin}/register?token=${invitation.token}`

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRevoke() {
    if (!confirm(`Uitnodiging voor ${invitation.email} intrekken?`)) return
    setRevoking(true)
    try {
      await fetch(`/api/profiles/invite?id=${invitation.id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{invitation.email}</p>
        <p className="text-xs text-muted-foreground">
          {roleLabel[invitation.role] ?? invitation.role} ·{' '}
          verloopt {new Date(invitation.expires_at).toLocaleDateString('nl-NL')}
        </p>
      </div>
      <button
        onClick={handleCopy}
        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
        title="Kopieer uitnodigingslink"
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
      </button>
      <button
        onClick={handleRevoke}
        disabled={revoking}
        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors"
        title="Uitnodiging intrekken"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </button>
    </div>
  )
}
