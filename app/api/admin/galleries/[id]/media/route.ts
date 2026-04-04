import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { fileUrl, fileType, caption, isPortfolio } = body

  if (!fileUrl || !fileType) {
    return NextResponse.json({ error: 'Missing file info' }, { status: 400 })
  }

  const { data, error } = await supabase.from('media_files').insert({
    gallery_id: id,
    file_url: fileUrl,
    file_type: fileType,
    caption: caption || null,
    is_portfolio: isPortfolio || false,
    uploaded_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
