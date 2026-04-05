import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PortalClient from './PortalClient'
import PortalNav from './PortalNav'
import PortalQuickUpload from './PortalQuickUpload'

export default async function ClientPortal() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = await createServiceRoleClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch assigned galleries (non-deleted only)
  let galleries: any[] = []
  const assigned = profile.assigned_galleries || []
  if (assigned.length > 0) {
    const { data } = await admin
      .from('client_galleries')
      .select('id, client_name, event_name, slug, is_public, password_plain, created_at')
      .in('id', assigned)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Get accurate media counts and thumbnails (excluding deleted)
    if (data && data.length > 0) {
      const galIds = data.map((g: any) => g.id)

      const { data: allMedia } = await admin
        .from('media_files')
        .select('gallery_id')
        .in('gallery_id', galIds)
        .is('deleted_at', null)

      const { data: photoMedia } = await admin
        .from('media_files')
        .select('gallery_id, file_url')
        .in('gallery_id', galIds)
        .eq('file_type', 'photo')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      const countMap: Record<string, number> = {}
      allMedia?.forEach((m: any) => {
        countMap[m.gallery_id] = (countMap[m.gallery_id] || 0) + 1
      })

      const thumbMap: Record<string, string[]> = {}
      photoMedia?.forEach((m: any) => {
        if (!thumbMap[m.gallery_id]) thumbMap[m.gallery_id] = []
        if (thumbMap[m.gallery_id].length < 5) {
          thumbMap[m.gallery_id].push(m.file_url)
        }
      })

      galleries = data.map((g: any) => ({
        ...g,
        media_files: [{ count: countMap[g.id] || 0 }],
        thumbnails: thumbMap[g.id] || [],
      }))
    }
  }

  // Stats for dashboard
  const galleryCount = galleries.length

  let mediaCount = 0
  if (galleries.length > 0) {
    const galleryIds = galleries.map((g: any) => g.id)
    const { count } = await admin.from('media_files').select('*', { count: 'exact', head: true }).in('gallery_id', galleryIds).is('deleted_at', null)
    mediaCount = count || 0
  }

  const { count: collectionCount } = await admin.from('collections').select('*', { count: 'exact', head: true }).eq('created_by', user.id).is('deleted_at', null)

  const stats = [
    { label: 'Galleries', value: galleryCount },
    { label: 'Collections', value: collectionCount || 0 },
    { label: 'Photos', value: mediaCount },
  ]

  return (
    <div className="min-h-screen bg-navy pb-20 lg:pb-0">
      {/* Desktop top nav */}
      <nav className="hidden lg:block border-b border-white/5 bg-navy/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-fraunces)] text-lg text-text">
            Digital Official Studio
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/portal" className="text-sm text-icy">Galleries</Link>
            {profile.role !== 'client' && <Link href="/portal/bookings" className="text-sm text-silver hover:text-icy transition-colors">Bookings</Link>}
            <Link href="/portal/collections" className="text-sm text-silver hover:text-icy transition-colors">Collections</Link>
            <Link href="/portal/settings" className="text-sm text-silver hover:text-icy transition-colors">Settings</Link>
            <span className="text-sm text-muted">{profile.display_name || profile.email}</span>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <PortalNav displayName={profile.display_name || profile.email} role={profile.role} />

      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
        {/* Quick Upload */}
        <div className="flex justify-end mb-4">
          <PortalQuickUpload displayName={profile.display_name || ''} />
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-4 lg:p-6 text-center">
              <p className="text-2xl lg:text-3xl font-semibold text-text">{stat.value}</p>
              <p className="text-muted text-xs lg:text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <PortalClient
          profile={profile}
          initialGalleries={galleries}
          userId={user.id}
        />
      </div>
    </div>
  )
}
