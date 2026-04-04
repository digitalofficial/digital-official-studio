import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createServiceRoleClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()

  let query = admin
    .from('collections')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Admin sees all, others see only their own
  if (profile?.role !== 'admin') {
    query = query.eq('created_by', user.id)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, galleryId, photoIds, isPrivate, password } = await request.json()

  if (!name || !galleryId || !photoIds?.length) {
    return NextResponse.json({ error: 'Name, gallery, and photos required' }, { status: 400 })
  }

  let passwordHash = null
  if (isPrivate && password) {
    passwordHash = await bcrypt.hash(password, 10)
  }

  const admin = await createServiceRoleClient()
  const { data, error } = await admin.from('collections').insert({
    name,
    gallery_id: galleryId,
    photo_ids: photoIds,
    created_by: user.id,
    is_private: isPrivate || false,
    password_hash: passwordHash,
    password_plain: isPrivate ? password : null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
