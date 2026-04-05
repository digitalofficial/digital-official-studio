'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Lightbox from '@/components/Lightbox'

interface Gallery {
  id: string
  client_name: string
  event_name: string
  slug: string
  is_public: boolean
  watermark_enabled: boolean
  is_paid: boolean
  media: MediaFile[]
}

interface MediaFile {
  id: string
  file_url: string
  file_type: string
  caption: string | null
  name: string | null
  is_portfolio: boolean
  uploaded_by: string | null
}

export default function PortalGalleryDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploadName, setUploadName] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [sharedBy, setSharedBy] = useState('')
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPrivateShare, setIsPrivateShare] = useState(false)
  const [sharePassword, setSharePassword] = useState('')
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [collectionName, setCollectionName] = useState('')
  const [collectionPrivate, setCollectionPrivate] = useState(false)
  const [collectionPassword, setCollectionPassword] = useState('')
  const [savingCollection, setSavingCollection] = useState(false)

  const fetchGallery = useCallback(async () => {
    const res = await fetch(`/api/admin/galleries/${id}`)
    if (res.ok) {
      setGallery(await res.json())
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchGallery() }, [fetchGallery])

  useEffect(() => {
    fetch('/api/auth/profile').then(r => r.json()).then(p => setUserId(p.id)).catch(() => {})
  }, [])

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadProgress({ current: 0, total: files.length })

    const supabase = createClient()

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadProgress({ current: i + 1, total: files.length })

      const fileType = file.type.startsWith('video/') ? 'video' : 'photo'
      const ext = file.name.split('.').pop()
      const filePath = `galleries/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { contentType: file.type })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath)

      await fetch(`/api/admin/galleries/${id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: publicUrl,
          fileType,
          caption: uploadCaption,
          name: uploadName,
          isPortfolio: false,
        }),
      })
    }

    setUploadCaption('')
    setUploadName('')
    setUploading(false)
    setUploadProgress(null)
    fetchGallery()
  }

  async function deleteMedia(mediaId: string) {
    if (!confirm('Delete this file?')) return
    await fetch(`/api/admin/media/${mediaId}`, { method: 'DELETE' })
    fetchGallery()
  }

  function copyLink() {
    if (!gallery) return
    navigator.clipboard.writeText(`${window.location.origin}/gallery/${gallery.slug}`)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  function toggleSelect(fileId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(fileId)) next.delete(fileId)
      else next.add(fileId)
      return next
    })
  }

  async function handleShare() {
    if (selected.size === 0 || !gallery) return
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
      setShareUrl(`${window.location.origin}/share/${data.slug || data.id}`)
    }
    setSharing(false)
  }

  function copyShareUrl() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function saveToCollection() {
    if (selected.size === 0 || !gallery || !collectionName.trim()) return
    setSavingCollection(true)
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: collectionName,
        galleryId: gallery.id,
        photoIds: Array.from(selected),
        isPrivate: collectionPrivate,
        password: collectionPrivate ? collectionPassword : null,
      }),
    })
    if (res.ok) {
      setShowCollectionModal(false)
      setCollectionName('')
      setCollectionPrivate(false)
      setCollectionPassword('')
      setSelected(new Set())
    }
    setSavingCollection(false)
  }

  if (loading) return <div className="min-h-screen bg-navy flex items-center justify-center"><p className="text-muted">Loading...</p></div>
  if (!gallery) return <div className="min-h-screen bg-navy flex items-center justify-center"><p className="text-muted">Gallery not found.</p></div>

  const inputClass = "w-full bg-card border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:border-icy/50"

  return (
    <div className="min-h-screen bg-navy pb-20 lg:pb-0">
      <nav className="border-b border-white/5 bg-navy/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 h-14 lg:h-16 flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-fraunces)] text-base lg:text-lg text-text">
            Digital Official Studio
          </Link>
          <Link href="/portal" className="text-sm text-silver hover:text-icy transition-colors">Back to Portal</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
        <Link href="/portal" className="inline-flex items-center gap-2 text-muted hover:text-icy transition-colors mb-6 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Galleries
        </Link>

        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text">{gallery.event_name}</h1>
            <p className="text-muted mt-1">
              {gallery.client_name} &middot;
              <span className={gallery.is_public ? ' text-green-400' : ' text-muted'}> {gallery.is_public ? 'Public' : 'Private'}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={gallery.watermark_enabled || false}
                onChange={async (e) => {
                  await fetch(`/api/admin/galleries/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ watermarkEnabled: e.target.checked }),
                  })
                  fetchGallery()
                }}
                className="w-4 h-4 rounded border-white/10 bg-navy text-icy focus:ring-icy"
              />
              <span className="text-xs text-silver">Watermark</span>
            </label>
            <button
              onClick={copyLink}
              className="text-xs px-4 py-2 rounded-lg bg-icy/10 text-icy hover:bg-icy/20 transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {copiedLink ? 'Copied!' : 'Copy Gallery Link'}
            </button>
          </div>
        </div>

        {/* Upload Section */}
        <div className="glass-card rounded-xl p-6 mb-8">
          <h2 className="text-text font-medium mb-4">Upload Photos & Videos</h2>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-silver mb-1.5">File Name (optional)</label>
                <input
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className={inputClass}
                  placeholder="File name"
                />
              </div>
              <div>
                <label className="block text-xs text-silver mb-1.5">Caption (optional)</label>
                <input
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  className={inputClass}
                  placeholder="Photo caption"
                />
              </div>
            </div>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-icy/30 transition-colors">
              <div className="text-center">
                <svg className="w-8 h-8 text-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-muted text-sm">{uploading ? `Uploading${uploadProgress ? ` ${uploadProgress.current}/${uploadProgress.total}` : ''}...` : 'Click to upload photos or videos'}</p>
                <p className="text-muted text-xs mt-1">Supports multiple files</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Media Grid */}
        <h2 className="text-text font-medium mb-4">Photos & Videos ({gallery.media.length} files)</h2>
        {gallery.media.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <p className="text-muted">No photos uploaded yet. Upload your first ones above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.media.map((file) => (
              <div key={file.id} className="glass-card rounded-lg overflow-hidden group relative">
                {/* Selection checkbox */}
                <div
                  onClick={(e) => { e.stopPropagation(); toggleSelect(file.id) }}
                  className={`absolute top-2 left-2 z-10 w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                    selected.has(file.id)
                      ? 'bg-icy border-icy'
                      : 'border-white/30 bg-navy/60 backdrop-blur-sm md:opacity-0 md:group-hover:opacity-100'
                  }`}
                >
                  {selected.has(file.id) && (
                    <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {file.file_type === 'photo' ? (
                  <div
                    className="relative aspect-square cursor-pointer"
                    onClick={() => {
                      const photoFiles = gallery.media.filter(f => f.file_type === 'photo')
                      const idx = photoFiles.findIndex(f => f.id === file.id)
                      setLightboxIndex(idx >= 0 ? idx : 0)
                    }}
                  >
                    <Image
                      src={file.file_url}
                      alt={file.caption || ''}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                ) : (
                  <div
                    className="relative aspect-video bg-card cursor-pointer"
                    onClick={() => {
                      const photoFiles = gallery.media.filter(f => f.file_type === 'photo')
                      const idx = photoFiles.findIndex(f => f.id === file.id)
                      setLightboxIndex(idx >= 0 ? idx : 0)
                    }}
                  >
                    <video src={file.file_url} className="w-full h-full object-cover" preload="metadata" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-navy/80 flex items-center justify-center">
                        <svg className="w-5 h-5 text-icy" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-3">
                  {/* Inline name editing */}
                  {editingName === file.id ? (
                    <div className="flex items-center gap-1 mb-1">
                      <input
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            await fetch(`/api/admin/media/${file.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: editNameValue }),
                            })
                            setEditingName(null)
                            fetchGallery()
                          }
                          if (e.key === 'Escape') setEditingName(null)
                        }}
                        className="flex-1 bg-navy border border-white/10 rounded px-2 py-1 text-text text-xs focus:outline-none focus:border-icy/50"
                        autoFocus
                        placeholder="File name"
                      />
                      <button
                        onClick={async () => {
                          await fetch(`/api/admin/media/${file.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: editNameValue }),
                          })
                          setEditingName(null)
                          fetchGallery()
                        }}
                        className="text-icy text-xs hover:underline"
                      >Save</button>
                    </div>
                  ) : (
                    <p
                      className="text-text text-xs mb-1 truncate cursor-pointer hover:text-icy transition-colors"
                      onClick={(e) => { e.stopPropagation(); setEditingName(file.id); setEditNameValue(file.name || '') }}
                      title="Click to rename"
                    >
                      {file.name || <span className="text-muted italic">Add name...</span>}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    {file.caption && <p className="text-muted text-xs truncate flex-1">{file.caption}</p>}
                    {file.uploaded_by && file.uploaded_by === userId && (
                      <button
                        onClick={() => deleteMedia(file.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors ml-auto"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Selection Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 glass-card rounded-xl px-6 py-4 flex items-center gap-4 shadow-2xl">
          <p className="text-sm text-silver">{selected.size} selected</p>
          <button onClick={() => setShowShareModal(true)} className="btn-primary text-sm !py-2 !px-5">Share</button>
          <button onClick={() => setShowCollectionModal(true)} className="text-xs px-3 py-1.5 rounded-lg bg-purple-400/10 text-purple-400 hover:bg-purple-400/20 transition-colors">Collection</button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-muted hover:text-silver">Cancel</button>
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
                <button onClick={() => { setShowShareModal(false); setSelected(new Set()); setShareUrl('') }} className="btn-secondary text-sm !py-2 w-full">Done</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 z-50 bg-navy/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCollectionModal(false)}>
          <div className="glass-card rounded-xl p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-[family-name:var(--font-fraunces)] text-xl text-text mb-4">Save to Collection</h3>
            <p className="text-muted text-sm mb-6">Save {selected.size} photo{selected.size > 1 ? 's' : ''} to a named collection.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs text-silver mb-1.5">Collection Name *</label>
                <input
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  className="w-full bg-card border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:border-icy/50"
                  placeholder="e.g. Favorites, Best Shots"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={collectionPrivate}
                  onChange={(e) => setCollectionPrivate(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-navy text-icy focus:ring-icy"
                />
                <span className="text-sm text-silver">Password protect this collection</span>
              </label>
              {collectionPrivate && (
                <div>
                  <label className="block text-xs text-silver mb-1.5">Password *</label>
                  <input
                    type="text"
                    value={collectionPassword}
                    onChange={(e) => setCollectionPassword(e.target.value)}
                    className="w-full bg-card border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:border-icy/50"
                    placeholder="Set a password"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={saveToCollection} disabled={savingCollection || !collectionName.trim() || (collectionPrivate && !collectionPassword)} className="btn-primary text-sm !py-2 flex-1 disabled:opacity-50">
                {savingCollection ? 'Saving...' : 'Create Collection'}
              </button>
              <button onClick={() => setShowCollectionModal(false)} className="btn-secondary text-sm !py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          items={gallery.media.filter(f => f.file_type === 'photo').map(f => ({ src: f.file_url, name: f.name || undefined }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
