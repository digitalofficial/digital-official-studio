import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { shareId, password } = await request.json()

    if (!shareId || !password) {
      return NextResponse.json({ error: 'Share ID and password required' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    const { data: share } = await supabase
      .from('shared_links')
      .select('id, password_hash')
      .eq('id', shareId)
      .single()

    if (!share) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const valid = await bcrypt.compare(password, share.password_hash)

    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set(`share_${share.id}`, share.id, {
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
