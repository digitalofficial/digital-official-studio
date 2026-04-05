'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import PasswordReveal from '@/components/PasswordReveal'
import PrivateToggle from '@/components/PrivateToggle'

interface Profile {
  id: string
  email: string
  display_name: string | null
  role: string
  assigned_galleries: string[]
}

interface Gallery {
  id: string
  client_name: string
  event_name: string
  slug: string
  is_public: boolean
  password_plain: string | null
  created_at: string
  media_files: { count: number }[]
  thumbnails: string[]
}

interface Props {
  profile: Profile
  initialGalleries: Gallery[]
  userId: string
}

export default function PortalClient({ profile, initialGalleries, userId }: Props) {
  const [galleries, setGalleries] = useState<Gallery[]>(initialGalleries)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    clientName: profile.display_name || '',
    eventName: '',
    slug: '',
    password: '',
    isPublic: false,
    category: 'Other',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  function handleSlugify(name: string) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const uid = Math.random().toString(36).slice(2, 8)
    return `${uid}-${base}`
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/portal/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create gallery')
        setSaving(false)
        return
      }

      const newGallery = await res.json()
      setGalleries([{ ...newGallery, thumbnails: [] }, ...galleries])
      setForm({ clientName: profile.display_name || '', eventName: '', slug: '', password: '', isPublic: false, category: 'Other' })
      setShowForm(false)
    } catch {
      setError('Something went wrong')
    }
    setSaving(false)
  }

  async function handleDeleteGallery(id: string) {
    if (!confirm('Delete this gallery? It will be moved to trash.')) return
    const res = await fetch(`/api/admin/galleries/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setGalleries(galleries.filter(g => g.id !== id))
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to delete gallery')
    }
  }

  async function togglePublic(id: string, makePublic: boolean, password?: string) {
    await fetch(`/api/admin/galleries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: makePublic, ...(!makePublic && password ? { password } : {}) }),
    })
    const res = await fetch('/api/admin/galleries')
    if (res.ok) setGalleries(await res.json())
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/gallery/${slug}`)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const inputClass = "w-full bg-card border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:border-icy/50"
  const labelClass = "block text-xs text-silver mb-1.5"

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text">My Galleries</h1>
          <p className="text-muted mt-2">Welcome back{profile.display_name ? `, ${profile.display_name}` : ''}. Your galleries hold all event photos — select favorites to create shareable collections.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm !py-2 !px-5">
          {showForm ? 'Cancel' : '+ New Gallery'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card rounded-xl p-6 mb-8 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Your Name *</label>
              <input
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className={inputClass}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Gallery Name *</label>
              <input
                value={form.eventName}
                onChange={(e) => {
                  const val = e.target.value
                  setForm({ ...form, eventName: val, slug: handleSlugify(val) })
                }}
                className={inputClass}
                placeholder="My Photo Collection"
                required
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {!form.isPublic && (
              <div>
                <label className={labelClass}>Password *</label>
                <input
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputClass}
                  placeholder="Gallery password"
                  required={!form.isPublic}
                />
              </div>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                <option>Sweet 16</option>
                <option>Quincea&ntilde;era</option>
                <option>Parties</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 bg-navy text-icy focus:ring-icy"
                />
                <span className="text-sm text-silver">Make gallery public (no password needed)</span>
              </label>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary text-sm !py-2 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Gallery'}
          </button>
        </form>
      )}

      {galleries.length === 0 && !showForm ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-muted">No galleries yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {galleries.map((g) => {
            const count = g.media_files?.[0]?.count || 0
            const thumbs = g.thumbnails || []
            const remaining = Math.max(0, count - thumbs.length)

            return (
              <Link key={g.id} href={`/portal/gallery/${g.id}`} className="glass-card rounded-xl overflow-hidden group hover:ring-1 hover:ring-icy/20 transition-all block">
                {/* Thumbnail mosaic */}
                <div>
                  {thumbs.length > 0 ? (
                    <div className="relative h-48 overflow-hidden bg-card">
                      {thumbs.length === 1 && (
                        <Image src={thumbs[0]} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="33vw" />
                      )}
                      {thumbs.length === 2 && (
                        <div className="grid grid-cols-2 h-full gap-0.5">
                          {thumbs.map((t, i) => (
                            <div key={i} className="relative overflow-hidden">
                              <Image src={t} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="17vw" />
                            </div>
                          ))}
                        </div>
                      )}
                      {thumbs.length === 3 && (
                        <div className="grid grid-cols-2 h-full gap-0.5">
                          <div className="relative row-span-2 overflow-hidden">
                            <Image src={thumbs[0]} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="17vw" />
                          </div>
                          <div className="relative overflow-hidden">
                            <Image src={thumbs[1]} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="17vw" />
                          </div>
                          <div className="relative overflow-hidden">
                            <Image src={thumbs[2]} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="17vw" />
                          </div>
                        </div>
                      )}
                      {thumbs.length >= 4 && (
                        <div className="grid grid-cols-3 grid-rows-2 h-full gap-0.5">
                          <div className="relative col-span-2 row-span-2 overflow-hidden">
                            <Image src={thumbs[0]} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="22vw" />
                          </div>
                          <div className="relative overflow-hidden">
                            <Image src={thumbs[1]} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="11vw" />
                          </div>
                          <div className="relative overflow-hidden">
                            <Image src={thumbs[2]} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="11vw" />
                            {remaining > 0 && (
                              <div className="absolute inset-0 bg-navy/70 backdrop-blur-[2px] flex items-center justify-center">
                                <span className="text-text font-semibold text-lg">+{remaining}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 bg-card flex items-center justify-center">
                      <svg className="w-12 h-12 text-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Card content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-text font-medium">{g.event_name}</h3>
                      <p className="text-muted text-sm">{count} files</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${g.is_public ? 'bg-green-400/10 text-green-400' : 'bg-card text-muted'}`}>
                        {g.is_public ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3" onClick={(e) => e.preventDefault()}>
                    <PrivateToggle
                      isPrivate={!g.is_public}
                      currentPassword={g.password_plain}
                      onToggle={async (isPrivate, password) => {
                        await togglePublic(g.id, !isPrivate, password)
                      }}
                      label={g.is_public ? 'Make Private' : 'Make Public'}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5" onClick={(e) => e.preventDefault()}>
                    <button
                      onClick={() => copyLink(g.slug)}
                      className="flex-1 text-center text-xs px-3 py-1.5 rounded-lg bg-icy/10 text-icy hover:bg-icy/20 transition-colors"
                    >
                      {copiedSlug === g.slug ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                  {!g.is_public && g.password_plain && (
                    <PasswordReveal password={g.password_plain} />
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
