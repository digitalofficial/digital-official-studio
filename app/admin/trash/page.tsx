'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface TrashedFile {
  id: string
  file_url: string
  file_type: string
  caption: string | null
  deleted_at: string
  gallery_id: string
  client_galleries: { event_name: string; client_name: string } | null
  profiles: { email: string; display_name: string | null } | null
}

interface TrashedGallery {
  id: string
  client_name: string
  event_name: string
  slug: string
  deleted_at: string
  media_files: { count: number }[]
  profiles: { email: string; display_name: string | null } | null
}

interface TrashedCollection {
  id: string
  name: string
  photo_ids: string[]
  deleted_at: string
  client_galleries: { event_name: string } | null
  profiles: { email: string; display_name: string | null } | null
}

type Tab = 'photos' | 'galleries' | 'collections'

export default function AdminTrash() {
  const [tab, setTab] = useState<Tab>('photos')
  const [media, setMedia] = useState<TrashedFile[]>([])
  const [galleries, setGalleries] = useState<TrashedGallery[]>([])
  const [collections, setCollections] = useState<TrashedCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState(false)

  async function fetchTrash() {
    const res = await fetch('/api/admin/trash')
    if (res.ok) {
      const data = await res.json()
      setMedia(data.media || [])
      setGalleries(data.galleries || [])
      setCollections(data.collections || [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchTrash() }, [])
  useEffect(() => { setSelected(new Set()) }, [tab])

  const currentItems = tab === 'photos' ? media : tab === 'galleries' ? galleries : collections

  function toggleSelectAll() {
    if (selected.size === currentItems.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(currentItems.map((item: any) => item.id)))
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days > 0) return `${days}d ago`
    const hours = Math.floor(diff / 3600000)
    if (hours > 0) return `${hours}h ago`
    return `${Math.floor(diff / 60000)}m ago`
  }

  // Media actions
  async function restoreMedia(id: string) {
    await fetch(`/api/admin/media/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restore: true }) })
    fetchTrash()
  }
  async function permanentDeleteMedia(id: string) {
    if (!confirm('Permanently delete? Cannot be undone.')) return
    await fetch(`/api/admin/media/${id}?permanent=true`, { method: 'DELETE' })
    fetchTrash()
  }

  // Gallery actions
  async function restoreGallery(id: string) {
    await fetch(`/api/admin/galleries/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restore: true }) })
    fetchTrash()
  }
  async function permanentDeleteGallery(id: string) {
    if (!confirm('Permanently delete this gallery and ALL its photos? Cannot be undone.')) return
    await fetch(`/api/admin/galleries/${id}?permanent=true`, { method: 'DELETE' })
    fetchTrash()
  }

  // Collection actions
  async function restoreCollection(id: string) {
    await fetch(`/api/collections/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restore: true }) })
    fetchTrash()
  }
  async function permanentDeleteCollection(id: string) {
    if (!confirm('Permanently delete? Cannot be undone.')) return
    await fetch(`/api/collections/${id}?permanent=true`, { method: 'DELETE' })
    fetchTrash()
  }

  // Bulk actions
  async function bulkRestore() {
    setActionLoading(true)
    const endpoint = tab === 'photos' ? '/api/admin/media' : tab === 'galleries' ? '/api/admin/galleries' : '/api/collections'
    await Promise.all(Array.from(selected).map(id =>
      fetch(`${endpoint}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restore: true }) })
    ))
    setSelected(new Set())
    setActionLoading(false)
    fetchTrash()
  }
  async function bulkPermanentDelete() {
    const count = selected.size
    if (!confirm(`Permanently delete ${count} item${count > 1 ? 's' : ''}? Cannot be undone.`)) return
    setActionLoading(true)
    const endpoint = tab === 'photos' ? '/api/admin/media' : tab === 'galleries' ? '/api/admin/galleries' : '/api/collections'
    await Promise.all(Array.from(selected).map(id =>
      fetch(`${endpoint}/${id}?permanent=true`, { method: 'DELETE' })
    ))
    setSelected(new Set())
    setActionLoading(false)
    fetchTrash()
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'photos', label: 'Photos', count: media.length },
    { key: 'galleries', label: 'Galleries', count: galleries.length },
    { key: 'collections', label: 'Collections', count: collections.length },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text">Trash</h1>
        <p className="text-muted text-sm mt-1">Deleted items from photographers and clients. Restore or permanently remove.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                tab === t.key ? 'bg-icy text-navy font-semibold' : 'bg-card text-silver hover:bg-card-hover'
            }`}
          >
            {t.label} {t.count > 0 && <span className="ml-1 text-xs opacity-70">({t.count})</span>}
          </button>
          ))}
        </div>
        {currentItems.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="text-xs text-silver hover:text-icy transition-colors"
          >
            {selected.size === currentItems.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="glass-card rounded-lg p-3 mb-4 flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-silver">{selected.size} selected</p>
          <div className="flex items-center gap-2">
            <button onClick={bulkRestore} disabled={actionLoading} className="text-xs px-3 py-1.5 rounded-lg bg-green-400/10 text-green-400 hover:bg-green-400/20 transition-colors disabled:opacity-50">Restore</button>
            <button onClick={bulkPermanentDelete} disabled={actionLoading} className="text-xs px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors disabled:opacity-50">Delete Forever</button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-muted hover:text-silver">Deselect All</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : (
        <>
          {/* Photos tab */}
          {tab === 'photos' && (media.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center"><p className="text-muted">No deleted photos.</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {media.map(file => (
                <div key={file.id} className={`glass-card rounded-lg overflow-hidden group relative ${selected.has(file.id) ? 'ring-2 ring-icy ring-offset-2 ring-offset-navy' : ''}`}>
                  <div onClick={() => toggleSelect(file.id)} className={`absolute top-2 left-2 z-10 w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${selected.has(file.id) ? 'bg-icy border-icy' : 'border-white/30 bg-navy/60 backdrop-blur-sm md:opacity-0 md:group-hover:opacity-100'}`}>
                    {selected.has(file.id) && <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  {file.file_type === 'photo' ? (
                    <div className="relative aspect-square opacity-60"><Image src={file.file_url} alt="" fill className="object-cover" sizes="25vw" /></div>
                  ) : (
                    <div className="relative aspect-video bg-card opacity-60"><video src={file.file_url} className="w-full h-full object-cover" preload="metadata" /></div>
                  )}
                  <div className="p-3">
                    <p className="text-muted text-xs truncate">{file.client_galleries?.event_name || 'Unknown'}</p>
                    <p className="text-muted text-xs mb-2">Deleted {timeAgo(file.deleted_at)}{file.profiles && ` by ${file.profiles.display_name || file.profiles.email}`}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => restoreMedia(file.id)} className="text-xs px-2 py-1 rounded bg-green-400/10 text-green-400 hover:bg-green-400/20">Restore</button>
                      <button onClick={() => permanentDeleteMedia(file.id)} className="text-xs text-red-400 hover:text-red-300">Delete Forever</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Galleries tab */}
          {tab === 'galleries' && (galleries.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center"><p className="text-muted">No deleted galleries.</p></div>
          ) : (
            <div className="space-y-3">
              {galleries.map(g => (
                <div key={g.id} className={`glass-card rounded-lg p-4 flex items-center justify-between gap-4 ${selected.has(g.id) ? 'ring-2 ring-icy ring-offset-2 ring-offset-navy' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input type="checkbox" checked={selected.has(g.id)} onChange={() => toggleSelect(g.id)} className="w-4 h-4 rounded border-white/10 bg-navy text-icy focus:ring-icy shrink-0" />
                    <div className="min-w-0">
                      <p className="text-text font-medium truncate">{g.event_name}</p>
                      <p className="text-muted text-sm">{g.client_name} · {g.media_files?.[0]?.count || 0} files · Deleted {timeAgo(g.deleted_at)}{g.profiles && ` by ${g.profiles.display_name || g.profiles.email}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => restoreGallery(g.id)} className="text-xs px-3 py-1.5 rounded-lg bg-green-400/10 text-green-400 hover:bg-green-400/20">Restore</button>
                    <button onClick={() => permanentDeleteGallery(g.id)} className="text-xs text-red-400 hover:text-red-300">Delete Forever</button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Collections tab */}
          {tab === 'collections' && (collections.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center"><p className="text-muted">No deleted collections.</p></div>
          ) : (
            <div className="space-y-3">
              {collections.map(c => (
                <div key={c.id} className={`glass-card rounded-lg p-4 flex items-center justify-between gap-4 ${selected.has(c.id) ? 'ring-2 ring-icy ring-offset-2 ring-offset-navy' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="w-4 h-4 rounded border-white/10 bg-navy text-icy focus:ring-icy shrink-0" />
                    <div className="min-w-0">
                      <p className="text-text font-medium truncate">{c.name}</p>
                      <p className="text-muted text-sm">{c.photo_ids.length} photos{c.client_galleries && ` · ${c.client_galleries.event_name}`} · Deleted {timeAgo(c.deleted_at)}{c.profiles && ` by ${c.profiles.display_name || c.profiles.email}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => restoreCollection(c.id)} className="text-xs px-3 py-1.5 rounded-lg bg-green-400/10 text-green-400 hover:bg-green-400/20">Restore</button>
                    <button onClick={() => permanentDeleteCollection(c.id)} className="text-xs text-red-400 hover:text-red-300">Delete Forever</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
