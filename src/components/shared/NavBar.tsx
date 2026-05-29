'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeftRight, LogOut, Menu, X, Home } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { NAV_ITEMS, APP_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/shared/UserAvatar'
import type { Profile } from '@/types'

interface NavBarProps {
  profile: Profile
}

export function NavBar({ profile }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-4 md:px-6">
        {/* Left: hamburger + app name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Menu openen"
            className="touch-target flex items-center justify-center rounded-xl hover:bg-accent transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <Home className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">{APP_NAME}</span>
          </Link>
        </div>

        {/* Right: user avatar */}
        <div className="flex items-center gap-3">
          <Link href="/profile" aria-label="Profiel">
            <UserAvatar profile={profile} size="sm" />
          </Link>
        </div>
      </header>

      {/* Drawer overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-background shadow-xl flex flex-col"
              role="navigation"
              aria-label="Hoofdnavigatie"
            >
              {/* Drawer header */}
              <div className="flex h-16 items-center justify-between px-5 border-b">
                <span className="font-bold text-lg">{APP_NAME}</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Menu sluiten"
                  className="touch-target flex items-center justify-center rounded-xl hover:bg-accent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User info */}
              <div className="flex items-center gap-3 px-5 py-4 border-b">
                <UserAvatar profile={profile} size="md" />
                <div>
                  <p className="font-semibold">{profile.display_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
                </div>
              </div>

              {/* Nav items */}
              <ul className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
                {NAV_ITEMS.map((item) => {
                  const active = pathname.startsWith(item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-accent',
                        )}
                      >
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-sm"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.label.charAt(0)}
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>

              {/* Footer actions */}
              <div className="p-3 border-t space-y-1">
                <Link
                  href="/switch"
                  onClick={() => setDrawerOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent transition-colors"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Wissel van profiel
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Uitloggen
                </button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
