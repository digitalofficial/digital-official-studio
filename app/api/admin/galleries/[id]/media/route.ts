import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
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

  // Check role and assignment
  const { data: profile } = await admin.from('profiles').select('role, assigned_galleries').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    const assigned = profile?.assigned_galleries || []
    if (!assigned.includes(id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
  }

  const body = await request.json()
  const { fileUrl, originalUrl, fileType, caption, isPortfolio, name } = body

  if (!fileUrl || !fileType) {
    return NextResponse.json({ error: 'Missing file info' }, { status: 400 })
  }

  const row: Record<string, unknown> = {
    gallery_id: id,
    file_url: fileUrl,
    original_url: originalUrl || fileUrl,
    file_type: fileType,
    caption: caption || null,
    name: name || null,
    is_portfolio: isPortfolio || false,
    uploaded_by: user.id,
  }

  let { data, error } = await admin.from('media_files').insert(row).select().single()

  // Tolerate the original_url column not existing yet (migration 0005 not applied).
  if (error && /original_url/.test(error.message)) {
    delete row.original_url
    ;({ data, error } = await admin.from('media_files').insert(row).select().single())
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // A newly-uploaded portfolio image must reach the static home + /portfolio.
  if (row.is_portfolio) revalidatePath('/', 'layout')
  return NextResponse.json(data)
}
