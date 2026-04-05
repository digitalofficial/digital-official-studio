import { createServiceRoleClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import ShareMasonry from './ShareMasonry'
import SharePasswordForm from './SharePasswordForm'
import ShareShareButtons from './ShareShareButtons'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceRoleClient()

  const { data: share } = await supabase
    .from('shared_links')
    .select('gallery_id, shared_by, client_galleries(event_name)')
    .eq('id', id)
    .single()

  const galleryName = (share?.client_galleries as any)?.event_name || 'Shared Photos'
  return {
    title: `${galleryName} | Digital Official Studio`,
    description: 'Shared photo gallery from Digital Official Studio',
  }
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceRoleClient()

  const { data: share } = await supabase
    .from('shared_links')
    .select('*, client_galleries(event_name, client_name, watermark_enabled, is_paid)')
    .eq('id', id)
    .single()

  if (!share) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text mb-4">Link Not Found</h1>
          <p className="text-muted mb-8">This shared link doesn&apos;t exist or has expired.</p>
          <Link href="/" className="btn-primary">Back to Home</Link>
        </div>
      </div>
    )
  }

  // Check if private and needs password
  if (share.is_private && share.password_hash) {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(`share_${share.id}`)
    const isAuthenticated = sessionCookie?.value === share.id

    if (!isAuthenticated) {
      const gallery = share.client_galleries as any
      return (
        <SharePasswordForm
          shareId={share.id}
          title={gallery?.event_name || 'Shared Photos'}
          sharedBy={share.shared_by}
        />
      )
    }
  }

  const { data: photos } = await supabase
    .from('media_files')
    .select('id, file_url, file_type, caption, name')
    .in('id', share.photo_ids)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const gallery = share.client_galleries as any

  // Fetch creator's watermark config
  let watermarkConfig = undefined
  if (gallery?.watermark_enabled && !gallery?.is_paid) {
    const { data: parentGallery } = await supabase
      .from('client_galleries')
      .select('created_by')
      .eq('id', share.gallery_id)
      .single()
    if (parentGallery?.created_by) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('watermark_text, watermark_image_url, watermark_style, watermark_opacity')
        .eq('id', parentGallery.created_by)
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
  }

  return (
    <div className="min-h-screen bg-navy">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <Link href="/" className="text-icy text-sm tracking-[0.2em] uppercase mb-3 inline-block hover:underline">
            Digital Official Studio
          </Link>
          <h1 className="font-[family-name:var(--font-fraunces)] text-4xl md:text-5xl text-text mt-2">
            {gallery?.event_name || 'Shared Photos'}
          </h1>
          {share.shared_by && (
            <p className="text-silver mt-3">Shared by {share.shared_by}</p>
          )}
          {share.is_private && (
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-card text-muted">Private</span>
          )}
          <p className="text-muted mt-2">{photos?.length || 0} photos</p>
          <div className="flex justify-center mt-4">
            <ShareShareButtons />
          </div>
        </div>

        {photos && photos.length > 0 ? (
          <ShareMasonry
            items={photos.map((p: any) => ({ ...p, file_type: p.file_type as 'photo' | 'video' }))}
            watermarkEnabled={gallery?.watermark_enabled || false}
            isPaid={gallery?.is_paid || false}
            watermarkConfig={watermarkConfig}
          />
        ) : (
          <div className="text-center py-16">
            <p className="text-muted">No photos to display.</p>
          </div>
        )}

        <div className="text-center mt-16 pt-8 border-t border-white/5">
          <p className="text-muted text-sm">
            Captured by <Link href="/" className="text-icy hover:underline">Digital Official Studio</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
