import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createServiceRoleClient()
  const { data: profile } = await admin.from('profiles').select('role, assigned_galleries').eq('id', user.id).single()

  let query = admin
    .from('client_galleries')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Non-admins only see assigned galleries
  if (profile?.role !== 'admin') {
    const assigned = profile?.assigned_galleries || []
    if (assigned.length === 0) {
      return NextResponse.json([])
    }
    query = query.in('id', assigned)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get accurate media counts and thumbnail previews (excluding deleted files)
  if (data && data.length > 0) {
    const galIds = data.map((g: any) => g.id)
    const { data: mediaRows } = await admin
      .from('media_files')
      .select('gallery_id, file_url, file_type')
      .in('gallery_id', galIds)
      .eq('file_type', 'photo')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    const countMap: Record<string, number> = {}
    const thumbMap: Record<string, string[]> = {}

    // Also count videos
    const { data: allMedia } = await admin
      .from('media_files')
      .select('gallery_id')
      .in('gallery_id', galIds)
      .is('deleted_at', null)

    allMedia?.forEach((m: any) => {
      countMap[m.gallery_id] = (countMap[m.gallery_id] || 0) + 1
    })

    mediaRows?.forEach((m: any) => {
      if (!thumbMap[m.gallery_id]) thumbMap[m.gallery_id] = []
      if (thumbMap[m.gallery_id].length < 5) {
        thumbMap[m.gallery_id].push(m.file_url)
      }
    })

    return NextResponse.json(data.map((g: any) => ({
      ...g,
      media_files: [{ count: countMap[g.id] || 0 }],
      thumbnails: thumbMap[g.id] || [],
    })))
  }

  return NextResponse.json(data)
}

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
  const { data, error } = await admin.from('client_galleries').insert({
    client_name: clientName,
    event_name: eventName,
    slug,
    password_hash: passwordHash,
    password_plain: password || null,
    is_public: isPublic || false,
    category: category || 'Other',
    created_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-assign gallery to creator's profile
  const { data: profile } = await admin.from('profiles').select('assigned_galleries').eq('id', user.id).single()
  const current = profile?.assigned_galleries || []
  await admin.from('profiles').update({
    assigned_galleries: [...current, data.id],
  }).eq('id', user.id)

  return NextResponse.json(data)
}
