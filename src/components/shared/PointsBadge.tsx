import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

interface PointsBadgeProps {
  points: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm:  'text-xs px-2 py-0.5 gap-1',
  md:  'text-sm px-3 py-1 gap-1.5',
  lg:  'text-base px-4 py-1.5 gap-2 font-semibold',
}

const iconSizes = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5' }

export function PointsBadge({ points, size = 'md', className }: PointsBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-amber-100 text-amber-700 font-medium',
        sizeClasses[size],
        className,
      )}
      aria-label={`${points} punten`}
    >
      <Star className={cn('fill-amber-400 text-amber-400', iconSizes[size])} aria-hidden />
      {points}
    </span>
  )
}
