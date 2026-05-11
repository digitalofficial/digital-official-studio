import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createServiceRoleClient()

  // Only admins can reset passwords
  const { data: requesterProfile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (requesterProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  // Get the target user's email
  const { data: targetProfile } = await admin.from('profiles').select('email').eq('id', id).single()
  if (!targetProfile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const origin = new URL(request.url).origin
  const { error } = await admin.auth.resetPasswordForEmail(targetProfile.email, {
    redirectTo: `${origin}/reset-password`,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
