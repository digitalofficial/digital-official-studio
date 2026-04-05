import { cookies } from 'next/headers'
import { createServiceRoleClient } from '@/lib/supabase/server'
import GalleryView from './GalleryView'
import PasswordForm from './PasswordForm'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServiceRoleClient()
  const { data: gallery } = await supabase
    .from('client_galleries')
    .select('client_name, event_name')
    .eq('slug', slug)
    .single()

  return {
    title: gallery ? `${gallery.event_name} | Digital Official Studio` : 'Gallery | Digital Official Studio',
  }
}

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServiceRoleClient()

  const { data: gallery } = await supabase
    .from('client_galleries')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (!gallery) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text mb-4">Gallery Not Found</h1>
          <p className="text-muted mb-8">This gallery doesn&apos;t exist or may have been removed.</p>
          <Link href="/" className="btn-primary">Back to Home</Link>
        </div>
      </div>
    )
  }

  // Public galleries skip password check
  if (!gallery.is_public && gallery.password_hash) {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(`gallery_${gallery.id}`)
    const isAuthenticated = sessionCookie?.value === gallery.id

    if (!isAuthenticated) {
      return <PasswordForm slug={slug} galleryName={gallery.event_name} clientName={gallery.client_name} />
    }
  }

  const { data: media } = await supabase
    .from('media_files')
    .select('id, file_url, file_type, caption, name, watermark_enabled')
    .eq('gallery_id', gallery.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Fetch creator's watermark config if any media has watermark enabled
  const hasAnyWatermark = (media || []).some((m: any) => m.watermark_enabled)
  let watermarkConfig = undefined
  if (hasAnyWatermark && gallery.created_by) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('watermark_text, watermark_image_url, watermark_style, watermark_opacity')
      .eq('id', gallery.created_by)
      .single()
    if (profile) {
      watermarkConfig = {
        watermarkText: profile.watermark_text || 'DIGITAL OFFICIAL STUDIO',
        watermarkImageUrl: profile.watermark_image_url || '',
        watermarkStyle: profile.watermark_style || 'angled-repeat',
        watermarkOpacity: profile.watermark_opacity ?? 20,
      }
    }
  }

  return <GalleryView gallery={gallery} media={media || []} watermarkConfig={watermarkConfig} />
}
