import { createServiceRoleClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import CollectionView from './CollectionView'
import CollectionPasswordForm from './CollectionPasswordForm'
import CollectionShareButtons from './CollectionShareButtons'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceRoleClient()
  const { data } = await supabase.from('collections').select('name, gallery_id').eq('id', id).single()
  const title = `${data?.name || 'Collection'} | Digital Official Studio`
  return {
    title,
    openGraph: {
      title,
      images: data?.gallery_id ? [`/api/og?galleryId=${data.gallery_id}`] : [],
    },
  }
}

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceRoleClient()

  const { data: collection } = await supabase
    .from('collections')
    .select('*, client_galleries(event_name, client_name)')
    .eq('id', id)
    .single()

  if (!collection) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text mb-4">Collection Not Found</h1>
          <p className="text-muted mb-8">This collection doesn&apos;t exist or has been removed.</p>
          <Link href="/" className="btn-primary">Back to Home</Link>
        </div>
      </div>
    )
  }

  // Check if private and needs password
  if (collection.is_private && collection.password_hash) {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(`collection_${collection.id}`)
    const isAuthenticated = sessionCookie?.value === collection.id

    if (!isAuthenticated) {
      return <CollectionPasswordForm collectionId={collection.id} title={collection.name} />
    }
  }

  const { data: photos } = await supabase
    .from('media_files')
    .select('id, file_url, file_type, caption, name, watermark_enabled')
    .in('id', collection.photo_ids)
    .is('deleted_at', null)

  const gallery = collection.client_galleries as any

  // Fetch creator's watermark config if any media has watermark enabled
  const hasAnyWatermark = (photos || []).some((p: any) => p.watermark_enabled)
  let watermarkConfig = undefined
  if (hasAnyWatermark) {
    const { data: parentGallery } = await supabase
      .from('client_galleries')
      .select('created_by')
      .eq('id', collection.gallery_id)
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
          <h1 className="font-[family-name:var(--font-fraunces)] text-4xl md:text-5xl text-text mt-2">{collection.name}</h1>
          {gallery && <p className="text-silver mt-3">From {gallery.event_name}</p>}
          {collection.is_private && (
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-card text-muted">Private</span>
          )}
          <p className="text-muted mt-2">{photos?.length || 0} photos</p>
          <div className="flex justify-center mt-4">
            <CollectionShareButtons />
          </div>
        </div>

        {photos && photos.length > 0 ? (
          <CollectionView
            items={photos.map((p: any) => ({ ...p, file_type: p.file_type as 'photo' | 'video' }))}
            watermarkConfig={watermarkConfig}
          />
        ) : (
          <div className="text-center py-16">
            <p className="text-muted">No photos in this collection.</p>
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
