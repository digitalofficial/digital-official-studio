import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (typeof body.isPortfolio === 'boolean') updates.is_portfolio = body.isPortfolio
  if (typeof body.caption === 'string') updates.caption = body.caption
  if (typeof body.name === 'string') updates.name = body.name
  if (typeof body.watermarkEnabled === 'boolean') updates.watermark_enabled = body.watermarkEnabled
  // Restore from trash
  if (body.restore === true) {
    updates.deleted_at = null
    updates.deleted_by = null
  }

  const admin = await createServiceRoleClient()

  // When restoring media, also restore its parent gallery if it was deleted
  if (body.restore === true) {
    const { data: mediaRecord } = await admin
      .from('media_files')
      .select('gallery_id')
      .eq('id', id)
      .single()

    if (mediaRecord?.gallery_id) {
      const { data: gallery } = await admin
        .from('client_galleries')
        .select('id, deleted_at, created_by')
        .eq('id', mediaRecord.gallery_id)
        .single()

      // Restore the gallery if it's also in trash
      if (gallery?.deleted_at) {
        await admin
          .from('client_galleries')
          .update({ deleted_at: null, deleted_by: null })
          .eq('id', gallery.id)
      }

      // Re-add gallery to creator's assigned_galleries
      if (gallery?.created_by) {
        const { data: profile } = await admin
          .from('profiles')
          .select('assigned_galleries')
          .eq('id', gallery.created_by)
          .single()
        const arr = profile?.assigned_galleries || []
        if (!arr.includes(mediaRecord.gallery_id)) {
          await admin.from('profiles').update({
            assigned_galleries: [...arr, mediaRecord.gallery_id],
          }).eq('id', gallery.created_by)
        }
      }
    }
  }

  const { data, error } = await admin
    .from('media_files')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createServiceRoleClient()

  // Get file info including uploader
  const { data: media } = await admin
    .from('media_files')
    .select('file_url, uploaded_by, deleted_at')
    .eq('id', id)
    .single()

  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  if (!isAdmin && (!media.uploaded_by || media.uploaded_by !== user.id)) {
    return NextResponse.json({ error: 'You can only delete files you uploaded' }, { status: 403 })
  }

  // Check if requesting permanent delete (admin only, from trash)
  const url = new URL(request.url)
  const permanent = url.searchParams.get('permanent') === 'true'

  if (permanent && isAdmin) {
    // Permanently delete from storage and DB
    const fileUrl = new URL(media.file_url)
    const pathMatch = fileUrl.pathname.match(/\/storage\/v1\/object\/public\/media\/(.+)/)
    if (pathMatch) {
      await admin.storage.from('media').remove([pathMatch[1]])
    }

    const { error } = await admin.from('media_files').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, permanent: true })
  }

  // Soft delete — move to trash
  const { error } = await admin
    .from('media_files')
    .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, trashed: true })
}
