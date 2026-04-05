'use client'

import Masonry from 'react-masonry-css'
import Image from 'next/image'
import { useState } from 'react'
import Lightbox from '@/components/Lightbox'
import WatermarkOverlay, { type WatermarkConfig } from '@/components/WatermarkOverlay'

interface MediaItem {
  id: string
  file_url: string
  file_type: 'photo' | 'video'
  caption: string | null
  name?: string | null
}

interface Props {
  items: MediaItem[]
  showDownload?: boolean
  watermarkEnabled?: boolean
  isPaid?: boolean
  watermarkConfig?: WatermarkConfig
}

export default function MasonryGrid({ items, showDownload = false, watermarkEnabled = false, isPaid = false, watermarkConfig }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const breakpoints = { default: 3, 1024: 2, 640: 1 }

  const photos = items.filter((i) => i.file_type === 'photo')
  const videos = items.filter((i) => i.file_type === 'video')

  const showWatermark = watermarkEnabled && !isPaid
  const canDownload = showDownload && !showWatermark

  const lightboxItems = photos.map((p) => ({ src: p.file_url, name: p.name || undefined }))

  return (
    <>
      <Masonry breakpointCols={breakpoints} className="flex -ml-4 w-auto" columnClassName="pl-4 bg-clip-padding">
        {photos.map((item, idx) => (
          <div key={item.id} className="mb-4 group relative">
            <div
              className="rounded-lg overflow-hidden cursor-pointer relative"
              onClick={() => setLightboxIndex(idx)}
              onContextMenu={showWatermark ? (e) => e.preventDefault() : undefined}
            >
              <Image
                src={item.file_url}
                alt={item.caption || ''}
                width={600}
                height={800}
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              {showWatermark && <WatermarkOverlay config={watermarkConfig} size="sm" />}
            </div>
            {canDownload && (
              <a
                href={item.file_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-navy/80 backdrop-blur-sm flex items-center justify-center text-icy md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            )}
            {item.name && (
              <p className="text-text text-sm mt-2 font-medium">{item.name}</p>
            )}
            {item.caption && (
              <p className="text-muted text-xs mt-1">{item.caption}</p>
            )}
          </div>
        ))}
      </Masonry>

      {videos.length > 0 && (
        <div className="mt-12">
          <h3 className="font-[family-name:var(--font-fraunces)] text-2xl text-text mb-6">Videos</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="rounded-lg overflow-hidden bg-card">
                <video controls className="w-full" preload="metadata">
                  <source src={video.file_url} />
                </video>
                {video.name && <p className="text-text text-sm font-medium px-3 pt-3">{video.name}</p>}
                {video.caption && <p className="text-muted text-sm p-3">{video.caption}</p>}
                {canDownload && (
                  <div className="px-3 pb-3">
                    <a href={video.file_url} download target="_blank" rel="noopener noreferrer" className="text-icy text-sm hover:underline">
                      Download Video
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          items={lightboxItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          watermarkEnabled={watermarkEnabled}
          isPaid={isPaid}
          watermarkConfig={watermarkConfig}
        />
      )}
    </>
  )
}
