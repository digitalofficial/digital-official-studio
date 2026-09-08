import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { mediaPathFromUrl } from '@/lib/storage'

// Returns short-lived signed URLs for the FULL-RESOLUTION originals of a gallery's
// media, for admin/photographer download. Signing needs the service role (the
// media bucket is private in Phase 3), so it lives server-side and is auth-gated.
// Body: { mediaIds?: string[] }  (omit → the whole gallery).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createServiceRoleClient()
  const { data: profile } = await admin
    .from('profiles').select('role, assigned_galleries').eq('id', user.id).single()
  if (profile?.role !== 'admin' && !(profile?.assigned_galleries || []).includes(id)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({} as { mediaIds?: string[] }))
  const mediaIds: string[] | undefined = body?.mediaIds

  let query = admin
    .from('media_files')
    .select('id, name, file_url, original_url, file_type')
    .eq('gallery_id', id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
  if (mediaIds && mediaIds.length) query = query.in('id', mediaIds)

  const { data: media } = await query
  if (!media || media.length === 0) return NextResponse.json({ files: [] })

  // Build a path→filename map (download the original; fall back to display url).
  const entries = media.map((m: any) => {
    const source = m.original_url || m.file_url
    const path = mediaPathFromUrl(source)
    const ext = (path?.split('.').pop() || (m.file_type === 'video' ? 'mp4' : 'jpg')).toLowerCase()
    const safe = String(m.name || m.id).replace(/[^\w.\- ]+/g, '_').trim() || m.id
    const filename = safe.toLowerCase().endsWith(`.${ext}`) ? safe : `${safe}.${ext}`
    return { id: m.id, path, filename, file_type: m.file_type }
  }).filter((e) => !!e.path) as { id: string; path: string; filename: string; file_type: string }[]

  const uniquePaths = Array.from(new Set(entries.map((e) => e.path)))
  const { data: signed } = await admin.storage.from('media').createSignedUrls(uniquePaths, 60 * 60)
  const urlByPath = new Map<string, string>()
  for (const s of signed || []) if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl)

  const files = entries
    .map((e) => ({ id: e.id, name: e.filename, url: urlByPath.get(e.path), file_type: e.file_type }))
    .filter((f) => !!f.url)

  return NextResponse.json({ files })
}
