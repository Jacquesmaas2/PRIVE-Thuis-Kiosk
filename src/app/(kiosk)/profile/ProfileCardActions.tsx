'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Pencil, Trash2 } from 'lucide-react'
import { EditProfileDialog } from '@/components/profile/EditProfileDialog'
import { SetPinDialog } from './SetPinDialog'
import type { Profile } from '@/types'

interface Props {
  profile: Profile
  isParent: boolean
  isCurrentUser: boolean
  canDelete: boolean
  hasPIN: boolean
}

export function ProfileCardActions({ profile, isParent, isCurrentUser, canDelete, hasPIN }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const showPinButton = isParent && !isCurrentUser && profile.role === 'kid'

  async function handleDelete() {
    if (!confirm(`Profiel van ${profile.display_name} verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/profiles/${profile.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        alert(json.error ?? 'Verwijderen mislukt')
        return
      }
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex gap-1 absolute top-4 right-4">
        {showPinButton && (
          <button
            onClick={() => setPinOpen(true)}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            title={hasPIN ? 'PIN wijzigen' : 'PIN instellen'}
          >
            <KeyRound className={`h-3.5 w-3.5 ${hasPIN ? 'text-primary' : 'text-muted-foreground'}`} />
          </button>
        )}
        <button
          onClick={() => setEditOpen(true)}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          title="Bewerken"
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors"
            title="Verwijderen"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </button>
        )}
      </div>

      <EditProfileDialog
        profile={profile}
        isParent={isParent}
        isOwnProfile={isCurrentUser}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      {showPinButton && (
        <SetPinDialog
          profileId={profile.id}
          profileName={profile.display_name}
          hasPIN={hasPIN}
          open={pinOpen}
          onClose={() => setPinOpen(false)}
        />
      )}
    </>
  )
}
