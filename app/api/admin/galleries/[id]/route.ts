import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createServiceRoleClient()
  const { data: gallery } = await admin
    .from('client_galleries')
    .select('*')
    .eq('id', id)
    .single()

  if (!gallery) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: media } = await admin
    .from('media_files')
    .select('*')
    .eq('gallery_id', id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return NextResponse.json({ ...gallery, media: media || [] })
}

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

  if (body.clientName) updates.client_name = body.clientName
  if (body.eventName) updates.event_name = body.eventName
  if (body.slug) updates.slug = body.slug
  if (body.category) updates.category = body.category
  if (typeof body.isPublic === 'boolean') updates.is_public = body.isPublic
  if (body.password) {
    updates.password_hash = await bcrypt.hash(body.password, 10)
    updates.password_plain = body.password
  }
  if (body.isPublic === true) {
    // When making public, clear password
    updates.password_plain = null
  }
  if (body.restore === true) {
    updates.deleted_at = null
    updates.deleted_by = null
  }

  const admin = await createServiceRoleClient()

  // If restoring, also restore media files and re-assign to creator
  if (body.restore === true) {
    await admin.from('media_files').update({
      deleted_at: null,
      deleted_by: null,
    }).eq('gallery_id', id)

    // Re-add to creator's profile
    const { data: gal } = await admin.from('client_galleries').select('created_by').eq('id', id).single()
    if (gal?.created_by) {
      const { data: p } = await admin.from('profiles').select('assigned_galleries').eq('id', gal.created_by).single()
      const arr = p?.assigned_galleries || []
      if (!arr.includes(id)) {
        await admin.from('profiles').update({
          assigned_galleries: [...arr, id],
        }).eq('id', gal.created_by)
      }
    }
  }

  const { data, error } = await admin
    .from('client_galleries')
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
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  const { data: gallery } = await admin.from('client_galleries').select('created_by').eq('id', id).single()

  // Only admin, creator, or assigned user can delete
  const { data: userProfile } = await admin.from('profiles').select('assigned_galleries').eq('id', user.id).single()
  const isAssigned = (userProfile?.assigned_galleries || []).includes(id)
  if (profile?.role !== 'admin' && gallery?.created_by !== user.id && !isAssigned) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const url = new URL(request.url)
  const permanent = url.searchParams.get('permanent') === 'true'

  // Remove gallery from all users' assigned_galleries
  async function removeFromProfiles(galleryId: string) {
    const { data: profiles } = await admin.from('profiles').select('id, assigned_galleries')
    if (profiles) {
      for (const p of profiles) {
        const arr = p.assigned_galleries || []
        if (arr.includes(galleryId)) {
          await admin.from('profiles').update({
            assigned_galleries: arr.filter((gid: string) => gid !== galleryId),
          }).eq('id', p.id)
        }
      }
    }
  }

  // Add gallery back to creator's assigned_galleries
  async function addBackToProfile(galleryId: string, creatorId: string | null) {
    if (!creatorId) return
    const { data: p } = await admin.from('profiles').select('assigned_galleries').eq('id', creatorId).single()
    const arr = p?.assigned_galleries || []
    if (!arr.includes(galleryId)) {
      await admin.from('profiles').update({
        assigned_galleries: [...arr, galleryId],
      }).eq('id', creatorId)
    }
  }

  if (permanent && profile?.role === 'admin') {
    await removeFromProfiles(id)
    const { error } = await admin.from('client_galleries').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, permanent: true })
  }

  // Soft delete gallery and its media
  const now = new Date().toISOString()
  await admin.from('media_files').update({
    deleted_at: now,
    deleted_by: user.id,
  }).eq('gallery_id', id).is('deleted_at', null)

  const { error } = await admin.from('client_galleries').update({
    deleted_at: now,
    deleted_by: user.id,
  }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Remove from all profiles
  await removeFromProfiles(id)

  return NextResponse.json({ success: true, trashed: true })
}
