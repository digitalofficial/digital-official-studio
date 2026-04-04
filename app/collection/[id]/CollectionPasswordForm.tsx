'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function CollectionPasswordForm({ collectionId, title }: { collectionId: string; title: string }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/collections/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId, password }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        setError('Incorrect password. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-icy text-sm tracking-[0.2em] uppercase mb-3">Private Collection</p>
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text mb-2">{title}</h1>
        </div>
        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8">
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm text-silver mb-2">Enter Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-text placeholder:text-muted focus:outline-none focus:border-icy/50 focus:ring-1 focus:ring-icy/50 transition-colors"
              placeholder="Password"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Verifying...' : 'View Collection'}
          </button>
        </form>
        <p className="text-center text-muted text-xs mt-6">
          Digital Official Studio &mdash; Private Collection
        </p>
      </div>
    </div>
  )
}
