import type { Profile } from '@/types'
import { UserAvatar } from '@/components/shared/UserAvatar'

interface WelcomeBannerProps {
  profile: Profile
  familyName: string
  dateLabel: string
}

export function WelcomeBanner({ profile, familyName, dateLabel }: WelcomeBannerProps) {
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Goedemorgen' :
    hour < 18 ? 'Goedemiddag' :
    'Goedenavond'

  return (
    <div
      className="rounded-2xl p-6 text-white relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${profile.color}cc, ${profile.color}88)`,
      }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 translate-x-8 -translate-y-8" />
      <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/10 -translate-x-6 translate-y-6" />

      <div className="relative flex items-center gap-4">
        <UserAvatar profile={profile} size="lg" />
        <div>
          <p className="text-white/80 text-sm font-medium">{greeting},</p>
          <h1 className="text-2xl font-bold">{profile.display_name}!</h1>
          <p className="text-white/70 text-sm mt-0.5">
            {familyName} · {dateLabel}
          </p>
        </div>
      </div>
    </div>
  )
}
