import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

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

    const { data, error } = await supabase.from('shared_links').insert({
      gallery_id: galleryId,
      photo_ids: photoIds,
      shared_by: sharedBy || null,
      is_private: isPrivate || false,
      password_hash: passwordHash,
    }).select('id').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
