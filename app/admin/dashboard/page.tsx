import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = await createServiceRoleClient()
  const { data: profile } = await admin.from('profiles').select('role, assigned_galleries, display_name').eq('id', user!.id).single()
  const isAdmin = profile?.role === 'admin'
  const assigned = profile?.assigned_galleries || []

  // Gallery count — filtered by role, excluding deleted
  let galleryCount = 0
  if (isAdmin) {
    const { count } = await admin.from('client_galleries').select('*', { count: 'exact', head: true }).is('deleted_at', null)
    galleryCount = count || 0
  } else if (assigned.length > 0) {
    const { count } = await admin.from('client_galleries').select('*', { count: 'exact', head: true }).in('id', assigned).is('deleted_at', null)
    galleryCount = count || 0
  }

  // Media count — for assigned galleries only (or all for admin), excluding deleted
  let mediaCount = 0
  if (isAdmin) {
    const { count } = await admin.from('media_files').select('*', { count: 'exact', head: true }).is('deleted_at', null)
    mediaCount = count || 0
  } else if (assigned.length > 0) {
    const { count } = await admin.from('media_files').select('*', { count: 'exact', head: true }).in('gallery_id', assigned).is('deleted_at', null)
    mediaCount = count || 0
  }

  // Collections count
  let collectionCount = 0
  if (isAdmin) {
    const { count } = await admin.from('collections').select('*', { count: 'exact', head: true }).is('deleted_at', null)
    collectionCount = count || 0
  } else {
    const { count } = await admin.from('collections').select('*', { count: 'exact', head: true }).eq('created_by', user!.id).is('deleted_at', null)
    collectionCount = count || 0
  }

  // Bookings — admins see all, photographers see only their assigned bookings
  let bookingCount = 0
  let recentBookings: any[] = []
  if (isAdmin) {
    const { count } = await admin.from('bookings').select('*', { count: 'exact', head: true })
    bookingCount = count || 0
    const { data } = await admin.from('bookings').select('*, photographer:profiles!photographer_id(display_name)').order('created_at', { ascending: false }).limit(5)
    recentBookings = data || []
  } else {
    const { count } = await admin.from('bookings').select('*', { count: 'exact', head: true }).eq('photographer_id', user!.id)
    bookingCount = count || 0
    const { data } = await admin.from('bookings').select('*').eq('photographer_id', user!.id).order('created_at', { ascending: false }).limit(5)
    recentBookings = data || []
  }

  const stats = [
    { label: 'Galleries', value: galleryCount, href: '/admin/galleries' },
    { label: 'Collections', value: collectionCount, href: '/admin/collections' },
    { label: 'Media Files', value: mediaCount, href: '/admin/galleries' },
    { label: 'Bookings', value: bookingCount || 0, href: '/admin/bookings' },
  ]

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text mb-2">Dashboard</h1>
      {profile?.display_name && <p className="text-muted mb-8">Welcome back, {profile.display_name}.</p>}
      {!profile?.display_name && <div className="mb-8" />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="glass-card rounded-xl p-6 hover:bg-card-hover transition-colors">
            <p className="text-muted text-sm">{stat.label}</p>
            <p className="text-3xl font-semibold text-text mt-2">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-text">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-icy text-sm hover:underline">View All</Link>
        </div>
        {recentBookings && recentBookings.length > 0 ? (
          <div className="space-y-3">
            {recentBookings.map((booking: any) => (
              <div key={booking.id} className="glass-card rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-text font-medium">{booking.name}</p>
                  <p className="text-muted text-sm">{booking.event_type} &middot; {booking.email}</p>
                </div>
                <p className="text-muted text-xs">
                  {new Date(booking.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">No bookings yet.</p>
        )}
      </div>
    </div>
  )
}
