import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { collectionId, password } = await request.json()

    if (!collectionId || !password) {
      return NextResponse.json({ error: 'Collection ID and password required' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    const { data: collection } = await supabase
      .from('collections')
      .select('id, password_hash')
      .eq('id', collectionId)
      .single()

    if (!collection) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const valid = await bcrypt.compare(password, collection.password_hash)

    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set(`collection_${collection.id}`, collection.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
