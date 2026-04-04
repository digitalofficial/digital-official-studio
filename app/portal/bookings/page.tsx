'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Booking {
  id: string
  name: string
  email: string
  event_type: string
  event_date: string | null
  package: string | null
  message: string | null
  created_at: string
}

export default function PortalBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/portal/bookings')
      .then(res => res.ok ? res.json() : [])
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-navy pb-20 lg:pb-0">
      <nav className="hidden lg:block border-b border-white/5 bg-navy/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-fraunces)] text-lg text-text">
            Digital Official Studio
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/portal" className="text-sm text-silver hover:text-icy transition-colors">Galleries</Link>
            <Link href="/portal/bookings" className="text-sm text-icy">Bookings</Link>
            <Link href="/portal/collections" className="text-sm text-silver hover:text-icy transition-colors">Collections</Link>
            <Link href="/portal/settings" className="text-sm text-silver hover:text-icy transition-colors">Settings</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text mb-2">My Bookings</h1>
        <p className="text-muted mb-8">Booking requests assigned to you.</p>

        {loading ? (
          <p className="text-muted">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <p className="text-muted">No bookings assigned to you yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="glass-card rounded-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-text font-medium">{b.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-icy/10 text-icy">{b.event_type}</span>
                    </div>
                    <p className="text-muted text-sm mt-1">{b.email}</p>
                    <div className="flex gap-4 mt-2 text-sm text-silver">
                      {b.event_date && <span>Date: {new Date(b.event_date).toLocaleDateString()}</span>}
                      {b.package && <span>Package: {b.package}</span>}
                    </div>
                    {b.message && (
                      <p className="text-silver text-sm mt-3 bg-navy/50 rounded-lg p-3">{b.message}</p>
                    )}
                  </div>
                  <p className="text-muted text-xs shrink-0">{new Date(b.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
