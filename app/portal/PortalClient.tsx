'use client'

import { useState } from 'react'
import Link from 'next/link'
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
      // Create gallery via API
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
      setGalleries([newGallery, ...galleries])
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
    // Refresh galleries
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleries.map((g) => (
            <div key={g.id} className="glass-card rounded-xl p-6 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-icy/10 flex items-center justify-center group-hover:bg-icy/20 transition-colors">
                  <svg className="w-6 h-6 text-icy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${g.is_public ? 'bg-green-400/10 text-green-400' : 'bg-card text-muted'}`}>
                    {g.is_public ? 'Public' : 'Private'}
                  </span>
                  <button onClick={() => handleDeleteGallery(g.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                </div>
              </div>
              <h3 className="text-text font-medium">{g.event_name}</h3>
              <p className="text-muted text-sm mt-1">{g.media_files?.[0]?.count || 0} files</p>
              <div className="flex items-center gap-2 mt-3">
                <PrivateToggle
                  isPrivate={!g.is_public}
                  currentPassword={g.password_plain}
                  onToggle={async (isPrivate, password) => {
                    await togglePublic(g.id, !isPrivate, password)
                  }}
                  label={g.is_public ? 'Make Private' : 'Make Public'}
                />
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                <Link
                  href={`/portal/gallery/${g.id}`}
                  className="flex-1 text-center text-xs px-3 py-1.5 rounded-lg bg-card text-silver hover:bg-card-hover transition-colors"
                >
                  Manage
                </Link>
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
          ))}
        </div>
      )}
    </>
  )
}
