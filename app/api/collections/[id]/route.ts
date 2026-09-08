import { NextResponse } from 'next/server'
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
  const { data: collection } = await admin
    .from('collections')
    .select('*, client_galleries(event_name, client_name)')
    .eq('id', id)
    .single()

  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only the owner or an admin may read a collection's contents.
  const { data: prof } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (prof?.role !== 'admin' && collection.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch the actual photos
  const { data: photos } = await admin
    .from('media_files')
    .select('id, file_url, file_type, caption')
    .in('id', collection.photo_ids)
    .is('deleted_at', null)

  return NextResponse.json({ ...collection, photos: photos || [] })
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
  const admin = await createServiceRoleClient()

  // Only the owner or an admin may modify a collection.
  const { data: col } = await admin.from('collections').select('created_by').eq('id', id).single()
  if (!col) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: prof } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (prof?.role !== 'admin' && col.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updates: Record<string, unknown> = {}
  if (body.restore === true) {
    updates.deleted_at = null
    updates.deleted_by = null
  }
  if (typeof body.isPrivate === 'boolean') {
    updates.is_private = body.isPrivate
    if (body.isPrivate && body.password) {
      const bcrypt = await import('bcryptjs')
      updates.password_hash = await bcrypt.hash(body.password, 10)
    }
    if (!body.isPrivate) {
      updates.password_hash = null
    }
  }

  const { data, error } = await admin.from('collections').update(updates).eq('id', id).select().single()
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

  // Only the owner or an admin may delete a collection.
  const { data: col } = await admin.from('collections').select('created_by').eq('id', id).single()
  if (!col) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (profile?.role !== 'admin' && col.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const permanent = url.searchParams.get('permanent') === 'true'

  if (permanent && profile?.role === 'admin') {
    const { error } = await admin.from('collections').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, permanent: true })
  }

  // Soft delete
  const { error } = await admin.from('collections').update({
    deleted_at: new Date().toISOString(),
    deleted_by: user.id,
  }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, trashed: true })
}
