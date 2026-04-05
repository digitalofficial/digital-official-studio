import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

function generateSlug(galleryName: string, sharedBy: string | null): string {
  const base = [galleryName, sharedBy].filter(Boolean).join('-')
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const suffix = Date.now().toString(36)
  return `${slug}-${suffix}`
}

export async function POST(request: Request) {
  try {
    const { galleryId, photoIds, sharedBy, isPrivate, password } = await request.json()

    if (!galleryId || !photoIds || photoIds.length === 0) {
      return NextResponse.json({ error: 'Gallery ID and photos required' }, { status: 400 })
    }

    let passwordHash = null
    if (isPrivate && password) {
      passwordHash = await bcrypt.hash(password, 10)
    }

    const supabase = await createServiceRoleClient()

    // Fetch gallery name for the slug
    const { data: gallery } = await supabase
      .from('client_galleries')
      .select('event_name')
      .eq('id', galleryId)
      .single()

    const slug = generateSlug(gallery?.event_name || 'shared', sharedBy || null)

    const { data, error } = await supabase.from('shared_links').insert({
      gallery_id: galleryId,
      photo_ids: photoIds,
      shared_by: sharedBy || null,
      is_private: isPrivate || false,
      password_hash: passwordHash,
      slug,
    }).select('id, slug').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id, slug: data.slug })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
