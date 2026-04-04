import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { clientName, eventName, slug, password, isPublic, category } = body

  if (!clientName || !eventName || !slug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!isPublic && !password) {
    return NextResponse.json({ error: 'Password required for private galleries' }, { status: 400 })
  }

  const passwordHash = password ? await bcrypt.hash(password, 10) : null
  const admin = await createServiceRoleClient()

  // Create gallery
  const { data: gallery, error } = await admin.from('client_galleries').insert({
    client_name: clientName,
    event_name: eventName,
    slug,
    password_hash: passwordHash,
    password_plain: password || null,
    is_public: isPublic || false,
    category: category || 'Other',
  }).select('id, client_name, event_name, slug, is_public, password_plain, created_at').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Add gallery to user's assigned_galleries
  const { data: profile } = await admin.from('profiles').select('assigned_galleries').eq('id', user.id).single()
  const currentGalleries = profile?.assigned_galleries || []

  await admin.from('profiles').update({
    assigned_galleries: [...currentGalleries, gallery.id],
  }).eq('id', user.id)

  return NextResponse.json({ ...gallery, media_files: [{ count: 0 }] })
}
