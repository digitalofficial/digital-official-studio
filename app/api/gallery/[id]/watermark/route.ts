import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = await createServiceRoleClient()

  // Get the gallery creator
  const { data: gallery } = await admin
    .from('client_galleries')
    .select('created_by')
    .eq('id', id)
    .single()

  if (!gallery?.created_by) {
    return NextResponse.json({
      watermarkText: 'DIGITAL OFFICIAL STUDIO',
      watermarkImageUrl: '',
      watermarkStyle: 'angled-repeat',
      watermarkOpacity: 20,
    })
  }

  // Get the creator's watermark settings
  const { data: profile } = await admin
    .from('profiles')
    .select('watermark_text, watermark_image_url, watermark_style, watermark_opacity')
    .eq('id', gallery.created_by)
    .single()

  return NextResponse.json({
    watermarkText: profile?.watermark_text || 'DIGITAL OFFICIAL STUDIO',
    watermarkImageUrl: profile?.watermark_image_url || '',
    watermarkStyle: profile?.watermark_style || 'angled-repeat',
    watermarkOpacity: profile?.watermark_opacity ?? 20,
  })
}
