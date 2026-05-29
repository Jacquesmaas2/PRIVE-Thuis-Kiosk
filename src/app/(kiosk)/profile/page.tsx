import { redirect } from 'next/navigation'
import { createClient, getAuthProfile } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { PointsBadge } from '@/components/shared/PointsBadge'
import { Badge } from '@/components/ui/badge'
import { MapPin, Users } from 'lucide-react'
import { ProfileActions } from './ProfileActions'
import { ProfileCardActions } from './ProfileCardActions'
import { PendingInvitations } from './PendingInvitations'
import { AddressForm } from './AddressForm'

export const metadata = { title: 'Profielen | Thuis Kiosk' }

export default async function ProfilePage() {
  const { userId, profile } = await getAuthProfile()
  if (!userId || !profile) redirect(ROUTES.login)

  const supabase = createClient()

  // Fetch all family members
  const { data: profiles = [] } = await supabase
    .from('profiles')
    .select('*')
    .eq('family_id', profile.family_id!)
    .order('created_at', { ascending: true })

  // Fetch point balances
  const { data: balanceRows = [] } = await supabase
    .from('user_points_balance')
    .select('user_id, balance')
    .eq('family_id', profile.family_id!)

  const balanceMap: Record<string, number> = {}
  for (const row of balanceRows ?? []) {
    if (row.user_id) balanceMap[row.user_id] = row.balance ?? 0
  }

  // Fetch pending invitations (parents only)
  type Invitation = { id: string; email: string; role: string; token: string; created_at: string; expires_at: string }
  let invitations: Invitation[] = []
  if (profile.role === 'parent') {
    const { data } = await supabase
      .from('invitations')
      .select('id, email, role, token, created_at, expires_at')
      .eq('family_id', profile.family_id!)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    invitations = (data ?? []) as Invitation[]
  }

  // Fetch family settings for home address (parents only)
  type FamilySettings = {
    address_line1: string | null; city: string | null; postal_code: string | null
    country: string; latitude: number | null; longitude: number | null
  }
  let familySettings: FamilySettings | null = null
  if (profile.role === 'parent') {
    const { data } = await supabase
      .from('family_settings')
      .select('address_line1, city, postal_code, country, latitude, longitude')
      .eq('family_id', profile.family_id!)
      .single()
    familySettings = (data as FamilySettings | null) ?? null
  }

  // Build a map of which kid profiles have a PIN set (for UI indicator)
  const hasPINMap: Record<string, boolean> = {}
  for (const p of profiles ?? []) {
    hasPINMap[p.id] = !!p.pin_hash
  }

  const isParent = profile.role === 'parent'

  // Sort: parents first, then kids, then guests
  const roleOrder = { parent: 0, kid: 1, guest: 2 }
  const sorted = [...(profiles ?? [])].sort(
    (a, b) => (roleOrder[a.role as keyof typeof roleOrder] ?? 9) - (roleOrder[b.role as keyof typeof roleOrder] ?? 9),
  )

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        title="Profielen"
        icon={<Users className="h-7 w-7" />}
        description={isParent ? 'Beheer familieleden, voeg kinderen toe of nodig een ouder uit' : undefined}
      />

      {/* Action buttons — parent only */}
      {isParent && (
        <ProfileActions />
      )}

      {/* Family members grid */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Familieleden
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((p) => {
            const { pin_hash: _, ...profileForClient } = p
            const isCurrentUser = profileForClient.id === profile.id
            const balance = balanceMap[profileForClient.id] ?? 0
            return (
              <ProfileCard
                key={profileForClient.id}
                profile={profileForClient as Parameters<typeof ProfileCard>[0]['profile']}
                balance={balance}
                isCurrentUser={isCurrentUser}
                isParent={isParent}
                currentProfileId={profile.id}
                hasPIN={hasPINMap[profileForClient.id] ?? false}
              />
            )
          })}
        </div>
      </section>

      {/* Pending invitations — parent only */}
      {isParent && invitations.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Openstaande uitnodigingen
          </h2>
          <PendingInvitations invitations={invitations} />
        </section>
      )}

      {/* Home address — parent only */}
      {isParent && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Thuisadres
          </h2>
          <p className="text-sm text-muted-foreground">
            Het thuisadres wordt gebruikt voor locatiegebonden onderdelen zoals het weerwidget.
          </p>
          <div className="kiosk-card p-5">
            <AddressForm
              initial={familySettings ?? {
                address_line1: null, city: null, postal_code: null,
                country: 'NL', latitude: null, longitude: null,
              }}
            />
          </div>
        </section>
      )}

      {/* Sign out */}
      <section className="pt-4 border-t">
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="h-11 rounded-xl border px-6 text-sm font-medium hover:bg-muted transition-colors"
          >
            Uitloggen
          </button>
        </form>
      </section>
    </div>
  )
}

// ─── Profile card (server-rendered, edit/delete handled by client sub-component) ──

import type { Profile } from '@/types'

interface ProfileCardProps {
  profile: Profile
  balance: number
  isCurrentUser: boolean
  isParent: boolean
  currentProfileId: string
  hasPIN: boolean
}

function ProfileCard({ profile, balance, isCurrentUser, isParent, currentProfileId, hasPIN }: ProfileCardProps) {
  const roleLabel: Record<string, string> = { parent: 'Ouder', kid: 'Kind', guest: 'Gast' }
  const canEdit = isParent || isCurrentUser
  const canDelete = isParent && !isCurrentUser

  return (
    <div className="kiosk-card flex items-start gap-4 relative">
      <UserAvatar profile={profile} size="lg" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold truncate">{profile.display_name}</span>
          {isCurrentUser && (
            <span className="text-xs text-muted-foreground">(jij)</span>
          )}
        </div>
        <Badge variant="secondary" className="capitalize text-xs">
          {roleLabel[profile.role] ?? profile.role}
        </Badge>
        <div className="pt-1">
          <PointsBadge points={balance} size="sm" />
        </div>
        {profile.date_of_birth && (
          <p className="text-xs text-muted-foreground">
            🎂 {formatDate(profile.date_of_birth)}
          </p>
        )}
      </div>

      {/* Client-side edit/delete buttons */}
      {(canEdit || canDelete) && (
        <ProfileCardActions
          profile={profile}
          isParent={isParent}
          isCurrentUser={isCurrentUser}
          canDelete={canDelete}
          hasPIN={hasPIN}
        />
      )}
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}
