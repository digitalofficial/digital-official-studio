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
  watermark_enabled?: boolean
}

interface Props {
  items: MediaItem[]
  showDownload?: boolean
  watermarkConfig?: WatermarkConfig
}

export default function MasonryGrid({ items, showDownload = false, watermarkConfig }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const breakpoints = { default: 3, 1024: 2, 640: 1 }

  const lightboxItems = items.map((item) => ({
    src: item.file_url,
    name: item.name || undefined,
    watermarkEnabled: item.watermark_enabled || false,
  }))

  return (
    <>
      <Masonry breakpointCols={breakpoints} className="flex -ml-4 w-auto" columnClassName="pl-4 bg-clip-padding">
        {items.map((item, idx) => {
          const isVideo = item.file_type === 'video'
          const hasWatermark = !isVideo && (item.watermark_enabled || false)
          const canDownload = showDownload && !hasWatermark

          return (
            <div key={item.id} className="mb-4 group relative">
              <div
                className="rounded-lg overflow-hidden cursor-pointer relative"
                onClick={() => setLightboxIndex(idx)}
                onContextMenu={hasWatermark ? (e) => e.preventDefault() : undefined}
              >
                {isVideo ? (
                  <div className="relative aspect-video bg-card">
                    <video
                      src={item.file_url}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                      onMouseOver={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                      onMouseOut={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0 }}
                    />
                    {/* Play icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-14 h-14 rounded-full bg-navy/70 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Image
                      src={item.file_url}
                      alt={item.caption || ''}
                      width={600}
                      height={800}
                      className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {hasWatermark && <WatermarkOverlay config={watermarkConfig} size="sm" />}
                  </>
                )}
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
          )
        })}
      </Masonry>

      {lightboxIndex !== null && (
        <Lightbox
          items={lightboxItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          watermarkConfig={watermarkConfig}
        />
      )}
    </>
  )
}
