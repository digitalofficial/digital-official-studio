'use client'

import MasonryGrid from '@/components/MasonryGrid'
import ShareButtons from '@/components/ShareButtons'
import { type WatermarkConfig } from '@/components/WatermarkOverlay'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

interface Gallery {
  id: string
  client_name: string
  event_name: string
  slug: string
}

interface MediaItem {
  id: string
  file_url: string
  file_type: 'photo' | 'video'
  caption: string | null
  name?: string | null
}

interface Props {
  gallery: Gallery
  media: MediaItem[]
  watermarkEnabled?: boolean
  isPaid?: boolean
  watermarkConfig?: WatermarkConfig
}

export default function GalleryView({ gallery, media, watermarkEnabled = false, isPaid = false, watermarkConfig }: Props) {
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showShareModal, setShowShareModal] = useState(false)
  const [sharedBy, setSharedBy] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isPrivateShare, setIsPrivateShare] = useState(false)
  const [sharePassword, setSharePassword] = useState('')

  const photos = media.filter((m) => m.file_type === 'photo')

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleShare() {
    if (selected.size === 0) return
    setSharing(true)

    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        galleryId: gallery.id,
        photoIds: Array.from(selected),
        sharedBy: sharedBy || null,
        isPrivate: isPrivateShare,
        password: isPrivateShare ? sharePassword : null,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setShareUrl(`${window.location.origin}/share/${data.id}`)
    }
    setSharing(false)
  }

  function copyShareUrl() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyGalleryLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  function cancelSelect() {
    setSelectMode(false)
    setSelected(new Set())
    setShareUrl('')
    setShowShareModal(false)
  }

  return (
    <div className="min-h-screen bg-navy">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-icy transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <div className="flex items-center gap-2">
            <ShareButtons url={typeof window !== 'undefined' ? window.location.href : ''} text={`Check out ${gallery.event_name} by Digital Official Studio`} />
            <button
              onClick={copyGalleryLink}
              className="text-xs px-3 py-1.5 rounded-lg bg-card text-silver hover:bg-card-hover transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </button>
            {photos.length > 0 && (
              <button
                onClick={() => selectMode ? cancelSelect() : setSelectMode(true)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  selectMode ? 'bg-icy/10 text-icy' : 'bg-card text-silver hover:bg-card-hover'
                }`}
              >
                {selectMode ? 'Cancel Selection' : 'Select & Share'}
              </button>
            )}
          </div>
        </div>

        <div className="text-center mb-12">
          <p className="text-icy text-sm tracking-[0.2em] uppercase mb-3">{gallery.client_name}</p>
          <h1 className="font-[family-name:var(--font-fraunces)] text-4xl md:text-5xl text-text">{gallery.event_name}</h1>
          <p className="text-muted mt-3">{media.length} files</p>
        </div>

        {selectMode ? (
          <>
            {/* Selection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                    selected.has(item.id) ? 'ring-2 ring-icy ring-offset-2 ring-offset-navy' : ''
                  }`}
                >
                  <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    selected.has(item.id)
                      ? 'bg-icy border-icy'
                      : 'border-white/30 bg-navy/60 backdrop-blur-sm'
                  }`}>
                    {selected.has(item.id) && (
                      <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="relative aspect-square">
                    <Image
                      src={item.file_url}
                      alt={item.caption || ''}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Videos section still shown normally */}
            {media.filter(m => m.file_type === 'video').length > 0 && (
              <div className="mt-12">
                <h3 className="font-[family-name:var(--font-fraunces)] text-2xl text-text mb-6">Videos</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {media.filter(m => m.file_type === 'video').map((video) => (
                    <div key={video.id} className="rounded-lg overflow-hidden bg-card">
                      <video controls className="w-full" preload="metadata">
                        <source src={video.file_url} />
                      </video>
                      {video.caption && <p className="text-muted text-sm p-3">{video.caption}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Floating Selection Bar */}
            {selected.size > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass-card rounded-xl px-6 py-4 flex items-center gap-4 shadow-2xl">
                <p className="text-sm text-silver">{selected.size} selected</p>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="btn-primary text-sm !py-2 !px-5"
                >
                  Share Selected
                </button>
                <button onClick={cancelSelect} className="text-xs text-muted hover:text-silver transition-colors">
                  Cancel
                </button>
              </div>
            )}

            {/* Share Modal */}
            {showShareModal && (
              <div className="fixed inset-0 z-50 bg-navy/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !shareUrl && setShowShareModal(false)}>
                <div className="glass-card rounded-xl p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                  {!shareUrl ? (
                    <>
                      <h3 className="font-[family-name:var(--font-fraunces)] text-xl text-text mb-4">Share Photos</h3>
                      <p className="text-muted text-sm mb-6">Share {selected.size} selected photo{selected.size > 1 ? 's' : ''} via link.</p>
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-xs text-silver mb-1.5">Your Name (optional)</label>
                          <input
                            value={sharedBy}
                            onChange={(e) => setSharedBy(e.target.value)}
                            className="w-full bg-card border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:border-icy/50"
                            placeholder="Your name"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPrivateShare}
                            onChange={(e) => setIsPrivateShare(e.target.checked)}
                            className="w-4 h-4 rounded border-white/10 bg-navy text-icy focus:ring-icy"
                          />
                          <span className="text-sm text-silver">Password protect this link</span>
                        </label>
                        {isPrivateShare && (
                          <div>
                            <label className="block text-xs text-silver mb-1.5">Password *</label>
                            <input
                              type="text"
                              value={sharePassword}
                              onChange={(e) => setSharePassword(e.target.value)}
                              className="w-full bg-card border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:border-icy/50"
                              placeholder="Set a password"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button onClick={handleShare} disabled={sharing || (isPrivateShare && !sharePassword)} className="btn-primary text-sm !py-2 flex-1 disabled:opacity-50">
                          {sharing ? 'Creating...' : isPrivateShare ? 'Create Private Link' : 'Create Public Link'}
                        </button>
                        <button onClick={() => setShowShareModal(false)} className="btn-secondary text-sm !py-2">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center mb-6">
                        <div className="w-12 h-12 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h3 className="font-[family-name:var(--font-fraunces)] text-xl text-text">Link Created!</h3>
                      </div>
                      <div className="bg-navy rounded-lg p-3 flex items-center gap-2 mb-6">
                        <p className="text-sm text-silver truncate flex-1">{shareUrl}</p>
                        <button onClick={copyShareUrl} className="text-xs px-3 py-1.5 rounded bg-icy/10 text-icy hover:bg-icy/20 transition-colors shrink-0">
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <button onClick={() => { setShowShareModal(false); cancelSelect() }} className="btn-secondary text-sm !py-2 w-full">Done</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <MasonryGrid items={media} showDownload watermarkEnabled={watermarkEnabled} isPaid={isPaid} watermarkConfig={watermarkConfig} />
        )}

        <div className="text-center mt-16 pt-8 border-t border-white/5">
          <p className="text-muted text-sm">Digital Official Studio &mdash; Private Client Gallery</p>
        </div>
      </div>
    </div>
  )
}
