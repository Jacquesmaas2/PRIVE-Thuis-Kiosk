import { cn, initials } from '@/lib/utils'
import type { Profile } from '@/types'

interface UserAvatarProps {
  profile: Pick<Profile, 'display_name' | 'avatar_url' | 'color'>
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm:  'h-9 w-9 text-sm',
  md:  'h-11 w-11 text-base',
  lg:  'h-14 w-14 text-lg',
  xl:  'h-20 w-20 text-2xl',
}

export function UserAvatar({ profile, size = 'md', className }: UserAvatarProps) {
  if (profile.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatar_url}
        alt={profile.display_name}
        className={cn('rounded-full object-cover border-2 border-background shadow-sm', sizeClasses[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white shadow-sm border-2 border-background',
        sizeClasses[size],
        className,
      )}
      style={{ backgroundColor: profile.color }}
      aria-label={profile.display_name}
    >
      {initials(profile.display_name)}
    </div>
  )
}
