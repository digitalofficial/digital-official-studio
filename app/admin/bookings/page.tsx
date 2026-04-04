'use client'

import { useEffect, useState } from 'react'

interface Booking {
  id: string
  name: string
  email: string
  event_type: string
  event_date: string | null
  package: string | null
  message: string | null
  photographer: { id: string; display_name: string | null } | null
  created_at: string
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchBookings() {
    const res = await fetch('/api/admin/bookings')
    if (res.ok) setBookings(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchBookings() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this booking?')) return
    await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' })
    fetchBookings()
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text mb-8">Bookings</h1>

      {loading ? (
        <p className="text-muted">Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-muted">No bookings yet.</p>
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
                  <div className="flex gap-4 mt-2 text-sm text-silver flex-wrap">
                    {b.event_date && <span>Date: {new Date(b.event_date).toLocaleDateString()}</span>}
                    {b.package && <span>Package: {b.package}</span>}
                    {b.photographer && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400 text-xs">
                        Photographer: {b.photographer.display_name || 'Assigned'}
                      </span>
                    )}
                  </div>
                  {b.message && (
                    <p className="text-silver text-sm mt-3 bg-navy/50 rounded-lg p-3">{b.message}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-muted text-xs">{new Date(b.created_at).toLocaleDateString()}</p>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
