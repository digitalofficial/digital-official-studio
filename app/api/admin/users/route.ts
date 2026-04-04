import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createServiceRoleClient()

  // Get profiles and auth users
  const { data: profiles } = await admin.from('profiles').select('*').order('created_at', { ascending: false })
  const { data: authData } = await admin.auth.admin.listUsers()

  const authMap: Record<string, { last_sign_in_at: string | null; created_at: string }> = {}
  if (authData?.users) {
    authData.users.forEach((u: any) => {
      authMap[u.id] = { last_sign_in_at: u.last_sign_in_at, created_at: u.created_at }
    })
  }

  const merged = (profiles || []).map((p: any) => ({
    ...p,
    last_sign_in_at: authMap[p.id]?.last_sign_in_at || null,
    auth_created_at: authMap[p.id]?.created_at || p.created_at,
  }))

  return NextResponse.json(merged)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if requester is admin
  const admin = await createServiceRoleClient()
  const { data: requesterProfile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (requesterProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 })
  }

  const { email, password, role, displayName, assignedGalleries } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const { data: newUser, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create profile
  const { error: profileError } = await admin.from('profiles').insert({
    id: newUser.user.id,
    email,
    display_name: displayName || null,
    role: role || 'client',
    assigned_galleries: assignedGalleries || [],
  })

  if (profileError) {
    console.error('Profile creation error:', profileError)
  }

  return NextResponse.json({
    id: newUser.user.id,
    email,
    role: role || 'client',
    display_name: displayName || null,
  })
}
