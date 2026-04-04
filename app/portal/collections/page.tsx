'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PasswordReveal from '@/components/PasswordReveal'
import PrivateToggle from '@/components/PrivateToggle'

interface Collection {
  id: string
  name: string
  gallery_id: string
  photo_ids: string[]
  is_private: boolean
  password_plain: string | null
  created_at: string
  client_galleries: { event_name: string; client_name: string } | null
}

export default function PortalCollections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function fetchCollections() {
    const res = await fetch('/api/collections')
    if (res.ok) setCollections(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchCollections() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this collection?')) return
    await fetch(`/api/collections/${id}`, { method: 'DELETE' })
    fetchCollections()
  }

  async function togglePrivate(id: string, makePrivate: boolean, password?: string) {
    await fetch(`/api/collections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPrivate: makePrivate, ...(password ? { password } : {}) }),
    })
    fetchCollections()
  }

  function copyShareLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/collection/${id}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-navy pb-20 lg:pb-0">
      <nav className="hidden lg:block border-b border-white/5 bg-navy/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-fraunces)] text-lg text-text">
            Digital Official Studio
          </Link>
          <Link href="/portal" className="text-sm text-silver hover:text-icy transition-colors">Back to Galleries</Link>
        </div>
      </nav>

      <div className="lg:hidden border-b border-white/5 bg-navy/80 backdrop-blur-md">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-fraunces)] text-base text-text">
            Digital Official Studio
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
        <Link href="/portal" className="inline-flex items-center gap-2 text-muted hover:text-icy transition-colors mb-6 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Galleries
        </Link>
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text">My Collections</h1>
          <p className="text-muted text-sm mt-1">Curated photo sets — pick your favorites from a gallery to share or download as a group.</p>
        </div>

        {loading ? (
          <p className="text-muted">Loading collections...</p>
        ) : collections.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <p className="text-muted">No collections yet.</p>
            <p className="text-muted text-sm mt-2">Open a gallery, select your favorite photos, and tap &quot;Collection&quot; to create one.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((c) => (
              <div key={c.id} className="glass-card rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-icy/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-icy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                  </div>
                  <PrivateToggle
                    isPrivate={c.is_private}
                    currentPassword={c.password_plain}
                    onToggle={async (isPrivate, password) => {
                      await togglePrivate(c.id, isPrivate, password)
                    }}
                  />
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-text font-medium">{c.name}</h3>
                  {c.is_private && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-card text-muted">Private</span>
                  )}
                </div>
                <p className="text-muted text-sm mt-1">
                  {c.photo_ids.length} photos
                  {c.client_galleries && ` · ${c.client_galleries.event_name}`}
                </p>
                {c.is_private && c.password_plain && (
                  <PasswordReveal password={c.password_plain} />
                )}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                  <Link
                    href={`/collection/${c.id}`}
                    className="flex-1 text-center text-xs px-3 py-1.5 rounded-lg bg-card text-silver hover:bg-card-hover transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => copyShareLink(c.id)}
                    className="flex-1 text-center text-xs px-3 py-1.5 rounded-lg bg-icy/10 text-icy hover:bg-icy/20 transition-colors"
                  >
                    {copiedId === c.id ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
