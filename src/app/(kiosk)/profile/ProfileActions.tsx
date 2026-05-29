'use client'

import { useState } from 'react'
import { UserPlus, MailPlus } from 'lucide-react'
import { AddKidDialog } from '@/components/profile/AddKidDialog'
import { InviteParentDialog } from '@/components/profile/InviteParentDialog'

export function ProfileActions() {
  const [kidOpen, setKidOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setKidOpen(true)}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-primary text-primary-foreground
                     text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Kind toevoegen
        </button>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border text-sm font-medium
                     hover:bg-muted transition-colors"
        >
          <MailPlus className="h-4 w-4" />
          Ouder uitnodigen
        </button>
      </div>

      <AddKidDialog open={kidOpen} onClose={() => setKidOpen(false)} />
      <InviteParentDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  )
}
