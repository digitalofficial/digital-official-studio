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

  const admin = await createServiceRoleClient()
  const { data: requesterProfile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (requesterProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can update users' }, { status: 403 })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (body.role) updates.role = body.role
  if (typeof body.displayName === 'string') updates.display_name = body.displayName
  if (Array.isArray(body.assignedGalleries)) updates.assigned_galleries = body.assignedGalleries

  const { data, error } = await admin.from('profiles').update(updates).eq('id', id).select().single()
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

  if (user.id === id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const admin = await createServiceRoleClient()
  const { data: requesterProfile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (requesterProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can delete users' }, { status: 403 })
  }

  // Delete profile first (cascade should handle it, but be safe)
  await admin.from('profiles').delete().eq('id', id)
  const { error } = await admin.auth.admin.deleteUser(id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
