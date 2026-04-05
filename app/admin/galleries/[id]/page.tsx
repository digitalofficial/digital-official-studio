'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
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
  category: string
  created_by: string | null
  media: MediaFile[]
}

interface MediaFile {
  id: string
  file_url: string
  file_type: string
  caption: string | null
  name: string | null
  is_portfolio: boolean
  watermark_enabled: boolean
  uploaded_by: string | null
}

export default function GalleryDetail() {
  const { id } = useParams<{ id: string }>()
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploadName, setUploadName] = useState('')
  const [uploadPortfolio, setUploadPortfolio] = useState(false)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [sharedBy, setSharedBy] = useState('')
  const [shareUrl, setShareUrl] = useState('')
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
    async function fetchRole() {
      try {
        const res = await fetch('/api/auth/profile')
        if (res.ok) {
          const data = await res.json()
          setRole(data.role)
          setUserId(data.id)
        }
      } catch {
        // ignore
      }
    }
    fetchRole()
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

      // Upload directly to Supabase Storage from browser (no size limit)
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { contentType: file.type })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath)

      // Save DB record via API
      await fetch(`/api/admin/galleries/${id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: publicUrl,
          fileType,
          caption: uploadCaption,
          name: uploadName,
          isPortfolio: uploadPortfolio,
        }),
      })
    }

    setUploadCaption('')
    setUploadName('')
    setUploadPortfolio(false)
    setUploading(false)
    setUploadProgress(null)
    fetchGallery()
  }

  function toggleSelect(mediaId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(mediaId)) next.delete(mediaId)
      else next.add(mediaId)
      return next
    })
  }

  function toggleSelectAll() {
    if (!gallery) return
    if (selected.size === gallery.media.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(gallery.media.map((m) => m.id)))
    }
  }

  async function togglePortfolio(mediaId: string, current: boolean) {
    await fetch(`/api/admin/media/${mediaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPortfolio: !current }),
    })
    fetchGallery()
  }

  async function deleteMedia(mediaId: string) {
    if (!confirm('Delete this file?')) return
    await fetch(`/api/admin/media/${mediaId}`, { method: 'DELETE' })
    fetchGallery()
  }

  async function bulkAddToPortfolio() {
    if (selected.size === 0) return
    setBulkLoading(true)
    await Promise.all(
      Array.from(selected).map((mediaId) =>
        fetch(`/api/admin/media/${mediaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPortfolio: true }),
        })
      )
    )
    setSelected(new Set())
    setBulkLoading(false)
    fetchGallery()
  }

  async function bulkRemoveFromPortfolio() {
    if (selected.size === 0) return
    setBulkLoading(true)
    await Promise.all(
      Array.from(selected).map((mediaId) =>
        fetch(`/api/admin/media/${mediaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPortfolio: false }),
        })
      )
    )
    setSelected(new Set())
    setBulkLoading(false)
    fetchGallery()
  }

  async function bulkDelete() {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} file${selected.size > 1 ? 's' : ''}?`)) return
    setBulkLoading(true)
    await Promise.all(
      Array.from(selected).map((mediaId) =>
        fetch(`/api/admin/media/${mediaId}`, { method: 'DELETE' })
      )
    )
    setSelected(new Set())
    setBulkLoading(false)
    fetchGallery()
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

  if (loading) return <p className="text-muted">Loading...</p>
  if (!gallery) return <p className="text-muted">Gallery not found.</p>

  const inputClass = "w-full bg-navy border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:border-icy/50"

  return (
    <div>
      <Link href="/admin/galleries" className="inline-flex items-center gap-2 text-muted hover:text-icy transition-colors mb-6 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Galleries
      </Link>

      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text">{gallery.event_name}</h1>
          <p className="text-muted mt-1">
            {gallery.client_name} &middot;
            <span className={gallery.is_public ? ' text-green-400' : ' text-muted'}> {gallery.is_public ? 'Public' : 'Private'}</span> &middot;
            <a href={`/gallery/${gallery.slug}`} target="_blank" rel="noopener noreferrer" className="text-icy hover:underline ml-1">
              /gallery/{gallery.slug}
            </a>
          </p>
        </div>
        <div />
      </div>

      {/* Upload Section */}
      <div className="glass-card rounded-xl p-6 mb-8">
        <h2 className="text-text font-medium mb-4">Upload Files</h2>
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
            {role === 'admin' && (
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uploadPortfolio}
                    onChange={(e) => setUploadPortfolio(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-navy text-icy focus:ring-icy"
                  />
                  <span className="text-sm text-silver">Add to public portfolio</span>
                </label>
              </div>
            )}
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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-text font-medium">Media ({gallery.media.length} files)</h2>
        {gallery.media.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="text-xs text-silver hover:text-icy transition-colors"
          >
            {selected.size === gallery.media.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="glass-card rounded-lg p-3 mb-4 flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-silver">{selected.size} selected</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              disabled={bulkLoading}
              className="text-xs px-3 py-1.5 rounded-lg bg-icy/10 text-icy hover:bg-icy/20 transition-colors disabled:opacity-50"
            >
              Share Selected
            </button>
            <button
              onClick={() => setShowCollectionModal(true)}
              disabled={bulkLoading}
              className="text-xs px-3 py-1.5 rounded-lg bg-purple-400/10 text-purple-400 hover:bg-purple-400/20 transition-colors disabled:opacity-50"
            >
              Save to Collection
            </button>
            {role === 'admin' && (
              <button
                onClick={bulkAddToPortfolio}
                disabled={bulkLoading}
                className="text-xs px-3 py-1.5 rounded-lg bg-icy/10 text-icy hover:bg-icy/20 transition-colors disabled:opacity-50"
              >
                Add to Portfolio
              </button>
            )}
            {role === 'admin' && (
              <button
                onClick={bulkRemoveFromPortfolio}
                disabled={bulkLoading}
                className="text-xs px-3 py-1.5 rounded-lg bg-card text-silver hover:bg-card-hover transition-colors disabled:opacity-50"
              >
                Remove from Portfolio
              </button>
            )}
            {(role === 'admin' || (gallery && Array.from(selected).every(id => {
              const file = gallery.media.find(f => f.id === id)
              return file?.uploaded_by && file.uploaded_by === userId
            }))) && (
              <button
                onClick={bulkDelete}
                disabled={bulkLoading}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors disabled:opacity-50"
              >
                Delete Selected
              </button>
            )}
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs px-3 py-1.5 rounded-lg text-muted hover:text-silver transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {gallery.media.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-muted">No media uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.media.map((file) => (
            <div
              key={file.id}
              className={`glass-card rounded-lg overflow-hidden group relative ${
                selected.has(file.id) ? 'ring-2 ring-icy ring-offset-2 ring-offset-navy' : ''
              }`}
            >
              {/* Selection checkbox - top left, click toggles select */}
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

              {/* Photo - click opens lightbox */}
              {file.file_type === 'photo' ? (
                <div className="relative aspect-square cursor-pointer" onClick={() => {
                  const photoFiles = gallery.media.filter(f => f.file_type === 'photo')
                  const idx = photoFiles.findIndex(f => f.id === file.id)
                  setLightboxIndex(idx >= 0 ? idx : 0)
                }}>
                  <Image
                    src={file.file_url}
                    alt={file.caption || ''}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              ) : (
                <div className="relative aspect-video bg-card">
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
                  <div className="flex items-center gap-1 mb-2">
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
                {file.caption && <p className="text-muted text-xs mb-2 truncate">{file.caption}</p>}
                <div className="flex items-center justify-between flex-wrap gap-1">
                  {(role === 'admin' || (gallery.created_by && gallery.created_by === userId)) && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        await fetch(`/api/admin/media/${file.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ watermarkEnabled: !file.watermark_enabled }),
                        })
                        fetchGallery()
                      }}
                      className={`text-xs px-2 py-1 rounded ${
                        file.watermark_enabled
                          ? 'bg-amber-400/10 text-amber-400'
                          : 'bg-card text-muted hover:text-silver'
                      } transition-colors`}
                    >
                      {file.watermark_enabled ? 'Watermarked' : 'Watermark'}
                    </button>
                  )}
                  {role === 'admin' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePortfolio(file.id, file.is_portfolio) }}
                      className={`text-xs px-2 py-1 rounded ${
                        file.is_portfolio
                          ? 'bg-icy/10 text-icy'
                          : 'bg-card text-muted hover:text-silver'
                      } transition-colors`}
                    >
                      {file.is_portfolio ? 'In Portfolio' : 'Add to Portfolio'}
                    </button>
                  )}
                  {(role === 'admin' || (file.uploaded_by && file.uploaded_by === userId)) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMedia(file.id) }}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
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
                <button onClick={() => { setShowShareModal(false); setShareUrl(''); setSharedBy(''); }} className="btn-secondary text-sm !py-2 w-full">Done</button>
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
                  placeholder="e.g. Favorites, Best Shots, For Print"
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
