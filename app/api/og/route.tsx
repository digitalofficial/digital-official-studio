import { ImageResponse } from 'next/og'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const galleryId = searchParams.get('galleryId')
  const imageUrl = searchParams.get('imageUrl')
  const title = searchParams.get('title') || 'Digital Official Studio'

  // If a specific image URL is provided with watermark
  if (imageUrl) {
    const watermarkText = searchParams.get('watermarkText') || 'DIGITAL OFFICIAL STUDIO'
    const hasWatermark = searchParams.get('watermark') === '1'

    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {hasWatermark && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '40px',
                transform: 'rotate(-30deg)',
                padding: '0',
              }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    color: 'rgba(255,255,255,0.25)',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {watermarkText}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  // Gallery preview - show first image with title overlay
  if (galleryId) {
    try {
      const supabase = await createServiceRoleClient()

      const { data: gallery } = await supabase
        .from('client_galleries')
        .select('event_name, client_name, created_by')
        .eq('id', galleryId)
        .single()

      const { data: media } = await supabase
        .from('media_files')
        .select('file_url, watermark_enabled')
        .eq('gallery_id', galleryId)
        .eq('file_type', 'photo')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)

      const firstPhoto = media?.[0]
      const hasWatermark = firstPhoto?.watermark_enabled || false

      // Get watermark text from creator
      let watermarkText = 'DIGITAL OFFICIAL STUDIO'
      if (hasWatermark && gallery?.created_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('watermark_text')
          .eq('id', gallery.created_by)
          .single()
        if (profile?.watermark_text) watermarkText = profile.watermark_text
      }

      return new ImageResponse(
        (
          <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative', backgroundColor: '#0f172a' }}>
            {firstPhoto?.file_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={firstPhoto.file_url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {hasWatermark && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-200px',
                      left: '-200px',
                      right: '-200px',
                      bottom: '-200px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '40px',
                      transform: 'rotate(-30deg)',
                    }}
                  >
                    {Array.from({ length: 20 }).map((_, i) => (
                      <span
                        key={i}
                        style={{
                          color: 'rgba(255,255,255,0.25)',
                          fontSize: '32px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {watermarkText}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : null}
            {/* Title bar at bottom */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                flexDirection: 'column',
                padding: '24px 32px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
              }}
            >
              <span style={{ color: '#67e8f9', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase' as const }}>
                {gallery?.client_name || 'Digital Official Studio'}
              </span>
              <span style={{ color: 'white', fontSize: '36px', fontWeight: 'bold', marginTop: '4px' }}>
                {gallery?.event_name || title}
              </span>
            </div>
          </div>
        ),
        { width: 1200, height: 630 }
      )
    } catch {
      // Fall through to default
    }
  }

  // Default OG image
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#0f172a',
          color: 'white',
        }}
      >
        <span style={{ fontSize: '48px', fontWeight: 'bold' }}>{title}</span>
        <span style={{ fontSize: '20px', color: '#67e8f9', marginTop: '12px' }}>Digital Official Studio</span>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
