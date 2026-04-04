'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const loginIcon = 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9'
const dashIcon = 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z'

export default function Navbar() {
  const pathname = usePathname()
  const [authLink, setAuthLink] = useState<{ href: string; label: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Fetch profile to determine where to link
        fetch('/api/auth/profile')
          .then(r => r.json())
          .then(profile => {
            if (profile.role === 'client') {
              setAuthLink({ href: '/portal', label: 'Portal' })
            } else {
              setAuthLink({ href: '/admin/dashboard', label: 'Dashboard' })
            }
          })
          .catch(() => setAuthLink({ href: '/admin/dashboard', label: 'Dashboard' }))
      }
    })
  }, [])

  const currentAuthLink = authLink || { href: '/login', label: 'Login' }
  const currentAuthIcon = authLink ? dashIcon : loginIcon

  const navLinks = [
    { href: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { href: '/portfolio', label: 'Portfolio', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { href: '/#contact', label: 'Contact', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { href: currentAuthLink.href, label: currentAuthLink.label, icon: currentAuthIcon },
  ]

  return (
    <>
      {/* Desktop top navbar */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-navy/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-fraunces)] text-xl text-text tracking-wide">
            Digital Official Studio
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/" className="text-sm text-silver hover:text-icy transition-colors">Home</Link>
            <Link href="/portfolio" className="text-sm text-silver hover:text-icy transition-colors">Portfolio</Link>
            <Link href="/#contact" className="text-sm text-silver hover:text-icy transition-colors">Contact</Link>
            <Link href="/#contact" className="btn-primary text-sm !py-2 !px-5">Book Now</Link>
            <Link href={currentAuthLink.href} className="text-sm text-silver hover:text-icy transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={currentAuthIcon} />
              </svg>
              {currentAuthLink.label}
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile bottom navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-md border-t border-white/5 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {navLinks.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-[60px] transition-colors ${
                  active ? 'text-icy' : 'text-muted'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.5} d={link.icon} />
                </svg>
                <span className="text-[10px]">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
