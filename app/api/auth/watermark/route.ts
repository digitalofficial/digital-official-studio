import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createServiceRoleClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('watermark_text, watermark_image_url, watermark_style, watermark_opacity')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    watermarkText: profile?.watermark_text || '',
    watermarkImageUrl: profile?.watermark_image_url || '',
    watermarkStyle: profile?.watermark_style || 'angled-repeat',
    watermarkOpacity: profile?.watermark_opacity ?? 20,
  })
}

export async function PUT(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (typeof body.watermarkText === 'string') updates.watermark_text = body.watermarkText
  if (typeof body.watermarkImageUrl === 'string') updates.watermark_image_url = body.watermarkImageUrl
  if (typeof body.watermarkStyle === 'string') updates.watermark_style = body.watermarkStyle
  if (typeof body.watermarkOpacity === 'number') updates.watermark_opacity = body.watermarkOpacity

  const admin = await createServiceRoleClient()
  const { data, error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('watermark_text, watermark_image_url, watermark_style, watermark_opacity')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
