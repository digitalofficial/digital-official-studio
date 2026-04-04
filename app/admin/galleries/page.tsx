'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PasswordReveal from '@/components/PasswordReveal'
import PrivateToggle from '@/components/PrivateToggle'

interface Gallery {
  id: string
  client_name: string
  event_name: string
  slug: string
  is_public: boolean
  category: string
  created_at: string
  created_by: string | null
  password_plain: string | null
  media_files: { count: number }[]
}

export default function AdminGalleries() {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string>('photographer')
  const [userId, setUserId] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    clientName: '',
    eventName: '',
    slug: '',
    password: '',
    isPublic: false,
    category: 'Other',
  })
  const [saving, setSaving] = useState(false)

  async function fetchGalleries() {
    const res = await fetch('/api/admin/galleries')
    if (res.ok) {
      const data = await res.json()
      setGalleries(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchGalleries()
    fetch('/api/auth/profile').then(r => r.json()).then(p => { setRole(p.role || 'photographer'); setUserId(p.id || null) }).catch(() => {})
  }, [])

  function handleSlugify(name: string) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const uid = Math.random().toString(36).slice(2, 8)
    return `${uid}-${base}`
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const res = await fetch('/api/admin/galleries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setForm({ clientName: '', eventName: '', slug: '', password: '', isPublic: false, category: 'Other' })
      setShowForm(false)
      fetchGalleries()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this gallery and all its media?')) return
    await fetch(`/api/admin/galleries/${id}`, { method: 'DELETE' })
    fetchGalleries()
  }

  async function togglePublic(id: string, makePublic: boolean, password?: string) {
    await fetch(`/api/admin/galleries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: makePublic, ...(!makePublic && password ? { password } : {}) }),
    })
    fetchGalleries()
  }

  const inputClass = "w-full bg-navy border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:border-icy/50"
  const labelClass = "block text-xs text-silver mb-1.5"

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text">Galleries</h1>
          <p className="text-muted text-sm mt-1">Full event albums — upload all photos/videos from a shoot and share with clients via password-protected link.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm !py-2 !px-5">
          {showForm ? 'Cancel' : '+ New Gallery'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card rounded-xl p-6 mb-8 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Client Name *</label>
              <input
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className={inputClass}
                placeholder="Sofia Rodriguez"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Event Name *</label>
              <input
                value={form.eventName}
                onChange={(e) => {
                  const val = e.target.value
                  setForm({ ...form, eventName: val, slug: handleSlugify(val) })
                }}
                className={inputClass}
                placeholder="Sofia's Sweet 16"
                required
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {!form.isPublic && (
              <div>
                <label className={labelClass}>Gallery Password *</label>
                <input
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputClass}
                  placeholder="Password for client"
                  required={!form.isPublic}
                />
              </div>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass}
              >
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
                <span className="text-sm text-silver">Public gallery</span>
              </label>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm !py-2 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Gallery'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-muted">Loading galleries...</p>
      ) : galleries.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-muted">No galleries yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {galleries.map((g) => (
            <div key={g.id} className="glass-card rounded-lg p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/admin/galleries/${g.id}`} className="text-text font-medium hover:text-icy transition-colors">
                    {g.event_name}
                  </Link>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${g.is_public ? 'bg-green-400/10 text-green-400' : 'bg-card text-muted'}`}>
                    {g.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
                <p className="text-muted text-sm mt-0.5">
                  {g.client_name} &middot; {g.media_files?.[0]?.count || 0} files
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/gallery/${g.slug}`)
                      setCopiedSlug(g.slug)
                      setTimeout(() => setCopiedSlug(null), 2000)
                    }}
                    className="text-xs text-icy hover:underline"
                  >
                    {copiedSlug === g.slug ? 'Copied!' : `/${g.slug}`}
                  </button>
                  {!g.is_public && g.password_plain && (
                    <PasswordReveal password={g.password_plain} />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/admin/galleries/${g.id}`}
                  className="px-3 py-1.5 rounded-lg bg-card text-silver text-sm hover:bg-card-hover transition-colors"
                >
                  Manage
                </Link>
                {(role === 'admin' || g.created_by === userId) && (
                  <PrivateToggle
                    isPrivate={!g.is_public}
                    currentPassword={g.password_plain}
                    onToggle={async (isPrivate, password) => {
                      await togglePublic(g.id, !isPrivate, password)
                    }}
                    label={g.is_public ? 'Make Private' : 'Make Public'}
                  />
                )}
                {(role === 'admin' || g.created_by === userId) && (
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="px-3 py-1.5 rounded-lg text-red-400 text-sm hover:bg-red-400/10 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
