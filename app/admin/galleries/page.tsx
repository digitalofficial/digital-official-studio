'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  thumbnails: string[]
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
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {galleries.map((g) => {
            const count = g.media_files?.[0]?.count || 0
            const thumbs = g.thumbnails || []
            const remaining = Math.max(0, count - thumbs.length)

            return (
              <Link key={g.id} href={`/admin/galleries/${g.id}`} className="glass-card rounded-xl overflow-hidden group hover:ring-1 hover:ring-icy/20 transition-all block">
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
                          {thumbs.length === 4 ? (
                            <div className="relative overflow-hidden">
                              <Image src={thumbs[2]} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="11vw" />
                              {remaining > 0 && (
                                <div className="absolute inset-0 bg-navy/70 backdrop-blur-[2px] flex items-center justify-center">
                                  <span className="text-text font-semibold text-lg">+{remaining}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="relative overflow-hidden">
                              <Image src={thumbs[2]} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="11vw" />
                              {remaining > 0 && (
                                <div className="absolute inset-0 bg-navy/70 backdrop-blur-[2px] flex items-center justify-center">
                                  <span className="text-text font-semibold text-lg">+{remaining}</span>
                                </div>
                              )}
                            </div>
                          )}
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
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <span className="text-text font-medium block truncate">
                        {g.event_name}
                      </span>
                      <p className="text-muted text-sm truncate">{g.client_name}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${g.is_public ? 'bg-green-400/10 text-green-400' : 'bg-white/5 text-muted'}`}>
                      {g.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-silver mb-4">
                    <span>{count} {count === 1 ? 'file' : 'files'}</span>
                    <span className="text-white/10">|</span>
                    <span>{g.category}</span>
                    <span className="text-white/10">|</span>
                    <span>{new Date(g.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/gallery/${g.slug}`)
                        setCopiedSlug(g.slug)
                        setTimeout(() => setCopiedSlug(null), 2000)
                      }}
                      className="text-xs text-icy hover:underline truncate"
                    >
                      {copiedSlug === g.slug ? 'Copied!' : 'Copy Link'}
                    </button>
                    {!g.is_public && g.password_plain && (
                      <PasswordReveal password={g.password_plain} />
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-white/5" onClick={(e) => e.preventDefault()}>
                    {(role === 'admin' || g.created_by === userId) && (
                      <PrivateToggle
                        isPrivate={!g.is_public}
                        currentPassword={g.password_plain}
                        onToggle={async (isPrivate, password) => {
                          await togglePublic(g.id, !isPrivate, password)
                        }}
                        label={g.is_public ? 'Private' : 'Public'}
                      />
                    )}
                    {(role === 'admin' || g.created_by === userId) && (
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="px-3 py-2 rounded-lg text-red-400/70 text-sm hover:bg-red-400/10 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
