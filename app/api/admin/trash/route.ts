import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createServiceRoleClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  // Deleted media files
  const { data: deletedMedia } = await admin
    .from('media_files')
    .select('*, client_galleries(event_name, client_name)')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  // Deleted galleries
  const { data: deletedGalleries } = await admin
    .from('client_galleries')
    .select('*, media_files(count)')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  // Deleted collections
  const { data: deletedCollections } = await admin
    .from('collections')
    .select('*, client_galleries(event_name)')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  // Fetch all profiles for deleted_by lookup
  const deletedByIds = new Set<string>()
  ;[...(deletedMedia || []), ...(deletedGalleries || []), ...(deletedCollections || [])].forEach((item: any) => {
    if (item.deleted_by) deletedByIds.add(item.deleted_by)
  })

  let profileMap: Record<string, { email: string; display_name: string | null }> = {}
  if (deletedByIds.size > 0) {
    const { data: profiles } = await admin.from('profiles').select('id, email, display_name').in('id', Array.from(deletedByIds))
    if (profiles) {
      profiles.forEach((p: any) => { profileMap[p.id] = { email: p.email, display_name: p.display_name } })
    }
  }

  // Attach profile info
  const attachProfile = (item: any) => ({
    ...item,
    profiles: item.deleted_by ? profileMap[item.deleted_by] || null : null,
  })

  return NextResponse.json({
    media: (deletedMedia || []).map(attachProfile),
    galleries: (deletedGalleries || []).map(attachProfile),
    collections: (deletedCollections || []).map(attachProfile),
  })
}
